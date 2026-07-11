# Changelog

Significant player-facing and developer-facing changes are recorded here. Detailed prototype history remains available in Git.

## Unreleased

- No unreleased changes yet.

## 0.2.0 - 2026-07-11

### Combat

- Added Phaser 3.90 as the real-time browser combat engine.
- Rebuilt Sorting Slime as a three-phase movement battle with collision damage, knockback, guarding, access windows, boss HP, defeat, retry, and admin completion.
- Made successful Python repairs reorganize attack formations and strengthen weak-point attacks.
- Added keyboard-first command selection for Attack, Use, Repair, and Guard.
- Added `ui-command-select.wav` feedback and restored pointer interaction only when the Repair editor opens.
- Added Tab, Shift+Tab, and normal Space behavior inside the Repair editor.
- Added a direct admin encounter route for Sorting Slime.

### Arcade and Campaign

- Added Arcade Mode to the title screen with a Sorting Slime encounter card.
- Connected the Queueworks campaign collision directly to the Phaser Sorting Slime encounter.
- Kept Arcade wins separate from campaign gate progression.
- Added admin level selection and encounter completion controls for rapid testing.

### World and Content

- Expanded Heaplight Foundry, Array Plains, and Graphreach into connected multi-room routes with backtracking, optional areas, puzzles, secrets, lore, and bosses.
- Added room reachability tests for required interactions and opened gates.
- Added moving enemies and more varied minor encounter styles.
- Added Null Rot environmental and narrative escalation across later regions.
- Added Recursive Husk and The Inner Copy as Graphreach mini-boss and secret-boss concepts.
- Integrated directional assets for Patchrunner, Mira, Sorting Slime, and Bogolord.
- Added the multi-phase Bogolord encounter with timed pressure, HP, editor corruption, visual instability, and real character art.

### Narrative

- Rebuilt the working canon around the protagonist, Null, Unbounded, Unbounded Null, memory loss, control, death, and the failed time reversal.
- Added a chronological story overview and preserved Henry's original vision document.
- Standardized new project-facing text on the name **Algorithmia**.

### Developer Experience

- Added npm build tooling that copies the pinned Phaser runtime into generated `web/vendor/` output.
- Added a browser smoke covering direct, campaign, and Arcade launch paths, keyboard commands, Repair input, Python execution, victory, and mobile fitting.
- Added explicit Phaser migration documentation.
- Added current onboarding, contribution, architecture, testing, and deployment documentation.
- Updated Vercel to install dependencies, build the vendor runtime, and publish `web/`.

## 0.1.0 - 2026-07-08

- Bootstrapped the legacy Python encounter and validation package.
- Added Sorting Slime and Triage Line deterministic contracts.
- Added constrained subprocess execution, timeout handling, sealed certification cases, and trace exports.
- Added the first static browser shell and Queueworks room prototype.
- Added the initial browser campaign, dialogue, save state, and DOM battle systems.
- Added Python unit tests and GitHub Actions coverage.
