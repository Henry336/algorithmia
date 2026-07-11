import { readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const searchRoots = ["web/js", "scripts", "tests"];

function collectJavaScript(folder) {
  const absoluteFolder = join(root, folder);
  return readdirSync(absoluteFolder)
    .flatMap((name) => {
      const absolutePath = join(absoluteFolder, name);
      if (statSync(absolutePath).isDirectory()) return collectJavaScript(relative(root, absolutePath));
      return /\.(?:cjs|js|mjs)$/.test(name) ? [absolutePath] : [];
    });
}

const files = searchRoots.flatMap(collectJavaScript);
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`Checked ${files.length} JavaScript files.`);
