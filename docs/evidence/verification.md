# Verification · 2 November 2026

## Local checks

Windows, Node 24.22, npm 11, installed Google Chrome 156. Tests used production assets under `/local-undercover-game/`.

| Check | Observed result |
| --- | --- |
| `npm run typecheck` and `npm run lint` | Passed strict TypeScript, ESLint and React Hooks checks. |
| `npm run validate:content` | Five Indonesian namespaces, required placeholders and 112 triples passed validation. Separate damaged fixture copies produced field-specific failures for a missing placeholder, missing key and duplicate triple ID. |
| `npm test` | 47 tests passed, including 72 seeded complete games covering every size from 3 to 20 and all four Fool-option combinations. Covers terminal Fool/White victories, queue cancellation, persisted Mime/Justice/revenge announcements, combined opening, legacy-setting migration and custom-only content. |
| `npm run build` | Vite production build and service worker generated. Core JS chunks total approximately 181.57 kB gzip; lazy Three/Fiber/rig chunks total 252.78 kB gzip. Largest minified chunk 375.76 kB. Workbox precached 26 entries, approximately 1.69 MiB. Two upstream Zod documentation-comment annotation notices remain; Rollup removes those comments. |
| Development startup | Chrome reached the six-player setup screen through the normal Vite development entry point. The lockfile also passed an offline `npm ci --dry-run`. |
| Browser checks | All 35 Chromium cases passed, including the three new setup cases, Fool options, privacy, events, suspense reel, offline/rematch/update and live/fallback 3D. Final full run passed 34 cases and hit one screenshot-file write error; that case passed unchanged with `npx playwright test --last-failed`. An earlier full run passed all 35 together. |
| `npm run avatars` | Ten live rigs and 66 clips passed capture and neutral restoration checks. [Asset QA](avatar-verification.md) |
| Dependency audit | Production dependency audit returned zero advisories. The development toolchain audit reported 17 moderate and 2 low findings after compatible fixes. |

## Setup and wording follow-up

- Replaced the long configuration page with Pemain → Peran → Kata → Waktu. The numbered breadcrumb bar supports direct jumps and keyboard use, identifies the current step, and disappears during gameplay. Removed the mode/preset picker and its translation entries.
- Sequential navigation retains role counts, Fool preferences, word filters and timers. Settings/rules return to the same step. Unsaved player drafts survive switching steps. Reload retains committed profile choices and returns to Home. Final launch validation prevents breadcrumb jumps from bypassing invalid roles, a missing word pack or an empty pool; correction buttons return to the relevant controls.
- Shortened Indonesian role descriptions, held-card hints, guide/rules, game messages, errors and dropdown labels. The rules and engine behavior remain unchanged. The guide describes the new setup and the “Pilih ini” vote confirmation. Added the navigation labels/placeholders to the translation contract.
- `npm run typecheck`, `npm run lint`, `npm run validate:content`, `npm test` (47 cases), `npm run build` and `git diff --check` passed. `npx playwright test tests/browser/setup.spec.ts --timeout=30000` passed all three new cases before the full-suite runs recorded above. Browser checks needed localhost access outside the restricted network sandbox. The final reel retry addressed an `UNKNOWN` filesystem error opening its screenshot, with no code change.
- Setup assertions cover sequential/back/direct/keyboard navigation, retained edits, Fool toggles, settings/rules panels, invalid-role and empty-custom-pool recovery, and launch snapshots. At 320×568, 390×844 and 430×932, navigation targets are at least 44×44, actions remain reachable, and no page overflows horizontally. The six-player roster shows both bottom actions without scrolling at the two taller sizes.
- Visually inspected the updated [player step](setup-390.png), [role step](setup-roles-390.png), [word step at 320px](setup-words-320.png) and [timer step at 320px](setup-timers-320.png). Short dropdown labels fit; compact roster portraits leave room for the navigation bar. Preserved unrelated historical captures. No deployment, avatar regeneration or dependency audit in this follow-up; physical-device limits below still apply.

## Fool-option follow-up

- Added `foolHasWord` and `foolCanStart`; both default true for saved profiles and matches missing the fields. No-word Fool keeps its explicit role and abilities, sees bluffing instructions, and shows “Tanpa kata” at results. The unused third word stays off its cards/results.
- Unit coverage checks all four independent combinations, legacy schema defaults, unchanged civilian/Undercover/White assignments, snapshot/rematch retention, every non-Fool role remaining eligible to open, complete clue turns, extra-clue order and ordinary later-cycle rotation. The 72 seeded full-game simulations now vary both options.
- `npx playwright test tests/browser/fool-options.spec.ts tests/browser/regressions.spec.ts`: 10 passed against the production subpath build in installed Chrome. Covers option visibility/defaults, independent changes, off/on retention, presets, setup reload, rematch, no-word results, held/reminder cards with Justice, release/blur concealment, and existing mobile/privacy/storage regressions. Localhost access required running this command outside the restricted network sandbox.
- Inspected the generated setup and word/no-word held-card captures at 320×568. Instructions and abilities fit without horizontal overflow or card clipping. Images are generated under ignored `test-results/`; prior evidence files were preserved.
- Typecheck, lint, Indonesian content validation (five namespaces/112 triples), 47 unit cases, production build and `git diff --check` passed. The build retains the two existing upstream Zod comment-annotation notices. Other browser suites, avatar capture and dependency audit were not rerun for this follow-up.

## Rules and recovery

Engine cases covered invalid rosters/configurations, A/B swapping, alias normalization, empty filters, recency exhaustion, editable pack snapshots, extra-clue limits, self/dead/out-of-turn votes, Justice eligibility and committed wheel outcomes. Death tests covered direct Fool wins, White guesses, revenge, linked partners, deferred victories, final-two Couple, lone Fool, zero survivors, rotating Mime, faction scoring and rematch reset.

Browser tests completed a six-player match offline, reloaded at sealed screens, checked the score ledger and started a fresh rematch. A second classic match reached impostor parity after an extra clue round and repeated eliminations. A seeded White/Revenger sequence verified that a correct guess cancels revenge, leaves remaining survivors untouched, hides words on the victory splash and awards only White across reloads. Direct Fool voting similarly cancels revenge and scores only Fool.

Held content disappeared from the DOM on key release, pointer cancellation, emulated touch release/cancellation, window blur and simulated hidden-document events. Reloading introductions, words, ballots, Justice, revenge and White choices restored named handoffs. A reloaded wheel kept its committed target. Timer expiry prompted advancement and a simulated hidden page preserved remaining time.

Checked 20 players, repeated avatars, 20-character names, multiword cards, custom triple create/edit/delete, unsupported UI locale, malformed word JSON, retry, broken saves, denied storage and double taps. Checked overflow and bottom-action reachability at 320 × 568, 360 × 640 and 430 × 932.

A simulated pack change retired the saved match's category. Its original words still appeared in results. Rematch showed the empty-filter explanation and left setup available.

## QA follow-up fixes

- Player name/avatar drafts survive opening Settings, rules and returning. Custom words, aliases and category drafts survive Back/Escape and panel unmounts. Explicit cancel discards a draft; save commits it. Roster now offers Beranda.
- Real emulated touch holds checked White+Justice, White+Couple, 80-character custom words+Justice and Couple introductions with 20-character owner/partner names at 320×568, 360×640, 390×844 and 430×932. Assertions verify held content fits, the card does not overflow and the hold button stays at its original position before/after touch-down; touch release removes private content. Compact short-phone layout omits the decorative portrait. [320-pixel held White regression capture](reveal-320-white.png)
- Both denied storage reads and quota-failing writes show a localized warning while in-memory dealing/reveal remains playable.
- Custom-only source blocks empty pools, deals only custom sets and persists through rematch. Old settings default to the combined source.
- Score reset is absent during unfinished games, confirms at results, preserves player identity and does not re-award points after reload. Reset also clears the result's point-gain badges.
- Private reminders use the explicitly chosen living player's pinned card, require a named handoff, conceal on blur and keep the match snapshot unchanged. A controlled-clock check pauses the clue timer at 11 seconds, spends 20 seconds in the reminder, then resumes at 11 and counts down normally. Reload does not reopen the reminder.
- Visible survivor names distinguish repeated avatars. The optional four-step introductory guide supports back navigation and continues to player setup.

Final follow-up checks: typecheck, lint, content validation, production build, all 40 unit cases and all 29 browser cases passed. No deployment performed. Historical avatar/audit/development-startup results above were not rerun in this follow-up.

## Role and event scene update

- Wrote the [implementation plan](../event-scenes-plan.md) after inspecting the existing code and before implementation. New matches/rematches start in `word`, with word/special role/ability/partner in one held card. Warga/Undercover labels and emblems stay hidden on private cards and reminders. Legacy `intro` saves still resume safely.
- All eight role/modifier emblems render in setup; private role art, words and partner names unmount immediately when released. Public survivor portraits do not disclose living players' hidden roles.
- Direct Fool votes and correct White guesses end play before pending revenge/partner effects. Only the solo winner scores. Unit coverage also confirms a wrong White guess continues the revenge sequence and indirect Fool deaths grant no win.
- Real UI transitions verify the persisted winged Justice summons, tied-candidate selection, red revenge summons/target selection, elimination summaries and victory. Reload retains the announcement and never commits another game effect.
- Gallery checks cover all six victories, both action decisions, Justice/revenge calls, failed guesses, round/Mime announcements and villager elimination at 320×568 and 390×844. No horizontal overflow; primary actions remain in view. All public scenes hide the three words until the final scoreboard.
- Normal-motion checks sample distinct actual emblem-animation transforms and confirm animated wing keyframes. OS reduced motion and the app setting remove decorative particles/animations while keeping static art/text. [Normal-motion Justice frame](justice-motion.png)
- Held-card regression passes White+Justice, White+Couple, long custom words+Justice and legacy Couple introductions with long names at 320×568, 360×640, 390×844 and 430×932. The combined card reserves space in both held/concealed states; the touch control does not move.
- Visually inspected the updated [14-scene gallery](events-gallery.webp), winged Justice frame and named elimination capture. Event effects use original SVG/CSS; no new dependencies or remote assets.

## Disclosure, Mime and summary follow-up

- Real held-card checks cover Warga, Undercover, Undercover+Justice, Warga+Revenger, Fool and White+Couple. Ordinary faction labels/emblems never mount; special role/ability details and words remain visible only while held. Existing private-reminder, concealment and four-size touch regressions pass.
- The final word acknowledgement enters `mimeReveal` with a committed eligible owner. Reload preserves that exact snapshot. Acknowledging starts clues directly; the next elimination cycle reassigns and announces the new round's Mime. Unit tests reject missing/White owners and prove acknowledgement never draws randomness or accepts stale commands.
- Elimination headings explicitly name the affected player. Summary assertions cover direct voting with base role/modifier, revenge victims, and linked partner deaths; death-chain entries name players and base roles. Follow-up copy explains Fool wins, White's guess, revenge or the queued partner death. Justice/revenge/guess scenes also identify their actor.
- All six victory scenes plus Mime announcements and action/role events fit the gallery checks at 320×568 and 390×844. The partner-death summary and chain remain readable and scrollable on a 320px phone. Production offline, worker updates, rematches, motion preferences and score idempotence still pass.

## Visual evidence

The tie-break scene now uses the [suspense reel](tie-reel-intense-390.png) and [committed result reveal](tie-reel-result-390.png). Both captures come from the actual running animation. Inspected the dark/red stage, gold pointer, public portraits/names, ECG, readable result and bottom actions.

Compared the 390 × 844 captures against [the approved board](../goal-design.png). The setup uses six raised cards in two columns, a selected blue-ring portrait and bottom actions. The held reveal pairs an overflow portrait with the blue-edged card. The action ballot uses the survivor strip and two dimensional choice cards. Iteration enlarged headings, portraits and actions, adjusted vertical spacing, and allowed the reveal portrait to yield space to longer instructions.

[Event gallery](events-gallery.webp) · [Winged Justice](justice-motion.png) · [Setup](setup-390.png) · [Held word](reveal-390.png) · [Action ballot](action-390.png) · [Elimination](elimination-390.png) · [Results](results-390.png) · [Screen contact sheet](screens.webp) · [Ten animals](avatar-roster.webp) · [Animation reel](avatar-motion.webp)

The contact sheet includes seeded private-role states for inspection. Its captions are test annotations. The game renders one screen at a time. Original procedural animals have a more visibly faceted appearance than the design-board illustration.

## Suspense reel verification

- Replaced the circle with a 6.6-second horizontal reel, long deceleration, red double-beat pulses, progressively stronger camera zoom/bounce and impact sparks. No new dependencies/assets or game-engine outcome changes. [Plan](../tie-reel-plan.md)
- Actual animation sampling confirms that movement during a late one-second interval is less than a quarter of an early interval. Near-stop stages switch at 3.3/5.1 seconds, with pulse periods of 1.35/1.05 seconds. The animation resumes from the sampled near-stop frame and finishes naturally into the stored candidate.
- At 320×568, 390×844 and 430×932, both action outcomes, all three positions of a three-player tie, and the first/last candidates of a 20-player tie center under the pointer within 1.5px. Long names remain in the candidate/result display; a horizontal candidate list handles larger ties.
- Skip snaps to the committed choice without changing the match revision. Reload retains the same outcome; acknowledgement applies only that choice. Resize recomputes landing geometry without changing the result. The full-motion reveal burst is horizontally contained on a 320px phone.
- OS/app reduced motion bypasses scrolling, pulses, zoom and particles and immediately centers the same candidate. Public reel markup has no secret roles or words. Full role, score, offline and update regressions still pass.

## Offline and deployment

Verified the manifest, font, dictionary, all ten portrait paths and the service-worker scope beneath the repository subpath. After caching, a fresh tab reopened offline and could start a match. A distinct second service worker installed during an active game, stayed waiting through another handoff and activated after the last old window closed.

GitHub Pages configuration is present. No repository remote or Git metadata existed in the supplied workspace. No hosted workflow, publication or external deployment was run.

## Remaining verification

Phone dimensions and touch events were emulated on desktop Chromium. Physical Android Chrome, iPhone Safari, mobile keyboards, screen readers, mobile GPU/battery behavior and in-person word fairness/role balance still need hands-on checks.
