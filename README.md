# node-traQ
A client library for the traQ API.
Typescript type definition included.

## How to use
```bash
npm i @traptitech/traq#version
```

 - `version`: ex. `3.0.0-8` => `npm i @traptitech/traq#3.0.0-8`

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
