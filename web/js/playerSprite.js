const PATCHRUNNER_BASE = "assets/characters/patchrunner/A_young_field_technician_in/rotations";

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
  if (!el) return;
  const direction = FACING_TO_ASSET[facing] || "south";
  let img = el.querySelector(".patchrunner-sprite");
  if (!img) {
    img = document.createElement("img");
    img.className = "patchrunner-sprite";
    img.alt = "";
    img.draggable = false;
    el.appendChild(img);
  }
  if (img.dataset.direction !== direction) {
    img.dataset.direction = direction;
    img.src = `${PATCHRUNNER_BASE}/${direction}.png`;
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
  if (!host || host.childElementCount) return;
  const img = document.createElement("img");
  img.className = "patchrunner-title-sprite";
  img.alt = "";
  img.draggable = false;
  img.src = `${PATCHRUNNER_BASE}/${direction}.png`;
  host.appendChild(img);
}
