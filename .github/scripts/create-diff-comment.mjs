import { readFile, writeFile } from "node:fs/promises";

const diff = await readFile("dist.diff");
// Leave room for the link and Markdown within GitHub's 65,536-character limit.
const maxPreviewBytes = 60_000;
const truncated = diff.length > maxPreviewBytes;
const preview = new TextDecoder().decode(diff.subarray(0, maxPreviewBytes), {
  stream: truncated,
});

await writeFile(
  "comment.md",
  [
    "[INFO] dist diff",
    "",
    `[Download the full diff](${process.env.DIFF_ARTIFACT_URL})`,
    "",
    "```diff",
    preview,
    "```",
    ...(truncated ? ["", "The diff preview was truncated. See the artifact for the full diff."] : []),
    "",
  ].join("\n"),
);
