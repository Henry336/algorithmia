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
  let serverError = "";
  localServer.stderr.on("data", (chunk) => {
    serverError += chunk.toString();
  });

  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await canReachServer()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Local server did not start. ${serverError}`);
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
    if (process.platform === "win32" && existsSync(edgePath)) {
      return chromium.launch({ headless: true, executablePath: edgePath });
    }
    throw new Error(`${error.message}\nInstall a browser with: npx playwright install chromium`);
  }
}

async function openArena(page) {
  await page.goto(`${baseUrl}/?admin=1&encounter=sorting-slime`, { waitUntil: "networkidle" });
  await page.locator("#slime-arena-host canvas").waitFor({ state: "visible", timeout: 10000 });
}

async function main() {
  await ensureServer();
  const browser = await launchBrowser();
  try {
    const errors = [];
    const failedRequests = [];
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || "failed"}`));

    await openArena(page);
    await page.waitForTimeout(2600);
    await page.screenshot({ path: path.resolve("build", "slime-arena-desktop.png"), fullPage: true });

    await page.waitForFunction(() => document.querySelector("#slime-wave-label")?.textContent.includes("Access window"), null, { timeout: 16000 });
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(3500);
    await page.keyboard.up("ArrowRight");
    await page.locator("#slime-command-panel:not(.hidden)").waitFor({ timeout: 4000 });
    const commandLabels = await page.locator("#slime-command-panel .slime-command:not(.admin-only)").allTextContents();
    if (JSON.stringify(commandLabels) !== JSON.stringify(["Attack 5", "Use", "Repair", "Guard"])) {
      throw new Error(`Unexpected command order: ${JSON.stringify(commandLabels)}`);
    }
    const cursorDuringCommands = await page.locator("#slime-arena-shell").evaluate((element) => getComputedStyle(element).cursor);
    if (cursorDuringCommands !== "none") throw new Error(`Command pointer should be hidden, got ${cursorDuringCommands}`);

    await page.keyboard.press("KeyD");
    await page.keyboard.press("Space");
    await page.waitForFunction(() => document.querySelector("#slime-arena-status")?.textContent.includes("No abilities"));
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    await page.locator("#slime-repair-panel:not(.hidden)").waitFor();
    const cursorDuringRepair = await page.locator("#slime-arena-shell").evaluate((element) => getComputedStyle(element).cursor);
    if (cursorDuringRepair === "none") throw new Error("Pointer should return for the repair editor.");
    await page.screenshot({ path: path.resolve("build", "slime-repair-desktop.png"), fullPage: true });

    const repairEditor = page.locator("#slime-repair-editor");
    await repairEditor.fill("def solve(values):\n");
    await repairEditor.press("Tab");
    await repairEditor.type("ordered = values[:]");
    await repairEditor.press("Space");
    const indentationProbe = await repairEditor.inputValue();
    if (!indentationProbe.includes("\n    ordered = values[:] ")) {
      throw new Error(`Tab or Space input failed in repair editor: ${JSON.stringify(indentationProbe)}`);
    }

    await repairEditor.fill(`def solve(values):
    ordered = values[:]
    for i in range(len(ordered)):
        for j in range(len(ordered) - 1 - i):
            if ordered[j] > ordered[j + 1]:
                ordered[j], ordered[j + 1] = ordered[j + 1], ordered[j]
    return ordered`);
    const audioResponse = await page.request.get(`${baseUrl}/assets/audio/ui-command-select.wav`);
    if (!audioResponse.ok() || (await audioResponse.body()).length === 0) {
      throw new Error(`Command-select sound returned ${audioResponse.status()} or an empty body`);
    }
    await page.locator('[data-action="run-slime-repair"]').click();
    await page.locator("#slime-repair-feedback.success").waitFor({ timeout: 5000 });
    await page.locator("#slime-repair-panel").waitFor({ state: "hidden", timeout: 4000 });

    await page.evaluate(async () => {
      const arena = await import("./js/slimeArenaEngine.js");
      arena.slimeArenaAdminWin();
    });
    await page.waitForFunction(() => document.body.dataset.slimeSmokeWin === "true", null, { timeout: 5000 });

    const arcade = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    arcade.on("pageerror", (error) => errors.push(`arcade: ${String(error)}`));
    await arcade.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await arcade.locator('[data-action="arcade"]').click();
    await arcade.locator("#screen-arcade-select.active").waitFor();
    await arcade.screenshot({ path: path.resolve("build", "arcade-select.png"), fullPage: true });
    await arcade.locator('[data-arcade-encounter="sorting-slime"]').click();
    await arcade.locator("#slime-arena-host canvas").waitFor({ state: "visible", timeout: 10000 });
    await arcade.screenshot({ path: path.resolve("build", "arcade-sorting-slime.png"), fullPage: true });

    const campaign = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    campaign.on("pageerror", (error) => errors.push(`campaign: ${String(error)}`));
    await campaign.goto(`${baseUrl}/?admin=0`, { waitUntil: "networkidle" });
    await campaign.locator('[data-action="new-game"]').click();
    await campaign.locator("#dialogue-box:not(.hidden)").waitFor({ timeout: 3000 });
    for (let attempt = 0; attempt < 6; attempt += 1) {
      if (await campaign.locator("#dialogue-box").evaluate((element) => element.classList.contains("hidden"))) break;
      await campaign.locator("#dialogue-box").click();
      await campaign.waitForTimeout(40);
    }
    await campaign.keyboard.press("ArrowUp");
    await campaign.keyboard.press("ArrowUp");
    await campaign.keyboard.press("ArrowUp");
    await campaign.keyboard.press("ArrowUp");
    await campaign.locator("#screen-battle.phaser-slime-active #slime-arena-host canvas").waitFor({ state: "visible", timeout: 10000 });

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    mobile.on("pageerror", (error) => errors.push(`mobile: ${String(error)}`));
    await openArena(mobile);
    await mobile.waitForTimeout(2600);
    const mobileGeometry = await mobile.evaluate(() => {
      const host = document.querySelector("#slime-arena-host").getBoundingClientRect();
      const canvas = document.querySelector("#slime-arena-host canvas").getBoundingClientRect();
      const element = document.querySelector("#slime-arena-host canvas");
      return {
        host: { left: host.left, right: host.right, top: host.top, bottom: host.bottom },
        canvas: { left: canvas.left, right: canvas.right, top: canvas.top, bottom: canvas.bottom },
        backing: { width: element.width, height: element.height },
        style: { width: element.style.width, height: element.style.height },
      };
    });
    if (mobileGeometry.canvas.left < mobileGeometry.host.left - 1 || mobileGeometry.canvas.right > mobileGeometry.host.right + 1) {
      throw new Error(`Mobile canvas escaped its host: ${JSON.stringify(mobileGeometry)}`);
    }
    await mobile.screenshot({ path: path.resolve("build", "slime-arena-mobile.png"), fullPage: true });

    if (failedRequests.length) throw new Error(`Failed requests:\n${failedRequests.join("\n")}`);
    if (errors.length) throw new Error(`Browser errors:\n${errors.join("\n")}`);
    console.log("Sorting Slime Phaser browser smoke passed.");
  } finally {
    await browser.close();
    if (localServer && !localServer.killed) localServer.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
