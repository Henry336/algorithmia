import { getState, setState, hasSave, resetState } from "./state.js";

const screens = {
  title: document.getElementById("screen-title"),
  chapterSelect: document.getElementById("screen-chapter-select"),
  options: document.getElementById("screen-options"),
};

export function initTitle({ onEnterChapter0, onEnterChapter1, onEnterChapter2, onEnterChapter3 }) {
  const continueBtn = document.querySelector('[data-action="continue"]');
  continueBtn.disabled = !hasSave();

  document.getElementById("title-build").textContent = `build ${buildStamp()}`;

  function resumeFurthest() {
    const { queueworksGateOpen, dispatcherDefeated, heapWardenDefeated } = getState();
    hideAll();
    if (heapWardenDefeated) onEnterChapter3();
    else if (dispatcherDefeated) onEnterChapter2();
    else if (queueworksGateOpen) onEnterChapter1();
    else onEnterChapter0();
  }

  function refreshChapterCards() {
    const { queueworksGateOpen, dispatcherDefeated, heapWardenDefeated } = getState();
    const ch1Card = document.querySelector('.chapter-card[data-chapter="1"]');
    if (ch1Card) {
      ch1Card.disabled = !queueworksGateOpen;
      ch1Card.classList.toggle("locked", !queueworksGateOpen);
    }
    const ch2Card = document.querySelector('.chapter-card[data-chapter="2"]');
    if (ch2Card) {
      ch2Card.disabled = !dispatcherDefeated;
      ch2Card.classList.toggle("locked", !dispatcherDefeated);
    }
    const ch3Card = document.querySelector('.chapter-card[data-chapter="3"]');
    if (ch3Card) {
      ch3Card.disabled = !heapWardenDefeated;
      ch3Card.classList.toggle("locked", !heapWardenDefeated);
    }
  }
  refreshChapterCards();

  document.getElementById("title-menu").addEventListener("click", (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    if (action === "new-game") {
      resetState();
      hideAll();
      onEnterChapter0();
    } else if (action === "continue" && hasSave()) {
      resumeFurthest();
    } else if (action === "chapter-select") {
      refreshChapterCards();
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
      if (btn.disabled) return;
      const chapter = Number(btn.dataset.chapter);
      hideAll();
      if (chapter === 0) onEnterChapter0();
      else if (chapter === 1) onEnterChapter1();
      else if (chapter === 2) onEnterChapter2();
      else if (chapter === 3) onEnterChapter3();
    });
  });

  document.getElementById("opt-text-speed").addEventListener("change", (e) => {
    setState({ textSpeed: e.target.value });
  });

  document.getElementById("opt-reset").addEventListener("click", () => {
    resetState();
    continueBtn.disabled = true;
    refreshChapterCards();
  });

  document.querySelectorAll('[data-action="quit-to-title"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("screen-room").classList.remove("active");
      document.getElementById("screen-room-ch1").classList.remove("active");
      document.getElementById("screen-room-ch2").classList.remove("active");
      document.getElementById("screen-room-ch3").classList.remove("active");
      show(screens.title);
      continueBtn.disabled = !hasSave();
    });
  });
}

function show(screen) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screen.classList.add("active");
}

function hideAll() {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
}

function buildStamp() {
  const d = new Date();
  return d.toISOString().slice(0, 16).replace("T", " ");
}
