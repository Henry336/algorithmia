const CHARACTER_BASES = {
  patchrunner: "assets/characters/patchrunner/A_young_field_technician_in/rotations",
  mira: "assets/characters/mira/A_woman_in_her_40s/rotations",
};

const FACING_TO_ASSET = {
  up: "north",
  down: "south",
  left: "west",
  right: "east",
};

export function placePatchrunnerEntity(viewport, col, row, tileSize, facing) {
  let el = viewport.querySelector('[data-entity="player"]');
  if (!el) {
    el = document.createElement("div");
    el.className = "entity patchrunner-entity";
    el.dataset.entity = "player";
    viewport.appendChild(el);
  }
  el.style.width = `${tileSize}px`;
  el.style.height = `${tileSize}px`;
  el.style.left = `${col * tileSize}px`;
  el.style.top = `${row * tileSize}px`;
  updatePatchrunnerFacing(el, facing);
  return el;
}

export function updatePatchrunnerFacing(el, facing) {
  updateCharacterFacing(el, "patchrunner", "patchrunner-sprite", facing);
}

export function placeMiraEntity(viewport, col, row, tileSize, facing = "down") {
  let el = viewport.querySelector('[data-entity="mira"]');
  if (!el) {
    el = document.createElement("div");
    el.className = "entity mira-entity";
    el.dataset.entity = "mira";
    viewport.appendChild(el);
  }
  el.style.width = `${tileSize}px`;
  el.style.height = `${tileSize}px`;
  el.style.left = `${col * tileSize}px`;
  el.style.top = `${row * tileSize}px`;
  updateMiraFacing(el, facing);
  return el;
}

export function updateMiraFacing(el, facing) {
  updateCharacterFacing(el, "mira", "mira-sprite", facing);
}

function updateCharacterFacing(el, character, spriteClass, facing) {
  if (!el) return;
  const direction = FACING_TO_ASSET[facing] || "south";
  let img = el.querySelector(`.${spriteClass}`);
  if (!img) {
    img = document.createElement("img");
    img.className = spriteClass;
    img.alt = "";
    img.draggable = false;
    el.appendChild(img);
  }
  if (img.dataset.direction !== direction) {
    img.dataset.direction = direction;
    img.src = `${CHARACTER_BASES[character]}/${direction}.png`;
  }
}

export function animatePatchrunnerStep(el) {
  if (!el) return;
  el.classList.remove("is-walking");
  void el.offsetWidth;
  el.classList.add("is-walking");
  window.setTimeout(() => el.classList.remove("is-walking"), 180);
}

export function renderPatchrunnerPortrait(host, direction = "south") {
  renderCharacterPortrait(host, "patchrunner", "patchrunner-title-sprite", direction);
}

export function renderMiraPortrait(host, direction = "south") {
  renderCharacterPortrait(host, "mira", "mira-title-sprite", direction);
}

function renderCharacterPortrait(host, character, spriteClass, direction = "south") {
  if (!host || host.childElementCount) return;
  const img = document.createElement("img");
  img.className = `character-title-sprite ${spriteClass}`;
  img.alt = "";
  img.draggable = false;
  img.src = `${CHARACTER_BASES[character]}/${direction}.png`;
  host.appendChild(img);
}
