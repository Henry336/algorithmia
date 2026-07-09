import { applyPixelArt } from "./pixelart.js";
import { applyBattleCost } from "./combatState.js";
import { describeCost, initBattleHud, logBattle, updateBattleVitals } from "./battleHud.js";
import { isAdminMode } from "./admin.js";

const screenBattle = document.getElementById("screen-battle-ticket");
const transition = document.getElementById("screen-transition");
const track = document.getElementById("ticket-track");
const roundLabel = document.getElementById("ticket-round-label");
const hintEl = document.getElementById("ticket-hint");
const feedbackEl = document.getElementById("ticket-battle-feedback");
const orderBuiltEl = document.getElementById("ticket-order-built");
const titleEl = document.getElementById("ticket-battle-title");
const checkBtn = document.querySelector('[data-action="check-ticket-order"]');
const resetBtn = document.querySelector('[data-action="reset-tickets"]');
const adminWinBtn = document.querySelector('[data-action="admin-win-ticket"]');
const enemySpriteHost = document.getElementById("ticket-battle-enemy-sprite");

let tickets = [];
let picked = [];
let round = 1;
let config = null;
let activeScreen = null;
let locked = false;
let wrongChecks = 0;

function ticket(id, arrival, urgent) {
  return { id, arrival, urgent };
}

function randomSealedTickets(count) {
  const letters = ["A", "B", "C", "D", "E", "F", "G"];
  const arrivals = Array.from({ length: count }, (_, i) => i);
  const list = arrivals.map((arrival, i) => {
    const urgent = Math.random() < 0.4;
    return ticket(letters[i], arrival, urgent);
  });
  if (!list.some((t) => t.urgent)) {
    list[Math.floor(Math.random() * list.length)].urgent = true;
  }
  return list;
}

// { title, publicTickets, sealedCount, enemySprite, onWin, returnScreen,
//   solve(items) -> [ids in order], generateSealed(count) -> items,
//   flagLabel(item) -> string, flagClass(item) -> bool,
//   wrongPublicHint, wrongSealedHint, wonPublicHint, wonHint }
export function startTicketBattle(battleConfig) {
  config = battleConfig;
  round = 1;
  tickets = config.publicTickets.slice();
  picked = [];
  locked = false;

  activeScreen = document.getElementById(config.returnScreen);
  titleEl.textContent = config.title;
  enemySpriteHost.innerHTML = "";
  if (config.enemySprite) {
    applyPixelArt(enemySpriteHost, config.enemySprite.matrix, config.enemySprite.palette, config.enemyPixelSize || 5);
  }
  initBattleHud(screenBattle, {
    objective: config.objective || "Build the service order. Wrong policies cost HP; wasted retries drain Focus.",
    enemyStatus: round === 1 ? "Public queue exposed" : "Sealed queue ready",
  });

  wipeTo(() => {
    if (activeScreen) activeScreen.classList.remove("active");
    screenBattle.classList.add("active");
    setupRound();
  });
}

function setupRound() {
  picked = [];
  wrongChecks = 0;
  feedbackEl.textContent = "";
  feedbackEl.classList.remove("error");
  checkBtn.disabled = false;
  roundLabel.textContent = round === 1 ? "Public spill" : "Sealed check";
  initBattleHud(screenBattle, {
    objective: round === 1
      ? (config.objective || "Serve the visible tickets by policy.")
      : "Serve a fresh queue without relying on visible IDs.",
    enemyStatus: round === 1 ? "Public queue exposed" : "Policy audit active",
  });
  logBattle(screenBattle, `Decision budget: ${tickets.length} picks. Policy must cover every ticket.`, "warning");
  hintEl.textContent = round === 1
    ? (config.roundHint1 || "Click tickets in the order you would serve them.")
    : (config.roundHint2 || "The Archive tried a fresh line. Prove the policy still holds.");
  renderTickets();
  renderOrder();
}

function renderTickets() {
  track.innerHTML = "";
  const flagClass = config.flagClass || ((t) => t.urgent);
  const flagLabel = config.flagLabel || ((t) => (t.urgent ? "URGENT" : "ticket"));
  tickets.forEach((t) => {
    const served = picked.includes(t.id);
    const card = document.createElement("div");
    card.className = "ticket" + (flagClass(t) ? " urgent" : "") + (served ? " served" : "");
    card.dataset.id = t.id;

    const flag = document.createElement("div");
    flag.className = "ticket-flag";
    flag.textContent = flagLabel(t);

    const idEl = document.createElement("div");
    idEl.className = "ticket-id";
    idEl.textContent = round === 1 ? t.id : "?";

    const orderNum = document.createElement("div");
    orderNum.className = "ticket-order-num";
    if (served) orderNum.textContent = `#${picked.indexOf(t.id) + 1}`;

    card.appendChild(flag);
    card.appendChild(idEl);
    card.appendChild(orderNum);
    if (!served) {
      card.addEventListener("click", () => onTicketClick(t.id));
    }
    track.appendChild(card);
  });
}

function renderOrder() {
  orderBuiltEl.textContent = picked.length ? picked.join(" -> ") : "(none yet)";
}

function onTicketClick(id) {
  if (locked) return;
  if (picked.includes(id)) return;
  picked.push(id);
  logBattle(screenBattle, `Decision ${picked.length}: ticket ${round === 1 ? id : "?"} selected.`);
  renderTickets();
  renderOrder();
}

function applyTicketMistake(message, hp, focus) {
  wrongChecks += 1;
  const cost = applyBattleCost({ hp, focus });
  updateBattleVitals(screenBattle);
  logBattle(screenBattle, `${message} ${describeCost(cost)}.`, "danger");
}

checkBtn.addEventListener("click", () => {
  if (locked) return;
  if (picked.length !== tickets.length) {
    feedbackEl.textContent = config.incompletePickHint || "Every item needs a place in the order.";
    feedbackEl.classList.add("error");
    applyTicketMistake(`Incomplete check ${wrongChecks + 1}: queue still has unserved work.`, 1, 1);
    return;
  }

  const correct = config.solve(tickets).join(",") === picked.join(",");
  if (!correct) {
    feedbackEl.textContent = round === 1
      ? (config.wrongPublicHint || "Not quite. Check the policy and try again.")
      : (config.wrongSealedHint || "The visible order held, but a fresh mess exposed a guess.");
    feedbackEl.classList.add("error");
    applyTicketMistake(`Wrong policy check ${wrongChecks + 1}: service order violated.`, round === 1 ? 3 : 5, 2);
    return;
  }

  feedbackEl.classList.remove("error");
  logBattle(screenBattle, `Policy work: ${picked.length} decisions, ${wrongChecks} failed checks.`, wrongChecks ? "warning" : "good");

  if (round === 1) {
    feedbackEl.textContent = config.wonPublicHint || "That holds. But can it survive a fresh mess?";
    round = 2;
    const generateSealed = config.generateSealed || randomSealedTickets;
    tickets = generateSealed(config.sealedCount || tickets.length);
    locked = true;
    window.setTimeout(() => {
      locked = false;
      setupRound();
    }, 1400);
    return;
  }

  locked = true;
  feedbackEl.textContent = config.wonHint || "Policy confirmed.";
  logBattle(screenBattle, "Sealed policy held. Enemy pressure broken.", "good");
  checkBtn.disabled = true;
  window.setTimeout(() => {
    finishBattle();
  }, 900);
});

resetBtn.addEventListener("click", () => {
  if (locked) return;
  picked = [];
  logBattle(screenBattle, "Reset service order. Decision list cleared.");
  renderTickets();
  renderOrder();
});

adminWinBtn.addEventListener("click", () => {
  if (!isAdminMode() || !config) return;
  locked = true;
  checkBtn.disabled = true;
  feedbackEl.classList.remove("error");
  feedbackEl.textContent = "Admin policy accepted.";
  logBattle(screenBattle, "Admin mode completed this queue encounter.", "good");
  finishBattle();
});

function finishBattle() {
  wipeTo(() => {
    screenBattle.classList.remove("active");
    if (activeScreen) activeScreen.classList.add("active");
    const cb = config && config.onWin;
    config = null;
    if (cb) cb();
  });
}

function wipeTo(afterFadeIn) {
  transition.classList.add("active");
  window.setTimeout(() => {
    afterFadeIn();
    window.setTimeout(() => transition.classList.remove("active"), 60);
  }, 180);
}

export function makeTicket(id, arrival, urgent) {
  return ticket(id, arrival, urgent);
}
