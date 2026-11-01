import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import axios from "axios";
import * as esm from "../dist/index.js";

const require = createRequire(import.meta.url);

for (const [format, sdk] of [["ESM", esm], ["CommonJS", require("../dist/index.cjs")]]) {
  test(`${format}: sends the configured access token`, async () => {
    const client = axios.create({
      adapter: async config => ({
        data: config.headers.get("Authorization"),
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      }),
    });
    const api = new sdk.Apis(new sdk.Configuration({ accessToken: "test-token" }), undefined, client);
    const response = await api.getChannels();
    assert.equal(response.data, "Bearer test-token");
  });
}
