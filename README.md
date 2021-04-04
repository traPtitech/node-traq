# node-traQ
[![npm version](https://badge.fury.io/js/%40traptitech%2Ftraq.svg)](https://badge.fury.io/js/%40traptitech%2Ftraq)
![check npm ci & build](https://github.com/traPtitech/node-traq/workflows/check%20npm%20ci%20%26%20build/badge.svg)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=traPtitech/node-traq)](https://dependabot.com)


A client library for the traQ API.
Typescript type definition included.

This package is updated automatically.

## How to use
```shell
$ npm i @traptitech/traq
```

```js
import { Apis, Configuration } from "@traptitech/traq";
// const { Apis } = require("@traptitech/traq");

const api = new Apis(new Configuration({
  accessToken: "/* your token */"
}));

api.getChannels().then(res => {
  console.log(res);
});
```

## Versioning
`x.y.z-n`

- `x.y.z-0`: It is assured that this version is compatible with traQ server version `x.y.z`.

## Diff
Use [`npm diff`](https://docs.npmjs.com/cli/v7/commands/npm-diff) to check diff between versions.

```shell
$ npm diff --diff=@traptitech/traq@3.6.1-3 --diff=@traptitech/traq@3.6.1-4
```
