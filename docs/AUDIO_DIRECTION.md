# Algorithmia Audio Direction

This file captures practical music notes so prototype tracks can become reusable game ideas instead of one-off files.

## Sorting Slime Temporary Full-Fight Theme

Source file: `Midnight Motorist Recreation.wav`

Current use: reference only. This was briefly used as a temporary full-fight Sorting Slime track, then removed from deployed assets when the boss returned to phase-specific music.

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

## Sorting Slime Phase Loop Cleanup

The original `slime-boss-phase-1-2.wav` and `slime-boss-phase-3.wav` exports were 51.2 seconds long, but only the first 12.8 seconds contained the intended loop. The remaining 38.4 seconds came from empty UltraBox pattern slots and exported as silence.

The deployed phase files are now trimmed to 12.8 seconds so Web Audio loops the musical phrase immediately. When exporting from UltraBox, make sure unused timeline boxes are not included in the export unless silence is intentional.
