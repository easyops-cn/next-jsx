import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { babel, babelConfigFile } from "./babel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function transpile() {
  const start = performance.now();
  const task = spawn(
    babel,
    [
      "temp",
      "--config-file",
      babelConfigFile,
      "--out-dir",
      "dist",
      "--extensions",
      ".jsx",
      "--copy-files",
      "--delete-dir-on-start",
    ],
    {
      stdio: "inherit",
    }
  );

  task.on("close", (code) => {
    if (code === 0) {
      console.log(
        "Transpile done!",
        `(${Math.round(performance.now() - start)}ms)`
      );
      spawn("node", [path.join(__dirname, "../lib/build.js")], {
        stdio: "inherit",
      });
    } else {
      console.error(`Transpile failed: ${code}`);
    }
  });
}
