# node-traQ

[![npm version](https://badge.fury.io/js/%40traptitech%2Ftraq.svg)](https://www.npmjs.com/package/@traptitech/traq)
![check npm ci & build](https://github.com/traPtitech/node-traq/workflows/check%20npm%20ci%20%26%20build/badge.svg)

A client library for the traQ API.
Typescript type definition included.

This package is updated automatically.

## How to use

Node.js v20 or later is required.

```shell
npm i @traptitech/traq
```

```js
import { Apis, Configuration } from "@traptitech/traq";
// const { Apis, Configuration } = require("@traptitech/traq");

const api = new Apis(new Configuration({
  accessToken: "/* your token */"
}));

api.getChannels().then(res => {
  console.log(res);
});
```

### Custom Axios header defaults

When making requests through this SDK, custom class instances in Axios header
defaults (`headers.common`, `headers.get`, `headers.post`, and other supported
methods) retain their behavior from Axios 1.20. Their own enumerable properties
are copied to plain header maps before Axios 1.21 prepares the request. Common
defaults apply to all methods; method defaults apply only to that method.

This applies to both a supplied Axios instance and headers in
`Configuration.baseOptions` or per-request options. The original instance and
default objects are preserved, including request and response interceptors.
Plain maps, null-prototype maps, `AxiosHeaders`, and literal headers such as
`Link` remain supported.
Class instances under these reserved names are treated as defaults; serialize
a custom object first when it is intended as a literal method-named header.

Direct requests made outside this SDK follow
[Axios 1.21's header-default rules](https://github.com/axios/axios/releases/tag/v1.21.0).
For those requests, convert custom class defaults explicitly, for example
`axios.create({ headers: { get: { ...customDefaults } } })`.

## Versioning

`x.y.z-n`

- `x.y.z-0`: It is assured that this version is compatible with traQ server version `x.y.z`.

## Diff

Use [`npm diff`](https://docs.npmjs.com/cli/v7/commands/npm-diff) to check diff between versions.

```shell
npm diff --diff=@traptitech/traq@3.6.1-3 --diff=@traptitech/traq@3.6.1-4
```
