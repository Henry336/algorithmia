import { initTitle } from "./title.js";
import { initRoom } from "./room.js";
import { initChapter1Room } from "./chapter1.js";
import { initChapter2Room } from "./chapter2.js";
import { initChapter3Room } from "./chapter3.js";
import { initChapter4Room } from "./chapter4.js";
import { isAdminMode } from "./admin.js";
import { startSortingSlimeArenaBattle } from "./slimeArenaBattle.js";
import { initWorkshop } from "./workshopEditor.js";

function enterChapter0() {
  document.getElementById("screen-room").classList.add("active");
  initRoom({ onExitToChapter1: enterChapter1 });
}

function enterChapter1() {
  document.getElementById("screen-room").classList.remove("active");
  document.getElementById("screen-room-ch1").classList.add("active");
  initChapter1Room({ onExitToChapter2: enterChapter2 });
}

function enterChapter2() {
  document.getElementById("screen-room-ch1").classList.remove("active");
  document.getElementById("screen-room-ch2").classList.add("active");
  initChapter2Room({ onExitToChapter3: enterChapter3 });
}

function enterChapter3() {
  document.getElementById("screen-room-ch2").classList.remove("active");
  document.getElementById("screen-room-ch3").classList.add("active");
  initChapter3Room({ onExitToChapter4: enterChapter4 });
}

function enterChapter4() {
  document.getElementById("screen-room-ch3").classList.remove("active");
  document.getElementById("screen-room-ch4").classList.add("active");
  initChapter4Room({});
}

function enterArcadeEncounter(encounter) {
  if (encounter !== "sorting-slime") return;
  document.getElementById("screen-arcade-select").classList.remove("active");
  startSortingSlimeArenaBattle({
    onWin: () => {
      document.getElementById("screen-room").classList.remove("active");
      document.getElementById("screen-arcade-select").classList.add("active");
    },
  });
}

function enterWorkshop() {
  document.querySelectorAll(".screen.active").forEach((screen) => screen.classList.remove("active"));
  document.getElementById("screen-workshop").classList.add("active");
  initWorkshop({
    onExit: () => {
      document.getElementById("screen-workshop").classList.remove("active");
      document.getElementById("screen-title").classList.add("active");
    },
  });
}

initTitle({
  onEnterChapter0: enterChapter0,
  onEnterChapter1: enterChapter1,
  onEnterChapter2: enterChapter2,
  onEnterChapter3: enterChapter3,
  onEnterChapter4: enterChapter4,
  onEnterArcadeEncounter: enterArcadeEncounter,
  onEnterWorkshop: enterWorkshop,
});

const launchEncounter = new URLSearchParams(window.location.search).get("encounter");
if (isAdminMode() && launchEncounter === "sorting-slime") {
  document.querySelectorAll(".screen.active").forEach((screen) => screen.classList.remove("active"));
  startSortingSlimeArenaBattle({
    onWin: () => {
      document.body.dataset.slimeSmokeWin = "true";
    },
  });
}

if (new URLSearchParams(window.location.search).get("workshop") === "1") {
  enterWorkshop();
}
