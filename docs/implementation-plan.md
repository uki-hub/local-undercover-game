# Undercover — implementation plan and verification

- **Execution contract**
  - Start from [HANDOFF.md](../HANDOFF.md); follow [rules](./game-rules.md), [design](./design-spec.md), [technical spec](./technical-spec.md), [assets](./asset-plan.md), and [language/word packs](./language-and-word-packs.md).
  - Implementation checkpoints are tracked below. See [development log](./progress.md) and [verification evidence](./evidence/verification.md).
  - Deliver a functional game, not only a styled prototype or rules demo.
  - Resolve routine implementation choices using these documents; record changes affecting rules or visible behavior.
  - Install only libraries that serve implemented requirements; preserve React 19 and compatible peer versions.

- **Proposed module boundaries**
  - src/app: bootstrap, provider composition, error boundary, current-screen dispatch.
  - src/engine: types, setup validation, assignment, transitions, ballots, death queue, victory/scoring, RNG interface.
  - src/content: JSON loaders, word-pack schemas, category IDs, custom-pack validation; no hardcoded word arrays.
  - public/words/id.json: manually editable Indonesian A/B/Fool sets and pack metadata.
  - src/locales: JSON locale manifest, Indonesian namespace files, future same-structure language folders.
  - src/i18n: i18next/react-i18next initialization, resource loading, typed translation keys, locale selection/fallback.
  - src/store: match/session/preferences, selectors, persistence adapters/migrations.
  - src/screens: setup, introductions, handoffs, reveal, clues, action votes, target votes, effects, results, settings/rules.
  - src/components: buttons, player cards, private handoff, word card, ballot options, timer, modal, wheel, avatar badge.
  - src/avatars: model registry, procedural animals or GLB adapters, animation scheduler, lighting/camera, preview capture support.
  - src/services: browser randomness, storage, visibility, asset cache/offline/update integration.
  - src/styles: global styles and shared design tokens.
  - public/assets: previews, optional GLB files, self-hosted fonts, licenses.
  - tests: engine scenarios, integration checks, browser flows; docs/evidence: selected screenshots and verification notes.
  - These are module responsibilities, not a requirement to create empty files or unnecessary abstractions.

- [x] **Milestone 0 — inspect and scaffold**
  - Read the full handoff pack; open the approved image and inspect the workspace for later changes or instructions.
  - Confirm compatible React/React DOM 19, Fiber 9, Three.js, Tailwind 4, Vite, Motion, Zustand, Zod, i18next/react-i18next, and testing dependencies.
  - Create a strict TypeScript Vite app, one lockfile, Tailwind integration, ESLint, and test setup.
  - Define supported Node version and scripts for dev, typecheck, lint, test, build, preview, and browser tests.
  - Establish design tokens, base-aware assets, phone layout, semantic controls, and a root error fallback.
  - Initialize Indonesian-only JSON translations with Indonesian fallback; use keys from the first screen onward, including the root error fallback.
  - Exit: development server and production build work; a phone-sized screen uses the intended typography and palette.

- [x] **Milestone 1 — prove visual and 3D direction**
  - Implement the shared card/button/badge system and real player setup screen.
  - Build one finished articulated Cat, including neutral preview, blink, yawn, selection reaction, circular crop, and upper overflow.
  - Build the private-reveal and action-choice components; inspect them in isolated development fixtures without exposing production debug routes or secrets.
  - Capture setup/reveal/action at 390×844 and compare against the goal.
  - Exit: three reference surfaces match the intended visual hierarchy, depth, controls, and avatar style; fix major drift before multiplying screens/assets.

- [x] **Milestone 2 — playable classic match**
  - Implement typed engine states/events, setup validation, random assignment, word selection, ballots, resolution, and ordinary victories.
  - Supply at least 20 validated sample triples in public/words/id.json for this checkpoint; final content remains 100+. Implement the base-aware JSON loader and localizable load-failure state.
  - Wire roster/setup → private reveals → ready/clues/discussion → action ballot → target ballot → elimination → results → rematch.
  - Enforce one extra clue round, no self-votes, eligible-player checks, handoff concealment, and hidden totals.
  - Introduce committed wheel outcomes and injectable RNG; no UI/animation callbacks may produce a second draw.
  - Exit: a 6-player classic match can be played to either faction's victory through the actual UI; engine scenario tests pass.

- [x] **Milestone 3 — chaos rules and content**
  - Add Fool personal wins, Mr. White one-shot guesses, Couple introductions/deaths/objective, Revenger choices, Justice ties, and rotating Mime.
  - Implement FIFO death effects, pending interaction states, exact terminal priority, and idempotent match scoring.
  - Complete the rules/preset/custom-role UI and in-app explanations of the custom victory rules.
  - Expand the editable JSON pack to 100+ curated triples, with categories, difficulty, aliases, recent-set avoidance, and custom triple CRUD.
  - Complete all Indonesian translation namespaces; document JSON-only addition of future English resources and separate English word content.
  - Add all public/private role screens and complete result disclosure.
  - Exit: every scenario in the matrix below passes; no role is an unused toggle or placeholder.

- [x] **Milestone 4 — complete animated roster**
  - Build Pig, Monkey, Chicken, Bear, Raccoon, Dog, Snake, Owl, and Rat to the quality established by Cat.
  - Implement all required idles, shared animation contracts, random timing, smooth restoration, reduced motion, and offscreen pause.
  - Produce matching WebP previews for all 10; use them in grids and as the runtime fallback.
  - Check repeated avatars, long names, 20-player scrolling, frame cost, resource reuse, and WebGL failure recovery.
  - Exit: all animals are recognizable and animated; save a contact sheet and animation evidence.

- [x] **Milestone 5 — persistence, offline, and polish**
  - Persist roster/settings/scores/recent content locally; persist active matches in versioned session storage.
  - Implement validated hydration/migrations and safe neutral handoff resume for every interrupted private state.
  - Commit score ledger and totals together; prevent duplicate awards across reloads or repeated events.
  - Handle visibility, pointer cancellation, focus loss, keyboard input, disabled storage, and damaged saved state.
  - Add PWA shell/content/preview caching and base-scoped service-worker behavior; declare offline-ready only after required caches complete.
  - Include Indonesian translations and word JSON in required offline assets; pin pack version/words across reloads and UI locale changes.
  - Keep updates pending until a safe between-match point. Uncached models use their bundled previews offline.
  - Finish timers, confirmation dialogs, reduced-motion behavior, screen transitions, idle performance, and results celebration.
  - Exit: interruption and offline tests pass; complete a match after going offline and after reloading into a handoff.

- [x] **Milestone 6 — verify and prepare deployment**
  - Run type checking, lint, locale/content validation, engine/content tests, production build, and browser smoke flows.
  - Test production output under a non-root path matching GitHub Pages; validate every model/font/content/preview/worker path.
  - Prepare a GitHub Actions build/test/deploy workflow; document configuration and the later publish step.
  - Capture setup, reveal, action voting, effects/results, and animal roster evidence. Compare the three reference screens again after all integrations.
  - Update README with real setup commands, controls/rules, content and asset editing, offline/resume behavior, checks, and Pages deployment.
  - Provide a validate:content script for word-pack and locale validation; document the manual JSON edit → validate → build → redeploy workflow and future language addition.
  - Record browser/device coverage, any physical-phone checks not run, performance measurements, and remaining issues.
  - Exit: all documented release requirements are implemented and verified to the extent tools allow; no actual deployment without an implementation-session request.

- **Engine acceptance matrix**
  - R01: invalid role counts, duplicate/empty names, impossible modifier allocations, and empty content filters block start with a useful message.
  - R02: all Civilians share one word, all Undercovers share the other, Fool receives C, White receives none; A/B swapping preserves these mappings.
  - R03: an action tie draws between exactly two actions; an extra clue round always leads to elimination rather than another optional loop.
  - R04: target ballots reject self/dead/duplicate/out-of-turn votes; eliminated players never enter future voter lists.
  - R05: Justice outside a tied set chooses only among tied leaders; dead/absent/tied Justice invokes the wheel.
  - R06: predetermined wheel outcome survives skip, refresh, replay, and hidden-page transitions unchanged.
  - R07: directly voted Fool records a personal win; revenge death does not. The match continues when no terminal condition applies.
  - R08: directly voted White receives one guess; aliases/normalization work, wrong guesses keep the answer hidden, non-vote death grants no guess.
  - R09: correct White claim takes precedence after the pending death queue completes; repeated submission cannot create another guess or score.
  - R10: intact Couple delays normal victories; exactly two surviving partners win; either partner's death kills the other once.
  - R11: voted Revenger chooses a living partner of a Couple; both partners die, all effects resolve once, and a zero-survivor setup produces a draw.
  - R12: Mime is assigned initially, excludes White, rotates only once per full death sequence, and avoids repeats where alternatives exist.
  - R13: ordinary parity uses only base Civilian and impostor counts; neutral Fool does not change those counts. A lone Fool produces a draw.
  - R14: faction scoring includes eliminated faction members but excludes Couple/Fool; Couple/White/Fool awards match the rulebook and remain idempotent.
  - R15: rematch resets votes/effects/roles and picks content using recent history while preserving roster, avatars, preferences, and scores.
  - R16: exhausted filtered pool reuses least-recently-played eligible content; canonical/custom content validates and active triples remain immutable snapshots.
  - R17: valid manual JSON changes alter the selectable dictionary; malformed packs, duplicate IDs, invalid categories, missing translations, and empty words fail validation with file/field details.
  - R18: UI locale changes never alter assigned words/aliases; saved unsupported locales fall back to id, and word histories/custom packs remain separated by language.

- **Browser acceptance matrix**
  - B01: complete a classic match and rematch through real controls at phone dimensions.
  - B02: held words disappear on release/cancel/blur/hide/navigation; stale words are absent from outgoing DOM and accessibility names.
  - B03: handoffs conceal previous choices; neither action nor elimination votes show totals or individual selections.
  - B04: refresh during introductions, reveal, ballots, wheel, White guess, Justice, and revenge choices resumes safely without rerolling or duplicate scoring.
  - B05: all 10 avatars render and animate; failed models/lost WebGL use the matching preview; reduced motion and hidden-page pause work.
  - B06: 320-pixel width, short screens, keyboard display, multiword secrets, long names, and 20-player lists keep primary controls reachable.
  - B07: a fully cached app reopens offline and completes a match; missing live models use previews; an update never forces a mid-match reload.
  - B08: production assets work under a repository subpath, including a cold reload and service-worker scope.
  - B09: keyboard/touch focus and accessible reveal controls work; pressed/disabled/selected states remain clear without color alone.
  - B10: double taps, repeated events, rapid screen changes, interrupted holds, corrupt storage, and unavailable storage leave coherent state.
  - B11: every visible/accessibility string uses the Indonesian resources; interpolation/counts and longer simulated translations fit without exposing keys or clipping controls.
  - B12: word JSON and translation resources load offline and under a repository subpath; a missing/corrupt dictionary shows a localized retry state and blocks new assignment without inventing fallback words.
  - Automated mobile emulation is not physical-device verification. Report actual Android/iPhone checks separately and honestly.

- **Final report template**
  - Implemented features and where to start/run the app.
  - Checks actually run with pass/fail results; production subpath and offline results.
  - Links to representative screenshots and all-animal/animation evidence.
  - Any remaining defects, visual gaps, or physical-device checks not performed.
  - Deployment readiness and required user/repository configuration; state explicitly whether anything was published.
