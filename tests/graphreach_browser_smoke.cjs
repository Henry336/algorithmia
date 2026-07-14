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

async function dismissDialogue(page) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const hidden = await page.locator("#dialogue-box").evaluate((element) => element.classList.contains("hidden"));
    if (hidden) return;
    await page.keyboard.press("Space");
    await page.waitForTimeout(80);
  }
}

async function openGraphreach(page) {
  await page.goto(`${baseUrl}/?admin=1&chapter=4`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.setItem("algorithimia-admin-mode", "1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#screen-room-ch4.active .graphreach-phaser-host canvas").waitFor({ state: "visible", timeout: 15000 });
  await page.waitForFunction(() => document.body.dataset.graphreachReady === "true" && window.__graphreachDebug);
  await page.waitForTimeout(750);
  await dismissDialogue(page);
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

    const mapResponse = await page.request.get(`${baseUrl}/assets/maps/graphreach/graphreach-space.png`);
    if (!mapResponse.ok()) throw new Error(`Graphreach map did not publish: ${mapResponse.status()}`);

    await openGraphreach(page);
    const initial = await page.evaluate(() => {
      const debug = window.__graphreachDebug;
      const step = 18;
      const start = debug.routeProbes[0];
      const queue = [start];
      const visited = new Map([[`${Math.round(start.x / step)},${Math.round(start.y / step)}`, start]]);
      for (let cursor = 0; cursor < queue.length; cursor += 1) {
        const current = queue[cursor];
        for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
          const candidate = { x: current.x + dx, y: current.y + dy };
          const key = `${Math.round(candidate.x / step)},${Math.round(candidate.y / step)}`;
          if (visited.has(key) || !debug.isWalkable(candidate.x, candidate.y)) continue;
          visited.set(key, candidate);
          queue.push(candidate);
        }
      }
      const reachableProbes = debug.routeProbes.map((probe) => Array.from(visited.values())
        .some((point) => Math.hypot(point.x - probe.x, point.y - probe.y) <= step * 1.6));
      return {
        snapshot: debug.snapshot(),
        routeProbeResults: debug.routeProbes.map((point) => debug.isWalkable(point.x, point.y)),
        reachableProbes,
        interactionIds: debug.interactionIds,
      };
    });
    if (initial.snapshot.mapWidth !== 1254 || initial.snapshot.mapHeight !== 1254) {
      throw new Error(`Unexpected Graphreach map size: ${JSON.stringify(initial.snapshot)}`);
    }
    if (initial.routeProbeResults.some((walkable) => !walkable)) {
      throw new Error(`A required Graphreach route probe is blocked: ${JSON.stringify(initial.routeProbeResults)}`);
    }
    if (initial.reachableProbes.some((reachable) => !reachable)) {
      throw new Error(`A required Graphreach destination is disconnected: ${JSON.stringify(initial.reachableProbes)}`);
    }
    if (initial.interactionIds.length < 8 || initial.snapshot.ambience.grass < 8 || initial.snapshot.ambience.water < 2) {
      throw new Error(`Graphreach content is incomplete: ${JSON.stringify(initial)}`);
    }

    const beforeMove = initial.snapshot.player.x;
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(520);
    await page.keyboard.up("ArrowRight");
    const afterMove = await page.evaluate(() => window.__graphreachDebug.snapshot().player.x);
    if (afterMove <= beforeMove + 12) {
      const movementDiagnostics = await page.evaluate(() => ({
        screenActive: document.getElementById("screen-room-ch4").classList.contains("active"),
        dialogueHidden: document.getElementById("dialogue-box").classList.contains("hidden"),
        activeElement: document.activeElement?.id || document.activeElement?.tagName,
      }));
      throw new Error(`Patchrunner did not move through Graphreach: ${beforeMove} -> ${afterMove}; ${JSON.stringify({ movementDiagnostics, errors })}`);
    }

    const chapelReady = await page.evaluate(() => window.__graphreachDebug.teleportToInteraction("chapel-ledger"));
    if (!chapelReady) throw new Error("Could not reach the chapel ledger interaction.");
    await page.waitForTimeout(80);
    const chapelSnapshot = await page.evaluate(() => window.__graphreachDebug.snapshot());
    if (chapelSnapshot.activeInteraction !== "chapel-ledger") {
      throw new Error(`Chapel interaction was not active: ${JSON.stringify(chapelSnapshot)}`);
    }
    await page.keyboard.press("Space");
    await page.locator("#dialogue-box:not(.hidden)").waitFor({ state: "visible" });
    await dismissDialogue(page);

    await page.screenshot({ path: path.resolve("build", "graphreach-exploration-desktop.png"), fullPage: true });

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    mobile.on("pageerror", (error) => errors.push(`mobile: ${String(error)}`));
    await openGraphreach(mobile);
    const mobileGeometry = await mobile.locator(".graphreach-space-shell").evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight };
    });
    if (mobileGeometry.width > mobileGeometry.viewportWidth + 1 || mobileGeometry.height > mobileGeometry.viewportHeight) {
      throw new Error(`Graphreach overflows mobile viewport: ${JSON.stringify(mobileGeometry)}`);
    }
    await mobile.screenshot({ path: path.resolve("build", "graphreach-exploration-mobile.png"), fullPage: true });
    await mobile.close();

    if (errors.length) throw new Error(`Browser errors:\n${errors.join("\n")}`);
    console.log("Graphreach exploration browser smoke passed.");
  } finally {
    await browser.close();
    if (localServer && !localServer.killed) localServer.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
