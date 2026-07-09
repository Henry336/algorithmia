import { applyPixelArt } from "./pixelart.js";

// Player writes a real `solve(values)` function and it actually runs, in a
// Web Worker so a hung/infinite-loop submission can be killed from outside
// without freezing the page. This is a pedagogical guardrail (mirrors the
// CLI's rejection of sorted()/.sort()), not a security sandbox — there is no
// untrusted-multiplayer code execution here, just the local player's own
// browser running their own code.
const WORKER_SOURCE = `
self.onmessage = (e) => {
  const { source, cases } = e.data;
  let solve;
  try {
    solve = new Function(source + "\\nreturn typeof solve === 'function' ? solve : null;")();
  } catch (err) {
    self.postMessage({ ok: false, error: "Could not read that code: " + (err && err.message || err) });
    return;
  }
  if (typeof solve !== "function") {
    self.postMessage({ ok: false, error: "Define a function named solve(values)." });
    return;
  }
  try {
    const results = cases.map((c) => {
      try {
        const actual = solve(c.input.slice());
        return { name: c.name, pass: JSON.stringify(actual) === JSON.stringify(c.expected) };
      } catch (err) {
        return { name: c.name, pass: false, error: String((err && err.message) || err) };
      }
    });
    self.postMessage({ ok: true, results });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err) });
  }
};
`;

const WORKER_URL = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "application/javascript" }));

const BANNED_PATTERNS = [
  { pattern: /\.sort\s*\(/, message: "This encounter needs visible sorting logic — replace .sort(...) with your own comparisons." },
  { pattern: /\bsorted\s*\(/, message: "This encounter needs visible sorting logic — replace sorted(...) with your own comparisons." },
];

function runInWorker(source, cases, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const worker = new Worker(WORKER_URL);
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      worker.terminate();
      resolve({ ok: false, error: "Timed out. Check for an infinite loop." });
    }, timeoutMs);
    worker.onmessage = (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(e.data);
    };
    worker.onerror = (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve({ ok: false, error: e.message || "Script error." });
    };
    worker.postMessage({ source, cases });
  });
}

const screenBattle = document.getElementById("screen-battle-code");
const transition = document.getElementById("screen-transition");
const titleEl = document.getElementById("code-battle-title");
const roundLabel = document.getElementById("code-round-label");
const hintEl = document.getElementById("code-hint");
const editor = document.getElementById("code-editor");
const resultsEl = document.getElementById("code-results");
const feedbackEl = document.getElementById("code-battle-feedback");
const runBtn = document.querySelector('[data-action="run-code"]');
const resetBtn = document.querySelector('[data-action="reset-code"]');
const enemySpriteHost = document.getElementById("code-battle-enemy-sprite");

let round = 1;
let config = null;
let activeScreen = null;
let locked = false;

// { title, starterCode, publicCases: [{name, input, expected}], generateSealed(): cases,
//   enemySprite, enemyPixelSize, returnScreen, onWin,
//   wrongPublicHint, wrongSealedHint, wonPublicHint, wonHint }
export function startCodeBattle(battleConfig) {
  config = battleConfig;
  round = 1;
  locked = false;

  activeScreen = document.getElementById(config.returnScreen);
  titleEl.textContent = config.title;
  editor.value = config.starterCode || "function solve(values) {\n  \n}";
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
  feedbackEl.textContent = "";
  feedbackEl.classList.remove("error");
  resultsEl.innerHTML = "";
  runBtn.disabled = false;
  roundLabel.textContent = round === 1 ? "Public cases" : "Sealed check";
  hintEl.textContent = round === 1
    ? (config.roundHint1 || "Write solve(values) and Run it against the visible cases.")
    : (config.roundHint2 || "The Archive tried fresh input. Prove the repair still holds.");
}

function renderResults(results) {
  resultsEl.innerHTML = "";
  results.forEach((r) => {
    const row = document.createElement("div");
    row.className = "code-result-row " + (r.pass ? "pass" : "fail");
    row.textContent = `${r.pass ? "PASS" : "FAIL"} ${round === 1 ? r.name : "sealed case"}${r.error ? " - " + r.error : ""}`;
    resultsEl.appendChild(row);
  });
}

runBtn.addEventListener("click", async () => {
  if (locked) return;
  const source = editor.value;

  for (const rule of BANNED_PATTERNS) {
    if (rule.pattern.test(source)) {
      feedbackEl.textContent = rule.message;
      feedbackEl.classList.add("error");
      return;
    }
  }

  runBtn.disabled = true;
  feedbackEl.classList.remove("error");
  feedbackEl.textContent = "Running...";

  const cases = round === 1 ? config.publicCases : config.generateSealed();
  const outcome = await runInWorker(source, cases);
  runBtn.disabled = false;

  if (!outcome.ok) {
    feedbackEl.textContent = outcome.error;
    feedbackEl.classList.add("error");
    resultsEl.innerHTML = "";
    return;
  }

  renderResults(outcome.results);
  const allPass = outcome.results.every((r) => r.pass);

  if (!allPass) {
    feedbackEl.textContent = round === 1
      ? (config.wrongPublicHint || "Not quite. Check the failing cases above.")
      : (config.wrongSealedHint || "The visible cases held, but a fresh mess exposed a guess.");
    feedbackEl.classList.add("error");
    return;
  }

  if (round === 1) {
    feedbackEl.textContent = config.wonPublicHint || "That holds. But can it survive a fresh mess?";
    round = 2;
    locked = true;
    window.setTimeout(() => {
      locked = false;
      setupRound();
    }, 1400);
    return;
  }

  locked = true;
  feedbackEl.textContent = config.wonHint || "Repair confirmed.";
  runBtn.disabled = true;
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
  editor.value = config.starterCode || "function solve(values) {\n  \n}";
  resultsEl.innerHTML = "";
  feedbackEl.textContent = "";
  feedbackEl.classList.remove("error");
});

function wipeTo(afterFadeIn) {
  transition.classList.add("active");
  window.setTimeout(() => {
    afterFadeIn();
    window.setTimeout(() => transition.classList.remove("active"), 60);
  }, 180);
}
