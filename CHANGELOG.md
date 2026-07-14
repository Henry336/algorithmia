# Changelog

Significant player-facing and developer-facing changes are recorded here. Detailed prototype history remains available in Git.

## Unreleased

### Campaign Overhaul

- Replaced the six separate rectangular chapter implementations with one full-screen Phaser campaign atlas built from shared region, corridor, blocker, gate, and foreground-occluder geometry.
- Reauthored Chapters 0-5 as distinct connected spaces: Queueworks Verge wetlands, Dispatch Meridian's suspended infrastructure, Heaplight Caldera's volcanic foundry, the floating Array Plains, fractured Graphreach, and the Citadel of Boundaries.
- Added camera-led continuous exploration, precise four-point foot collision, backtracking, moving patrols, responsive touch controls, and foreground arches and tunnels that correctly hide Patchrunner as he passes underneath.
- Added chapter-specific animated water, grass, trees, flames, machinery, route motes, Source rings, and increasingly invasive Null Rot.
- Added new NPCs, optional lore, empty decorative branches, hidden fourth-wall dialogue, relay and dial puzzles, persistent collectibles, mini-bosses, enemies, bosses, and chapter progression requirements.
- Added a concealed Graphreach secret route that opens near the entrance only after all three Archive diamonds are recovered.
- Integrated the supplied Patchrunner, Mira Vale, Sorting Slime, Bogolord, and Recursive Husk art alongside the approved high-detail Dispatcher asset; all field characters now idle, patrol, pulse, or flicker as appropriate.
- Connected every campaign encounter through one return-aware bridge, preserving dedicated Sorting Slime and Bogolord battles while giving minor enemies and later bosses varied Python tasks and progression-safe rewards.
- Added a browser campaign smoke that renders all six worlds at desktop size, flood-fills every authored destination, audits blockers and gates, exercises puzzles and concealed routes, checks animation and viewport usage, and verifies mobile framing.
- Added owner and architecture documentation for editing world geometry, art, collision, interactions, encounters, and route tests without extending the retired chapter renderers.

### Interface

- Rebuilt the title screen around an original full-bleed pixel-art mural of Algorithmia's world, replaced the smooth text heading with a custom-rendered block-pixel logo, removed the floating character lineup, and kept its navigation deliberately pointer-first.
- Added independent persistent Music and Sound Effects toggles to Options and wired them directly into the shared audio engine.
- Added custom stepped pixel cursors for the title mural and its interactive controls while preserving native cursor behavior throughout gameplay and code editors.

### Developer Experience

- Replaced the Chapter 4 rectangular grid presentation with a Phaser exploration scene over the new Graphreach environment map, including continuous movement, camera tracking, authored collision corridors, interactable landmarks, mobile controls, ambient water/grass/Null effects, a collision debug overlay, and browser reachability coverage.
- Added Chapter 5 as an LDtk import test that fetches a deployed `.ldtk` file, renders its collision grid and entities, supports simple items, keyed doors, buttons, secret walls, room transitions, and has a dedicated browser smoke.
- Added Workshop Mode as a visual level editor with map painting, entity placement, dialogue editing, battle preset editing, local browser draft saves, JSON import/export, and reachability validation.
- Added a Workshop browser smoke that verifies direct launch, painting, entity editing, battle metadata, local persistence, reload, and JSON export.
- Added an owner-focused project guide covering prerequisites, account access, file ownership, common edits, testing, deployment, rollback, and troubleshooting.
- Split Sorting Slime balance, hazard patterns, and repair content into focused modules so common changes do not require editing the full engine or controller.
- Replaced the hand-maintained JavaScript syntax-check list with automatic discovery and added `npm run verify:web` as the complete browser verification command.
- Pinned Node 20 through `.nvmrc` and updated architecture and migration documentation to match the live continuous-hazard combat flow.

### Combat

- Fixed campaign-launched Sorting Slime battles ignoring movement input while the exploration Phaser instance remained alive, and removed the admin fallback that had hidden this failure from browser verification.
- Gave Sorting Slime a dedicated Phaser animation controller with a breathing idle, jump-and-slam entrance, wave attack wind-up, shield recoil, core-damage reaction, repair stun, phase recompile, player-bump lunge, and defeat collapse. Animation states are exposed through the arena debug hook and covered by the browser smoke.
- Reduced phase-1 Sorting Slime column frequency while keeping column travel speed unchanged.
- Slowed phase-1 Sorting Slime columns by about 30% after playtesting showed speed was still too punishing for the first boss.
- Added Mira Vale guidance that tells beginners to repair the shielded slime before attacking and to strike once repairs weaken it.
- Added yellow orbiting stun stars above Sorting Slime while the Repair editor is open.
- Restored Sorting Slime to phase-specific music, removed the temporary deployed full-fight track, and trimmed the phase 1/2 and phase 3 WAVs to their 12.8-second musical loop so they no longer play 38 seconds of exported silence before looping.
- Added the temporary full-fight Sorting Slime track `Midnight Motorist Recreation` while the final phase-specific boss themes are being worked out.
- Switched Sorting Slime boss music to Web Audio buffer looping so phase 1/2 and phase 3 tracks can loop seamlessly until the active phase changes or the boss ends.
- Fixed phase-2 Merge Flood warning circles that could remain on screen after the command window cancelled their cleanup timer.
- Integrated Sorting Slime phase music, phase-3 music, and the shared hit sound for player, boss, and shield damage.
- Added a small browser audio helper so command sounds, hit effects, and looping encounter music use the same autoplay-safe behavior.
- Reframed all three Sorting Slime repairs as beginner code-completion exercises with most control flow prewritten, concrete input/output examples, and optional two-step conceptual and syntax hints.
- Reworked Guard into a visible five-second shield that halves incoming damage and cleanly bursts when it expires.
- Added a 100 HP Null shield to every Sorting Slime phase. Successful phase-specific repairs breach it; crossing a core-health threshold recompiles a fresh shield and new repair problem.
- Removed Repair's flat Attack bonus. Direct attacks now deal 5 core damage and launch Patchrunner back toward spawn, while unrepaired attacks only chip the Null shield.
- Made Sorting Slime hazards continuous until Patchrunner physically reaches the boss.
- Increased Insertion March frequency and made its repaired columns follow a readable `1-2-3-4-5-4-3` height sequence.
- Replaced later generic columns with Merge Flood's one-second pop fields and Overflow Spiral's radial rotating patterns, each gaining a distinct deterministic behavior after repair.
- Added a jump-and-slam entrance, animated shield formation and rupture effects, and cleaner boss-driven recoil.
- Extended the browser smoke to verify Guard timing, phase shield resets, repair breaches, all three Phaser attack patterns, and deployed battle audio assets.

## 0.2.0 - 2026-07-11

### Combat

- Added Phaser 3.90 as the real-time browser combat engine.
- Rebuilt Sorting Slime as a three-phase movement battle with collision damage, knockback, guarding, boss HP, defeat, retry, and admin completion.
- Made successful Python repairs reorganize attack formations.
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
