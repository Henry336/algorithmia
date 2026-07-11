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

    await page.goto(`${baseUrl}/?workshop=1`, { waitUntil: "networkidle" });
    await page.locator("#screen-workshop.active .workshop-grid").waitFor({ state: "visible", timeout: 10000 });
    await page.screenshot({ path: path.resolve("build", "workshop-editor.png"), fullPage: true });

    await page.locator('[data-workshop-tile="wall"]').click();
    await page.locator('[data-workshop-cell][data-x="3"][data-y="3"]').click();
    const paintedWall = await page.locator('[data-workshop-cell][data-x="3"][data-y="3"]').evaluate((cell) => cell.classList.contains("workshop-tile-wall"));
    if (!paintedWall) throw new Error("Workshop map painter did not paint a wall.");

    await page.locator('[data-workshop-tool="spawn"]').click();
    await page.locator('[data-workshop-cell][data-x="2"][data-y="2"]').click();
    const spawnText = await page.locator('[data-workshop-cell][data-x="2"][data-y="2"]').textContent();
    if (!spawnText.includes("P")) throw new Error("Workshop spawn tool did not move the player spawn.");

    await page.locator('[data-workshop-tab="entities"]').click();
    await page.locator('[data-workshop-entity-type="enemy"]').click();
    await page.locator('[data-workshop-cell][data-x="6"][data-y="5"]').click();
    await page.locator('[data-entity-field="name"]').fill("Workshop Slime");
    await page.locator('[data-entity-field="sprite"]').selectOption("sorting-slime");

    await page.locator('[data-workshop-tab="battle"]').click();
    await page.locator('[data-workshop-cell][data-x="6"][data-y="5"]').click();
    await page.locator('[data-encounter-field="kind"]').selectOption("miniboss");
    await page.locator('[data-encounter-field="hp"]').fill("55");
    await page.locator('[data-phase-index="1"]').selectOption("pop_in_hazard_grid");
    await page.locator('[data-encounter-field="repairChallenge"]').selectOption("merge_sorted_lists");
    await page.locator('[data-encounter-field="hintStyle"]').selectOption("partial");

    await page.locator('[data-workshop-tab="dialogue"]').click();
    await page.locator('[data-workshop-select-entity]').first().click();
    await page.locator("[data-dialogue-lines]").fill("The room remembers your edits.\nIt keeps them until you throw them away.");

    await page.locator('[data-workshop-tab="test"]').click();
    await page.locator('[data-workshop-action="start-test"]').click();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    const testMarkerVisible = await page.locator(".workshop-test-player").count();
    if (testMarkerVisible !== 1) throw new Error("Workshop test marker did not render.");

    await page.locator('[data-workshop-action="run-validation"]').click();
    await page.locator('[data-workshop-tab="export"]').click();
    await page.locator('[data-workshop-action="save-draft"]').click();
    await page.locator('[data-workshop-action="export-json"]').click();
    const jsonText = await page.locator("[data-workshop-json]").inputValue();
    const exported = JSON.parse(jsonText);
    if (exported.playerSpawn.x !== 2 || exported.playerSpawn.y !== 2) throw new Error("Export did not include edited spawn.");
    if (!exported.entities.some((entity) => entity.name === "Workshop Slime" && entity.encounter.kind === "miniboss")) {
      throw new Error("Export did not include edited enemy encounter.");
    }

    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#screen-workshop.active .workshop-grid").waitFor({ state: "visible", timeout: 10000 });
    await page.locator('[data-workshop-tab="export"]').click();
    await page.locator('[data-workshop-action="load-draft"]').click();
    await page.locator('[data-workshop-action="export-json"]').click();
    const reloaded = JSON.parse(await page.locator("[data-workshop-json]").inputValue());
    if (!reloaded.entities.some((entity) => entity.name === "Workshop Slime")) {
      throw new Error("Saved Workshop draft did not survive reload.");
    }

    if (errors.length) throw new Error(`Browser errors:\n${errors.join("\n")}`);
    console.log("Workshop browser smoke passed.");
  } finally {
    await browser.close();
    if (localServer && !localServer.killed) localServer.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
