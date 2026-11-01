import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import axios from "axios";
import * as esm from "../dist/index.js";

const require = createRequire(import.meta.url);
const cjsAxios = require("axios");
const formats = [
  ["ESM", esm, axios, cjsAxios],
  ["CommonJS", require("../dist/index.cjs"), cjsAxios, axios],
];

class HeaderDefaults {
  constructor(headers) {
    Object.assign(this, headers);
  }
}

function captureRequests(axiosBuild, headers = {}) {
  const requests = [];
  const client = axiosBuild.create({
    headers,
    adapter: async config => {
      requests.push(config);
      return { data: [], status: 200, statusText: "OK", headers: {}, config };
    },
  });
  return { client, requests };
}

for (const [format, sdk, axiosBuild, otherAxiosBuild] of formats) {
  test(`${format}: custom instance defaults retain authorization and method scope`, async () => {
    const common = Object.freeze(new HeaderDefaults({ "X-Common": "common" }));
    const get = Object.freeze(new HeaderDefaults({ Authorization: "get-token" }));
    const post = Object.freeze(new HeaderDefaults({ Authorization: "post-token" }));
    const { client, requests } = captureRequests(axiosBuild, { common, get, post });
    Object.freeze(client.defaults.headers);
    let requestInterceptors = 0;
    let responseInterceptors = 0;
    client.interceptors.request.use(config => {
      requestInterceptors++;
      config.headers.set("X-Interceptor", "present");
      return config;
    });
    client.interceptors.response.use(response => {
      responseInterceptors++;
      return response;
    });

    const api = new sdk.Apis(undefined, undefined, client);
    await api.getChannels();
    await api.postMessage("channel/id", { content: "test" });

    assert.equal(requests[0].headers.get("Authorization"), "get-token");
    assert.equal(requests[1].headers.get("Authorization"), "post-token");
    for (const request of requests) {
      assert.equal(request.headers.get("X-Common"), "common");
      assert.equal(request.headers.get("X-Interceptor"), "present");
      for (const name of ["common", "get", "post"]) {
        assert.equal(request.headers.has(name), false);
      }
    }
    assert.equal(client.defaults.headers.common, common);
    assert.equal(client.defaults.headers.get, get);
    assert.equal(client.defaults.headers.post, post);
    assert.equal(requestInterceptors, 2);
    assert.equal(responseInterceptors, 2);
    assert.equal(requests[1].url.endsWith("/channels/channel%2Fid/messages"), true);
    assert.deepEqual(JSON.parse(requests[1].data), { content: "test" });
  });

  test(`${format}: method-specific credentials never become unrelated literal headers`, async () => {
    const { client, requests } = captureRequests(axiosBuild, {
      post: new HeaderDefaults({ Authorization: "post-only-secret" }),
      query: new HeaderDefaults({ "X-Query-Secret": "query-only-secret" }),
      link: new HeaderDefaults({ "X-Link-Secret": "link-only-secret" }),
    });
    const api = new sdk.Apis(undefined, undefined, client);
    await api.getChannels();
    const headers = requests[0].headers.toJSON();
    assert.equal(requests[0].headers.has("Authorization"), false);
    for (const name of ["post", "query", "link", "X-Query-Secret", "X-Link-Secret"]) {
      assert.equal(requests[0].headers.has(name), false);
    }
    assert.equal(JSON.stringify(headers).includes("secret"), false);
  });

  test(`${format}: configuration and request defaults preserve header precedence`, async () => {
    const { client, requests } = captureRequests(axiosBuild, {
      common: new HeaderDefaults({ "X-Value": "instance-common", "X-Instance": "present" }),
      get: new HeaderDefaults({ "X-Value": "instance-get" }),
    });
    const baseHeaders = Object.freeze({
      Common: Object.freeze(new HeaderDefaults({ "X-Value": "base-common", "X-Base": "present" })),
    });
    const configuration = new sdk.Configuration({
      accessToken: "configuration-token",
      baseOptions: { headers: baseHeaders },
    });
    const api = new sdk.Apis(configuration, undefined, client);
    const requestHeaders = Object.freeze({
      GeT: Object.freeze(new HeaderDefaults({ "x-value": "request-get" })),
      "X-Direct": "present",
    });
    await api.getChannels(undefined, undefined, { headers: requestHeaders });
    assert.equal(requests[0].headers.get("X-Value"), "request-get");
    assert.equal(requests[0].headers.has("X-Instance"), false);
    assert.equal(requests[0].headers.get("X-Base"), "present");
    assert.equal(requests[0].headers.get("X-Direct"), "present");
    assert.equal(requests[0].headers.get("Authorization"), "Bearer configuration-token");
    assert.equal(requestHeaders.GeT["x-value"], "request-get");

    await api.getChannels(undefined, undefined, { headers: { "X-Value": "direct", Authorization: false } });
    assert.equal(requests[1].headers.get("X-Value"), "direct");
    assert.equal(requests[1].headers.toJSON().Authorization, undefined);
  });

  test(`${format}: replacing a class defaults bucket does not retain its credentials`, async () => {
    for (const defaults of [
      { Authorization: "replaced-secret", "X-Old": "old" },
      new HeaderDefaults({ Authorization: "replaced-secret", "X-Old": "old" }),
    ]) {
      const { client, requests } = captureRequests(axiosBuild, { common: defaults });
      const api = new sdk.Apis(undefined, undefined, client);
      // Plain maps merge; class instances replace the entire bucket in Axios 1.20.
      for (const common of [new HeaderDefaults({ "X-New": "class" }), null]) {
        await api.getChannels(undefined, undefined, { headers: { common } });
        const request = requests.at(-1);
        assert.equal(request.headers.has("Authorization"), false);
        assert.equal(request.headers.has("X-Old"), false);
        assert.equal(request.headers.has("common"), false);
      }
      assert.equal(client.defaults.headers.common.Authorization, "replaced-secret");
    }
  });

  test(`${format}: plain maps, null-prototype maps and foreign AxiosHeaders remain supported`, async () => {
    const { client, requests } = captureRequests(axiosBuild, {
      common: new otherAxiosBuild.AxiosHeaders({ "X-Common": "foreign" }),
      get: Object.assign(Object.create(null), { "X-Get": "null-prototype" }),
    });
    const api = new sdk.Apis(undefined, undefined, client);
    await api.getChannels(undefined, undefined, { headers: { "X-Plain": "plain" } });
    assert.equal(requests[0].headers.get("X-Common"), "foreign");
    assert.equal(requests[0].headers.get("X-Get"), "null-prototype");
    assert.equal(requests[0].headers.get("X-Plain"), "plain");
  });

  test(`${format}: literal method-named headers keep Axios 1.21 serialization`, async () => {
    const date = new Date("2026-01-01T00:00:00Z");
    const { client, requests } = captureRequests(axiosBuild, {
      common: new HeaderDefaults({ "X-Common": "present" }),
    });
    const api = new sdk.Apis(undefined, undefined, client);
    await api.getChannels(undefined, undefined, {
      headers: { Link: "</next>; rel=next", Get: date, Query: Buffer.from("literal") },
    });
    assert.equal(requests[0].headers.get("Link"), "</next>; rel=next");
    assert.equal(requests[0].headers.get("Get"), String(date));
    assert.equal(requests[0].headers.get("Query"), "literal");
  });

  test(`${format}: compatibility conversion does not copy inherited or prototype-polluting defaults`, async () => {
    class UnsafeDefaults extends HeaderDefaults {}
    UnsafeDefaults.prototype["X-Inherited"] = "must-not-be-sent";
    const defaults = new UnsafeDefaults({ "X-Safe": "present" });
    for (const name of ["__proto__", "constructor", "prototype"]) {
      Object.defineProperty(defaults, name, { value: { polluted: true }, enumerable: true });
    }
    const { client, requests } = captureRequests(axiosBuild);
    client.defaults.headers.common = defaults;
    const api = new sdk.Apis(undefined, undefined, client);
    await api.getChannels();
    assert.equal(requests[0].headers.get("X-Safe"), "present");
    assert.equal(requests[0].headers.has("X-Inherited"), false);
    assert.equal(requests[0].headers.has("__proto__"), false);
    assert.equal(requests[0].headers.has("constructor"), false);
    assert.equal(requests[0].headers.has("prototype"), false);
    assert.equal(Object.prototype.polluted, undefined);
  });
}
