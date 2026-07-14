const path = require("node:path");
const { existsSync, mkdirSync } = require("node:fs");
const { spawn } = require("node:child_process");
const { chromium } = require("playwright");

const baseUrl = process.env.ALGORITHMIA_BASE_URL || "http://127.0.0.1:4173";
const captureScreenshots = process.env.ALGORITHMIA_CAPTURE_ATLAS === "1";
const chapterNames = [
  "Queueworks Verge",
  "Dispatch Meridian",
  "Heaplight Caldera",
  "Array Plains",
  "Graphreach",
  "Citadel of Boundaries",
];
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
  if (!["127.0.0.1", "localhost"].includes(target.hostname)) throw new Error(`Cannot start external smoke target: ${baseUrl}`);
  localServer = spawn(process.execPath, [path.resolve("scripts", "serve-web.mjs"), "--port", target.port || "4173"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await canReachServer()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Local campaign-atlas server did not start.");
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
    if (process.platform === "win32" && existsSync(edgePath)) return chromium.launch({ headless: true, executablePath: edgePath });
    throw error;
  }
}

async function openChapter(page, chapter) {
  await page.goto(`${baseUrl}/?admin=1&chapter=${chapter}`, { waitUntil: "networkidle" });
  await page.locator("#screen-campaign-atlas.active #campaign-atlas-host canvas").waitFor({ state: "visible", timeout: 15000 });
  await page.waitForFunction(() => document.body.dataset.campaignAtlasReady === "true" && window.__campaignAtlasDebug?.ready);
  await page.waitForTimeout(650);
}

async function inspectChapter(page, chapter) {
  return page.evaluate(({ expectedChapter, expectedTitle }) => {
    const debug = window.__campaignAtlasDebug;
    const snapshot = debug.snapshot();
    const canvas = document.querySelector("#campaign-atlas-host canvas");
    const host = document.getElementById("campaign-atlas-host");
    const hostRect = host.getBoundingClientRect();
    const heading = document.getElementById("campaign-atlas-title").textContent;
    const probes = debug.routeProbes();
    const badProbes = probes.filter((probe) => !debug.isWalkable(probe.x, probe.y, true)).map((probe) => probe.id);
    const badBlockers = debug.blockerAudit().filter((item) => !item.blocked);
    return {
      expectedChapter,
      snapshot,
      heading,
      titleMatches: heading === expectedTitle,
      hostRect: { width: hostRect.width, height: hostRect.height, left: hostRect.left, top: hostRect.top },
      viewport: { width: innerWidth, height: innerHeight },
      canvas: { width: canvas.width, height: canvas.height },
      badProbes,
      unreachable: debug.unreachableRouteProbes(),
      badBlockers,
      bodyOverflow: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight,
      hud: {
        region: document.getElementById("campaign-atlas-region").textContent,
        objective: document.getElementById("campaign-atlas-objective").textContent,
        rot: document.getElementById("campaign-atlas-rot-value").textContent,
      },
    };
  }, { expectedChapter: chapter, expectedTitle: chapterNames[chapter] });
}

async function launchAtlasEncounter(page, chapter, interactionId) {
  await openChapter(page, chapter);
  const launched = await page.evaluate(async (id) => {
    const { getCampaignChapter } = await import("./js/campaignAtlasData.js");
    const { startCampaignEncounter } = await import("./js/campaignAtlasEncounters.js");
    const interaction = getCampaignChapter(window.__campaignAtlasDebug.chapter).interactions.find((item) => item.id === id);
    if (!interaction) return false;
    window.__atlasEncounterFinished = false;
    startCampaignEncounter({
      interaction,
      onComplete: () => {
        window.__atlasEncounterFinished = true;
        window.__campaignAtlasDebug?.refresh();
      },
    });
    return true;
  }, interactionId);
  if (!launched) throw new Error(`Atlas encounter ${interactionId} was not found in Chapter ${chapter}.`);
}

async function assertLoadedImage(page, selector, expectedPath) {
  await page.locator(selector).waitFor({ state: "visible", timeout: 15000 });
  const image = await page.locator(selector).evaluate((img) => ({ src: img.getAttribute("src"), width: img.naturalWidth, height: img.naturalHeight }));
  if (!image.src?.includes(expectedPath) || image.width < 80 || image.height < 80) {
    throw new Error(`Encounter image did not load at production quality: ${JSON.stringify(image)}`);
  }
}

function assertChapter(audit) {
  const chapter = audit.expectedChapter;
  if (audit.snapshot.chapter !== chapter) throw new Error(`Chapter ${chapter} loaded the wrong world: ${JSON.stringify(audit.snapshot)}`);
  if (!audit.titleMatches) throw new Error(`Chapter ${chapter} heading mismatch: ${audit.heading}`);
  if (audit.snapshot.entities.length < 8) throw new Error(`Chapter ${chapter} has too little authored content: ${audit.snapshot.entities.length} interactions`);
  if (audit.snapshot.ambience.scenery < 20) throw new Error(`Chapter ${chapter} scenery pass is too sparse: ${JSON.stringify(audit.snapshot.ambience)}`);
  if (audit.snapshot.ambience.occluders < 3) throw new Error(`Chapter ${chapter} lacks foreground occlusion structures.`);
  if (audit.badProbes.length) throw new Error(`Chapter ${chapter} interaction probes are outside collision terrain: ${audit.badProbes.join(", ")}`);
  if (audit.unreachable.length) throw new Error(`Chapter ${chapter} contains unreachable content: ${audit.unreachable.join(", ")}`);
  if (audit.badBlockers.length) throw new Error(`Chapter ${chapter} blockers do not reject collision: ${JSON.stringify(audit.badBlockers)}`);
  if (audit.hostRect.width < audit.viewport.width * 0.98 || audit.hostRect.height < audit.viewport.height * 0.98) {
    throw new Error(`Chapter ${chapter} does not use the viewport: ${JSON.stringify(audit.hostRect)} vs ${JSON.stringify(audit.viewport)}`);
  }
  if (audit.canvas.width < 700 || audit.canvas.height < 500) throw new Error(`Chapter ${chapter} canvas is undersized: ${JSON.stringify(audit.canvas)}`);
  if (!audit.hud.region || !audit.hud.objective || !audit.hud.rot.endsWith("%")) throw new Error(`Chapter ${chapter} HUD is incomplete: ${JSON.stringify(audit.hud)}`);
  if (audit.bodyOverflow) throw new Error(`Chapter ${chapter} introduces document overflow.`);
}

async function main() {
  await ensureServer();
  const browser = await launchBrowser();
  let activeChapter = "boot";
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("pageerror", (error) => errors.push(`[chapter ${activeChapter}] ${String(error)}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`[chapter ${activeChapter}] ${message.text()}`);
    });
    page.on("response", (response) => {
      if (response.status() >= 400) errors.push(`[chapter ${activeChapter}] HTTP ${response.status()} ${response.url()}`);
    });

    if (captureScreenshots) mkdirSync(path.resolve("output", "playwright"), { recursive: true });
    for (let chapter = 0; chapter < chapterNames.length; chapter += 1) {
      activeChapter = chapter;
      await openChapter(page, chapter);
      const audit = await inspectChapter(page, chapter);
      assertChapter(audit);
      const canvasImage = await page.locator("#campaign-atlas-host canvas").screenshot();
      if (canvasImage.length < 20_000) throw new Error(`Chapter ${chapter} canvas screenshot appears blank (${canvasImage.length} bytes).`);
      if (captureScreenshots) await page.screenshot({ path: path.resolve("output", "playwright", `campaign-atlas-ch${chapter}.png`), fullPage: false });
    }

    activeChapter = "puzzle-audit";
    await openChapter(page, 0);
    const puzzleAudit = await page.evaluate(async () => {
      const state = await import("./js/state.js");
      state.resetState();
      window.__campaignAtlasDebug.refresh();
      const gateBefore = window.__campaignAtlasDebug.gateAudit().find((gate) => gate.id === "queueworks-exit-gate");
      window.__campaignAtlasDebug.interact("valve-return");
      const wrongProgress = state.getState().campaignPuzzleProgress["queue-valves"] || [];
      window.__campaignAtlasDebug.interact("valve-low");
      window.__campaignAtlasDebug.interact("valve-return");
      window.__campaignAtlasDebug.interact("valve-high");
      return { gateBefore, wrongProgress, aligned: state.getState().queueworksValvesAligned };
    });
    if (!puzzleAudit.gateBefore?.blockedNow || !puzzleAudit.gateBefore?.traversableWhenOpen) throw new Error(`Queueworks gate collision contract failed: ${JSON.stringify(puzzleAudit)}`);
    if (puzzleAudit.wrongProgress.length !== 0 || !puzzleAudit.aligned) throw new Error(`Queueworks relay reset/completion failed: ${JSON.stringify(puzzleAudit)}`);

    activeChapter = "secret-audit";
    await openChapter(page, 4);
    const secretAudit = await page.evaluate(async () => {
      const state = await import("./js/state.js");
      state.resetState();
      window.__campaignAtlasDebug.refresh();
      const concealedBefore = window.__campaignAtlasDebug.concealedVisible();
      window.__campaignAtlasDebug.interact("graph-diamond-a");
      window.__campaignAtlasDebug.interact("graph-diamond-b");
      window.__campaignAtlasDebug.interact("graph-diamond-c");
      const gateAfter = window.__campaignAtlasDebug.gateAudit().find((gate) => gate.id === "graph-secret-gate");
      return {
        concealedBefore,
        concealedAfter: window.__campaignAtlasDebug.concealedVisible(),
        diamonds: state.getState().graphDiamonds,
        gateAfter,
      };
    });
    if (secretAudit.concealedBefore !== 1 || secretAudit.concealedAfter !== 0 || secretAudit.diamonds.length !== 3) throw new Error(`Graphreach secret reveal failed: ${JSON.stringify(secretAudit)}`);
    if (!secretAudit.gateAfter?.requirementMet || secretAudit.gateAfter.blockedNow || !secretAudit.gateAfter.traversableWhenOpen) throw new Error(`Graphreach secret gate did not open cleanly: ${JSON.stringify(secretAudit)}`);

    activeChapter = "dispatcher-handoff";
    await launchAtlasEncounter(page, 1, "dispatcher");
    await page.locator("#screen-battle-ticket.active").waitFor({ state: "visible", timeout: 15000 });
    await assertLoadedImage(page, "#ticket-battle-enemy-sprite img", "characters/dispatcher/dispatcher.png");
    await page.locator('[data-action="admin-win-ticket"]').click();
    await page.waitForFunction(async () => window.__atlasEncounterFinished && (await import("./js/state.js")).getState().dispatcherDefeated, null, { timeout: 15000 });
    await page.locator("#screen-campaign-atlas.active").waitFor({ state: "visible" });

    activeChapter = "bogolord-handoff";
    await launchAtlasEncounter(page, 3, "bogolord");
    await page.locator("#screen-battle-bogo.active").waitFor({ state: "visible", timeout: 15000 });
    await assertLoadedImage(page, "#bogo-boss-sprite img", "characters/bogolord/");
    await page.locator('[data-action="admin-win-bogo"]').click();
    await page.waitForFunction(async () => window.__atlasEncounterFinished && (await import("./js/state.js")).getState().bogoDefeated, null, { timeout: 15000 });
    await page.locator("#screen-campaign-atlas.active").waitFor({ state: "visible" });

    activeChapter = "husk-handoff";
    await launchAtlasEncounter(page, 4, "recursive-husk");
    await page.locator("#screen-battle-code.active").waitFor({ state: "visible", timeout: 15000 });
    await assertLoadedImage(page, "#code-battle-enemy-sprite img", "characters/recursive-husk/recursive-husk-92.png");
    await page.locator('[data-action="admin-win-code"]').click();
    await page.waitForFunction(async () => window.__atlasEncounterFinished && (await import("./js/state.js")).getState().recursiveHuskCleared, null, { timeout: 15000 });
    await page.locator("#screen-campaign-atlas.active").waitFor({ state: "visible" });

    activeChapter = "mobile";
    await page.setViewportSize({ width: 390, height: 844 });
    await openChapter(page, 4);
    const mobile = await page.evaluate(() => {
      const dpad = document.getElementById("dpad-campaign-atlas").getBoundingClientRect();
      const objective = document.querySelector(".campaign-atlas-objective").getBoundingClientRect();
      const menu = document.querySelector("#screen-campaign-atlas .hud-menu-btn").getBoundingClientRect();
      return {
        dpad: { width: dpad.width, right: dpad.right, bottom: dpad.bottom },
        objective: { left: objective.left, right: objective.right, bottom: objective.bottom },
        menu: { left: menu.left, right: menu.right },
        viewport: { width: innerWidth, height: innerHeight },
        overflow: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight,
      };
    });
    if (mobile.dpad.width < 90 || mobile.dpad.right > mobile.viewport.width || mobile.dpad.bottom > mobile.viewport.height) throw new Error(`Mobile d-pad is not framed correctly: ${JSON.stringify(mobile)}`);
    if (mobile.objective.left < 0 || mobile.objective.right > mobile.viewport.width || mobile.menu.right > mobile.viewport.width) throw new Error(`Mobile campaign UI escapes the viewport: ${JSON.stringify(mobile)}`);
    if (mobile.overflow) throw new Error("Mobile campaign introduces document overflow.");
    if (captureScreenshots) await page.screenshot({ path: path.resolve("output", "playwright", "campaign-atlas-mobile.png"), fullPage: false });

    if (errors.length) throw new Error(`Campaign atlas emitted browser errors:\n${errors.join("\n")}`);
    console.log("Campaign atlas browser smoke passed for six desktop chapters and mobile Graphreach.");
  } finally {
    await browser.close();
    if (localServer) localServer.kill();
  }
}

main().catch((error) => {
  console.error(error);
  if (localServer) localServer.kill();
  process.exitCode = 1;
});
