import { initTitle } from "./title.js";
import { initRoom } from "./room.js";

function enterChapter0() {
  document.getElementById("screen-room").classList.add("active");
  initRoom();
}

initTitle({ onEnterChapter0: enterChapter0 });
