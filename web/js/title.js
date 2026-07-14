import { getState, setState, hasSave, resetState } from "./state.js";
import { isAdminMode, syncAdminModeFromUrl } from "./admin.js";
import { getAudioPreferences, playSound, setMusicMuted, setSoundMuted } from "./audio.js";
import { renderPixelLogo } from "./pixelLogo.js";

const screens = {
  title: document.getElementById("screen-title"),
  arcade: document.getElementById("screen-arcade-select"),
  chapterSelect: document.getElementById("screen-chapter-select"),
  options: document.getElementById("screen-options"),
  workshop: document.getElementById("screen-workshop"),
};

export function initTitle({ onEnterChapter0, onEnterChapter1, onEnterChapter2, onEnterChapter3, onEnterChapter4, onEnterChapter5, onEnterArcadeEncounter, onEnterWorkshop }) {
  syncAdminModeFromUrl();
  const continueBtn = document.querySelector('[data-action="continue"]');
  continueBtn.disabled = !hasSave();

  document.getElementById("title-build").textContent = isAdminMode() ? `build ${buildStamp()} - ADMIN MODE` : `build ${buildStamp()}`;
  renderPixelLogo(document.getElementById("title-logo-canvas"));
  initOptionControls();

  function resumeFurthest() {
    const { queueworksGateOpen, dispatcherDefeated, heapWardenDefeated, bogoDefeated, nullFerrymanDefeated } = getState();
    hideAll();
    if (nullFerrymanDefeated && onEnterChapter5) onEnterChapter5();
    else if (bogoDefeated) onEnterChapter4();
    else if (heapWardenDefeated) onEnterChapter3();
    else if (dispatcherDefeated) onEnterChapter2();
    else if (queueworksGateOpen) onEnterChapter1();
    else onEnterChapter0();
  }

  function refreshChapterCards() {
    const { queueworksGateOpen, dispatcherDefeated, heapWardenDefeated, bogoDefeated, nullFerrymanDefeated } = getState();
    const admin = isAdminMode();
    const ch1Card = document.querySelector('.chapter-card[data-chapter="1"]');
    if (ch1Card) {
      ch1Card.disabled = !admin && !queueworksGateOpen;
      ch1Card.classList.toggle("locked", !admin && !queueworksGateOpen);
    }
    const ch2Card = document.querySelector('.chapter-card[data-chapter="2"]');
    if (ch2Card) {
      ch2Card.disabled = !admin && !dispatcherDefeated;
      ch2Card.classList.toggle("locked", !admin && !dispatcherDefeated);
    }
    const ch3Card = document.querySelector('.chapter-card[data-chapter="3"]');
    if (ch3Card) {
      ch3Card.disabled = !admin && !heapWardenDefeated;
      ch3Card.classList.toggle("locked", !admin && !heapWardenDefeated);
    }
    const ch4Card = document.querySelector('.chapter-card[data-chapter="4"]');
    if (ch4Card) {
      ch4Card.disabled = !admin && !bogoDefeated;
      ch4Card.classList.toggle("locked", !admin && !bogoDefeated);
    }
    const ch5Card = document.querySelector('.chapter-card[data-chapter="5"]');
    if (ch5Card) {
      ch5Card.disabled = !admin && !nullFerrymanDefeated;
      ch5Card.classList.toggle("locked", !admin && !nullFerrymanDefeated);
    }
  }
  refreshChapterCards();

  document.getElementById("title-menu").addEventListener("click", (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    playSound("commandSelect", { volume: 0.35 });
    if (action === "new-game") {
      resetState();
      hideAll();
      onEnterChapter0();
    } else if (action === "continue" && hasSave()) {
      resumeFurthest();
    } else if (action === "arcade") {
      show(screens.arcade);
    } else if (action === "workshop") {
      if (onEnterWorkshop) onEnterWorkshop();
    } else if (action === "chapter-select") {
      refreshChapterCards();
      show(screens.chapterSelect);
    } else if (action === "options") {
      show(screens.options);
    }
  });

  document.querySelectorAll('[data-action="back-to-title"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      playSound("commandSelect", { volume: 0.35 });
      show(screens.title);
    });
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
      else if (chapter === 4) onEnterChapter4();
      else if (chapter === 5 && onEnterChapter5) onEnterChapter5();
    });
  });

  document.querySelectorAll("[data-arcade-encounter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (onEnterArcadeEncounter) onEnterArcadeEncounter(btn.dataset.arcadeEncounter);
    });
  });

  document.getElementById("opt-text-speed").addEventListener("change", (e) => {
    setState({ textSpeed: e.target.value });
    playSound("commandSelect", { volume: 0.3 });
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
      document.getElementById("screen-room-ch4").classList.remove("active");
      document.getElementById("screen-room-ch5").classList.remove("active");
      show(screens.title);
      continueBtn.disabled = !hasSave();
    });
  });

  function initOptionControls() {
    const musicToggle = document.getElementById("opt-music");
    const soundToggle = document.getElementById("opt-sound");
    const textSpeed = document.getElementById("opt-text-speed");
    const musicState = document.getElementById("opt-music-state");
    const soundState = document.getElementById("opt-sound-state");
    const preferences = getAudioPreferences();
    musicToggle.checked = !preferences.musicMuted;
    soundToggle.checked = !preferences.soundMuted;
    textSpeed.value = getState().textSpeed;

    function updateLabels() {
      musicState.textContent = musicToggle.checked ? "On" : "Off";
      soundState.textContent = soundToggle.checked ? "On" : "Off";
    }

    musicToggle.addEventListener("change", () => {
      setMusicMuted(!musicToggle.checked);
      updateLabels();
      playSound("commandSelect", { volume: 0.3 });
    });
    soundToggle.addEventListener("change", () => {
      setSoundMuted(!soundToggle.checked);
      updateLabels();
      if (soundToggle.checked) playSound("commandSelect", { volume: 0.3 });
    });
    updateLabels();
  }

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
