import {
  BATTLE_PRESETS,
  ENTITY_TYPES,
  HINT_STYLES,
  REPAIR_CHALLENGES,
  SPRITE_LIBRARY,
  TILE_TYPES,
  WORKSHOP_STORAGE_KEY,
  createDefaultLevel,
  makeEntity,
  normalizeLevel,
} from "./workshopData.js";
import { pointKey, validateWorkshopLevel } from "./workshopValidation.js";

const TABS = ["map", "entities", "dialogue", "battle", "test", "export"];
const TILE_SIZE = 34;

let root = null;
let onExitWorkshop = null;
let state = createInitialState();

export function initWorkshop({ onExit } = {}) {
  root = document.getElementById("workshop-root");
  onExitWorkshop = onExit || null;
  const saved = loadDraft();
  state = createInitialState(saved || state.level);
  renderWorkshop();
  document.removeEventListener("keydown", onWorkshopKeyDown);
  document.addEventListener("keydown", onWorkshopKeyDown);
}

function createInitialState(level = createDefaultLevel()) {
  return {
    level: normalizeLevel(level),
    tab: "map",
    selectedTile: "floor",
    selectedTool: "paint",
    selectedEntityId: null,
    rectStart: null,
    showCollision: true,
    showReachable: false,
    status: "Draft ready.",
    importText: "",
    exportText: "",
    testPlayer: null,
  };
}

function renderWorkshop() {
  if (!root) return;
  root.innerHTML = `
    <div class="workshop-shell">
      <header class="workshop-header">
        <div>
          <span class="workshop-kicker">ALGORITHMIA WORKSHOP</span>
          <h2>${escapeHtml(state.level.name)}</h2>
        </div>
        <nav class="workshop-tabs" aria-label="Workshop sections">
          ${TABS.map((tab) => `<button class="${tab === state.tab ? "active" : ""}" data-workshop-tab="${tab}">${titleCase(tab)}</button>`).join("")}
        </nav>
        <button class="workshop-exit" data-workshop-action="exit">Back</button>
      </header>
      <main class="workshop-main">
        <aside class="workshop-panel workshop-tools" id="workshop-tools"></aside>
        <section class="workshop-stage">
          <div class="workshop-grid-wrap">
            <div class="workshop-grid" id="workshop-grid"></div>
          </div>
        </section>
        <aside class="workshop-panel workshop-inspector" id="workshop-inspector"></aside>
      </main>
      <footer class="workshop-status" id="workshop-status"></footer>
    </div>
  `;
  bindWorkshopEvents();
  renderPanels();
}

function bindWorkshopEvents() {
  root.onclick = onWorkshopClick;
  root.oninput = onWorkshopInput;
  root.onchange = onWorkshopChange;
}

function renderPanels() {
  root.querySelector("#workshop-tools").innerHTML = renderToolPanel();
  root.querySelector("#workshop-grid").outerHTML = renderGrid();
  root.querySelector("#workshop-inspector").innerHTML = renderInspector();
  renderStatus();
}

function renderToolPanel() {
  if (state.tab === "map") {
    return `
      <h3>Map</h3>
      <div class="workshop-tool-row">
        ${toolButton("paint", "Paint")}
        ${toolButton("erase", "Erase")}
        ${toolButton("rect", "Rect")}
        ${toolButton("spawn", "Spawn")}
      </div>
      <label class="workshop-field">
        <span>Tile</span>
        <select data-workshop-control="selectedTile">
          ${Object.entries(TILE_TYPES).map(([id, tile]) => `<option value="${id}" ${id === state.selectedTile ? "selected" : ""}>${tile.label}</option>`).join("")}
        </select>
      </label>
      <div class="workshop-palette">
        ${Object.entries(TILE_TYPES).map(([id, tile]) => `
          <button class="${id === state.selectedTile ? "active" : ""}" data-workshop-tile="${id}" title="${tile.label}">
            <span style="background:${tile.color}"></span>${tile.label}
          </button>
        `).join("")}
      </div>
      ${overlayControls()}
    `;
  }

  if (state.tab === "entities") {
    return `
      <h3>Entities</h3>
      <div class="workshop-tool-row">
        ${toolButton("select", "Select")}
        ${toolButton("patrol", "Patrol")}
      </div>
      <p class="workshop-help">Choose a type, then click the room.</p>
      <div class="workshop-palette">
        ${Object.entries(ENTITY_TYPES).map(([id, entity]) => `
          <button class="${state.selectedTool === `place:${id}` ? "active" : ""}" data-workshop-entity-type="${id}">
            ${entity.label}
          </button>
        `).join("")}
      </div>
      ${overlayControls()}
    `;
  }

  if (state.tab === "dialogue") {
    return `
      <h3>Dialogue</h3>
      <p class="workshop-help">Select an NPC, object, or hidden voice tile. Lines are one per row.</p>
      ${entityList(["npc", "object", "door"])}
    `;
  }

  if (state.tab === "battle") {
    return `
      <h3>Battle</h3>
      <p class="workshop-help">Select an enemy or boss to assign encounter behavior.</p>
      ${entityList(["enemy", "boss"])}
    `;
  }

  if (state.tab === "test") {
    return `
      <h3>Test</h3>
      <button class="workshop-primary" data-workshop-action="start-test">Start Test</button>
      <button data-workshop-action="reset-test">Reset Test</button>
      <button data-workshop-action="run-validation">Run Validation</button>
      <div class="workshop-dpad" aria-label="Test movement controls">
        <button data-workshop-move="up">Up</button>
        <button data-workshop-move="left">Left</button>
        <button data-workshop-move="right">Right</button>
        <button data-workshop-move="down">Down</button>
      </div>
      <p class="workshop-help">WASD and arrow keys move while this tab is open.</p>
      ${overlayControls()}
    `;
  }

  return `
    <h3>Export</h3>
    <button class="workshop-primary" data-workshop-action="save-draft">Save Draft</button>
    <button data-workshop-action="load-draft">Load Draft</button>
    <button data-workshop-action="new-draft">New Draft</button>
    <button data-workshop-action="export-json">Export JSON</button>
    <button data-workshop-action="download-json">Download JSON</button>
    <button data-workshop-action="import-json">Import JSON</button>
    <button data-workshop-action="run-validation">Validate</button>
    <p class="workshop-help">Live deployments save drafts in this browser. Export JSON to add a level to the repo later.</p>
  `;
}

function renderGrid() {
  const validation = validateWorkshopLevel(state.level);
  const reachable = validation.reachable;
  const cells = [];
  for (let y = 0; y < state.level.height; y += 1) {
    for (let x = 0; x < state.level.width; x += 1) {
      const tile = state.level.tiles[y][x];
      const entity = entityAt(x, y);
      const isSpawn = state.level.playerSpawn.x === x && state.level.playerSpawn.y === y;
      const isReachable = reachable.has(pointKey(x, y));
      const selected = entity && entity.id === state.selectedEntityId;
      cells.push(`
        <button class="workshop-cell workshop-tile-${tile}${selected ? " selected" : ""}${state.showReachable && isReachable ? " reachable" : ""}"
          data-workshop-cell="1" data-x="${x}" data-y="${y}" aria-label="Tile ${x}, ${y}">
          <span class="workshop-cell-bg"></span>
          ${state.showCollision && TILE_TYPES[tile]?.blocks ? `<span class="workshop-collision"></span>` : ""}
          ${isSpawn ? `<span class="workshop-spawn">P</span>` : ""}
          ${entity ? renderEntityToken(entity) : ""}
          ${state.testPlayer?.x === x && state.testPlayer?.y === y ? `<span class="workshop-test-player">T</span>` : ""}
        </button>
      `);
    }
  }
  return `
    <div class="workshop-grid" id="workshop-grid"
      style="grid-template-columns: repeat(${state.level.width}, ${TILE_SIZE}px); grid-template-rows: repeat(${state.level.height}, ${TILE_SIZE}px);">
      ${cells.join("")}
    </div>
  `;
}

function renderInspector() {
  if (state.tab === "map") {
    return `
      <h3>Room</h3>
      <label class="workshop-field"><span>Name</span><input data-level-field="name" value="${escapeAttr(state.level.name)}" /></label>
      <label class="workshop-field"><span>Chapter / Area</span><input data-level-field="chapter" value="${escapeAttr(state.level.chapter)}" /></label>
      <label class="workshop-field"><span>Room kind</span>${select("roomKind", state.level.roomKind, ["required", "optional", "secret", "lore-only", "boss", "arcade"])}</label>
      <label class="workshop-field"><span>Music</span>${select("music", state.level.music, ["queueworks_low_hum", "foundry_pulse", "array_wind", "graphreach_static", "boss_pressure"])}</label>
      <label class="workshop-field"><span>Palette</span>${select("palette", state.level.palette, ["queueworks", "dispatch", "heaplight", "array", "graphreach"])}</label>
      <div class="workshop-size-row">
        <label><span>W</span><input type="number" min="6" max="40" data-workshop-resize="width" value="${state.level.width}" /></label>
        <label><span>H</span><input type="number" min="6" max="28" data-workshop-resize="height" value="${state.level.height}" /></label>
      </div>
      <button data-workshop-action="apply-resize">Apply Size</button>
      <p class="workshop-help">Changing size preserves the upper-left part of the room.</p>
    `;
  }

  if (state.tab === "export") {
    const text = state.exportText || JSON.stringify(state.level, null, 2);
    return `
      <h3>Level Pack</h3>
      <textarea class="workshop-json" data-workshop-json>${escapeHtml(text)}</textarea>
      <p class="workshop-help">Paste JSON here, then use Import JSON. Exported data is meant to be committed later under a real level-data folder.</p>
    `;
  }

  if (state.tab === "test") {
    const validation = validateWorkshopLevel(state.level);
    return `
      <h3>Playtest</h3>
      <p class="workshop-help">${state.testPlayer ? `Testing from ${state.testPlayer.x}, ${state.testPlayer.y}.` : "Press Start Test to spawn the test marker."}</p>
      ${renderValidation(validation)}
    `;
  }

  const selected = selectedEntity();
  if (!selected) {
    return `<h3>Inspector</h3><p class="workshop-help">Select something in the room to edit its details.</p>`;
  }

  if (state.tab === "dialogue") return renderDialogueInspector(selected);
  if (state.tab === "battle") return renderBattleInspector(selected);
  return renderEntityInspector(selected);
}

function renderEntityInspector(entity) {
  return `
    <h3>${escapeHtml(entity.name)}</h3>
    ${spritePreview(entity)}
    <label class="workshop-field"><span>Name</span><input data-entity-field="name" value="${escapeAttr(entity.name)}" /></label>
    <label class="workshop-field"><span>Sprite</span>${entitySelect("sprite", entity.sprite, SPRITE_LIBRARY)}</label>
    <label class="workshop-field"><span>Facing</span>${entitySelect("facing", entity.facing, { down: "Down", up: "Up", left: "Left", right: "Right" })}</label>
    <label class="workshop-field"><span>Behavior</span>${entitySelect("behavior", entity.behavior, { interact: "Interact", touch_battle: "Touch Battle", touch_collect: "Touch Collect", locked_exit: "Locked Exit" })}</label>
    <div class="workshop-size-row">
      <label><span>X</span><input type="number" data-entity-field="x" value="${entity.x}" /></label>
      <label><span>Y</span><input type="number" data-entity-field="y" value="${entity.y}" /></label>
    </div>
    <button data-workshop-action="add-patrol-point">Add Patrol By Clicking</button>
    <button class="danger-button" data-workshop-action="delete-entity">Delete</button>
    <p class="workshop-help">Patrol: ${entity.patrol.length ? entity.patrol.map((point) => `${point.x},${point.y}`).join(" -> ") : "none"}</p>
  `;
}

function renderDialogueInspector(entity) {
  return `
    <h3>${escapeHtml(entity.name)} Dialogue</h3>
    ${spritePreview(entity)}
    <label class="workshop-field"><span>Condition</span>${entitySelect("dialogue.condition", entity.dialogue.condition, {
      always: "Always",
      before_boss: "Before boss",
      after_boss: "After boss",
      after_item: "After item",
      admin_only: "Admin only"
    })}</label>
    <label class="workshop-field"><span>Lines</span><textarea data-dialogue-lines>${escapeHtml(entity.dialogue.lines.join("\n"))}</textarea></label>
    <label class="workshop-field"><span>Choices</span><textarea data-dialogue-choices>${escapeHtml(entity.dialogue.choices.join("\n"))}</textarea></label>
  `;
}

function renderBattleInspector(entity) {
  const encounter = entity.encounter;
  return `
    <h3>${escapeHtml(entity.name)} Battle</h3>
    ${spritePreview(entity)}
    <label class="workshop-field"><span>Kind</span>${encounterSelect("kind", encounter.kind, { normal: "Normal", miniboss: "Mini-boss", boss: "Boss", secret_boss: "Secret Boss", arcade: "Arcade Only", none: "None" })}</label>
    <div class="workshop-size-row">
      <label><span>HP</span><input type="number" data-encounter-field="hp" value="${encounter.hp}" /></label>
      <label><span>Shield</span><input type="number" data-encounter-field="shieldHp" value="${encounter.shieldHp}" /></label>
      <label><span>DMG</span><input type="number" data-encounter-field="damage" value="${encounter.damage}" /></label>
    </div>
    <label class="workshop-field"><span>Phase thresholds</span><input data-encounter-field="phaseThresholds" value="${escapeAttr(encounter.phaseThresholds)}" /></label>
    <label class="workshop-field"><span>Phase 1</span>${phaseSelect(0, encounter.phasePatterns[0] || "none")}</label>
    <label class="workshop-field"><span>Phase 2</span>${phaseSelect(1, encounter.phasePatterns[1] || "none")}</label>
    <label class="workshop-field"><span>Phase 3</span>${phaseSelect(2, encounter.phasePatterns[2] || "none")}</label>
    <label class="workshop-field"><span>Repair challenge</span>${encounterSelect("repairChallenge", encounter.repairChallenge, REPAIR_CHALLENGES)}</label>
    <label class="workshop-field"><span>Hint style</span>${encounterSelect("hintStyle", encounter.hintStyle, HINT_STYLES)}</label>
  `;
}

function onWorkshopClick(event) {
  const target = event.target.closest("button");
  if (!target || !root.contains(target)) return;

  if (target.dataset.workshopTab) {
    state.tab = target.dataset.workshopTab;
    state.selectedTool = state.tab === "entities" ? "select" : "paint";
    state.rectStart = null;
    renderWorkshop();
    return;
  }

  if (target.dataset.workshopTile) {
    state.selectedTile = target.dataset.workshopTile;
    state.selectedTool = "paint";
    renderPanels();
    return;
  }

  if (target.dataset.workshopTool) {
    state.selectedTool = target.dataset.workshopTool;
    state.rectStart = null;
    renderPanels();
    return;
  }

  if (target.dataset.workshopEntityType) {
    state.selectedTool = `place:${target.dataset.workshopEntityType}`;
    renderPanels();
    return;
  }

  if (target.dataset.workshopSelectEntity) {
    state.selectedEntityId = target.dataset.workshopSelectEntity;
    renderPanels();
    return;
  }

  if (target.dataset.workshopCell) {
    handleCellClick(Number(target.dataset.x), Number(target.dataset.y));
    return;
  }

  if (target.dataset.workshopMove) {
    moveTestPlayer(target.dataset.workshopMove);
    return;
  }

  handleAction(target.dataset.workshopAction);
}

function onWorkshopInput(event) {
  const target = event.target;
  if (target.dataset.levelField) {
    state.level[target.dataset.levelField] = target.value;
    updateHeaderTitle();
  } else if (target.dataset.entityField) {
    updateSelectedEntity(target.dataset.entityField, target.value);
  } else if (target.dataset.dialogueLines !== undefined) {
    updateSelectedEntity("dialogue.lines", target.value.split("\n").map((line) => line.trim()).filter(Boolean));
  } else if (target.dataset.dialogueChoices !== undefined) {
    updateSelectedEntity("dialogue.choices", target.value.split("\n").map((line) => line.trim()).filter(Boolean));
  } else if (target.dataset.encounterField) {
    updateSelectedEntity(`encounter.${target.dataset.encounterField}`, target.value);
  } else if (target.dataset.workshopJson !== undefined) {
    state.importText = target.value;
    state.exportText = target.value;
  }
}

function onWorkshopChange(event) {
  const target = event.target;
  if (target.dataset.workshopControl === "selectedTile") {
    state.selectedTile = target.value;
    renderPanels();
  } else if (target.dataset.levelField) {
    state.level[target.dataset.levelField] = target.value;
    renderPanels();
  } else if (target.dataset.entityField) {
    updateSelectedEntity(target.dataset.entityField, target.value);
    renderPanels();
  } else if (target.dataset.encounterField) {
    updateSelectedEntity(`encounter.${target.dataset.encounterField}`, target.value);
    renderPanels();
  } else if (target.dataset.phaseIndex) {
    const entity = selectedEntity();
    if (!entity) return;
    entity.encounter.phasePatterns[Number(target.dataset.phaseIndex)] = target.value;
    renderPanels();
  } else if (target.dataset.overlay) {
    state[target.dataset.overlay] = target.checked;
    renderPanels();
  }
}

function handleCellClick(x, y) {
  if (state.tab === "map") {
    if (state.selectedTool === "spawn") {
      state.level.playerSpawn = { x, y };
      state.status = `Spawn set to ${x}, ${y}.`;
    } else if (state.selectedTool === "erase") {
      state.level.tiles[y][x] = "floor";
    } else if (state.selectedTool === "rect") {
      paintRectangle(x, y);
    } else {
      state.level.tiles[y][x] = state.selectedTile;
    }
    renderPanels();
    return;
  }

  const existing = entityAt(x, y);
  if (state.tab === "entities") {
    if (state.selectedTool === "patrol") {
      const entity = selectedEntity();
      if (entity) {
        entity.patrol.push({ x, y });
        state.status = `Added patrol point ${x}, ${y}.`;
      }
    } else if (state.selectedTool.startsWith("place:")) {
      const type = state.selectedTool.replace("place:", "");
      const entity = makeEntity(type, x, y);
      state.level.entities.push(entity);
      state.selectedEntityId = entity.id;
      state.selectedTool = "select";
    } else if (existing) {
      state.selectedEntityId = existing.id;
    }
    renderPanels();
    return;
  }

  if ((state.tab === "dialogue" || state.tab === "battle") && existing) {
    state.selectedEntityId = existing.id;
    renderPanels();
  }
}

function handleAction(action) {
  if (!action) return;
  if (action === "exit") {
    document.removeEventListener("keydown", onWorkshopKeyDown);
    if (onExitWorkshop) onExitWorkshop();
  } else if (action === "apply-resize") {
    resizeLevel();
  } else if (action === "delete-entity") {
    deleteSelectedEntity();
  } else if (action === "add-patrol-point") {
    state.tab = "entities";
    state.selectedTool = "patrol";
    state.status = "Click tiles to add patrol points.";
    renderWorkshop();
  } else if (action === "start-test") {
    state.testPlayer = { ...state.level.playerSpawn };
    state.status = "Test started. Move with WASD, arrows, or the test buttons.";
    renderPanels();
  } else if (action === "reset-test") {
    state.testPlayer = null;
    renderPanels();
  } else if (action === "run-validation") {
    const validation = validateWorkshopLevel(state.level);
    state.status = validation.ok ? `Validated with ${validation.warnings.length} warning(s).` : `Validation found ${validation.errors.length} error(s).`;
    state.showReachable = true;
    renderPanels();
  } else if (action === "save-draft") {
    localStorage.setItem(WORKSHOP_STORAGE_KEY, JSON.stringify(state.level));
    state.status = "Draft saved in this browser.";
    renderPanels();
  } else if (action === "load-draft") {
    const draft = loadDraft();
    if (draft) {
      state.level = draft;
      state.status = "Draft loaded.";
    } else {
      state.status = "No draft found in this browser.";
    }
    renderWorkshop();
  } else if (action === "new-draft") {
    state = createInitialState();
    renderWorkshop();
  } else if (action === "export-json") {
    state.exportText = JSON.stringify(state.level, null, 2);
    state.status = "JSON export refreshed.";
    renderPanels();
  } else if (action === "download-json") {
    downloadJson();
  } else if (action === "import-json") {
    importJson();
  }
}

function renderStatus() {
  const validation = validateWorkshopLevel(state.level);
  const status = root.querySelector("#workshop-status");
  status.innerHTML = `
    <span>${escapeHtml(state.status)}</span>
    <span>${validation.errors.length} error(s), ${validation.warnings.length} warning(s)</span>
    <span>${state.level.width}x${state.level.height} / ${state.level.entities.length} entities</span>
  `;
}

function renderValidation(validation) {
  const rows = [
    ...validation.errors.map((text) => `<li class="error">${escapeHtml(text)}</li>`),
    ...validation.warnings.map((text) => `<li>${escapeHtml(text)}</li>`),
  ];
  if (rows.length === 0) return `<p class="workshop-valid">No validation problems found.</p>`;
  return `<ul class="workshop-validation">${rows.join("")}</ul>`;
}

function resizeLevel() {
  const widthInput = root.querySelector('[data-workshop-resize="width"]');
  const heightInput = root.querySelector('[data-workshop-resize="height"]');
  const width = clamp(Number(widthInput.value), 6, 40);
  const height = clamp(Number(heightInput.value), 6, 28);
  const nextTiles = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => state.level.tiles[y]?.[x] || (x === 0 || y === 0 || x === width - 1 || y === height - 1 ? "wall" : "floor"))
  );
  state.level.width = width;
  state.level.height = height;
  state.level.tiles = nextTiles;
  state.level.playerSpawn.x = clamp(state.level.playerSpawn.x, 0, width - 1);
  state.level.playerSpawn.y = clamp(state.level.playerSpawn.y, 0, height - 1);
  state.level.entities = state.level.entities.filter((entity) => entity.x < width && entity.y < height);
  state.status = `Room resized to ${width}x${height}.`;
  renderWorkshop();
}

function paintRectangle(x, y) {
  if (!state.rectStart) {
    state.rectStart = { x, y };
    state.status = "Rectangle start set. Click another tile to finish.";
    return;
  }
  const left = Math.min(state.rectStart.x, x);
  const right = Math.max(state.rectStart.x, x);
  const top = Math.min(state.rectStart.y, y);
  const bottom = Math.max(state.rectStart.y, y);
  for (let row = top; row <= bottom; row += 1) {
    for (let col = left; col <= right; col += 1) {
      state.level.tiles[row][col] = state.selectedTile;
    }
  }
  state.rectStart = null;
  state.status = "Rectangle painted.";
}

function moveTestPlayer(direction) {
  if (state.tab !== "test") return;
  if (!state.testPlayer) state.testPlayer = { ...state.level.playerSpawn };
  const offset = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  }[direction];
  const next = { x: state.testPlayer.x + offset.x, y: state.testPlayer.y + offset.y };
  if (next.x < 0 || next.y < 0 || next.x >= state.level.width || next.y >= state.level.height) return;
  if (TILE_TYPES[state.level.tiles[next.y][next.x]]?.blocks) {
    state.status = "Blocked by tile collision.";
    renderPanels();
    return;
  }
  state.testPlayer = next;
  const entity = entityAt(next.x, next.y);
  state.status = entity ? `Touched ${entity.name}. Behavior: ${entity.behavior}.` : `Moved to ${next.x}, ${next.y}.`;
  renderPanels();
}

function onWorkshopKeyDown(event) {
  if (!document.getElementById("screen-workshop")?.classList.contains("active")) return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
  if (event.code === "Escape") {
    event.preventDefault();
    if (onExitWorkshop) onExitWorkshop();
    return;
  }
  if (state.tab !== "test") return;
  const keyDirs = {
    ArrowUp: "up",
    KeyW: "up",
    ArrowDown: "down",
    KeyS: "down",
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
  };
  if (keyDirs[event.code]) {
    event.preventDefault();
    moveTestPlayer(keyDirs[event.code]);
  }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(WORKSHOP_STORAGE_KEY);
    return raw ? normalizeLevel(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function importJson() {
  try {
    state.level = normalizeLevel(JSON.parse(state.importText || state.exportText || "{}"));
    state.selectedEntityId = null;
    state.status = "Imported JSON into the editor.";
    renderWorkshop();
  } catch (error) {
    state.status = `Import failed: ${error.message}`;
    renderPanels();
  }
}

function downloadJson() {
  state.exportText = JSON.stringify(state.level, null, 2);
  const blob = new Blob([state.exportText], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${state.level.id || "algorithmia-level"}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  state.status = "JSON download prepared.";
  renderPanels();
}

function deleteSelectedEntity() {
  if (!state.selectedEntityId) return;
  state.level.entities = state.level.entities.filter((entity) => entity.id !== state.selectedEntityId);
  state.selectedEntityId = null;
  state.status = "Entity deleted.";
  renderPanels();
}

function updateSelectedEntity(path, value) {
  const entity = selectedEntity();
  if (!entity) return;
  setPath(entity, path, numericIfNeeded(path, value));
}

function setPath(target, path, value) {
  const parts = path.split(".");
  let node = target;
  for (let index = 0; index < parts.length - 1; index += 1) node = node[parts[index]];
  node[parts[parts.length - 1]] = value;
}

function numericIfNeeded(path, value) {
  if (["x", "y", "encounter.hp", "encounter.shieldHp", "encounter.damage"].includes(path)) return Number(value);
  return value;
}

function selectedEntity() {
  return state.level.entities.find((entity) => entity.id === state.selectedEntityId) || null;
}

function entityAt(x, y) {
  return state.level.entities.find((entity) => entity.x === x && entity.y === y) || null;
}

function renderEntityToken(entity) {
  const sprite = SPRITE_LIBRARY[entity.sprite];
  const label = sprite?.icon || entity.name.slice(0, 1).toUpperCase();
  if (sprite?.image) {
    return `<span class="workshop-entity" title="${escapeAttr(entity.name)}"><img src="${sprite.image}" alt="" /></span>`;
  }
  return `<span class="workshop-entity icon" title="${escapeAttr(entity.name)}">${escapeHtml(label)}</span>`;
}

function spritePreview(entity) {
  const sprite = SPRITE_LIBRARY[entity.sprite];
  if (sprite?.image) {
    return `<div class="workshop-sprite-preview"><img src="${sprite.image}" alt="" /><span>${sprite.label}</span></div>`;
  }
  return `<div class="workshop-sprite-preview text"><strong>${escapeHtml(sprite?.icon || "?")}</strong><span>${escapeHtml(sprite?.label || entity.sprite)}</span></div>`;
}

function entityList(types) {
  const entities = state.level.entities.filter((entity) => types.includes(entity.type));
  if (entities.length === 0) return `<p class="workshop-help">No matching entities yet.</p>`;
  return `<div class="workshop-entity-list">${entities.map((entity) => `
    <button class="${entity.id === state.selectedEntityId ? "active" : ""}" data-workshop-select-entity="${entity.id}">
      ${escapeHtml(entity.name)} <span>${entity.x},${entity.y}</span>
    </button>
  `).join("")}</div>`;
}

function toolButton(tool, label) {
  return `<button class="${state.selectedTool === tool ? "active" : ""}" data-workshop-tool="${tool}">${label}</button>`;
}

function overlayControls() {
  return `
    <label class="workshop-check"><input type="checkbox" data-overlay="showCollision" ${state.showCollision ? "checked" : ""} /> Collision</label>
    <label class="workshop-check"><input type="checkbox" data-overlay="showReachable" ${state.showReachable ? "checked" : ""} /> Reachable</label>
  `;
}

function select(field, value, options) {
  return `<select data-level-field="${field}">${options.map((option) => `<option value="${option}" ${option === value ? "selected" : ""}>${titleCase(option)}</option>`).join("")}</select>`;
}

function entitySelect(field, value, options) {
  return `<select data-entity-field="${field}">${optionMarkup(value, options)}</select>`;
}

function encounterSelect(field, value, options) {
  return `<select data-encounter-field="${field}">${optionMarkup(value, options)}</select>`;
}

function phaseSelect(index, value) {
  return `<select data-phase-index="${index}">${optionMarkup(value, BATTLE_PRESETS)}</select>`;
}

function optionMarkup(value, options) {
  return Object.entries(options).map(([id, option]) => {
    const label = typeof option === "string" ? option : option.label;
    return `<option value="${id}" ${id === value ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }).join("");
}

function updateHeaderTitle() {
  const heading = root.querySelector(".workshop-header h2");
  if (heading) heading.textContent = state.level.name;
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function titleCase(value) {
  return String(value).replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}
