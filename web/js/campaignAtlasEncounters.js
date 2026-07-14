import { startBogoBossBattle } from "./bogoBossBattle.js";
import { startCodeBattle } from "./codeBattle.js";
import { sayLines } from "./dialogue.js";
import { startSortingSlimeArenaBattle } from "./slimeArenaBattle.js";
import { setState } from "./state.js";
import { makeTicket, startTicketBattle } from "./ticketBattle.js";
import { solveTriageOrder } from "./triagePolicy.js";

const RETURN_SCREEN = "screen-campaign-atlas";
const DISPATCHER_IMAGE = "assets/characters/dispatcher/dispatcher.png";
const HUSK_IMAGE = "assets/characters/recursive-husk/recursive-husk-92.png";

const STARTERS = {
  sort: `def solve(values):
    result = values[:]
    for end in range(len(result)):
        for i in range(len(result) - 1):
            # Swap neighbors when the left value is larger.
    return result`,
  max: `def solve(values):
    best = values[0]
    for i in range(1, len(values)):
        # Replace best when values[i] is larger.
    return best`,
  min: `def solve(values):
    best = values[0]
    for i in range(1, len(values)):
        # Replace best when values[i] is smaller.
    return best`,
  sum: `def solve(values):
    total = 0
    for i in range(len(values)):
        # Add this value to total.
    return total`,
  reverse: `def solve(values):
    result = values[:]
    left = 0
    right = len(result) - 1
    while left < right:
        # Swap result[left] and result[right].
        left += 1
        right -= 1
    return result`,
  maxIndex: `def solve(values):
    best_index = 0
    for i in range(1, len(values)):
        # Keep the index of the largest value seen so far.
    return best_index`,
  palindrome: `def solve(values):
    left = 0
    right = len(values) - 1
    mirrored = True
    while left < right:
        # Set mirrored to False when the pair does not match.
        left += 1
        right -= 1
    return mirrored`,
  positiveCount: `def solve(values):
    count = 0
    for i in range(len(values)):
        # Count values greater than zero.
    return count`,
  moveZeros: `def solve(values):
    result = values[:]
    write = 0
    for read in range(len(result)):
        # Copy each non-zero value to the next write position.
    for i in range(write, len(result)):
        result[i] = 0
    return result`,
  prefix: `def solve(values):
    result = values[:]
    for i in range(1, len(result)):
        # Add the previous running total to result[i].
    return result`,
  twoSum: `def solve(values):
    target = values[0]
    for i in range(1, len(values)):
        for j in range(i + 1, len(values)):
            # Return [i, j] when this pair adds to target.
    return [-1, -1]`,
};

const SOLVERS = {
  sort: (values) => values.slice().sort((a, b) => a - b),
  max: (values) => Math.max(...values),
  min: (values) => Math.min(...values),
  sum: (values) => values.reduce((sum, value) => sum + value, 0),
  reverse: (values) => values.slice().reverse(),
  maxIndex: (values) => values.reduce((best, value, index) => (value > values[best] ? index : best), 0),
  palindrome: (values) => values.every((value, index) => value === values[values.length - 1 - index]),
  positiveCount: (values) => values.filter((value) => value > 0).length,
  moveZeros: (values) => [...values.filter((value) => value !== 0), ...values.filter((value) => value === 0)],
  prefix: (values) => values.reduce((result, value) => [...result, value + (result[result.length - 1] || 0)], []),
  twoSum: (values) => {
    const target = values[0];
    for (let i = 1; i < values.length; i += 1) {
      for (let j = i + 1; j < values.length; j += 1) {
        if (values[i] + values[j] === target) return [i, j];
      }
    }
    return [-1, -1];
  },
};

const PROBLEMS = {
  "rune-snarl": problem("Rune Snarl", "sort", "Restore the runes to ascending order.", [[4, 1, 3, 2], [2, 1]], [[8, 3, 6, 1, 5], [5, 5, 0, -2]]),
  "ember-sorter": problem("Ember Sorter", "max", "Return the hottest value in the heap.", [[2, 9, 4, 7], [-4, -2, -8]], [[13, 5, 21, 8], [0, -3, -1]]),
  "priority-forger": problem("Priority Forger", "maxIndex", "Return the index of the largest priority.", [[3, 8, 4, 7], [-2, -1, -5]], [[4, 12, 8, 2, 9], [10, 3, 2, 1]]),
  "ash-auditor": problem("Ash Auditor", "sum", "Add every surviving quantity. None may vanish from the ledger.", [[3, 1, 4], [-2, 5, -1]], [[8, 8, 2, 1], [0, 0, 7]]),
  "heat-sifter": problem("Heat Sifter", "reverse", "Reverse the heat channel in place.", [[1, 2, 3, 4], [9, 5]], [[4, 0, -2, 7, 3], [1]]),
  "heap-warden-a": problem("Heap Warden / Furnace Limit", "max", "Find the hottest safe load before the furnace peaks.", [[7, 2, 11, 4], [-3, -1, -8]], [[15, 9, 12, 3], [0, 5, 4]]),
  "heap-warden-b": problem("Heap Warden / Cooling Queue", "moveZeros", "Move every spent cell to the end without changing live-cell order.", [[0, 4, 0, 2, 1], [3, 0]], [[0, 0, 8, 1, 0, 5], [4, 2, 1]]),
  "shuffle-imp": problem("Shuffle Imp", "reverse", "Undo the Imp's exact reversal.", [[4, 1, 3], [8, 2]], [[7, 0, -1, 5], [3]]),
  "pivot-shade": problem("Pivot Shade", "min", "Find the smallest pivot candidate.", [[8, 2, 5, 3], [-2, -8, -1]], [[12, 4, 9, 1], [0, 7, 2]]),
  "index-ghost": problem("Index Ghost", "maxIndex", "Return the index where the largest value still lives.", [[2, 9, 4], [6, 1]], [[3, 5, 12, 4], [-7, -3, -5]]),
  "null-echo": problem("Null Echo", "positiveCount", "Count real positive values. Zero stays real, but it does not count as positive.", [[0, 2, -1, 3], [0, 0]], [[5, -2, 1, 0, 7], [-1, -2, -3]]),
  "bridge-wisp": problem("Bridge Wisp", "prefix", "Build running route totals so every step remembers the path behind it.", [[2, 3, 1], [5, -2]], [[1, 1, 1, 1], [4, -1, 2, -2]]),
  "cycle-hound": problem("Cycle Hound", "palindrome", "Return whether the route reads the same in both directions.", [[1, 2, 1], [1, 2, 3]], [[4, 6, 6, 4], [0, 1, 0, 2]]),
  "recursive-husk": problem("Recursive Husk", "twoSum", "The first value is the target. Return the first pair of later indices that reaches it.", [[9, 2, 7, 4], [10, 3, 4, 6]], [[12, 5, 1, 7, 4], [3, 1, 1, 1]]),
  "component-hermit": problem("Component Hermit", "positiveCount", "Count the components that still answer with positive signal.", [[1, 0, -1, 2], [-2, -1]], [[5, 3, 0, -4, 1], [0, 2, 0]]),
  "null-witness-a": problem("Null Witness / Reflection", "palindrome", "Tell the Witness whether this memory mirrors itself.", [[1, 3, 1], [2, 4, 5]], [[7, 0, 0, 7], [1, 2, 1, 3]]),
  "null-witness-b": problem("Null Witness / Missing Signal", "positiveCount", "Count only the signals that remain above zero.", [[0, 1, -1, 2], [-3, 0]], [[5, -5, 4, 0, 1], [1, 1, 1]]),
  "null-ferryman-a": problem("Null Ferryman / Route Debt", "prefix", "Carry every route cost forward as a running total.", [[3, -1, 4], [2, 2]], [[5, -2, -1, 6], [1, 0, 3]]),
  "null-ferryman-b": problem("Null Ferryman / Return Crossing", "palindrome", "Prove whether the crossing can be retraced exactly.", [[1, 5, 1], [1, 5, 2]], [[3, 4, 4, 3], [8, 0, 8, 1]]),
  "null-ferryman-c": problem("Null Ferryman / Fare Pair", "twoSum", "The first value is the fare. Return the first later pair that pays it.", [[10, 3, 7, 4], [5, 1, 9, 4]], [[14, 6, 8, 3], [8, 2, 1, 6, 7]]),
  "citadel-sentinel": problem("Citadel Sentinel", "maxIndex", "Return the strongest permission index.", [[2, 5, 3], [9, 1, 4]], [[1, 7, 12, 2], [-4, -2, -8]]),
  "memory-scribe": problem("Frozen Memory Scribe", "prefix", "Repair the memory offsets into running positions.", [[2, 4, -1], [1, 1, 1]], [[5, -3, 2, 4], [0, 3, 0]]),
  "source-custodian-a": problem("Source Custodian / Authority", "maxIndex", "Find the index holding the greatest claimed authority.", [[4, 9, 2], [-2, -1, -5]], [[3, 8, 13, 5], [7, 0, 6]]),
  "source-custodian-b": problem("Source Custodian / Bounded Pair", "twoSum", "The first value is the bound. Return the first later pair that meets it.", [[8, 3, 5, 1], [6, 2, 4, 9]], [[13, 5, 2, 8, 1], [4, 1, 1, 3]]),
  "source-custodian-c": problem("Source Custodian / Stable Memory", "prefix", "Write every memory offset as a bounded running total.", [[2, -1, 3], [4, 0]], [[1, 2, 3, 4], [8, -4, -2, 1]]),
};

const ENCOUNTER_PHASES = {
  "heap-warden": ["heap-warden-a", "heap-warden-b"],
  "null-witness": ["null-witness-a", "null-witness-b"],
  "null-ferryman": ["null-ferryman-a", "null-ferryman-b", "null-ferryman-c"],
  "source-custodian": ["source-custodian-a", "source-custodian-b", "source-custodian-c"],
};

const WIN_LINES = {
  "rune-snarl": [{ speaker: "Mira Vale", text: "Clean order. The knot has nothing left to argue with." }],
  "sorting-slime": [{ speaker: "Mira Vale", text: "Good. The repair changed what the slime could do, not just what the test expected." }],
  dispatcher: [{ speaker: "The Dispatcher", text: "The queue moves. I had forgotten motion could be fair." }, { speaker: "", text: "The Spire dispatches its first message in years." }],
  "heap-warden": [{ speaker: "Heap Warden", text: "A bounded furnace... can still make something new." }, { speaker: "Mira Vale", text: "That was always the point." }],
  bogolord: [{ speaker: "Bogolord", text: "Still ordered. Then the rot must learn to eat the rule, not the row." }, { speaker: "Mira Vale", text: "He was warning us. I am sure of it now." }],
  "recursive-husk": [{ speaker: "", text: "The smallest figure inside the Husk finally stops falling inward." }],
  "null-witness": [{ speaker: "Null Witness", text: "The save continues without me. That does not make it innocent." }],
  "null-ferryman": [{ speaker: "Null Ferryman", text: "You crossed without surrendering a piece of yourself. That has not happened before." }],
  "source-custodian": [{ speaker: "Source Custodian", text: "Smaller. Bounded. Perhaps this time you can enter without owning what you find." }],
};

const PORTRAIT_STYLES = {
  "rune-snarl": ["#4d2867", "#7eddd0", "orb"], "ember-sorter": ["#8e2418", "#ffd066", "flame"],
  "priority-forger": ["#3b3436", "#ff8a43", "armor"], "ash-auditor": ["#4d5558", "#9bd9cc", "scribe"],
  "heat-sifter": ["#27182f", "#ff7945", "shade"], "heap-warden": ["#4d3932", "#ff8b47", "golem"],
  "shuffle-imp": ["#4e276c", "#dedb58", "imp"], "pivot-shade": ["#24182f", "#9d78d9", "shade"],
  "index-ghost": ["#354158", "#8edfd4", "ghost"], "null-echo": ["#120f1b", "#9b5dcc", "ghost"],
  "bridge-wisp": ["#183941", "#7eddd0", "orb"], "cycle-hound": ["#222431", "#9c63c4", "hound"],
  "component-hermit": ["#313947", "#d3aa54", "scribe"], "null-witness": ["#24112e", "#a269d2", "eye"],
  "null-ferryman": ["#10131c", "#7e4ca3", "ferryman"], "citadel-sentinel": ["#535766", "#e7c765", "armor"],
  "memory-scribe": ["#4e5462", "#8ce1d7", "scribe"], "source-custodian": ["#73727b", "#a95fc6", "golem"],
};

export function startCampaignEncounter({ interaction, onComplete }) {
  if (interaction.encounter === "sorting-slime") {
    startSortingSlimeArenaBattle({
      returnScreen: RETURN_SCREEN,
      onWin: () => completeEncounter(interaction, onComplete, { queueworksGateOpen: true, archiveFragmentAwake: true }),
    });
    return;
  }

  if (interaction.encounter === "bogolord") {
    startBogoBossBattle({
      returnScreen: RETURN_SCREEN,
      onWin: () => completeEncounter(interaction, onComplete, { bogoDefeated: true, archiveFragmentAwake: true }),
    });
    return;
  }

  if (["line-cutter", "backlog-clerk", "dispatcher"].includes(interaction.encounter)) {
    startQueueEncounter(interaction, onComplete);
    return;
  }

  const phases = ENCOUNTER_PHASES[interaction.encounter] || [interaction.encounter];
  startCodeSequence(interaction, phases, 0, onComplete);
}

function startCodeSequence(interaction, phases, phaseIndex, onComplete) {
  const problemData = PROBLEMS[phases[phaseIndex]];
  if (!problemData) {
    completeEncounter(interaction, onComplete);
    return;
  }
  const finalPhase = phaseIndex === phases.length - 1;
  const exactImage = interaction.encounter === "recursive-husk" ? HUSK_IMAGE : null;
  startCodeBattle({
    title: phases.length > 1 ? `${problemData.title} (${phaseIndex + 1}/${phases.length})` : problemData.title,
    objective: problemData.objective,
    starterCode: problemData.starterCode,
    publicCases: problemData.publicCases,
    generateSealed: () => problemData.sealedCases,
    enemyImage: exactImage || makePixelPortrait(interaction.encounter),
    enemyImageClass: interaction.type === "boss" ? "code-battle-image-sprite campaign-boss-portrait" : "code-battle-image-sprite",
    returnScreen: RETURN_SCREEN,
    roundHint1: problemData.hint,
    roundHint2: "Fresh inputs are loaded. Keep the same rule; do not hard-code the visible values.",
    wonPublicHint: finalPhase ? "Visible input holds. The sealed case is still waiting." : "That layer holds. Prove it against a sealed input.",
    wonHint: finalPhase ? "Repair confirmed." : `Layer ${phaseIndex + 1} broken. Another mechanic is surfacing.`,
    onWin: () => {
      if (!finalPhase) {
        window.setTimeout(() => startCodeSequence(interaction, phases, phaseIndex + 1, onComplete), 220);
      } else {
        completeEncounter(interaction, onComplete);
      }
    },
  });
}

function startQueueEncounter(interaction, onComplete) {
  const isDispatcher = interaction.encounter === "dispatcher";
  const publicTickets = interaction.encounter === "line-cutter"
    ? [makeTicket("A", 0, false), makeTicket("B", 1, true), makeTicket("C", 2, false)]
    : interaction.encounter === "backlog-clerk"
      ? [makeTicket("A", 0, true), makeTicket("B", 1, false), makeTicket("C", 2, true), makeTicket("D", 3, false)]
      : [makeTicket("A", 0, false), makeTicket("B", 1, true), makeTicket("C", 2, true), makeTicket("D", 3, false), makeTicket("E", 4, false)];
  startTicketBattle({
    title: isDispatcher ? "The Dispatcher" : interaction.label.replace(/^Face |^Stop /, ""),
    objective: isDispatcher ? "Serve urgent tickets first while preserving arrival order inside each group." : "Repair this queue without breaking stable arrival order.",
    publicTickets,
    sealedCount: isDispatcher ? 6 : 4,
    solve: solveTriageOrder,
    enemyImage: isDispatcher ? DISPATCHER_IMAGE : makePixelPortrait(interaction.encounter),
    enemyImageClass: isDispatcher ? "code-battle-image-sprite dispatcher-battle-portrait" : "code-battle-image-sprite",
    returnScreen: RETURN_SCREEN,
    wrongPublicHint: "Urgent tickets go first, but equal-priority tickets keep their arrival order.",
    wonPublicHint: "The public queue moves. A sealed queue is arriving now.",
    wonHint: "Policy confirmed across fresh arrivals.",
    onWin: () => completeEncounter(interaction, onComplete, isDispatcher ? { dispatcherDefeated: true, archiveFragmentAwake: true } : {}),
  });
}

function completeEncounter(interaction, onComplete, extraState = {}) {
  const patch = { ...extraState };
  if (interaction.clearedFlag) patch[interaction.clearedFlag] = true;
  setState(patch);
  onComplete?.();
  const lines = WIN_LINES[interaction.encounter] || [
    { speaker: "", text: `${interaction.label.replace(/^(Face|Stop|Challenge|Repair|Confront|Catch|Quench|Audit|Ground|Wake|Address|Approach)\s+(the\s+)?/i, "")} loses its hold on the route.` },
    { speaker: "Mira Vale", text: "Good. The path changed because the rule changed. That is a real repair." },
  ];
  window.setTimeout(() => sayLines(lines), 260);
}

function problem(title, kind, objective, publicInputs, sealedInputs) {
  const solve = SOLVERS[kind];
  const makeCases = (inputs, prefix) => inputs.map((input, index) => ({ name: `${prefix}_${index + 1}`, input, expected: solve(input.slice()) }));
  return {
    title,
    kind,
    objective,
    starterCode: STARTERS[kind],
    publicCases: makeCases(publicInputs, "visible"),
    sealedCases: makeCases(sealedInputs, "sealed"),
    hint: hintFor(kind),
  };
}

function hintFor(kind) {
  const hints = {
    sort: "The loop structure is ready. Compare result[i] with result[i + 1], then swap when the left one is larger.",
    max: "Keep one best value. Replace it whenever the current item is larger.",
    min: "Keep one best value. Replace it whenever the current item is smaller.",
    sum: "The loop already visits every value. Add values[i] to total.",
    reverse: "Swap the left and right values before moving both pointers inward.",
    maxIndex: "Compare values[i] with values[best_index], then save i when it is larger.",
    palindrome: "Compare values[left] and values[right]. A mismatch makes mirrored False.",
    positiveCount: "Increase count only when values[i] is greater than zero.",
    moveZeros: "When result[read] is non-zero, copy it to result[write] and advance write.",
    prefix: "Each position should add the running total stored immediately before it.",
    twoSum: "The target is values[0]. Inside the nested loops, test values[i] + values[j].",
  };
  return hints[kind];
}

function makePixelPortrait(encounter) {
  const [body, glow, form] = PORTRAIT_STYLES[encounter] || ["#303641", "#78d8ca", "shade"];
  const shapes = portraitShapes(form, body, glow);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="92" height="92" viewBox="0 0 92 92" shape-rendering="crispEdges"><rect x="10" y="78" width="72" height="6" fill="#05070a" opacity=".45"/>${shapes}</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function portraitShapes(form, body, glow) {
  if (form === "orb") return `<rect x="24" y="25" width="44" height="44" fill="${body}"/><rect x="31" y="32" width="30" height="30" fill="#0b0c12"/><rect x="38" y="39" width="16" height="16" fill="${glow}"/><rect x="18" y="42" width="8" height="8" fill="${glow}"/><rect x="68" y="34" width="8" height="8" fill="${glow}"/>`;
  if (form === "flame") return `<path d="M46 8h8v12h8v12h8v38H22V38h8V22h8v10h8z" fill="${body}"/><path d="M46 32h8v10h8v25H32V46h8V28h6z" fill="${glow}"/><rect x="36" y="48" width="7" height="6" fill="#090b0f"/><rect x="53" y="48" width="7" height="6" fill="#090b0f"/>`;
  if (form === "hound") return `<rect x="18" y="42" width="48" height="27" fill="${body}"/><rect x="60" y="30" width="22" height="28" fill="${body}"/><rect x="24" y="66" width="9" height="16" fill="${body}"/><rect x="50" y="66" width="9" height="16" fill="${body}"/><rect x="67" y="38" width="7" height="6" fill="${glow}"/><rect x="9" y="34" width="9" height="9" fill="${glow}" opacity=".6"/>`;
  if (form === "eye") return `<rect x="12" y="34" width="68" height="30" fill="${body}"/><rect x="22" y="27" width="48" height="44" fill="${body}"/><rect x="30" y="35" width="32" height="28" fill="#05060a"/><rect x="40" y="42" width="12" height="14" fill="${glow}"/><rect x="7" y="46" width="7" height="7" fill="${glow}" opacity=".7"/><rect x="79" y="30" width="7" height="7" fill="${glow}" opacity=".7"/>`;
  if (form === "ferryman") return `<path d="M46 8h14v12h8v20h8v42H16V52h8V30h8V14h14z" fill="${body}"/><rect x="34" y="26" width="26" height="24" fill="#08090e"/><rect x="39" y="34" width="6" height="6" fill="${glow}"/><rect x="51" y="34" width="6" height="6" fill="${glow}"/><rect x="72" y="10" width="5" height="72" fill="${glow}" opacity=".7"/><rect x="66" y="10" width="20" height="5" fill="${glow}" opacity=".7"/>`;
  if (form === "imp") return `<rect x="27" y="28" width="38" height="40" fill="${body}"/><rect x="34" y="17" width="8" height="18" fill="${body}"/><rect x="52" y="17" width="8" height="18" fill="${body}"/><rect x="34" y="39" width="7" height="7" fill="${glow}"/><rect x="52" y="39" width="7" height="7" fill="${glow}"/><rect x="20" y="63" width="15" height="12" fill="${body}"/><rect x="59" y="63" width="15" height="12" fill="${body}"/>`;
  if (form === "ghost" || form === "shade") return `<rect x="28" y="18" width="36" height="42" fill="${body}"/><rect x="20" y="42" width="52" height="30" fill="${body}"/><rect x="20" y="68" width="12" height="14" fill="${body}"/><rect x="40" y="68" width="12" height="14" fill="${body}"/><rect x="60" y="68" width="12" height="14" fill="${body}"/><rect x="35" y="33" width="7" height="7" fill="${glow}"/><rect x="51" y="33" width="7" height="7" fill="${glow}"/>`;
  return `<rect x="30" y="14" width="32" height="25" fill="${body}"/><rect x="22" y="38" width="48" height="34" fill="${body}"/><rect x="18" y="45" width="10" height="25" fill="${glow}" opacity=".75"/><rect x="66" y="45" width="10" height="25" fill="${glow}" opacity=".75"/><rect x="29" y="70" width="14" height="13" fill="${body}"/><rect x="51" y="70" width="14" height="13" fill="${body}"/><rect x="37" y="24" width="7" height="6" fill="${glow}"/><rect x="50" y="24" width="7" height="6" fill="${glow}"/><rect x="39" y="47" width="16" height="12" fill="${glow}" opacity=".8"/>`;
}
