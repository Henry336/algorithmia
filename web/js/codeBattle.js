import { applyPixelArt } from "./pixelart.js";
import { applyBattleCost } from "./combatState.js";
import { describeCost, initBattleHud, logBattle, updateBattleVitals } from "./battleHud.js";

// Player writes a Python-flavored `solve(values)` function. The static browser
// build supports the small subset this first sorting lesson needs: def,
// indentation, range/len loops, list copies, comparisons, swaps, and return.
// It runs in a Web Worker so a hung submission can be killed without freezing
// the page. This is a pedagogical guardrail, not a security sandbox.
const WORKER_SOURCE = `
function countIndent(line) {
  const match = line.match(/^ */);
  return match ? match[0].length : 0;
}

function withoutComment(line) {
  const index = line.indexOf("#");
  return index === -1 ? line : line.slice(0, index);
}

function splitRangeArgs(args) {
  return args.split(",").map((part) => part.trim()).filter(Boolean);
}

function translateExpr(expr) {
  return expr
    .replace(/\\b([A-Za-z_]\\w*)\\s*\\[\\s*:\\s*\\]/g, "$1.slice()")
    .replace(/\\b([A-Za-z_]\\w*)\\.copy\\(\\s*\\)/g, "$1.slice()")
    .replace(/\\blist\\s*\\(\\s*([A-Za-z_]\\w*)\\s*\\)/g, "$1.slice()")
    .replace(/\\blen\\s*\\(\\s*([A-Za-z_]\\w*)\\s*\\)/g, "$1.length")
    .replace(/\\bTrue\\b/g, "true")
    .replace(/\\bFalse\\b/g, "false")
    .replace(/\\bNone\\b/g, "null")
    .replace(/\\band\\b/g, "&&")
    .replace(/\\bor\\b/g, "||")
    .replace(/\\bnot\\b/g, "!");
}

function compilePythonSolve(source) {
  const lines = source.replace(/\\t/g, "    ").split(/\\r?\\n/);
  const defIndex = lines.findIndex((line) => /^\\s*def\\s+solve\\s*\\(\\s*values\\s*\\)\\s*:\\s*$/.test(withoutComment(line).trim()));
  if (defIndex === -1) {
    throw new Error("Define Python function: def solve(values):");
  }

  const defIndent = countIndent(lines[defIndex]);
  const bodyLines = [];
  for (let i = defIndex + 1; i < lines.length; i++) {
    const raw = withoutComment(lines[i]);
    if (!raw.trim()) continue;
    const indent = countIndent(raw);
    if (indent <= defIndent) break;
    bodyLines.push({ indent, text: raw.trim(), lineNo: i + 1 });
  }

  if (!bodyLines.length) {
    throw new Error("Add an indented body under def solve(values):");
  }

  const js = ["function solve(values) {", "const __metrics = { steps: 0, writes: 0, assignments: 0 };"];
  const stack = [];
  const declared = new Set(["values"]);
  let swapTemp = 0;

  function closeTo(indent) {
    while (stack.length && indent <= stack[stack.length - 1]) {
      js.push("}");
      stack.pop();
    }
  }

  for (const item of bodyLines) {
    closeTo(item.indent);
    const line = item.text;

    let match = line.match(/^for\\s+([A-Za-z_]\\w*)\\s+in\\s+range\\s*\\((.*)\\)\\s*:\\s*$/);
    if (match) {
      const name = match[1];
      const args = splitRangeArgs(match[2]).map(translateExpr);
      if (args.length < 1 || args.length > 3) {
        throw new Error("range() needs one, two, or three arguments near line " + item.lineNo);
      }
      const start = args.length === 1 ? "0" : args[0];
      const end = args.length === 1 ? args[0] : args[1];
      const step = args.length === 3 ? args[2] : "1";
      declared.add(name);
      js.push("for (let " + name + " = " + start + "; " + name + " < " + end + "; " + name + " += " + step + ") {");
      js.push("__metrics.steps += 1; if (__metrics.steps > 10000) throw new Error('Too many loop steps. Check for runaway work.');");
      stack.push(item.indent);
      continue;
    }

    match = line.match(/^if\\s+(.+)\\s*:\\s*$/);
    if (match) {
      js.push("if (" + translateExpr(match[1]) + ") {");
      stack.push(item.indent);
      continue;
    }

    match = line.match(/^while\\s+(.+)\\s*:\\s*$/);
    if (match) {
      js.push("while (" + translateExpr(match[1]) + ") {");
      js.push("__metrics.steps += 1; if (__metrics.steps > 10000) throw new Error('Too many loop steps. Check for runaway work.');");
      stack.push(item.indent);
      continue;
    }

    match = line.match(/^return\\s+(.+)$/);
    if (match) {
      js.push("return { __algorithimiaValue: " + translateExpr(match[1]) + ", __algorithimiaMetrics: __metrics };");
      continue;
    }

    match = line.match(/^(.+\\[[^\\]]+\\])\\s*,\\s*(.+\\[[^\\]]+\\])\\s*=\\s*(.+\\[[^\\]]+\\])\\s*,\\s*(.+\\[[^\\]]+\\])$/);
    if (match) {
      const leftA = translateExpr(match[1]);
      const leftB = translateExpr(match[2]);
      const rightA = translateExpr(match[3]);
      const rightB = translateExpr(match[4]);
      const tempA = "__swapA" + swapTemp;
      const tempB = "__swapB" + swapTemp;
      swapTemp += 1;
      js.push("const " + tempA + " = " + rightA + ";");
      js.push("const " + tempB + " = " + rightB + ";");
      js.push("__metrics.writes += 2;");
      js.push(leftA + " = " + tempA + ";");
      js.push(leftB + " = " + tempB + ";");
      continue;
    }

    match = line.match(/^([A-Za-z_]\\w*)\\s*([+\\-])=\\s*(.+)$/);
    if (match) {
      const name = match[1];
      const op = match[2];
      const value = translateExpr(match[3]);
      if (!declared.has(name)) {
        throw new Error("Unknown variable near line " + item.lineNo + ": " + name);
      }
      js.push("__metrics.assignments += 1;");
      js.push(name + " " + op + "= " + value + ";");
      continue;
    }

    match = line.match(/^([A-Za-z_]\\w*)\\s*=\\s*(.+)$/);
    if (match) {
      const name = match[1];
      const value = translateExpr(match[2]);
      if (declared.has(name)) {
        js.push("__metrics.assignments += 1;");
        js.push(name + " = " + value + ";");
      } else {
        declared.add(name);
        js.push("__metrics.assignments += 1;");
        js.push("let " + name + " = " + value + ";");
      }
      continue;
    }

    match = line.match(/^(.+\\[[^\\]]+\\])\\s*=\\s*(.+)$/);
    if (match) {
      js.push("__metrics.writes += 1;");
      js.push(translateExpr(match[1]) + " = " + translateExpr(match[2]) + ";");
      continue;
    }

    throw new Error("Unsupported Python near line " + item.lineNo + ": " + line);
  }

  closeTo(-1);
  js.push("}");
  return js.join("\\n");
}

self.onmessage = (e) => {
  const { source, cases } = e.data;
  let solve;
  try {
    const compiled = compilePythonSolve(source);
    solve = new Function(compiled + "\\nreturn solve;")();
  } catch (err) {
    self.postMessage({ ok: false, error: "Could not read that Python: " + (err && err.message || err) });
    return;
  }
  try {
    const results = cases.map((c) => {
      try {
        const raw = solve(c.input.slice());
        const actual = raw && Object.prototype.hasOwnProperty.call(raw, "__algorithimiaValue") ? raw.__algorithimiaValue : raw;
        const metrics = raw && raw.__algorithimiaMetrics ? raw.__algorithimiaMetrics : { steps: 0, writes: 0, assignments: 0 };
        return { name: c.name, pass: JSON.stringify(actual) === JSON.stringify(c.expected), metrics };
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
  { pattern: /\.sort\s*\(/, message: "This encounter needs visible Python sorting logic - replace .sort() with your own comparisons." },
  { pattern: /\bsorted\s*\(/, message: "This encounter needs visible Python sorting logic - replace sorted(...) with your own comparisons." },
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
let failedRuns = 0;

// { title, starterCode, publicCases: [{name, input, expected}], generateSealed(): cases,
//   enemySprite, enemyPixelSize, returnScreen, onWin,
//   wrongPublicHint, wrongSealedHint, wonPublicHint, wonHint }
export function startCodeBattle(battleConfig) {
  config = battleConfig;
  round = 1;
  locked = false;

  activeScreen = document.getElementById(config.returnScreen);
  titleEl.textContent = config.title;
  editor.value = config.starterCode || "def solve(values):\n    return values";
  enemySpriteHost.innerHTML = "";
  if (config.enemySprite) {
    applyPixelArt(enemySpriteHost, config.enemySprite.matrix, config.enemySprite.palette, config.enemyPixelSize || 5);
  }
  initBattleHud(screenBattle, {
    objective: config.objective || "Write Python that passes visible and sealed cases with reasonable work.",
    enemyStatus: round === 1 ? "Public cases loaded" : "Sealed cases armed",
  });

  wipeTo(() => {
    if (activeScreen) activeScreen.classList.remove("active");
    screenBattle.classList.add("active");
    setupRound();
  });
}

function setupRound() {
  failedRuns = 0;
  feedbackEl.textContent = "";
  feedbackEl.classList.remove("error");
  resultsEl.innerHTML = "";
  runBtn.disabled = false;
  roundLabel.textContent = round === 1 ? "Public cases" : "Sealed check";
  initBattleHud(screenBattle, {
    objective: round === 1
      ? (config.objective || "Write Python repair logic, then check its observed work.")
      : "Run the same Python against fresh hidden cases.",
    enemyStatus: round === 1 ? "Visible tests online" : "Hidden tests online",
  });
  logBattle(screenBattle, "Analyzer tracks loop steps, list writes, and assignments.", "warning");
  hintEl.textContent = round === 1
    ? (config.roundHint1 || "Write Python def solve(values): and run it against the visible cases.")
    : (config.roundHint2 || "The Archive tried fresh input. Prove the repair still holds.");
}

function renderResults(results) {
  resultsEl.innerHTML = "";
  results.forEach((r) => {
    const row = document.createElement("div");
    row.className = "code-result-row " + (r.pass ? "pass" : "fail");
    const metrics = r.metrics ? ` | steps ${r.metrics.steps || 0}, writes ${r.metrics.writes || 0}` : "";
    row.textContent = `${r.pass ? "PASS" : "FAIL"} ${round === 1 ? r.name : "sealed case"}${metrics}${r.error ? " - " + r.error : ""}`;
    resultsEl.appendChild(row);
  });
}

function summarizeMetrics(results) {
  return results.reduce((total, result) => {
    const metrics = result.metrics || {};
    return {
      steps: total.steps + (metrics.steps || 0),
      writes: total.writes + (metrics.writes || 0),
      assignments: total.assignments + (metrics.assignments || 0),
    };
  }, { steps: 0, writes: 0, assignments: 0 });
}

function expectedWorkBudget(cases) {
  return cases.reduce((total, c) => {
    const n = Array.isArray(c.input) ? c.input.length : 1;
    return total + (n * n) + n + 4;
  }, 0);
}

function applyCodeMistake(message, hp, focus) {
  failedRuns += 1;
  const cost = applyBattleCost({ hp, focus });
  updateBattleVitals(screenBattle);
  logBattle(screenBattle, `${message} ${describeCost(cost)}.`, "danger");
}

function scoreCodeWork(results, cases) {
  const totals = summarizeMetrics(results);
  const budget = expectedWorkBudget(cases);
  const overBudget = Math.max(0, totals.steps - budget);
  if (!overBudget) {
    logBattle(screenBattle, `Work cost: ${totals.steps} loop steps, ${totals.writes} writes, ${totals.assignments} assignments. Within O(n^2) lesson budget.`, "good");
    return totals;
  }
  const cost = applyBattleCost({
    hp: round === 2 ? Math.min(6, Math.floor(overBudget / 8)) : 0,
    focus: Math.min(8, Math.ceil(overBudget / 6)),
  });
  updateBattleVitals(screenBattle);
  logBattle(screenBattle, `Work cost: ${totals.steps} loop steps, ${overBudget} over budget. ${describeCost(cost)}.`, "warning");
  return totals;
}

runBtn.addEventListener("click", async () => {
  if (locked) return;
  const source = editor.value;

  for (const rule of BANNED_PATTERNS) {
    if (rule.pattern.test(source)) {
      feedbackEl.textContent = rule.message;
      feedbackEl.classList.add("error");
      applyCodeMistake(`Shortcut blocked ${failedRuns + 1}: no visible algorithm.`, 2, 2);
      return;
    }
  }

  runBtn.disabled = true;
  feedbackEl.classList.remove("error");
  feedbackEl.textContent = "Running Python...";

  const cases = round === 1 ? config.publicCases : config.generateSealed();
  const outcome = await runInWorker(source, cases);
  runBtn.disabled = false;

  if (!outcome.ok) {
    feedbackEl.textContent = outcome.error;
    feedbackEl.classList.add("error");
    resultsEl.innerHTML = "";
    applyCodeMistake(`Runtime failure ${failedRuns + 1}: Python did not complete.`, 4, 1);
    return;
  }

  renderResults(outcome.results);
  const allPass = outcome.results.every((r) => r.pass);

  if (!allPass) {
    feedbackEl.textContent = round === 1
      ? (config.wrongPublicHint || "Not quite. Check the failing cases above.")
      : (config.wrongSealedHint || "The visible cases held, but a fresh mess exposed a guess.");
    feedbackEl.classList.add("error");
    applyCodeMistake(`Failed run ${failedRuns + 1}: incorrect output.`, round === 1 ? 3 : 5, 2);
    return;
  }
  scoreCodeWork(outcome.results, cases);

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
  logBattle(screenBattle, "Sealed Python held. Enemy corruption collapsed.", "good");
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
  editor.value = config.starterCode || "def solve(values):\n    return values";
  resultsEl.innerHTML = "";
  feedbackEl.textContent = "";
  feedbackEl.classList.remove("error");
  logBattle(screenBattle, "Restored starter Python. Test results cleared.");
});

function wipeTo(afterFadeIn) {
  transition.classList.add("active");
  window.setTimeout(() => {
    afterFadeIn();
    window.setTimeout(() => transition.classList.remove("active"), 60);
  }, 180);
}
