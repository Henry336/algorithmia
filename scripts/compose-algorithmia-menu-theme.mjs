import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const BAR_TICKS = 16;
const OUTPUT = resolve("music", "algorithmia-menu-theme.ultrabox.json");

function note(pitch, start, end, volume = 82) {
  return {
    pitches: Array.isArray(pitch) ? pitch : [pitch],
    points: [
      { tick: start, pitchBend: 0, volume },
      { tick: end, pitchBend: 0, volume },
    ],
  };
}

function chipInstrument(wave, volume) {
  return {
    type: "chip",
    volume,
    pan: 0,
    eqFilter: [],
    effects: [],
    fadeInSeconds: 0,
    fadeOutTicks: -3,
    wave,
    unison: "none",
    envelopes: [],
  };
}

function makeChannel(name, wave, volume, octaveScrollBar, bars) {
  if (bars.length !== 32) throw new Error(`${name} must contain exactly 32 bars.`);
  const patterns = [];
  const sequence = [];
  const knownPatterns = new Map();
  for (const notes of bars) {
    if (!notes.length) {
      sequence.push(0);
      continue;
    }
    const key = JSON.stringify(notes);
    let patternNumber = knownPatterns.get(key);
    if (!patternNumber) {
      patterns.push({ notes });
      patternNumber = patterns.length;
      knownPatterns.set(key, patternNumber);
    }
    sequence.push(patternNumber);
  }
  return {
    type: "pitch",
    name,
    octaveScrollBar,
    instruments: [chipInstrument(wave, volume)],
    patterns,
    sequence,
  };
}

const leadBars = [
  [note(62, 0, 4, 92), note(69, 4, 6, 88), note(65, 6, 8, 88), note(64, 8, 12, 86), note(65, 14, 16, 84)],
  [note(62, 0, 4, 90), note(61, 4, 6, 82), note(57, 6, 10, 84), note(60, 10, 12, 80), note(62, 12, 16, 88)],
  [note(67, 0, 4, 88), note(74, 4, 6, 86), note(70, 6, 8, 86), note(69, 8, 12, 84), note(70, 14, 16, 82)],
  [note(69, 0, 3, 88), note(64, 3, 6, 82), note(61, 6, 10, 84), note(64, 10, 12, 82), note(69, 12, 16, 88)],
  [note(62, 0, 3, 90), note(65, 3, 6, 86), note(69, 6, 10, 88), note(72, 10, 12, 86), note(69, 12, 16, 84)],
  [note(60, 0, 4, 84), note(64, 4, 7, 84), note(65, 7, 10, 86), note(69, 10, 12, 84), note(67, 12, 14, 82), note(64, 14, 16, 82)],
  [note(58, 0, 4, 84), note(62, 4, 6, 84), note(65, 6, 10, 86), note(69, 10, 13, 88), note(65, 13, 16, 82)],
  [note(64, 0, 3, 84), note(61, 3, 7, 86), note(62, 9, 11, 80), note(61, 11, 14, 84), note(57, 14, 16, 78)],

  [note(62, 0, 3, 94), note(69, 3, 5, 90), note(65, 5, 7, 88), note(64, 7, 10, 88), note(65, 10, 12, 86), note(69, 14, 16, 90)],
  [note(74, 0, 4, 92), note(73, 4, 6, 86), note(69, 6, 9, 88), note(72, 9, 12, 86), note(74, 12, 16, 92)],
  [note(67, 0, 3, 88), note(70, 3, 6, 88), note(74, 6, 8, 90), note(72, 8, 11, 86), note(70, 11, 14, 84), note(69, 14, 16, 84)],
  [note(69, 0, 2, 90), note(73, 2, 5, 90), note(76, 5, 8, 92), note(73, 8, 10, 86), note(71, 10, 12, 84), note(69, 12, 16, 88)],
  [note(65, 0, 4, 88), note(69, 4, 6, 88), note(72, 6, 9, 90), note(77, 9, 12, 94), note(76, 12, 14, 90), note(72, 14, 16, 86)],
  [note(64, 0, 3, 86), note(67, 3, 6, 86), note(72, 6, 8, 90), note(79, 8, 11, 96), note(76, 11, 13, 90), note(72, 13, 16, 88)],
  [note(70, 0, 4, 88), note(69, 4, 6, 86), note(65, 6, 9, 86), note(62, 9, 12, 84), note(65, 12, 14, 84), note(70, 14, 16, 88)],
  [note(69, 0, 4, 90), note(64, 4, 6, 84), note(61, 6, 10, 88), note(64, 10, 12, 86), note(73, 12, 14, 90), note(69, 14, 16, 86)],

  [note(62, 0, 4, 88), note(69, 4, 6, 84), note(65, 6, 8, 82), note(63, 8, 12, 84), note(66, 14, 16, 80)],
  [note(62, 0, 3, 86), note(61, 3, 6, 82), note(56, 6, 10, 78), note(60, 10, 12, 80), note(63, 12, 16, 84)],
  [note(63, 0, 4, 86), note(70, 4, 6, 84), note(66, 6, 8, 84), note(65, 8, 12, 82), note(68, 14, 16, 82)],
  [note(69, 0, 3, 86), note(63, 3, 6, 82), note(61, 6, 10, 84), note(59, 10, 12, 78), note(63, 12, 16, 82)],
  [note(62, 0, 4, 90), note(69, 4, 7, 86), note(62, 9, 12, 84), note(65, 12, 16, 86)],
  [note(61, 0, 2, 82), note(62, 2, 4, 84), note(63, 4, 6, 84), note(64, 6, 8, 86), note(69, 10, 12, 86), note(58, 14, 16, 78)],
  [note(58, 0, 4, 84), note(62, 4, 7, 84), note(65, 7, 10, 86), note(68, 10, 12, 84), note(65, 12, 16, 82)],
  [note(64, 0, 3, 84), note(61, 3, 6, 86), note(62, 6, 8, 82), note(61, 8, 11, 84), note(57, 11, 14, 80), note(58, 14, 16, 80)],

  [note(62, 0, 4, 92), note(69, 4, 6, 88), note(65, 6, 8, 88), note(64, 8, 12, 86), note(65, 14, 16, 84)],
  [note(62, 0, 4, 90), note(61, 4, 6, 82), note(57, 6, 10, 84), note(60, 10, 12, 80), note(62, 12, 16, 88)],
  [note(67, 0, 4, 88), note(74, 4, 6, 86), note(70, 6, 8, 86), note(69, 8, 12, 84), note(70, 14, 16, 82)],
  [note(69, 0, 3, 88), note(64, 3, 6, 82), note(62, 6, 9, 84), note(64, 9, 12, 84), note(69, 12, 16, 88)],
  [note(65, 0, 3, 90), note(69, 3, 6, 88), note(74, 6, 10, 94), note(72, 10, 12, 88), note(69, 12, 16, 86)],
  [note(67, 0, 3, 86), note(70, 3, 6, 88), note(74, 6, 9, 90), note(70, 9, 12, 86), note(67, 12, 16, 84)],
  [note(58, 0, 3, 84), note(62, 3, 6, 86), note(65, 6, 9, 88), note(69, 9, 12, 90), note(67, 12, 14, 84), note(65, 14, 16, 84)],
  [note(61, 0, 4, 88), note(64, 4, 8, 86), note(69, 8, 14, 90), note(57, 14, 16, 76)],
];

const echoBars = Array.from({ length: 32 }, () => []);
echoBars[6] = [note(74, 8, 12, 48), note(72, 12, 16, 44)];
echoBars[7] = [note(69, 10, 14, 46)];
echoBars[8] = [note(77, 8, 12, 56), note(76, 12, 16, 52)];
echoBars[9] = [note(69, 0, 4, 50), note(72, 8, 12, 52)];
echoBars[10] = [note(74, 8, 12, 54), note(70, 12, 16, 50)];
echoBars[11] = [note(76, 0, 4, 54), note(73, 8, 12, 52)];
echoBars[12] = [note(72, 4, 8, 52), note(69, 12, 16, 48)];
echoBars[13] = [note(79, 0, 4, 58), note(76, 8, 12, 54)];
echoBars[14] = [note(77, 4, 8, 52), note(74, 12, 16, 50)];
echoBars[15] = [note(73, 0, 4, 54), note(76, 8, 12, 52)];
echoBars[16] = [note(74, 10, 13, 44), note(75, 14, 16, 38)];
echoBars[17] = [note(68, 2, 5, 40), note(75, 11, 14, 44)];
echoBars[18] = [note(78, 8, 10, 42), note(77, 13, 16, 46)];
echoBars[19] = [note(75, 1, 4, 42), note(71, 10, 13, 38)];
echoBars[20] = [note(74, 8, 12, 48)];
echoBars[21] = [note(70, 0, 2, 40), note(75, 6, 8, 42), note(76, 12, 14, 44)];
echoBars[22] = [note(77, 4, 8, 46), note(80, 12, 14, 38)];
echoBars[23] = [note(70, 2, 5, 42), note(73, 10, 14, 48)];
echoBars[24] = [note(77, 10, 14, 48)];
echoBars[25] = [note(69, 4, 8, 44), note(72, 12, 16, 48)];
echoBars[26] = [note(74, 8, 12, 50), note(70, 12, 16, 46)];
echoBars[27] = [note(76, 4, 8, 48), note(73, 12, 16, 46)];
echoBars[28] = [note(77, 8, 12, 54), note(76, 12, 16, 50)];
echoBars[29] = [note(74, 4, 8, 50), note(70, 12, 16, 46)];
echoBars[30] = [note(72, 8, 12, 48), note(70, 12, 16, 44)];
echoBars[31] = [note(73, 4, 8, 48), note(76, 8, 12, 46)];

const chords = [
  [50, 53, 57], [46, 50, 53, 57], [43, 46, 50, 57], [45, 52, 55, 61],
  [50, 53, 57, 64], [48, 53, 57, 60], [46, 50, 53, 57], [45, 52, 55, 61],
  [50, 53, 57], [46, 50, 53, 57], [43, 46, 50, 57], [45, 52, 55, 61],
  [53, 57, 60], [52, 55, 60, 64], [46, 50, 53, 57], [45, 52, 55, 61],
  [45, 50, 53, 57], [51, 55, 58, 62], [46, 49, 53], [45, 48, 51, 54],
  [50, 53, 57], [49, 52, 55, 58], [46, 50, 53, 57], [45, 49, 52, 55, 58],
  [50, 53, 57], [46, 50, 53, 57], [43, 46, 50, 57], [45, 50, 52, 57],
  [53, 57, 60], [43, 46, 50], [46, 50, 53, 57], [45, 52, 55, 61],
];

const bassRoots = [
  38, 34, 31, 33, 38, 36, 34, 33,
  38, 34, 31, 33, 41, 40, 34, 33,
  33, 39, 34, 33, 38, 37, 34, 33,
  38, 34, 31, 33, 41, 31, 34, 33,
];

function arpeggioBar(chord, barIndex) {
  const tones = chord.map((pitch) => pitch + 12);
  const order = barIndex >= 16 && barIndex < 24
    ? [0, 2 % tones.length, 1, tones.length - 1, 1, 0, tones.length - 1, 2 % tones.length]
    : [0, 1, 2 % tones.length, 1, 0, 1, tones.length - 1, 1];
  return order.map((toneIndex, step) => note(tones[toneIndex], step * 2, (step * 2) + 2, step % 4 === 0 ? 58 : 48));
}

function bassBar(root, barIndex) {
  const finalSection = barIndex >= 24;
  return [
    note(root, 0, 7, finalSection ? 74 : 68),
    note(root + 7, 8, 11, 62),
    note(root + 12, 12, 16, finalSection ? 70 : 64),
  ];
}

function clockBar(root, barIndex) {
  const notes = [
    note(root + 24, 0, 1, 40),
    note(root + 31, 8, 9, 34),
  ];
  if (barIndex % 2 === 1) notes.push(note(root + 36, 12, 13, 30));
  if (barIndex >= 16 && barIndex < 24) {
    notes.push(note(root + 30, 5, 6, 32));
    notes.push(note(root + 25, 14, 15, 34));
  }
  if ([7, 15, 23, 31].includes(barIndex)) notes.push(note(61, 15, 16, 38));
  return notes;
}

const arpeggioBars = chords.map(arpeggioBar);
const padBars = chords.map((chord, index) => [note(chord, 0, BAR_TICKS, index >= 16 && index < 24 ? 38 : 44)]);
const bassBars = bassRoots.map(bassBar);
const clockBars = bassRoots.map(clockBar);

const song = {
  name: "Algorithmia - A Memory Without Address",
  format: "UltraBox",
  version: 5,
  scale: "Free",
  key: "D",
  introBars: 0,
  loopBars: 32,
  beatsPerBar: 4,
  ticksPerBeat: 4,
  beatsPerMinute: 84,
  layeredInstruments: false,
  patternInstruments: false,
  channels: [
    makeChannel("Archive Bell Lead", "square", -10, 4, leadBars),
    makeChannel("Memory Echo", "triangle", -17, 5, echoBars),
    makeChannel("Clockwork Arpeggio", "triangle", -18, 4, arpeggioBars),
    makeChannel("Citadel Pad", "triangle", -23, 3, padBars),
    makeChannel("Source Bass", "triangle", -14, 2, bassBars),
    makeChannel("Null Clock", "square", -25, 3, clockBars),
  ],
};

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(song, null, 2)}\n`, "utf8");
console.log(`Wrote ${OUTPUT}`);
