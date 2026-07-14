import { isAdminMode } from "./admin.js";
import { startCampaignChapter, stopCampaignAtlas } from "./campaignAtlas.js";
import { startCampaignEncounter } from "./campaignAtlasEncounters.js";
import { startSortingSlimeArenaBattle } from "./slimeArenaBattle.js";
import { initTitle } from "./title.js";
import { initWorkshop } from "./workshopEditor.js";

function hideActiveScreens() {
  document.querySelectorAll(".screen.active").forEach((screen) => screen.classList.remove("active"));
}

function enterChapter(chapterIndex) {
  hideActiveScreens();
  document.getElementById("screen-campaign-atlas").classList.add("active");
  startCampaignChapter(chapterIndex, {
    onExitChapter: (nextChapter) => enterChapter(nextChapter),
    onEncounter: ({ interaction, onComplete }) => startCampaignEncounter({ interaction, onComplete }),
  });
}

const enterChapter0 = () => enterChapter(0);
const enterChapter1 = () => enterChapter(1);
const enterChapter2 = () => enterChapter(2);
const enterChapter3 = () => enterChapter(3);
const enterChapter4 = () => enterChapter(4);
const enterChapter5 = () => enterChapter(5);

function enterArcadeEncounter(encounter) {
  if (encounter !== "sorting-slime") return;
  startSortingSlimeArenaBattle({
    returnScreen: "screen-arcade-select",
    onWin: () => document.getElementById("screen-arcade-select").classList.add("active"),
  });
}

function enterWorkshop() {
  stopCampaignAtlas();
  hideActiveScreens();
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
  onEnterChapter5: enterChapter5,
  onEnterArcadeEncounter: enterArcadeEncounter,
  onEnterWorkshop: enterWorkshop,
});

document.querySelectorAll('[data-action="quit-to-title"]').forEach((button) => {
  button.addEventListener("click", () => stopCampaignAtlas());
});

const launchParams = new URLSearchParams(window.location.search);
const launchEncounter = launchParams.get("encounter");
const launchChapter = launchParams.get("chapter");

if (isAdminMode() && launchEncounter === "sorting-slime") {
  hideActiveScreens();
  startSortingSlimeArenaBattle({
    returnScreen: "screen-title",
    onWin: () => { document.body.dataset.slimeSmokeWin = "true"; },
  });
} else if (isAdminMode() && launchChapter !== null && Number.isInteger(Number(launchChapter))) {
  enterChapter(Number(launchChapter));
}

if (launchParams.get("workshop") === "1") enterWorkshop();
