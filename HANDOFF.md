# Undercover — development handoff

**Implementation delivered.** Use [README](./README.md) for setup and [verification](./docs/evidence/verification.md) for test results, screenshots and remaining device checks. The following handoff preserves the original brief and pre-development inventory.

Latest setup: Pemain → Peran → Kata → Waktu, with clickable breadcrumb navigation and no “Pilihan mode” picker. UI explanations use shorter, casual Indonesian for teens. See the updated design specification and README for validation/navigation behavior.

The production game now supports standalone installation, an offline soundtrack and public-event sounds. Install and audio controls live in **Pengaturan**. [Player instructions](./README.md#install-and-sound)

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
  - Start directly with private word handoffs. Hide Warga/Undercover identity; show their word only plus any special ability/partner. Explicitly reveal Fool and Mr. White. No separate introduction round for new matches.
  - After word dealing and each new Mime assignment, show a named Pantomim splash before clues. Elimination summaries state the player's name, revealed roles, cause and next effect.
  - Fool wins solo when directly voted out; end play and cancel pending death effects.
  - Fool options: `foolHasWord` gives the third word or no word; `foolCanStart` includes/excludes Fool in the first-round opener draw. Both default on, including older saves. Later rounds rotate normally; rematches retain both options.
  - Mr. White has an independent `whiteCanStart` option for the same first-round opener draw, defaulting on for older saves. Disabling it keeps Mr. White in the full clue order after another player opens; Mr. White still receives no word.
  - An intact Couple postpones ordinary team victories; final-two Couple wins take priority over those victories.
  - A correct directly eliminated Mr. White guess wins solo; end play and cancel pending death effects.
  - Use full-phone themed event scenes for decisions, eliminations, Justice/revenge summons and victories. See [change plan](./docs/event-scenes-plan.md).
  - Justice resolves elimination ties only; other ties use a committed equal-chance draw, shown as a suspense reel. See [reel plan](./docs/tie-reel-plan.md).
  - One mandatory clue round before action voting; at most one extra clue round per elimination cycle.
  - Commit random tie results before animation; never reroll on replay, skip, resize or reload.
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
