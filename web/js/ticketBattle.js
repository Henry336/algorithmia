import { applyPixelArt } from "./pixelart.js";
import { solveTriageOrder } from "./triagePolicy.js";

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
const enemySpriteHost = document.getElementById("ticket-battle-enemy-sprite");

let tickets = [];
let picked = [];
let round = 1;
let config = null;
let activeScreen = null;
let locked = false;

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

// { title, publicTickets, sealedCount, enemySprite, onWin, returnScreen }
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

  wipeTo(() => {
    if (activeScreen) activeScreen.classList.remove("active");
    screenBattle.classList.add("active");
    setupRound();
  });
}

function setupRound() {
  picked = [];
  feedbackEl.textContent = "";
  feedbackEl.classList.remove("error");
  checkBtn.disabled = false;
  roundLabel.textContent = round === 1 ? "Public spill" : "Sealed check";
  hintEl.textContent = round === 1
    ? "Click tickets in the order you would serve them."
    : "The Archive tried a fresh line. Prove the policy still holds.";
  renderTickets();
  renderOrder();
}

function renderTickets() {
  track.innerHTML = "";
  tickets.forEach((t) => {
    const served = picked.includes(t.id);
    const card = document.createElement("div");
    card.className = "ticket" + (t.urgent ? " urgent" : "") + (served ? " served" : "");
    card.dataset.id = t.id;

    const flag = document.createElement("div");
    flag.className = "ticket-flag";
    flag.textContent = t.urgent ? "URGENT" : "ticket";

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
  renderTickets();
  renderOrder();
}

checkBtn.addEventListener("click", () => {
  if (locked) return;
  if (picked.length !== tickets.length) {
    feedbackEl.textContent = "Every ticket in the line needs a place in the order.";
    feedbackEl.classList.add("error");
    return;
  }

  const correct = solveTriageOrder(tickets).join(",") === picked.join(",");
  if (!correct) {
    feedbackEl.textContent = round === 1
      ? "Not quite. Check urgency, stable ties, and the ordinary guard."
      : "The visible line held, but the Archive tried a fresh mess and the policy guessed.";
    feedbackEl.classList.add("error");
    return;
  }

  feedbackEl.classList.remove("error");

  if (round === 1) {
    feedbackEl.textContent = "The line moves. But can it hold under a fresh rush?";
    round = 2;
    tickets = randomSealedTickets(config.sealedCount || tickets.length);
    locked = true;
    window.setTimeout(() => {
      locked = false;
      setupRound();
    }, 1400);
    return;
  }

  locked = true;
  feedbackEl.textContent = "The counter breathes again. Policy confirmed.";
  checkBtn.disabled = true;
  window.setTimeout(() => {
    wipeTo(() => {
      screenBattle.classList.remove("active");
      if (activeScreen) activeScreen.classList.add("active");
      const cb = config.onWin;
      config = null;
      if (cb) cb();
    });
  }, 900);
});

resetBtn.addEventListener("click", () => {
  if (locked) return;
  picked = [];
  renderTickets();
  renderOrder();
});

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
