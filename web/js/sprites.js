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

export const HEAP_WARDEN = {
  palette: {
    G: "#4a4a52", // stone plates
    D: "#33333a", // shadow seam
    O: "#e08a3f", // molten seam
    M: "#ff7a3f", // top ember (max node)
    L: "#c9522a", // lower embers
    K: "#1a1a1a", // eye slits
  },
  matrix: [
    "....MM....",
    "...MMMM...",
    "..GGGGGG..",
    ".GGGOGOGG.",
    "GGGGGGGGGG",
    "GKGGGGGGKG",
    "GLGGOGGLGG",
    ".GGGGGGGG.",
    ".GG....GG.",
    ".GG....GG.",
  ],
};

export const EMBER_SORTER = {
  palette: {
    G: "#4a4a52",
    O: "#e08a3f",
    L: "#c9522a",
    S: "#ffb066",
    K: "#1a1a1a",
  },
  matrix: [
    "..GGGG..",
    ".GOSSOG.",
    ".GLGGLG.",
    "GGGGGGGG",
    "GKGGGGKG",
    "GGGGGGGG",
    ".GG..GG.",
    ".GG..GG.",
  ],
};

export const DISPATCHER = {
  palette: {
    D: "#3a3f45", // desk
    B: "#25292e", // desk shadow
    U: "#242f3a", // uniform navy
    S: "#c98f5e", // skin
    H: "#6b6458", // thinning hair
    T: "#caa24a", // brass ticket badge
    G: "#3fae6a", // dim desk-lamp glow
    P: "#e8e6df", // paper ticket spool
  },
  matrix: [
    "...HHHH....",
    "..HSSSSS...",
    "..SSSSSS...",
    "..SEESEE...",
    "..SSSSSS...",
    "..USTUSU...",
    ".UUUUUUUU..",
    "PPDDDDDDDDP",
    "PPDBBBBBBDP",
    "..DBBGBBD..",
    "..DBBBBBD..",
    "..DDDDDDD..",
  ],
};

export const LINE_CUTTER = {
  palette: {
    K: "#2a2a30", // dark coat
    S: "#c98f5e",
    E: "#c9524f", // angry eyes
    R: "#c9524f", // stolen ticket red stripe
    P: "#e8e6df",
  },
  matrix: [
    "..KKKK..",
    ".KSSSSK.",
    ".KSEESK.",
    ".KSSSSK.",
    "KKKKKKKK",
    "KKPRKKKK",
    "KKKKKKKK",
    ".KK..KK.",
  ],
};

// Simple tile "icon" overlays drawn as small pixel glyphs on top of a floor tile.
export const LORD_BOGO = {
  palette: {
    P: "#8a4fc9", // purple coat
    Y: "#d8c24a", // gold coat
    S: "#c98f5e", // skin
    E: "#2a2016", // eyes
    W: "#f2f2f2", // ruff
    C: "#c9c9d0", // crown
    D: "#5a2fa0", // dark purple shadow
  },
  matrix: [
    "...CCC....",
    "..CCCCC...",
    "...WWW....",
    "..SSSSS...",
    "..SEESE...",
    "..SSSSS...",
    ".WPYPYPW..",
    "PPYPYPYPY.",
    "PPYPYPYPY.",
    "PDYDYDYDY.",
    ".PP...YY..",
    ".PP...YY..",
  ],
};

export const SHUFFLE_IMP = {
  palette: {
    P: "#8a4fc9",
    K: "#2a2a30",
    E: "#d8c24a",
  },
  matrix: [
    "..PPPP..",
    ".PKEEKP.",
    ".PPPPPP.",
    "PPKPPKPP",
    "PPPPPPPP",
    ".PP..PP.",
    ".P....P.",
  ],
};

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

export const QUEUE_RAIL_ICON = {
  palette: {
    R: "#4c6b7a",
    T: "#7fd8c9",
    D: "#26343d",
  },
  matrix: [
    "R......R",
    "RTTTTTTR",
    "R.DDDD.R",
    "R.TTTT.R",
    "R.DDDD.R",
    "RTTTTTTR",
    "R......R",
  ],
};

export const FURNACE_STACK_ICON = {
  palette: {
    S: "#4a4a52",
    D: "#2a2a30",
    O: "#e08a3f",
    F: "#ffb066",
  },
  matrix: [
    "..SSSS..",
    ".SDDDDS.",
    "SDOFFODS",
    "SDOFFODS",
    "SDOOOODS",
    ".SDDDDS.",
    "..SSSS..",
  ],
};

export const ARRAY_MARKER_ICON = {
  palette: {
    P: "#8a4fc9",
    T: "#7fd8c9",
    Y: "#d8c24a",
    D: "#2a2a30",
  },
  matrix: [
    "PPTTYY",
    "P.D.TY",
    "PPTTYY",
    "YYTTPP",
    "YTD.PP",
    "YYTTPP",
  ],
};

export const ARCHIVE_SHARD = {
  palette: {
    T: "#7fd8c9",
    W: "#eef2f0",
    B: "#3a6f8f",
    G: "#d8a04a",
  },
  matrix: [
    "...W...",
    "..WTW..",
    ".WTBTW.",
    "WTBTBTW",
    ".WTBTW.",
    "..WGW..",
    "...G...",
  ],
};
