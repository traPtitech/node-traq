import runCmdAsync from "./runCmdAsync";
import addApis from "./addApis";

const SWAGGER_URL =
  "https://raw.githubusercontent.com/traPtitech/traQ/master/docs/v3-api.yaml";

const GENERATED_FOLDER = "./bin/generated";

const npx = process.platform === "win32" ? "npx.cmd" : "npx";

const generateCmd = [
  "openapi-generator-cli",
  "generate",
  "-i",
  SWAGGER_URL,
  "-g",
  "typescript-axios",
  "-o",
  GENERATED_FOLDER,
  "--skip-validate-spec",
  "--generate-alias-as-model",
  "--reserved-words-mappings public=public"
];

(async () => {
  try {
    await runCmdAsync(npx, generateCmd);

    console.log("Start adding Apis class...");
    await addApis(GENERATED_FOLDER);
    console.log("Finished adding Apis class");
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
