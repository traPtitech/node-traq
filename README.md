# node-traQ
A client library for the traQ API.
Typescript type definition included.

## How to use
```bash
npm i traq-api
```

```js
import { Apis } from "traq-api";

const api = new Apis({
  accessToken: "1Tk8vgV4R39KVQztXF5VSkec6lGWTvA6859T"
});

api.channelsGet().then(res => {
  console.log(res);
});
```
