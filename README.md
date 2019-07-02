# node-traQ
A client library for the traQ API.
Typescript type definition included.

## How to use
```bash
npm i traPtitech/node-traq
```

```js
import { Apis } from "traq-api";

const api = new Apis({
  accessToken: "/* your token */"
});

api.channelsGet().then(res => {
  console.log(res);
});
```
