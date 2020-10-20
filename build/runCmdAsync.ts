import { spawn, SpawnOptionsWithoutStdio } from "child_process";

export default function(
  cmd: string,
  args?: string[],
  options?: SpawnOptionsWithoutStdio
) {
  const proc = spawn(cmd, args, options);
  return new Promise((resolve, reject) => {
    proc.stderr.pipe(process.stderr);
    proc.stdout.pipe(process.stdout);
    proc.on("error", reject);
    proc.on("exit", code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`child exited with code ${code}`));
      }
    });
  });
}
