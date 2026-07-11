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
  if (defIndex === -1) throw new Error("Define Python function: def solve(values):");

  const defIndent = countIndent(lines[defIndex]);
  const bodyLines = [];
  for (let i = defIndex + 1; i < lines.length; i++) {
    const raw = withoutComment(lines[i]);
    if (!raw.trim()) continue;
    const indent = countIndent(raw);
    if (indent <= defIndent) break;
    bodyLines.push({ indent, text: raw.trim(), lineNo: i + 1 });
  }
  if (!bodyLines.length) throw new Error("Add an indented body under def solve(values):");

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
      if (args.length < 1 || args.length > 3) throw new Error("range() needs one, two, or three arguments near line " + item.lineNo);
      const start = args.length === 1 ? "0" : args[0];
      const end = args.length === 1 ? args[0] : args[1];
      const step = args.length === 3 ? args[2] : "1";
      declared.add(name);
      js.push("for (let " + name + " = " + start + "; " + name + " < " + end + "; " + name + " += " + step + ") {");
      js.push("__metrics.steps += 1; if (__metrics.steps > 15000) throw new Error('Too many loop steps. Check for runaway work.');");
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
      js.push("__metrics.steps += 1; if (__metrics.steps > 15000) throw new Error('Too many loop steps. Check for runaway work.');");
      stack.push(item.indent);
      continue;
    }

    match = line.match(/^return\\s+(.+)$/);
    if (match) {
      js.push("return { value: " + translateExpr(match[1]) + ", metrics: __metrics };");
      continue;
    }

    match = line.match(/^(.+\\[[^\\]]+\\])\\s*,\\s*(.+\\[[^\\]]+\\])\\s*=\\s*(.+\\[[^\\]]+\\])\\s*,\\s*(.+\\[[^\\]]+\\])$/);
    if (match) {
      const leftA = translateExpr(match[1]);
      const leftB = translateExpr(match[2]);
      const tempA = "__swapA" + swapTemp;
      const tempB = "__swapB" + swapTemp;
      swapTemp += 1;
      js.push("const " + tempA + " = " + translateExpr(match[3]) + ";");
      js.push("const " + tempB + " = " + translateExpr(match[4]) + ";");
      js.push("__metrics.writes += 2;");
      js.push(leftA + " = " + tempA + ";");
      js.push(leftB + " = " + tempB + ";");
      continue;
    }

    match = line.match(/^([A-Za-z_]\\w*)\\s*([+\\-])=\\s*(.+)$/);
    if (match) {
      if (!declared.has(match[1])) throw new Error("Unknown variable near line " + item.lineNo + ": " + match[1]);
      js.push("__metrics.assignments += 1;");
      js.push(match[1] + " " + match[2] + "= " + translateExpr(match[3]) + ";");
      continue;
    }

    match = line.match(/^([A-Za-z_]\\w*)\\s*=\\s*(.+)$/);
    if (match) {
      const name = match[1];
      const value = translateExpr(match[2]);
      js.push("__metrics.assignments += 1;");
      js.push((declared.has(name) ? "" : "let ") + name + " = " + value + ";");
      declared.add(name);
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

self.onmessage = (event) => {
  const { source, cases } = event.data;
  try {
    const solve = new Function(compilePythonSolve(source) + "\\nreturn solve;")();
    const results = cases.map((testCase) => {
      try {
        const output = solve(testCase.input.slice());
        return {
          name: testCase.name,
          sealed: Boolean(testCase.sealed),
          pass: JSON.stringify(output.value) === JSON.stringify(testCase.expected),
          metrics: output.metrics,
        };
      } catch (error) {
        return { name: testCase.name, sealed: Boolean(testCase.sealed), pass: false, error: String(error.message || error) };
      }
    });
    self.postMessage({ ok: true, results });
  } catch (error) {
    self.postMessage({ ok: false, error: "Could not read that Python: " + String(error.message || error) });
  }
};
`;

const WORKER_URL = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "application/javascript" }));

export async function runPythonRepair(source, cases, timeoutMs = 2400) {
  return new Promise((resolve) => {
    const worker = new Worker(WORKER_URL);
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      resolve(result);
    };
    const timer = window.setTimeout(() => finish({ ok: false, error: "Timed out. Check for an infinite loop." }), timeoutMs);
    worker.onmessage = (event) => {
      window.clearTimeout(timer);
      finish(event.data);
    };
    worker.onerror = (event) => {
      window.clearTimeout(timer);
      finish({ ok: false, error: event.message || "Repair worker failed." });
    };
    worker.postMessage({ source, cases });
  });
}

export function summarizeRepairMetrics(results) {
  return results.reduce((total, result) => {
    const metrics = result.metrics || {};
    total.steps += metrics.steps || 0;
    total.writes += metrics.writes || 0;
    total.assignments += metrics.assignments || 0;
    return total;
  }, { steps: 0, writes: 0, assignments: 0 });
}
