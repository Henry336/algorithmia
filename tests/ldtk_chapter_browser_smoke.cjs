const path = require("node:path");
const { existsSync } = require("node:fs");
const { spawn } = require("node:child_process");
const { chromium } = require("playwright");

const baseUrl = process.env.ALGORITHMIA_BASE_URL || "http://127.0.0.1:4173";
let localServer = null;

async function canReachServer() {
  try {
    const response = await fetch(baseUrl);
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await canReachServer()) return;
  const target = new URL(baseUrl);
  if (!["127.0.0.1", "localhost"].includes(target.hostname)) {
    throw new Error(`Cannot reach external smoke target: ${baseUrl}`);
  }
  localServer = spawn(process.execPath, [path.resolve("scripts", "serve-web.mjs"), "--port", target.port || "4173"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await canReachServer()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Local server did not start.");
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
    if (process.platform === "win32" && existsSync(edgePath)) {
      return chromium.launch({ headless: true, executablePath: edgePath });
    }
    throw error;
  }
}

async function main() {
  await ensureServer();
  const browser = await launchBrowser();
  try {
    const errors = [];
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    const dataResponse = await page.request.get(`${baseUrl}/data/ldtk/chapter5_layout.ldtk`);
    if (!dataResponse.ok()) throw new Error(`LDtk data did not publish: ${dataResponse.status()}`);

    await page.goto(`${baseUrl}/?admin=1&chapter=5`, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.removeItem("algorithimia-save-v1");
      localStorage.setItem("algorithimia-admin-mode", "1");
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#screen-room-ch5.active .theme-ldtk-test").waitFor({ state: "visible", timeout: 10000 });
    await page.locator(".ldtk-entity").first().waitFor({ state: "visible", timeout: 10000 });

    const geometry = await page.evaluate(() => {
      const viewport = document.querySelector("#room-viewport-ch5");
      return {
        width: viewport.style.width,
        height: viewport.style.height,
        wallCount: document.querySelectorAll("#room-viewport-ch5 .tile-wall").length,
        entityCount: document.querySelectorAll("#room-viewport-ch5 .ldtk-entity").length,
      };
    });
    if (geometry.width !== "512px" || geometry.height !== "512px") {
      throw new Error(`Unexpected LDtk room geometry: ${JSON.stringify(geometry)}`);
    }
    if (geometry.wallCount < 20 || geometry.entityCount < 4) {
      throw new Error(`LDtk render is missing important tiles/entities: ${JSON.stringify(geometry)}`);
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (await page.locator("#dialogue-box").evaluate((element) => element.classList.contains("hidden"))) break;
      await page.keyboard.press("Space");
      await page.waitForTimeout(60);
    }
    await page.keyboard.press("ArrowRight");
    const inventory = await page.evaluate(async () => (await import("./js/state.js")).getState().ldtkChapter5Inventory);
    if (!inventory.includes("KeyB")) throw new Error(`Expected to collect KeyB, got ${JSON.stringify(inventory)}`);

    await page.screenshot({ path: path.resolve("build", "ldtk-chapter-5.png"), fullPage: true });

    if (errors.length) throw new Error(`Browser errors:\n${errors.join("\n")}`);
    console.log("LDtk Chapter 5 browser smoke passed.");
  } finally {
    await browser.close();
    if (localServer && !localServer.killed) localServer.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
