# Algorithmia Audio Direction

This file captures practical music notes so prototype tracks can become reusable game ideas instead of one-off files.

## Sorting Slime Temporary Full-Fight Theme

Source file: `Midnight Motorist Recreation.wav`

Deployed copy: `web/assets/audio/music/slime-boss-midnight-motorist-recreation.wav`

Current use: temporary single looping track for the whole Sorting Slime boss fight. The original phase 1/2 and phase 3 tracks are still in the repo and can be restored later by changing `SLIME_BOSS_MUSIC` in `web/js/slimeArenaBattle.js`.

Observed structure from the mixed WAV:

- Duration: 128 seconds.
- Shape: two mirrored 64-second halves.
- Energy rises around 16 seconds and 80 seconds.
- Energy pulls back around 64 seconds before the second half restarts.
- Dominant pitch centers cluster around C, D#, G, and G#.

Reusable patterns:

- Fast square-wave drive: short repeated notes make the theme feel like motion instead of ambience.
- Dark minor-center vocabulary: C to D# movement gives an uneasy minor color; G and G# can be used as tension/landing points.
- Two-half arrangement: first half establishes the chase, second half repeats with enough energy to work as a boss loop.
- Temporary slime identity: frantic motor rhythm fits the current dodge-heavy battle while final slime-specific motifs are still being composed.

Ideas to reuse in final original themes:

- Keep a 16-step chug under the lead for movement pressure.
- Let phase 1/2 use the cleaner square-wave drive.
- Let phase 3 keep the same rhythm but add wrong notes, detuned doubles, or noisier percussion.
- Preserve the 64-second reset idea for longer boss arrangements, but keep exported game loops clean at their loop boundary.
