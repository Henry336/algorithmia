import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "node_modules", "phaser", "dist", "phaser.min.js");
const destination = resolve(root, "web", "vendor", "phaser.min.js");

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
console.log("Copied Phaser runtime to web/vendor/phaser.min.js");
