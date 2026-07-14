const path = require("node:path");
const { existsSync } = require("node:fs");
const { spawn } = require("node:child_process");
const { chromium } = require("playwright");

const baseUrl = process.env.ALGORITHMIA_BASE_URL || "http://127.0.0.1:4173";
let localServer = null;

async function canReachServer() {
  try {
    return (await fetch(baseUrl)).ok;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await canReachServer()) return;
  const target = new URL(baseUrl);
  localServer = spawn(process.execPath, [path.resolve("scripts", "serve-web.mjs"), "--port", target.port || "4173"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await canReachServer()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Local title-screen server did not start.");
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
    await page.goto(`${baseUrl}/?admin=0`, { waitUntil: "networkidle" });
    await page.locator("#screen-title.active .title-menu").waitFor();

    const background = await page.request.get(`${baseUrl}/assets/menu/algorithmia-world-menu.png`);
    if (!background.ok() || (await background.body()).length < 1_000_000) {
      throw new Error("The generated Algorithmia menu mural is missing or unexpectedly small.");
    }

    const logo = await page.locator("#title-logo-canvas").evaluate((canvas) => {
      const context = canvas.getContext("2d");
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let opaquePixels = 0;
      for (let index = 3; index < pixels.length; index += 4) {
        if (pixels[index] > 0) opaquePixels += 1;
      }
      return { width: canvas.width, height: canvas.height, opaquePixels };
    });
    if (logo.width < 400 || logo.height < 50 || logo.opaquePixels < 10_000) {
      throw new Error(`Pixel logo was not rendered correctly: ${JSON.stringify(logo)}`);
    }

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("KeyS");
    if (await page.locator(".title-option.selected").count()) {
      throw new Error("The pointer-first title menu unexpectedly created a keyboard selection.");
    }
    const cursorStyles = await page.evaluate(() => ({
      scene: getComputedStyle(document.querySelector(".title-scene")).cursor,
      option: getComputedStyle(document.querySelector('[data-action="new-game"]')).cursor,
    }));
    if (!cursorStyles.scene.includes("pixel-menu-cursor.svg") || !cursorStyles.option.includes("pixel-menu-hand.svg")) {
      throw new Error(`Pixel cursors were not applied: ${JSON.stringify(cursorStyles)}`);
    }
    for (const cursorAsset of ["pixel-menu-cursor.svg", "pixel-menu-hand.svg"]) {
      const cursorResponse = await page.request.get(`${baseUrl}/assets/ui/${cursorAsset}`);
      if (!cursorResponse.ok() || (await cursorResponse.body()).length < 200) {
        throw new Error(`Pixel cursor asset failed to load: ${cursorAsset}`);
      }
    }
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.resolve("build", "title-screen-desktop.png"), fullPage: true });

    await page.locator('[data-action="options"]').click();
    await page.locator("#screen-options.active .options-panel").waitFor();
    await page.locator('label[for="opt-music"] .option-switch').click();
    await page.locator('label[for="opt-sound"] .option-switch').click();
    const preferences = await page.evaluate(() => JSON.parse(localStorage.getItem("algorithmia-audio-v1")));
    if (!preferences?.musicMuted || !preferences?.soundMuted) {
      throw new Error(`Audio preferences did not persist: ${JSON.stringify(preferences)}`);
    }
    await page.reload({ waitUntil: "networkidle" });
    await page.locator('[data-action="options"]').click();
    if (await page.locator("#opt-music").isChecked() || await page.locator("#opt-sound").isChecked()) {
      throw new Error("Muted audio toggles did not restore after reload.");
    }
    await page.screenshot({ path: path.resolve("build", "options-screen-desktop.png"), fullPage: true });

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    mobile.on("pageerror", (error) => errors.push(`mobile: ${String(error)}`));
    await mobile.goto(`${baseUrl}/?admin=0`, { waitUntil: "networkidle" });
    await mobile.waitForTimeout(1200);
    const mobileGeometry = await mobile.locator(".title-content").evaluate((content) => {
      const rect = content.getBoundingClientRect();
      const lastButton = document.querySelector(".title-option:last-child").getBoundingClientRect();
      return {
        content: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
        lastButtonBottom: lastButton.bottom,
        viewport: { width: innerWidth, height: innerHeight },
      };
    });
    if (mobileGeometry.content.left < 0 || mobileGeometry.content.right > mobileGeometry.viewport.width || mobileGeometry.lastButtonBottom > mobileGeometry.viewport.height) {
      throw new Error(`Mobile title content overflowed: ${JSON.stringify(mobileGeometry)}`);
    }
    await mobile.screenshot({ path: path.resolve("build", "title-screen-mobile.png"), fullPage: true });

    if (errors.length) throw new Error(`Title screen browser errors:\n${errors.join("\n")}`);
    console.log("Algorithmia title screen browser smoke passed.");
  } finally {
    await browser.close();
    if (localServer && !localServer.killed) localServer.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
