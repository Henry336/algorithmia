const box = document.getElementById("dialogue-box");
const speakerEl = document.getElementById("dialogue-speaker");
const textEl = document.getElementById("dialogue-text");

let queue = [];
let typing = null;
let onDoneCallback = null;
let inputLocked = false;

export function isDialogueActive() {
  return !box.classList.contains("hidden");
}

export function sayLines(lines, onDone) {
  queue = lines.slice();
  onDoneCallback = onDone || null;
  box.classList.remove("hidden");
  advance();
}

export function advance() {
  if (typing) {
    // finish current line instantly on advance-while-typing
    clearInterval(typing);
    typing = null;
    textEl.textContent = currentFullText;
    return;
  }
  if (queue.length === 0) {
    box.classList.add("hidden");
    const cb = onDoneCallback;
    onDoneCallback = null;
    if (cb) cb();
    return;
  }
  const line = queue.shift();
  speakerEl.textContent = line.speaker || "";
  typeLine(line.text);
}

let currentFullText = "";

function typeLine(text) {
  currentFullText = text;
  textEl.textContent = "";
  let i = 0;
  typing = setInterval(() => {
    textEl.textContent += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(typing);
      typing = null;
    }
  }, 18);
}

box.addEventListener("click", advance);

export function lockDialogueInput(locked) {
  inputLocked = locked;
}
