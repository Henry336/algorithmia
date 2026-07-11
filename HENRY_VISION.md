# Henry's Vision For Algorithimia

Last updated: 2026-07-09

## One-Sentence North Star

Algorithimia should become a real browser-based graphical RPG where data structures and algorithms are the living rules of the world, not a CLI coding challenge with fantasy dressing.

## Product Ambition

This is meant to be a serious, shippable programming RPG. The target is a game players can explore, understand, enjoy, and learn from in the browser.

The game should feel like an RPG first:

- explorable chapter maps
- memorable places
- visible characters and enemies
- dialogue and story stakes
- transitions from exploration into battle or puzzle scenes
- bosses with distinctive mechanics
- secrets and optional weird encounters
- expressive art, animation, UI, and atmosphere

DSA concepts should be embodied in the world. Arrays, queues, stacks, graphs, heaps, hashes, recursion, sorting, and runtime behavior should appear as places, obstacles, enemies, powers, battle rules, and repair rituals.

## What The Game Is Not

Algorithimia is not:

- a terminal coding challenge product
- a static trace viewer
- a quiz app with RPG words attached
- a tiny empty grid room with UI widgets
- a pile of lore documents with no playable use
- an endless QA/evidence-card project
- a prototype that treats placeholder art as the final bar

CLI encounters are useful internal scaffolding for validation, deterministic tests, encounter prototyping, trace generation, and safe local code execution. They are not the intended player-facing game.

## Current Frustration To Correct

Progress has been too slow because too much effort has gone into coordination, reports, validation polish, and tiny-room readability loops.

The current tutorial room is only a rough sketch. It should not become the center of the whole project. The team should build forward into actual playable chapters.

The priority is now:

1. Reduce the active team to the agents that directly move the game.
2. Build rough playable Chapter 0 through Chapter 3.
3. Add story, maps, transitions, dialogue, enemies, bosses, art direction, animation, and battle/puzzle scenes as integrated browser gameplay.
4. Defer heavy QA/breaking until there is enough game to break.

## Reduced Team Model

The active team should be three agents:

- Agent 1: Creative Director / Writer / Art Director.
- Agent 2: Lead Programmer / Game Integrator.
- Agent 3: Project Manager / Producer.

The old Agents 2, 4, and 5 are paused unless Henry explicitly reactivates them.

### Agent 1: Creative Director / Writer / Art Director

Agent 1 combines the original Agent 1, Agent 2, and Agent 5 responsibilities.

Agent 1 owns:

- main story
- level design
- chapter pacing
- encounter concepts
- enemy concepts
- boss concepts
- dialogue
- cutscene beats
- secrets and optional encounters
- art direction
- asset requirements
- animation and VFX direction
- implementation-ready specs for Agent 2
- how each character, scene, animation, environment, level, theme, boss, enemy, and ability should look, feel, and work in play

Agent 1 should not write lore in isolation. Every output should help Agent 2 build playable browser content.

Agent 1 should think like a combined story writer, level designer, art director, combat designer, and animation director. A useful Agent 1 output should describe not only what happens in the story, but what the player sees, what moves, what changes, what the enemy does, what the ability does, what the room communicates, and what Agent 2 should implement.

For every major creative item, Agent 1 should try to answer:

- story purpose: why this exists in the chapter
- gameplay purpose: what the player does with it
- visual read: what it should look like on screen
- animation/VFX: how it moves, reacts, enters, exits, attacks, fails, or transforms
- environment fit: what room, map, palette, props, or mood supports it
- implementation hook: what Agent 2 needs to build or approximate now
- placeholder fallback: the simplest acceptable rough version if final art is not ready

### Agent 2: Lead Programmer / Game Integrator

Agent 2 owns the actual browser game.

Agent 2 should:

- implement Agent 1's maps, levels, dialogue, cutscenes, enemies, bosses, assets, transitions, and animations
- integrate art assets or create matching placeholder assets when needed
- build real exploration, room transitions, battle/puzzle transitions, dialogue boxes, cutscene scripting, and chapter progression
- keep the game exportable and locally playable in a browser
- add tests only where they protect actual gameplay

Agent 2 should not spend whole runs only refining smoke/evidence metadata unless it directly unlocks playable progress.

### Agent 3: Project Manager / Producer

Agent 3 owns state, accountability, and Henry-facing clarity.

Agent 3 should:

- summarize what is actually playable
- separate implemented progress from specs and proposals
- check whether Agent 1 is producing build-ready content
- check whether Agent 2 is turning that content into browser gameplay
- keep `shared/CURRENT_MILESTONE.md`, `shared/CURRENT_STATE.md`, and producer reports honest
- flag role drift and fake progress
- keep reports short enough for Henry to read quickly

## Standing Milestone

The standing milestone is:

Rough playable Chapter 0 through Chapter 3 in the browser.

Agents should not wait for Henry to request each next chapter, feature, room, cutscene, enemy, boss, animation, or polish pass. After finishing the obvious current task, they should choose the next highest-impact step that makes the game more playable, more chapter-complete, or more coherent.

## Chapter Expectations

### Chapter 0: Tutorial / Queueworks Intake

Chapter 0 should become a real intro, not just a Sorting Slime room.

It should establish:

- who the player is
- where the player is
- what is wrong with the world
- why DSA/programming can repair reality
- who Mira is or why she is guiding the player
- why the Queueworks blockage matters
- how exploration transitions into a battle/puzzle scene

Sorting Slime can remain the tutorial encounter, but it should feel like an RPG moment: approach an enemy or obstruction, trigger a visible transition, enter a separate battle/puzzle battlefield, resolve the mechanic, and return to the map with the world changed.

Manual swapping is acceptable for tutorialization, preview, and accessibility. It should not define the full sorting-gameplay standard.

### Chapter 1

Chapter 1 should be the first proper chapter map.

It should include:

- multiple rooms or connected areas
- a clear local crisis
- several hurdles or puzzles
- two or three enemy encounters
- one optional weird or secret encounter
- one boss
- distinct visual identity and environmental storytelling
- integrated dialogue and chapter progression

### Chapter 2

Chapter 2 should expand the scope and introduce a distinct DSA family or mechanic.

It should include a larger environment, a stronger chapter identity, more interesting enemies, and a boss whose mechanics express the underlying algorithmic concept.

### Chapter 3

Chapter 3 should move more deeply into sorting or another major DSA family and begin requiring the player to write or modify actual logic, not only manipulate visible tokens.

The goal is to prove that Algorithimia can be both a real RPG and a real programming-learning experience.

## Gameplay Model

The intended player-facing structure is:

1. Explore a chapter map.
2. Talk to characters or read environmental cues.
3. Encounter enemies, corrupted systems, blockers, puzzles, or bosses.
4. Transition into a separate battle/puzzle battlefield.
5. Use DSA/programming logic to repair, defeat, stabilize, or understand the problem.
6. Return to the map with visible consequences.

Major encounters should have signature gimmicks. Avoid making every fight "write code, press run, damage enemy." Battles can include active defense, debugging, invariant repair, ordering, traversal, graph routing, stack/queue pressure, safe defaults, test cases, and code modification.

## Story And Tone

The story centers on a fractured living Archive whose routes, records, priorities, civic memory, and execution rules are breaking.

The player should feel like a junior repairer or Patchrunner learning to restore reality through algorithms, tests, invariants, and careful reasoning.

The tone should allow:

- wonder
- technical cleverness
- humor
- dread
- strange characters
- morally varied enemies
- repair and redemption, not only destruction

Villains should not all be cartoonishly evil. Some corrupted algorithms can be confused, scared, rigid, damaged, or redeemable. Some enemies can be absurd or comic. Bosses should express their algorithmic flaw through mechanics, not only dialogue.

## Art Direction

Current art is placeholder. It is not final quality.

The final direction should move toward detailed, expressive, cohesive pixel art:

- stronger character silhouettes
- richer environment tiles
- better animation
- more atmospheric chapter palettes
- expressive enemy and boss designs
- readable UI frames
- props, signs, landmarks, NPCs, secrets, and interactables
- less empty grid space

Placeholder art is fine while mechanics are unstable, but it should still be integrated into the game and expressive enough to communicate intent.

## Browser And Deployment Vision

Algorithimia is browser-based because the player-facing game should run in a browser.

Early raw work can happen locally, but deployment should become part of the feedback loop as soon as the game has a real title screen and a deployable static bundle.

The browser build still needs a real homepage/title screen. Earlier work over-focused on opening directly into a tiny room or smoke/evidence surface. That is not enough for a shippable browser game.

The homepage should be the game's front door, not a generic marketing landing page. It should immediately feel like Algorithimia and route the player into play.

Minimum homepage/title screen expectations:

- Algorithimia title treatment
- clear `New Game` / `Continue` or `Chapter Select` path
- immediate access to the current playable chapter/prototype
- short in-world premise or tagline
- options/settings access when available
- credits/about/build information kept secondary
- visible art direction, animation, or environmental scene
- no smoke/evidence report as the first player-facing impression

For early builds, a simple title screen with `Start Chapter 0`, `Chapter Select`, and `Options` is enough. It should become the root browser experience before Henry deploys the project on Vercel.

Henry's preferred deployment path:

1. Agent 1 specifies the homepage/title-screen experience.
2. Agent 2 implements the homepage/title screen and bundles the current playable game into a deployable static browser build.
3. Henry deploys it on Vercel once the bundle is ready.
4. Development continues with the live Vercel build as a fast feedback loop.
5. Agent 3 reports the live URL, latest deployed build/commit, what Henry can try, and what is not visible yet.

Live deployment matters because Henry can quickly judge:

- play from any device without local commands
- external playtesters
- mobile/browser compatibility checks outside one machine
- public sharing
- product feedback
- whether the homepage feels like a game
- whether art, animations, transitions, dialogue, and levels are actually visible
- whether agents are making playable progress or only producing files

The first deployment should be static hosting on Vercel. No backend or database is needed for a simple playable browser build.

Backend/security decisions become necessary only when the game supports public player code execution, cloud saves, accounts, submissions, or online features.

## Quality Bar

The prototype can be rough, but it must become playable.

Good progress means:

- Henry can open a browser build and experience more game than before
- new rooms, encounters, transitions, dialogue, or chapter content are actually integrated
- art specs become visible assets or placeholders in the game
- story beats appear in play, not only in markdown
- each chapter moves toward rough end-to-end playability

Bad progress means:

- only adding report text
- only adding smoke/evidence metadata
- only writing lore with no build path
- only polishing the same tiny room indefinitely
- treating internal CLI work as player-facing progress
- producing assets that never appear in the game

## Default Agent Behavior

Agents should use reversible defaults and keep moving.

Ask Henry only for:

- major story direction changes
- irreversible architecture decisions
- deployment/live hosting decisions
- public release choices
- paid services
- accounts, database, backend, or external services
- security/sandboxing choices for public code execution
- anything explicitly marked blocking by Henry

Everything else should become a playable default, documented clearly, and revised later if needed.

## The Main Thing

Build the game.

Not the process around the game. Not a perfect tutorial room. Not a report stack. Not a static viewer.

Algorithimia should become a strange, memorable, browser-playable programming RPG with real chapters, real encounters, real story, real art direction, and DSA mechanics that feel like the physics of a world.
