import { initTitle } from "./title.js";
import { initRoom } from "./room.js";
import { initChapter1Room } from "./chapter1.js";

function enterChapter0() {
  document.getElementById("screen-room").classList.add("active");
  initRoom({ onExitToChapter1: enterChapter1 });
}

function enterChapter1() {
  document.getElementById("screen-room").classList.remove("active");
  document.getElementById("screen-room-ch1").classList.add("active");
  initChapter1Room();
}

initTitle({ onEnterChapter0: enterChapter0, onEnterChapter1: enterChapter1 });
