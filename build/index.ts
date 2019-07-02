import runCmdAsync from "./runCmdAsync";
import addApis from "./addApis";

const SWAGGER_URL =
  "https://raw.githubusercontent.com/traPtitech/traQ/master/docs/swagger.yaml";

const GENERATED_FOLDER = "bin/generated";
const DIST_ES_FOLDER = "dist/es";
const DIST_COMMONJS_FOLDER = "dist/commonjs";
const DIST_TYPE_FOLDER = "dist/types";

const npx = process.platform === "win32" ? "npx.cmd" : "npx";

const generateCmd = [
  "openapi-generator",
  "generate",
  "-i",
  SWAGGER_URL,
  "-g",
  "typescript-axios",
  "-o",
  GENERATED_FOLDER,
  "--skip-validate-spec"
];

const baseTscCmd = [
  "tsc",
  `${GENERATED_FOLDER}/index.ts`,
  "-t",
  "ESNext",
  "--moduleResolution",
  "node"
];

(async () => {
  try {
    await runCmdAsync(npx, generateCmd);

    console.log("Start adding Apis class...");
    await addApis(GENERATED_FOLDER);
    console.log("Finished adding Apis class");

    console.log("Start building ESModule version");
    await runCmdAsync(
      npx,
      baseTscCmd.concat([
        "-m",
        "es2015",
        "--outDir",
        DIST_ES_FOLDER,
        "-d",
        "--declarationDir",
        DIST_TYPE_FOLDER
      ])
    );
    console.log("Finished building ESModule version");

    console.log("Start building CommonJS version");
    await runCmdAsync(
      npx,
      baseTscCmd.concat(["-m", "commonjs", "--outDir", DIST_COMMONJS_FOLDER])
    );
    console.log("Finished building CommonJS version");
  } catch (e) {
    console.error(e);
  }
})();
