# Undercover — development handoff

**Implementation delivered.** Use [README](./README.md) for setup and [verification](./docs/evidence/verification.md) for test results, screenshots and remaining device checks. The following handoff preserves the original brief and pre-development inventory.

- **Task for the next session**
  - Build the complete playable game described here. This session prepared documentation only.
  - Workspace: `D:\repos\local-undercover-game`.
  - Copy-ready new-session prompt: [START_DEVELOPMENT.txt](./START_DEVELOPMENT.txt).
  - Start implementation immediately after reading the linked documents and inspecting the goal image.
  - Carry work through a playable, verified build; use the milestones as checkpoints within the task.

- **Before implementation — 2 November 2026**
  - Documentation, a saved goal image, the earlier concept image, and its generation prompt exist.
  - No app scaffold, package manifest, dependencies, game engine, tests, animated models, or deploy workflow exists yet.
  - No live site has been created or published.
  - The supplied image is preserved unchanged at `docs/goal-design.png`.

- **Read order and authority**
  1. This handoff: scope, defaults, completion criteria.
  2. [Game rules](./docs/game-rules.md): authoritative behavior and edge cases.
  3. [Goal image](./docs/goal-design.png) and [design specification](./docs/design-spec.md): visual target and screen requirements.
  4. [Technical specification](./docs/technical-spec.md): stack and architecture.
  5. [Asset plan](./docs/asset-plan.md): all 10 animated animals and delivery requirements.
  6. [Implementation plan](./docs/implementation-plan.md): milestones and verification.
  7. [Language and word packs](./docs/language-and-word-packs.md): Indonesian-first localization, future English, editable JSON content.
  - Later explicit user instructions take precedence.
  - For behavior, game-rules.md overrides older summaries; for aesthetics, the approved image takes precedence, except the exact roster below overrides its sample animals.
  - The older concept and generation prompt are historical context, not additional requirements.

- **Product goal**
  - A premium Indonesian Undercover party game for 3–20 people sharing one phone.
  - React 19, TypeScript, Tailwind, Three.js, Motion, Zustand; Vite build for GitHub Pages.
  - Portrait-first touch UI, private pass-the-phone reveals, spoken clues, private votes, chaos roles, rematches, session scores, and offline play after caching.
  - White/blue/gray tactile UI, raised cards, expressive 3D animal badges, polished but brief motion.
  - The image depicts three separate screens. The actual game displays one screen at a time.

- **Fixed scope**
  - Base roles: Civilian, Undercover, Mr. White, Fool.
  - Permanent modifiers: Couple, Revenger, Justice; one per player maximum.
  - Temporary rotating modifier: Mime.
  - Exactly 10 avatar types: cat, pig, monkey, chicken, bear, raccoon, dog, snake, owl, rat.
  - All animals have blinking, a yawn, and species-specific idle motion; all are cosmetic.
  - Avatars may repeat; unique player names identify people in a 20-player game.
  - Initial content: at least 100 reviewed Indonesian A/B/Fool triples, category/difficulty filters, recent-set avoidance, and local custom triples.
  - UI localization: i18next + react-i18next, Indonesian only initially, reusable JSON language packs for future English.
  - Word assets: manually editable `public/words/id.json`; never hardcode the playable dictionary in TypeScript or components.
  - In-app rules, optional timers, reduced motion, local persistence, static fallbacks, and safe resume.

- **Important implementation defaults**
  - Hide Civilian/Undercover/Fool identity from the recipient; show their word only. Explicitly identify Mr. White and special abilities.
  - Fool wins personally only when directly voted out; the match continues.
  - An intact Couple postpones ordinary team victories; final-two Couple wins take priority over those victories.
  - A correct directly eliminated Mr. White guess records a solo claim; finish pending death effects before the final result.
  - Justice resolves elimination ties only; action-choice ties always use the wheel.
  - One mandatory clue round before action voting; at most one extra clue round per elimination cycle.
  - Commit random wheel results before animation; never reroll on replay, skip, or reload.
  - Animal geometry may be original procedural Three.js models; GLB packaging is optional. Recognizable, articulated, polished 3D and all required animations remain mandatory.
  - Use Indonesian UI copy throughout, including errors, rules, accessibility text, and animal/role labels; source every fixed display string from JSON language packs.
  - Keep UI translations separate from word triples. Future UI language changes must not translate, regenerate, or alter an active match's secret words.

- **Implementation boundaries**
  - Prepare a GitHub Pages workflow and validate production subpath behavior. Actual publication is a later step unless requested in the implementation session.
  - Accounts, remote multiplayer, chat, microphone recording, payments, cloud saves, analytics, and AI-generated runtime words are outside this release.
  - Development requires downloading build dependencies; gameplay itself must run without a server or runtime API.
  - Keep secret values out of URLs, public screen props, logs, and persistence previews. Local-device secrecy is an accidental-exposure boundary, not remote security.
  - No new skills, subagents, or external services are required merely because this handoff exists; follow the next session's applicable instructions.

- **Completion criteria**
  - Every required screen is interactive and reachable through legal game transitions.
  - A complete match and every chaos-role scenario work, including ties, death chains, reloads, and rematches.
  - All 10 animated avatars ship, with recognizable silhouettes, correct circle clipping, and preview fallbacks.
  - All 100+ bundled triples validate; custom input and exhausted pools work.
  - Indonesian language packs cover all visible/accessibility copy; a future English pack can be added through JSON resources and the locale manifest.
  - Editing the word JSON changes available content after validation/build/redeployment; no TypeScript dictionary edits are needed.
  - Public vote totals and secret words never flash during handoff, conceal, backgrounding, or resume.
  - Goal-screen comparisons show consistent typography, spacing, depth, colors, avatars, and bottom actions.
  - Type checking, lint, engine tests, production build, and browser smoke checks pass.
  - Offline readiness and GitHub Pages subpath assets work; updates are deferred during matches.
  - README documents setup, commands, rules, content editing, asset generation, and deployment.
  - Report exact checks performed, files changed, and any verification that requires a physical phone.

- **Copy into the new session**
  > Implement the game in D:\repos\local-undercover-game. Start by reading HANDOFF.md and all linked specifications, including language/word packs; inspect docs/goal-design.png. Build through the milestones to a complete playable game, matching the reference and using the exact 10-animal roster with idle animations. Use Bahasa Indonesia, JSON UI language packs through i18next/react-i18next, and manually editable JSON word assets. Use documented defaults for routine choices. Validate the game engine, privacy, mobile UI, offline behavior, and GitHub Pages build; prepare deployment without publishing. Keep docs current and report verified results and any remaining limits. This request authorizes implementation, not another planning-only response.
