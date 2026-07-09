import { getState, setState, hasSave, resetState } from "./state.js";

const screens = {
  title: document.getElementById("screen-title"),
  chapterSelect: document.getElementById("screen-chapter-select"),
  options: document.getElementById("screen-options"),
};

export function initTitle({ onEnterChapter0 }) {
  const continueBtn = document.querySelector('[data-action="continue"]');
  continueBtn.disabled = !hasSave();

  document.getElementById("title-build").textContent = `build ${buildStamp()}`;

  document.getElementById("title-menu").addEventListener("click", (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    if (action === "new-game") {
      resetState();
      go("title", null);
      onEnterChapter0();
    } else if (action === "continue" && hasSave()) {
      go("title", null);
      onEnterChapter0();
    } else if (action === "chapter-select") {
      show(screens.chapterSelect);
    } else if (action === "options") {
      show(screens.options);
    }
  });

  document.querySelectorAll('[data-action="back-to-title"]').forEach((btn) => {
    btn.addEventListener("click", () => show(screens.title));
  });

  document.querySelectorAll(".chapter-card[data-chapter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const chapter = Number(btn.dataset.chapter);
      if (chapter === 0) {
        show(screens.title);
        onEnterChapter0();
      }
    });
  });

  document.getElementById("opt-text-speed").addEventListener("change", (e) => {
    setState({ textSpeed: e.target.value });
  });

  document.getElementById("opt-reset").addEventListener("click", () => {
    resetState();
    continueBtn.disabled = true;
  });

  document.querySelector('[data-action="quit-to-title"]').addEventListener("click", () => {
    document.getElementById("screen-room").classList.remove("active");
    show(screens.title);
    continueBtn.disabled = !hasSave();
  });
}

function go(hideKey) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
}

function show(screen) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screen.classList.add("active");
}

function buildStamp() {
  const d = new Date();
  return d.toISOString().slice(0, 16).replace("T", " ");
}
