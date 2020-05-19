# node-traQ
A client library for the traQ API.
Typescript type definition included.

## How to use
```shell
$ npm i @traptitech/traq
```

```js
import { Apis } from "@traptitech/traq";
// const { Apis } = require("@traptitech/traq");

const api = new Apis({
  accessToken: "/* your token */"
});

api.getChannels().then(res => {
  console.log(res);
});
```
