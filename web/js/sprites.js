// Hand-authored placeholder pixel matrices. Rough by design — replace the
// matrix/palette pairs (or swap applyPixelArt for an <img> setter) once real
// exported sprite sheets come back from art generation.

export const PIXEL_SIZE = 3;

export const PLAYER_DOWN = {
  palette: {
    H: "#5b3a24", // hair
    S: "#d8a97a", // skin
    E: "#2a2016", // eyes
    J: "#4c6b3a", // jacket (olive)
    T: "#7fae86", // patch teal accent
    P: "#2f4a73", // denim pants
    B: "#5a3c22", // boots
    G: "#bcbcc4", // goggle lens
  },
  matrix: [
    "..HHHHHH..",
    ".HHHHHHHH.",
    ".HGGGGGGH.",
    ".HSSSSSSH.",
    "..SEESEE..",
    "..SSSSSS..",
    ".JJJJJJJJ.",
    "JJJJJJJJJJ",
    "JJTJJJJTJJ",
    "JJJJJJJJJJ",
    ".JJJJJJJJ.",
    "..PPPPPP..",
    ".PPP..PPP.",
    ".PPP..PPP.",
    ".BBB..BBB.",
  ],
};

export const MIRA_DOWN = {
  palette: {
    H: "#c7b07a", // tied-back hair
    S: "#c98f5e", // skin
    E: "#2a2016",
    O: "#5a5f66", // overalls (gray)
    L: "#5a7a4a", // shirt
    A: "#caa24a", // amber goggles around neck
    P: "#3a3f45",
    B: "#4a3624",
  },
  matrix: [
    "...HHHH...",
    "..HHHHHH..",
    ".HSSSSSSH.",
    "..SEESEE..",
    "..SSSSSS..",
    "..AAAAAA..",
    ".LOOOOOOL.",
    "OOOOOOOOOO",
    "OOOOOOOOOO",
    "OOOOOOOOOO",
    ".OOOOOOOO.",
    "..PPPPPP..",
    ".PPP..PPP.",
    ".PPP..PPP.",
    ".BBB..BBB.",
  ],
};

export const SORTING_SLIME = {
  palette: {
    G: "#5fbf5f",
    D: "#3f9a4a",
    R: "#c94f4f",
    U: "#4f7fc9",
    Y: "#d8c24a",
    P: "#8a4fc9",
    W: "#f2f2f2",
    K: "#1a1a1a",
  },
  matrix: [
    "..DGGGGGGD..",
    ".GGGGGGGGGG.",
    "GGGGGGGGGGGG",
    "GGRGUGYGPGGG",
    "GGRGUGYGPGGG",
    "GGRGUGYGPGGG",
    "GGWGGGGGWGGG",
    "GGKGGGGGKGGG",
    "GGGGGGGGGGGG",
    ".GGGGGGGGGG.",
    "..DGGGGGGD..",
  ],
};

export const MIRA_PORTRAIT = MIRA_DOWN;
export const PLAYER_PORTRAIT = PLAYER_DOWN;

// Simple tile "icon" overlays drawn as small pixel glyphs on top of a floor tile.
export const GATE_ICON = {
  palette: { M: "#8a6a3a", D: "#4a3620", L: "#d8b26a" },
  matrix: [
    "MMMMMMMM",
    "MDDDDDDM",
    "MDLLLLDM",
    "MDLDDLDM",
    "MDLDDLDM",
    "MDLLLLDM",
    "MDDDDDDM",
    "MMMMMMMM",
  ],
};

export const LEDGER_ICON = {
  palette: { C: "#7a5a3a", L: "#c9a86a" },
  matrix: [
    "CCCCCC",
    "CLLLLC",
    "CLLLLC",
    "CCCCCC",
    "CLLLLC",
    "CCCCCC",
  ],
};
