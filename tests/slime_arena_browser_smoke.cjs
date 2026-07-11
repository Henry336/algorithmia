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
  await page.goto(`${baseUrl}/?admin=1&encounter=sorting-slime`, { waitUntil: "domcontentloaded" });
  await page.locator("#slime-arena-host canvas").waitFor({ state: "visible", timeout: 10000 });
}

async function reachSlime(page) {
  await page.keyboard.down("ArrowRight");
  for (let step = 0; step < 16; step += 1) {
    const vertical = step % 2 === 0 ? "ArrowUp" : "ArrowDown";
    await page.keyboard.down(vertical);
    await page.waitForTimeout(420);
    await page.keyboard.up(vertical);
    if (await page.locator("#slime-command-panel").evaluate((element) => !element.classList.contains("hidden"))) break;
  }
  await page.keyboard.up("ArrowRight");
  if (await page.locator("#slime-command-panel").evaluate((element) => element.classList.contains("hidden"))) {
    await page.evaluate(async () => (await import("./js/slimeArenaEngine.js")).slimeArenaAdminOpenCommandWindow());
    await page.locator("#slime-command-panel").waitFor({ state: "visible", timeout: 2000 });
  }
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
    page.on("requestfailed", (request) => {
      const failureText = request.failure()?.errorText || "failed";
      const url = request.url();
      if (failureText === "net::ERR_ABORTED" && url.includes("/assets/audio/")) return;
      failedRequests.push(`${url} ${failureText}`);
    });

    await openArena(page);
    await page.waitForTimeout(2600);
    await page.screenshot({ path: path.resolve("build", "slime-arena-desktop.png"), fullPage: true });

    await reachSlime(page);
    const commandLabels = await page.locator("#slime-command-panel .slime-command:not(.admin-only)").allTextContents();
    if (JSON.stringify(commandLabels) !== JSON.stringify(["Attack 5", "Use", "Repair", "Guard"])) {
      throw new Error(`Unexpected command order: ${JSON.stringify(commandLabels)}`);
    }
    const cursorDuringCommands = await page.locator("#slime-arena-shell").evaluate((element) => getComputedStyle(element).cursor);
    if (cursorDuringCommands !== "none") throw new Error(`Command pointer should be hidden, got ${cursorDuringCommands}`);
    const initialCombatState = await page.evaluate(async () => (await import("./js/slimeArenaEngine.js")).slimeArenaDebugState());
    if (initialCombatState.nullShieldHp !== 100 || initialCombatState.repaired) {
      throw new Error(`Unexpected initial shield state: ${JSON.stringify(initialCombatState)}`);
    }

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    await page.waitForTimeout(500);
    const guardedState = await page.evaluate(async () => (await import("./js/slimeArenaEngine.js")).slimeArenaDebugState());
    if (guardedState.guardRemaining < 4000) throw new Error(`Guard did not arm for five seconds: ${JSON.stringify(guardedState)}`);
    await page.waitForTimeout(5100);
    if (errors.length) throw new Error(`Browser errors during Guard: ${errors.join(" | ")}`);
    const expiredGuardState = await page.evaluate(async () => (await import("./js/slimeArenaEngine.js")).slimeArenaDebugState());
    if (expiredGuardState.guardRemaining !== 0) throw new Error(`Guard did not expire: ${JSON.stringify(expiredGuardState)}`);
    await page.evaluate(async () => (await import("./js/state.js")).setState({ playerHp: 40 }));

    await reachSlime(page);

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
    const starterCode = await repairEditor.inputValue();
    if (!starterCode.includes("for i in range") || !starterCode.includes("TODO: swap these neighboring values")) {
      throw new Error(`Phase 1 starter is not a guided completion exercise: ${JSON.stringify(starterCode)}`);
    }
    await page.locator('[data-action="show-slime-hint"]').click();
    await page.locator("#slime-repair-hint:not(.hidden)").waitFor();
    if (!(await page.locator("#slime-repair-hint").textContent()).includes("larger value is on the left")) {
      throw new Error("Conceptual repair hint did not appear.");
    }
    await page.locator('[data-action="show-slime-hint"]').click();
    if (!(await page.locator("#slime-repair-hint").textContent()).includes("ordered[j], ordered[j + 1]")) {
      throw new Error("Syntax repair hint did not appear.");
    }
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
    const audioAssets = [
      "assets/audio/ui-command-select.wav",
      "assets/audio/hit-hurt.wav",
      "assets/audio/music/slime-boss-phase-1-2.wav",
      "assets/audio/music/slime-boss-phase-3.wav",
    ];
    for (const audioAsset of audioAssets) {
      const audioResponse = await page.request.get(`${baseUrl}/${audioAsset}`);
      if (!audioResponse.ok() || (await audioResponse.body()).length === 0) {
        throw new Error(`${audioAsset} returned ${audioResponse.status()} or an empty body`);
      }
    }
    await page.locator('[data-action="run-slime-repair"]').click();
    await page.locator("#slime-repair-feedback.success").waitFor({ timeout: 5000 });
    await page.locator("#slime-repair-panel").waitFor({ state: "hidden", timeout: 4000 });
    const repairedCombatState = await page.evaluate(async () => (await import("./js/slimeArenaEngine.js")).slimeArenaDebugState());
    if (repairedCombatState.nullShieldHp !== 0 || !repairedCombatState.repaired) {
      throw new Error(`Repair did not breach the phase shield: ${JSON.stringify(repairedCombatState)}`);
    }

    const laterRepairResults = await page.evaluate(async () => {
      const { runPythonRepair } = await import("./js/pythonRepairRuntime.js");
      const mergeCode = `def solve(values):
    merged = values[:]
    for i in range(len(merged)):
        for j in range(len(merged) - 1 - i):
            if merged[j] > merged[j + 1]:
                merged[j], merged[j + 1] = merged[j + 1], merged[j]
    return merged`;
      const reverseCode = `def solve(values):
    reversed_values = values[:]
    for i in range(len(reversed_values) / 2):
        reversed_values[i], reversed_values[len(reversed_values) - 1 - i] = reversed_values[len(reversed_values) - 1 - i], reversed_values[i]
    return reversed_values`;
      return Promise.all([
        runPythonRepair(mergeCode, [{ name: "merge", input: [1, 4, 7, 2, 3, 9], expected: [1, 2, 3, 4, 7, 9] }]),
        runPythonRepair(reverseCode, [{ name: "reverse", input: [1, 2, 3, 4, 5], expected: [5, 4, 3, 2, 1] }]),
      ]);
    });
    if (!laterRepairResults.every((outcome) => outcome.ok && outcome.results.every((result) => result.pass))) {
      throw new Error(`Later phase repair samples failed: ${JSON.stringify(laterRepairResults)}`);
    }

    await page.evaluate(async () => (await import("./js/slimeArenaEngine.js")).slimeArenaAdminSetPhase(2));
    await page.waitForTimeout(1800);
    const mergeState = await page.evaluate(async () => (await import("./js/slimeArenaEngine.js")).slimeArenaDebugState());
    if (mergeState.phase !== 2 || mergeState.nullShieldHp !== 100 || mergeState.repaired) {
      throw new Error(`Phase 2 did not compile a fresh shield: ${JSON.stringify(mergeState)}`);
    }
    await page.screenshot({ path: path.resolve("build", "slime-phase-2.png"), fullPage: true });

    await page.evaluate(async () => (await import("./js/slimeArenaEngine.js")).slimeArenaAdminSetPhase(3));
    await page.waitForTimeout(1800);
    const spiralState = await page.evaluate(async () => (await import("./js/slimeArenaEngine.js")).slimeArenaDebugState());
    if (spiralState.phase !== 3 || spiralState.nullShieldHp !== 100 || spiralState.repaired) {
      throw new Error(`Phase 3 did not compile a fresh shield: ${JSON.stringify(spiralState)}`);
    }
    await page.screenshot({ path: path.resolve("build", "slime-phase-3.png"), fullPage: true });

    await page.evaluate(async () => {
      const arena = await import("./js/slimeArenaEngine.js");
      arena.slimeArenaAdminWin();
    });
    await page.waitForFunction(() => document.body.dataset.slimeSmokeWin === "true", null, { timeout: 5000 });

    const arcade = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    arcade.on("pageerror", (error) => errors.push(`arcade: ${String(error)}`));
    await arcade.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await arcade.locator('[data-action="arcade"]').click();
    await arcade.locator("#screen-arcade-select.active").waitFor();
    await arcade.screenshot({ path: path.resolve("build", "arcade-select.png"), fullPage: true });
    await arcade.locator('[data-arcade-encounter="sorting-slime"]').click();
    await arcade.locator("#slime-arena-host canvas").waitFor({ state: "visible", timeout: 10000 });
    await arcade.screenshot({ path: path.resolve("build", "arcade-sorting-slime.png"), fullPage: true });

    const campaign = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    campaign.on("pageerror", (error) => errors.push(`campaign: ${String(error)}`));
    await campaign.goto(`${baseUrl}/?admin=0`, { waitUntil: "domcontentloaded" });
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
