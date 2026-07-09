import { applyBattleCost } from "./combatState.js";
import { describeCost, initBattleHud, logBattle, updateBattleVitals } from "./battleHud.js";
import { isAdminMode } from "./admin.js";

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
      js.push("__metrics.steps += 1; if (__metrics.steps > 15000) throw new Error('Too many loop steps. Bogolord loves runaway work.');");
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
      js.push("__metrics.steps += 1; if (__metrics.steps > 15000) throw new Error('Too many loop steps. Bogolord loves runaway work.');");
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
const BOGO_MAX_HP = 90;
const PHASE_DAMAGE = 30;
const BOGO_IMAGE = "assets/characters/bogolord/Style_16-bit_horror_pixel_art/rotations/south.png";

const BANNED_PATTERNS = [
  { pattern: /\.sort\s*\(/, message: "Bogolord blocks .sort(). Show the repair logic." },
  { pattern: /\bsorted\s*\(/, message: "Bogolord blocks sorted(...). Write the algorithm yourself." },
];

const challenges = [
  {
    name: "Phase 1: Ascending Spill",
    phaseLabel: "Phase 1 - Dice Scatter",
    status: "Random tiles orbiting",
    hpDamage: PHASE_DAMAGE,
    attackName: "Permutation Sting",
    attackMs: 14000,
    attackCost: { hp: 2, focus: 1 },
    objective: "Sort the list in ascending order without shortcuts.",
    hint: "Return the values in ascending order. Swaps and loops are enough.",
    starterCode: `def solve(values):
    ordered = values[:]
    # Sort ordered from smallest to largest.
    return ordered`,
    publicCases: [
      { name: "visible_shuffle", input: [5, 1, 4, 2], expected: [1, 2, 4, 5] },
    ],
    sealedCases: [
      { name: "sealed_shuffle", input: [3, 3, 1, 2], expected: [1, 2, 3, 3] },
      { name: "sealed_reverse", input: [6, 5, 4, 1], expected: [1, 4, 5, 6] },
    ],
  },
  {
    name: "Phase 2: Zeroes Are Values",
    phaseLabel: "Phase 2 - Null Bloom",
    status: "Screen geometry unstable",
    hpDamage: PHASE_DAMAGE,
    attackName: "Rot Pulse",
    attackMs: 11000,
    attackCost: { hp: 3, focus: 2 },
    objective: "Move all zeroes to the end while preserving nonzero order.",
    hint: "Zero is a value, not Null Rot. Keep nonzero order and push zeroes to the end.",
    starterCode: `def solve(values):
    result = values[:]
    # Move every 0 to the end.
    return result`,
    publicCases: [
      { name: "visible_zeroes", input: [0, 1, 0, 3, 12], expected: [1, 3, 12, 0, 0] },
    ],
    sealedCases: [
      { name: "sealed_edges", input: [0, 0, 2, 0, 5], expected: [2, 5, 0, 0, 0] },
      { name: "sealed_clean", input: [4, 0, 1, 0], expected: [4, 1, 0, 0] },
    ],
    tilt: true,
  },
  {
    name: "Phase 3: Ordered Squares",
    phaseLabel: "Phase 3 - Unbounded Oracle",
    status: "Null Rot editing margins",
    hpDamage: PHASE_DAMAGE,
    attackName: "Null Cascade",
    attackMs: 9000,
    attackCost: { hp: 4, focus: 2 },
    objective: "Return sorted squares of an already sorted list.",
    hint: "Square every value, then return the squared values in ascending order.",
    starterCode: `def solve(values):
    result = values[:]
    for i in range(len(values)):
        result[i] = values[i] * values[i]
    # Sort the squared values.
    return result`,
    publicCases: [
      { name: "visible_squares", input: [-4, -1, 0, 3, 10], expected: [0, 1, 9, 16, 100] },
    ],
    sealedCases: [
      { name: "sealed_squares", input: [-7, -3, 2, 3, 11], expected: [4, 9, 9, 49, 121] },
      { name: "sealed_small", input: [-2, -1, 1], expected: [1, 1, 4] },
    ],
    tilt: true,
    corruptsEditor: true,
  },
];

const screenBattle = document.getElementById("screen-battle-bogo");
const transition = document.getElementById("screen-transition");
const phaseLabel = document.getElementById("bogo-phase-label");
const challengeName = document.getElementById("bogo-challenge-name");
const attackReadout = document.getElementById("bogo-attack-readout");
const hintEl = document.getElementById("bogo-hint");
const editorWrap = document.getElementById("bogo-editor-wrap");
const editor = document.getElementById("bogo-code-editor");
const resultsEl = document.getElementById("bogo-code-results");
const feedbackEl = document.getElementById("bogo-battle-feedback");
const runBtn = document.querySelector('[data-action="run-bogo-code"]');
const resetBtn = document.querySelector('[data-action="reset-bogo-code"]');
const adminWinBtn = document.querySelector('[data-action="admin-win-bogo"]');
const spriteHost = document.getElementById("bogo-boss-sprite");
const hpFill = document.getElementById("bogo-hp-fill");
const hpText = document.getElementById("bogo-hp-text");

let config = null;
let activeScreen = null;
let phaseIndex = 0;
let round = 1;
let bossHp = BOGO_MAX_HP;
let locked = false;
let attackTimer = null;
let countdownTimer = null;
let sabotageTimer = null;
let nextAttackAt = 0;
let failedRuns = 0;

export function startBogoBossBattle(battleConfig) {
  config = battleConfig;
  activeScreen = document.getElementById(config.returnScreen);
  phaseIndex = 0;
  round = 1;
  bossHp = BOGO_MAX_HP;
  locked = false;
  failedRuns = 0;
  renderSprite();
  updateBossHp();
  initBattleHud(screenBattle, {
    objective: "Break Bogolord's phases. Time matters now.",
    enemyStatus: "Null Rot gathering",
  });

  wipeTo(() => {
    if (activeScreen) activeScreen.classList.remove("active");
    screenBattle.classList.add("active");
    setupPhase();
  });
}

function renderSprite() {
  spriteHost.innerHTML = "";
  const img = document.createElement("img");
  img.src = BOGO_IMAGE;
  img.alt = "Bogolord";
  img.draggable = false;
  spriteHost.appendChild(img);
  for (let i = 0; i < 18; i++) {
    const mote = document.createElement("span");
    mote.className = "bogo-null-mote";
    mote.style.setProperty("--x", `${Math.random() * 96 - 48}px`);
    mote.style.setProperty("--y", `${Math.random() * 78 - 39}px`);
    mote.style.setProperty("--d", `${0.4 + Math.random() * 1.4}s`);
    spriteHost.appendChild(mote);
  }
}

function setupPhase() {
  const challenge = challenges[phaseIndex];
  clearTimers();
  round = 1;
  failedRuns = 0;
  locked = false;
  phaseLabel.textContent = challenge.phaseLabel;
  challengeName.textContent = challenge.name;
  hintEl.textContent = challenge.hint;
  editor.value = challenge.starterCode;
  feedbackEl.textContent = "";
  feedbackEl.classList.remove("error");
  resultsEl.innerHTML = "";
  runBtn.disabled = false;
  editorWrap.classList.toggle("bogo-editor-tilt", Boolean(challenge.tilt));
  initBattleHud(screenBattle, {
    objective: challenge.objective,
    enemyStatus: challenge.status,
  });
  updateBossHp();
  logBattle(screenBattle, `${challenge.attackName} will strike while you think.`, "warning");
  startTimers(challenge);
}

function startTimers(challenge) {
  nextAttackAt = Date.now() + challenge.attackMs;
  attackTimer = window.setInterval(() => {
    applyTimedAttack(challenge);
    nextAttackAt = Date.now() + challenge.attackMs;
  }, challenge.attackMs);
  countdownTimer = window.setInterval(() => {
    const remaining = Math.max(0, Math.ceil((nextAttackAt - Date.now()) / 1000));
    attackReadout.textContent = `Next attack: ${remaining}s`;
  }, 500);
  if (challenge.corruptsEditor) {
    sabotageTimer = window.setInterval(insertNullRot, 12500 + Math.floor(Math.random() * 4000));
  }
}

function clearTimers() {
  if (attackTimer) window.clearInterval(attackTimer);
  if (countdownTimer) window.clearInterval(countdownTimer);
  if (sabotageTimer) window.clearInterval(sabotageTimer);
  attackTimer = null;
  countdownTimer = null;
  sabotageTimer = null;
}

function applyTimedAttack(challenge) {
  if (!screenBattle.classList.contains("active") || locked) return;
  const cost = applyBattleCost(challenge.attackCost);
  updateBattleVitals(screenBattle);
  logBattle(screenBattle, `${challenge.attackName}: ${describeCost(cost)}.`, "danger");
  screenBattle.classList.add("bogo-impact");
  window.setTimeout(() => screenBattle.classList.remove("bogo-impact"), 380);
}

function insertNullRot() {
  if (!screenBattle.classList.contains("active") || locked) return;
  const fragments = [
    "    # null rot moved this comment",
    "    bogo_noise = None",
    "    # the order is watching",
  ];
  const lines = editor.value.split(/\r?\n/);
  const index = Math.min(lines.length, 1 + Math.floor(Math.random() * Math.max(1, lines.length - 1)));
  lines.splice(index, 0, fragments[Math.floor(Math.random() * fragments.length)]);
  editor.value = lines.join("\n");
  feedbackEl.textContent = "Bogolord altered the editor.";
  logBattle(screenBattle, "Bogolord inserted Null Rot into the code margin.", "warning");
}

function currentCases() {
  const challenge = challenges[phaseIndex];
  return round === 1 ? challenge.publicCases : challenge.sealedCases;
}

function runInWorker(source, cases, timeoutMs = 2200) {
  return new Promise((resolve) => {
    const worker = new Worker(WORKER_URL);
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      worker.terminate();
      resolve({ ok: false, error: "Timed out. Bogolord fed on the loop." });
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

function summarizeSteps(results) {
  return results.reduce((total, result) => total + ((result.metrics && result.metrics.steps) || 0), 0);
}

function workBudget(cases) {
  return cases.reduce((total, c) => {
    const n = Array.isArray(c.input) ? c.input.length : 1;
    return total + n * n + n + 6;
  }, 0);
}

function applyMistake(message, hp, focus) {
  failedRuns += 1;
  const cost = applyBattleCost({ hp, focus });
  updateBattleVitals(screenBattle);
  logBattle(screenBattle, `${message} ${describeCost(cost)}.`, "danger");
}

function updateBossHp() {
  const pct = Math.max(0, Math.min(100, (bossHp / BOGO_MAX_HP) * 100));
  hpFill.style.width = `${pct}%`;
  hpText.textContent = `${bossHp}/${BOGO_MAX_HP}`;
}

function damageBoss(amount) {
  bossHp = Math.max(0, bossHp - amount);
  updateBossHp();
  screenBattle.classList.add("bogo-damaged");
  window.setTimeout(() => screenBattle.classList.remove("bogo-damaged"), 420);
  logBattle(screenBattle, `Bogolord takes ${amount} phase damage.`, "good");
}

runBtn.addEventListener("click", async () => {
  if (locked) return;
  const source = editor.value;
  for (const rule of BANNED_PATTERNS) {
    if (rule.pattern.test(source)) {
      feedbackEl.textContent = rule.message;
      feedbackEl.classList.add("error");
      applyMistake("Shortcut rejected:", 3, 2);
      return;
    }
  }

  runBtn.disabled = true;
  feedbackEl.classList.remove("error");
  feedbackEl.textContent = "Running repair...";
  const cases = currentCases();
  const outcome = await runInWorker(source, cases);
  runBtn.disabled = false;

  if (!outcome.ok) {
    feedbackEl.textContent = outcome.error;
    feedbackEl.classList.add("error");
    resultsEl.innerHTML = "";
    applyMistake("Runtime failure:", 4, 2);
    return;
  }

  renderResults(outcome.results);
  const allPass = outcome.results.every((r) => r.pass);
  if (!allPass) {
    feedbackEl.textContent = round === 1
      ? "Visible case failed. Fix the repair before Bogolord's next attack."
      : "Sealed case failed. The phase is reading your shortcut.";
    feedbackEl.classList.add("error");
    applyMistake("Incorrect repair:", round === 1 ? 3 : 5, 2);
    return;
  }

  const steps = summarizeSteps(outcome.results);
  const overBudget = Math.max(0, steps - workBudget(cases));
  if (overBudget) {
    const cost = applyBattleCost({ hp: Math.min(5, Math.floor(overBudget / 8)), focus: Math.min(6, Math.ceil(overBudget / 6)) });
    updateBattleVitals(screenBattle);
    logBattle(screenBattle, `Work cost ${steps} loop steps, ${overBudget} over budget. ${describeCost(cost)}.`, "warning");
  } else {
    logBattle(screenBattle, `Work cost ${steps} loop steps. Within the phase budget.`, "good");
  }

  if (round === 1) {
    round = 2;
    feedbackEl.textContent = "Public repair held. Bogolord reshuffles the sealed phase.";
    logBattle(screenBattle, "Sealed cases armed. Same code, stranger input.", "warning");
    return;
  }

  locked = true;
  damageBoss(challenges[phaseIndex].hpDamage);
  if (bossHp <= 0) {
    finishBattle();
    return;
  }
  phaseIndex += 1;
  feedbackEl.textContent = "Phase broken. Bogolord changes the rules of the room.";
  window.setTimeout(setupPhase, 1200);
});

resetBtn.addEventListener("click", () => {
  if (locked) return;
  editor.value = challenges[phaseIndex].starterCode;
  resultsEl.innerHTML = "";
  feedbackEl.textContent = "";
  feedbackEl.classList.remove("error");
  logBattle(screenBattle, "Phase starter restored. Bogo keeps counting time.");
});

adminWinBtn.addEventListener("click", () => {
  if (!isAdminMode() || !config) return;
  locked = true;
  bossHp = 0;
  updateBossHp();
  feedbackEl.classList.remove("error");
  feedbackEl.textContent = "Admin phase collapse accepted.";
  logBattle(screenBattle, "Admin mode forced Bogolord's HP to zero.", "good");
  finishBattle();
});

function finishBattle() {
  clearTimers();
  feedbackEl.textContent = "Bogolord's health hits zero.";
  logBattle(screenBattle, "Bogolord's Null Rot halo collapses out of order.", "good");
  runBtn.disabled = true;
  window.setTimeout(() => {
    wipeTo(() => {
      screenBattle.classList.remove("active");
      editorWrap.classList.remove("bogo-editor-tilt");
      const cb = config && config.onWin;
      config = null;
      if (activeScreen) activeScreen.classList.add("active");
      if (cb) cb();
    });
  }, 1000);
}

function wipeTo(afterFadeIn) {
  transition.classList.add("active");
  window.setTimeout(() => {
    afterFadeIn();
    window.setTimeout(() => transition.classList.remove("active"), 60);
  }, 180);
}
