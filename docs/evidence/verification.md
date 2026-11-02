# Verification · 2 November 2026

## Local checks

Windows, Node 24.22, npm 11, installed Google Chrome 156. Tests used production assets under `/local-undercover-game/`.

| Check | Observed result |
| --- | --- |
| `npm run typecheck` and `npm run lint` | Passed strict TypeScript, ESLint and React Hooks checks. |
| `npm run validate:content` | Five Indonesian namespaces, required placeholders and 112 triples passed validation. Separate damaged fixture copies produced field-specific failures for a missing placeholder, missing key and duplicate triple ID. |
| `npm test` | 36 tests passed, including 72 seeded complete games covering every size from 3 to 20. Simulations are separate tests per roster size, removing the previous aggregate five-second timeout. Added legacy-setting migration and custom-only selection/filter/history/snapshot cases. |
| `npm run build` | Vite production build and service worker generated. Core chunks total approximately 174.10 kB gzip; lazy Three/Fiber/rig chunks total 252.78 kB gzip. Largest minified chunk 375.76 kB. Workbox precached 26 entries, approximately 1.65 MiB. JSON attribute and chunk-size warnings resolved; two upstream Zod documentation-comment annotation notices remain and Rollup removes those comments. |
| Development startup | Chrome reached the six-player setup screen through the normal Vite development entry point. The lockfile also passed an offline `npm ci --dry-run`. |
| `npm run test:browser` | 18 Chromium browser cases passed, including both classic faction wins, offline/rematch/update coverage, live/fallback 3D, and seven regression cases for the changes below. |
| `npm run avatars` | Ten live rigs and 66 clips passed capture and neutral restoration checks. [Asset QA](avatar-verification.md) |
| Dependency audit | Production dependency audit returned zero advisories. The development toolchain audit reported 17 moderate and 2 low findings after compatible fixes. |

## Rules and recovery

Engine cases covered invalid rosters/configurations, A/B swapping, alias normalization, empty filters, recency exhaustion, editable pack snapshots, extra-clue limits, self/dead/out-of-turn votes, Justice eligibility and committed wheel outcomes. Death tests covered direct Fool wins, White guesses, revenge, linked partners, deferred victories, final-two Couple, lone Fool, zero survivors, rotating Mime, faction scoring and rematch reset.

Browser tests completed a six-player match offline, reloaded at sealed screens, checked the score ledger and started a fresh rematch. A second classic match reached impostor parity after an extra clue round and repeated eliminations. A seeded White/Revenger sequence verified the guess, both partner deaths and Fool plus solo points.

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

Latest checks ran together under load: typecheck, lint, content validation, all 36 unit cases and all 18 browser cases passed. No deployment performed. Existing historical avatar/audit/development-startup results above were not rerun in this follow-up.

## Visual evidence

Compared the 390 × 844 captures against [the approved board](../goal-design.png). The setup uses six raised cards in two columns, a selected blue-ring portrait and bottom actions. The held reveal pairs an overflow portrait with the blue-edged card. The action ballot uses the survivor strip and two dimensional choice cards. Iteration enlarged headings, portraits and actions, adjusted vertical spacing, and allowed the reveal portrait to yield space to longer instructions.

[Setup](setup-390.png) · [Held word](reveal-390.png) · [Action ballot](action-390.png) · [Elimination](elimination-390.png) · [Results](results-390.png) · [Screen contact sheet](screens.webp) · [Ten animals](avatar-roster.webp) · [Animation reel](avatar-motion.webp)

The contact sheet includes seeded private-role states for inspection. Its captions are test annotations. The game renders one screen at a time. Original procedural animals have a more visibly faceted appearance than the design-board illustration.

## Offline and deployment

Verified the manifest, font, dictionary, all ten portrait paths and the service-worker scope beneath the repository subpath. After caching, a fresh tab reopened offline and could start a match. A distinct second service worker installed during an active game, stayed waiting through another handoff and activated after the last old window closed.

GitHub Pages configuration is present. No repository remote or Git metadata existed in the supplied workspace. No hosted workflow, publication or external deployment was run.

## Remaining verification

Phone dimensions and touch events were emulated on desktop Chromium. Physical Android Chrome, iPhone Safari, mobile keyboards, screen readers, mobile GPU/battery behavior and in-person word fairness/role balance still need hands-on checks.
