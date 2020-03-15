# node-traQ
A client library for the traQ API.
Typescript type definition included.

## How to use
```bash
npm i @traptitech/traq
```

```js
import { Apis } from "@traptitech/traq";
// const { Apis } = require("@traptitech/traq");

const api = new Apis({
  accessToken: "/* your token */"
});

api.channelsGet().then(res => {
  console.log(res);
});
```
