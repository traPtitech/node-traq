# node-traQ
A client library for the traQ API.
Typescript type definition included.

## How to use
```bash
npm i traPtitech/node-traq#version
```

 - `version`: ex. `2.7.2-0` => `npm i traPtitech/node-traq#2.7.2-0`

```js
import { Apis } from "traq-api";
// const { Apis } = require("traq-api");

const api = new Apis({
  accessToken: "/* your token */"
});

api.channelsGet().then(res => {
  console.log(res);
});
```
