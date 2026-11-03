# Party Studio — visual upgrade proposal

4 November 2026. **Approved and implemented in the following task.** The audit and concept below record the original proposal. Current behavior: [design specification](./design-spec.md); completed checks: [verification](./evidence/verification.md#party-studio--4-november-2026). Game rules and saved-data format remain unchanged.

Recommendation: a cohesive mobile game presentation using white surfaces, cool gray framing, blue actions, expressive animal stages, and action-specific motion. Keep the existing engine and React/Motion/Three.js stack.

## Audit

Read `HANDOFF.md`, design/technical/game-rule specifications, asset/localization plans, implementation/event/reel plans, and current components. Compared the approved board with fresh production-build captures. Inspected normal-motion screens; ran the complete existing test suite.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run validate:content` | Passed: five Indonesian namespaces; **400** word triples |
| `npm test` | **54 passed**, five files |
| `npm run build` | Passed; PWA generated, 29 precache entries, 1,907.40 KiB |
| `npm run test:browser` | **39 passed**, ten files; 1.6 minutes |
| Additional visual inspection | Eight current-state captures; normal-motion Chrome, touch emulation, 390×844 |
| Concept checks | Six screens × 320/390/736px widths; no horizontal overflow; hold/release, blur conceal, vote confirmation, overlay cleanup, OS reduced motion passed |

Build printed two nonblocking Zod dependency annotation warnings. Browser runner printed `NO_COLOR`/`FORCE_COLOR` warnings. Initial sandboxed browser-server startup stalled; the completed browser suite and visual audit ran outside the sandbox.

Existing browser coverage includes small/short phones, long words, 20 players, interrupted secrets, role effects, committed tie outcomes, offline/reload/rematch, installation/audio, and updates. Most tests default to reduced motion; separate existing tests exercise normal-motion avatars, event wings, and the reel. These checks do **not** establish phone GPU performance, battery usage, or iOS Safari behavior.

## Findings and priorities

These are presentation/interaction opportunities, not newly discovered game-rule failures.

| Priority | Current evidence | Proposed improvement |
| --- | --- | --- |
| First | At 390×844, default roles occupy **1,326px**; all roles/options **1,722px**. “Lanjut” starts at y=1,184 / 1,580. [Captures](./evidence/visual-audit-2026-11-04/current-roles-390.png). [Setup](../src/screens/Setup.tsx). | Compact role rows, short inline summaries, switch controls, a count stepper, and contextual options. Put complete rule explanations behind optional details. Keep validation adjacent and the primary action reachable. |
| First | A 20-player roster occupies **1,687px**; “Lanjut” starts at y=1,540. Footer uses `margin-top:auto`, without sticky positioning. [Capture](./evidence/visual-audit-2026-11-04/current-roster-20-390.png). [Styles](../src/styles.css). | A safe-area-aware bottom action dock. Compact rows for larger groups; reduce decorative stage height before shrinking names or controls. Reserve content padding so the last player remains reachable. |
| First | Every setup step/match revision gets the same 180ms opacity/y entrance; the screen is keyed by revision and scrolling resets. [App, lines 101–152](../src/App.tsx#L101). | Stable app shell; directional setup transitions; localized speaker/card changes; sheets for short edits. Preserve scroll within a screen; reset deliberately on a new public/private stage. |
| First | The first action choice is solid blue even when neither choice is selected. The confirm button is absent until selection. [Match, lines 215–255](../src/screens/Match.tsx#L215). | Equal neutral choices initially. Selection supplies the blue border, check, and brief spring. Reserve a visible disabled confirmation action from the start. Keep select → confirm. |
| Next | Repeated gradients, outlined panels, heavy text weights, and raised secondary buttons give many elements similar emphasis. [Styles](../src/styles.css). | Three surface levels: page, card, overlay. Depth concentrates on characters and primary controls; secondary actions become quiet. Use fewer heavy headings and clearer spacing. |
| Next | Event scenes replace the entire shell with green, purple, orange, pink, or red; primary buttons also change appearance. [Event CSS, lines 25–44](../src/components/events.css#L25). | White/blue/gray shell throughout. Put role imagery and any small secondary color accents inside the event stage. Keep the primary action blue and consistently positioned. |
| Next | Event particles, halos, wings, and emblems contain continuous loops. Routine gameplay has comparatively little choreography. [Events](../src/components/EventScene.tsx), [CSS](../src/components/events.css). | More feedback across everyday actions; stronger, finite bursts for important events. Settle to a calm readable state. Profile before increasing particle counts or effects. |
| Preserve | Ten recognizable avatars, one shared demand-rendered canvas, DPR cap, static previews, offscreen/hidden pausing, reduced motion. [LiveAnimal](../src/avatars/LiveAnimal.tsx). | Reuse these assets and constraints. Add selection/turn reactions; refine framing and lighting consistently. Lists remain inexpensive. |

Measurements: [JSON](./evidence/visual-audit-2026-11-04/measurements.json). Current UI has no horizontal overflow in these captures. Below-fold actions remain scroll-reachable; the concern is effort and continuity.

## Recommended direction: Party Studio

Think of each game phase as a small stage inside the same app. Characters supply personality; restrained surfaces make the current player, instruction, and next action easy to spot.

- **Palette:** white `#FFFFFF`, page gray `#F4F7FB`, pale blue `#EAF2FF`, primary blue `#0875FF`, deep blue `#0754DC`, ink `#17233C`, secondary text `#60718A`. Natural animal colors remain. Special-event color must not replace the dominant palette.
- **Type:** retain self-hosted Nunito; 28–34px main headings, 16–18px essential body/actions, 13–14px secondary labels. Verify contrast on the actual surface and large-text wrapping.
- **Shape:** 20–24px cards, 16–20px controls, consistent 4/8/12/16/24px spacing. One ambient shadow family; stronger depth only where touch or scene hierarchy benefits.
- **Layout:** compact top bar, readable content stage, stable bottom action zone. Touch targets at least 44px; primary actions around 56px. At short heights, collapse art before useful content. Avoid extra navigation tabs during play.

### Screen ideas

| Screen | Layout and interaction | Motion/effects |
| --- | --- | --- |
| Home | Featured mascot, one start/resume action, quiet access to guide/rules/settings. Offline/install status stays secondary. | Brief mascot greeting and staged entrance; no mandatory splash or new onboarding. |
| Players | Small character stage, compact name/avatar tiles, player count, add action, reachable Next. Editing opens one name/avatar sheet. At 9+ players, prefer compact rows and a smaller stage. | Tile press, selected-ring spring, insertion/removal movement; featured avatar reacts. No 20-canvas grid. |
| Roles | Composition summary, count stepper, concise role rows, switches. Show White/Fool suboptions only when relevant; retain every existing independent option. | Switch-thumb movement, small emblem reaction, expanding contextual options with stable scroll/focus. |
| Words / timers | Keep the four clickable setup steps. Use clear category/difficulty/source selections, optional timer choices, available-word count, and an accurate final summary. | Blue selection indicators and short option transitions; no extra review gate. |
| Private handoff / secret | Name first, centered animal, reserved secret-card space. “Saya Adit, siap” precedes hold-to-reveal. Release closes the card immediately. | Decorative seal/ring response while holding; secret text mounts/unmounts instantly. Animate the empty card shell only. |
| Clues / discussion | Dominant speaker name/avatar, short instruction, public turn progress, optional countdown ring, bottom Next. Keep private reminders available. | Speaker stage changes with a short slide/settle; timer progresses quietly. No microphone-like affordance or recording implication. |
| Action / target vote | Explicit current voter, neutral choices or named target tiles, clear selected check, stable Confirm. Never expose totals. | Selection spring; after confirmation, clear the choice and show the next named handoff immediately. No added “vote saved” confirmation tap. |
| Events / tie reel | Blue/gray stage, role emblem and affected player, concise cause/next effect. Keep existing skip and acknowledgement controls. | Event-specific entrance, restrained impact, finite sparks/hearts/confetti. Retain committed reel result, 6.6s default sequence, and skip behavior. |
| Results | Victory stage, all existing word/role disclosures, score rows, direct rematch. Keep every player's score and role accessible. | One short celebration, winner highlights, cosmetic +1/count animation ending at the already committed score. Never award on animation completion. |

The setup sequence remains **Pemain → Peran → Kata → Waktu**. Existing direct-step navigation already supports skipping unchanged settings; make that clearer rather than introducing a new mode or start flow. Rematch remains one action. Sheets replace short editing screens without adding save steps; preserve drafts and validation.

### Motion language

Proposed timings are design targets, not measured performance results.

| Interaction | Target | Reduced motion |
| --- | --- | --- |
| Press/release | 80–120ms; compress to approximately 0.97, then settle | Immediate pressed-state change |
| Selection/switch | 140–220ms; small controlled spring, no moving tap target | Immediate check/fill |
| Public screen/turn | 220–280ms; short directional movement, shared shell stays | Immediate replacement or brief opacity only |
| Edit/settings sheet | 240–320ms; short upward entrance, opaque surface | Immediate open/close |
| Public event | 350–650ms entrance; optional particles settle within 1.2–1.8s | Static emblem, full text, immediate controls |
| Secret conceal | **Immediate**, including release/cancel/blur/background/navigation | Same |

Do not stack every effect on every tap. Sequence attention: character → instruction → action. Keep existing music/effect preferences and pauses during spoken phases; optional feedback should be brief. Animation cannot delay an essential action or commit game state.

## Implementation boundaries for a later task

1. **Foundation:** tokens, action dock, stable public shell, hierarchy, neutral ballot selection. Verify long lists, keyboard, safe areas, and short screens first.
2. **Core journey:** lobby/edit sheet, role controls, word/timer styling, private card, speaker/timer stage. Preserve the existing four-step setup and all options.
3. **Choreography:** reusable Motion variants and stage reactions; refined public events/reel/results; synchronized existing audio cues.
4. **Device polish:** profile real phones, reduce expensive effects as needed, complete privacy/accessibility/offline regression checks, then update active design/technical docs and evidence.

Use separate public and private transition boundaries. `AnimatePresence` retains outgoing DOM for exit animation: never put held secrets, voter choices, private reminders, or private screen snapshots into an outgoing animation/view-transition capture. Conceal and dispose first. Shared avatar movement may carry only public cosmetic identity. Existing Warga/Undercover secrecy, named handoffs, interruption handling, terminal wins, score idempotency, and engine-owned randomness remain mandatory.

Prefer transform/opacity for movement; use pseudo-element opacity for glow rather than repainting large animated shadows. Keep the single canvas, demand frames, capped DPR, preview fallback, and hidden-page suspension. Start with the installed Motion stack; additional animation libraries are unnecessary for this direction. New sheets need accessible names, focus management, keyboard dismissal, draft preservation, and no backdrop interaction leaking into gameplay.

Acceptance targets for the later implementation:

- One main action per stage; common setup and rematch require no extra mandatory taps.
- Primary actions visible at 390×844 even with 20 players; long content can scroll without being covered. At 320px/short heights, art yields space first.
- Secret/vote contents absent from outgoing DOM and captures immediately on every conceal path; no cross-player shared-layout animation.
- Normal and reduced motion both complete every flow; controls never depend on a finished animation.
- Aim for sustained 60Hz presentation on chosen target phones, measured with frame/long-task traces. Desktop touch emulation is insufficient evidence.
- Verify Android Chrome and iOS Safari/installed PWA, keyboard/safe areas, 20-player lists, long Indonesian copy, low-end/WebGL fallback, offline updates, and existing automated checks.

Technical references: [Motion exit lifecycle](https://motion.dev/docs/react-animate-presence), [Motion reduced motion](https://motion.dev/docs/react-use-reduced-motion), [web.dev animation performance](https://web.dev/articles/animations-guide).

## Concept evidence

The accompanying interactive concept demonstrates six visual states and selected local interactions. It uses copies of the existing animal portraits. It is **not** a playable implementation or complete settings/accessibility spec. Screen-preview tabs are review controls, not proposed in-game navigation. Example words, timer, outcomes, and points are fixtures; the real app must derive all of them from its existing state. Minor role accents, complete option sheets, target voting, event choreography, and full 3D reactions remain ideas described above.

- [Players](./evidence/visual-audit-2026-11-04/concept-lobby-390.png) · [Roles](./evidence/visual-audit-2026-11-04/concept-roles-390.png)
- [Secret](./evidence/visual-audit-2026-11-04/concept-secret-390.png) · [Clue](./evidence/visual-audit-2026-11-04/concept-clue-390.png)
- [Vote](./evidence/visual-audit-2026-11-04/concept-vote-390.png) · [Results](./evidence/visual-audit-2026-11-04/concept-result-390.png)

The planning-only task made no behavior changes, dependencies or deployment. Its historical captures remain in this audit's evidence folder. The later implementation is documented in the active design specification and verification record linked above.
