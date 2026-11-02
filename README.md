# Undercover

A Bahasa Indonesia pass-the-phone game for 3–20 players. One device handles private word cards and ballots while the group gives clues in person.

## Run

Use Node 24 LTS with npm. From this workspace:

```sh
npm ci
npm run dev
```

Open the local URL Vite prints, including `/local-undercover-game/`. To try the offline-enabled production version:

```sh
npm run build
npm run preview
```

## Play

1. Tap **Mulai bermain**. Tap a player to edit their name or animal. Add up to 20 players. Names must be unique.
2. Choose a preset for the matching roster size, or configure counts, modifiers, filters and optional timers. Civilians must initially outnumber Undercover and Mr. White combined.
3. Everyone gets a named private introduction, then a separate word handoff. Tap **Saya …, siap** and hold **Tahan untuk melihat**. Release before passing. A keyboard user can focus the same control and hold Space or Enter.
4. Each survivor gives one clue. Pantomim gestures. Discuss, then vote privately for elimination or one extra clue round. Confirm every choice. After the extra round, elimination is mandatory.
5. Elimination votes exclude the voter. Action ties use an equal wheel. A living, untied Hakim breaks elimination ties. Other elimination ties use the wheel. Skipping the animation preserves its committed result.
6. Resolve the entire elimination chain. Score once at match end. **Main lagi** keeps players, avatars, settings and scores, then deals new roles and selects a triple using recent history.

**Panduan singkat** on Home offers an optional four-step introduction. **Beranda** returns from the roster to Home. Unsaved player edits and custom-word drafts (including aliases and filters) survive Settings/rules/Back/Escape within the open page; **Simpan** commits them and **Batal** discards them. Drafts do not survive reload or closing the page.

Survivor strips show names even when avatars repeat. During ready, clues or discussion, **Lihat kartu pribadi** lets a living player choose their own name, complete another named handoff, and hold to re-read their original card. Release before returning. This pauses the on-screen timer while preserving the turn, votes and match revision; it is unavailable during voting and death effects. On short phones, the reveal omits the decorative portrait and uses compact instructions so held content and controls fit without jumping.

**Pengaturan → Nolkan skor sesi** confirms before clearing points, and is available before a match or after results. Players, settings, word history and the scored-match ledger remain; reloading an old result cannot restore cleared points. Reset is unavailable during unfinished games.

| Role | Rule |
| --- | --- |
| Warga | Share one word. Win with a living civilian and no living impostors. |
| Undercover | Share the related word. The impostor team wins at parity with living civilians. |
| Mr. White | Gets no word. A direct vote elimination grants one typed guess of the civilian word. A correct canonical answer or curated alias claims a solo win after all death effects. |
| Fool | Gets the third word. A direct vote elimination earns one personal point. Play continues. |
| Pasangan | Partners learn one another's names. One death takes both. An intact pair postpones faction wins and wins together as the final two. |
| Pembalas | On death, chooses a living target. Linked deaths and revenge deaths trigger applicable abilities. |
| Hakim | Chooses among tied elimination leaders when alive and outside the tie. |
| Pantomim | A public, rotating gesture-only clue giver. Mr. White is ineligible. |

Fool is neutral for parity. Faction points include eliminated teammates and exclude partners and Fool. A draw gives no faction points. See the full [rulebook](docs/game-rules.md) or **Cara bermain** in the game.

## Privacy, resume and offline

Words mount only while held. Release, cancellation, blur, backgrounding and navigation conceal them. Private choices always restart at a named handoff after interruption. Voter identities and totals stay off public screens.

The versioned active match lives in `sessionStorage`. Reload the same tab and tap **Lanjutkan permainan**. Closing a tab can discard its active match. Local storage keeps the roster, settings, custom triples, word history and score ledger. Storage failures show a notice that recent progress/scores may be lost on reload or closing; in-memory play remains available. The notice stays out of held-card layouts. Device owners can inspect browser storage.

Open the production build online over HTTPS or localhost. Wait for **Siap dimainkan luring** before disconnecting. The service worker precaches the shell, UI translations, dictionary, font, portraits and lazy 3D chunk. An updated worker waits until all windows using the previous version close. The active match pins its own words and aliases.

## Editable content

- Edit [public/words/id.json](public/words/id.json). It ships 112 curated triples, 16 in each category. Keep stable IDs when correcting entries. Increment `contentVersion`, run validation/tests, rebuild and redeploy.
- A triple contains `id`, `categoryId`, `difficulty` (`easy`, `medium`, `hard`), `wordA`, `wordB`, `foolWord` and optional `aliasesA` / `aliasesB`. Words and aliases must be nonempty and distinct under Unicode, case and whitespace normalization.
- **Sumber kata** chooses the combined bundled/local pool or **Kata pribadi saja**. Category/difficulty still apply; an empty custom pool blocks dealing without falling back to bundled words. Older saves default to the combined pool. Rematch preserves the selected source, avoids the last 20 IDs where possible and reuses the least recently played eligible set when exhausted. **Pengaturan → Paket kata pribadi** edits local triples between matches.
- Interface copy lives in five [Indonesian JSON namespaces](src/locales/id). To add English, supply matching files under `src/locales/en/`, preserve interpolation names, then register and enable the locale in [the manifest](src/locales/manifest.json). The loader discovers the resources. The language selector appears with two enabled locales.
- Word languages are independent. Register a separate curated `public/words/en.json` for English words. For new UI keys, maintain the required key/placeholder [contract](src/locales/contract.json). Run `npm run validate:content` before enabling a pack.

## Animals and assets

Cat, pig, monkey, chicken, bear, raccoon, dog, snake, owl and rat have original articulated Three.js rigs. Edit geometry, motion, framing and lighting in [src/avatars](src/avatars). The featured badge uses one on-demand Fiber canvas. Lists, reduced motion and WebGL failures use matching portraits.

```sh
npx playwright install chromium
npm run avatars
```

Capture regenerates ten transparent WebPs, a contact sheet and an animation reel from the actual models. It also checks poses, restoration, visibility, canvas reuse and fallback behavior. On Windows the browser tasks can use installed Google Chrome. Set `CHROMIUM_EXECUTABLE_PATH` to override the executable. Nunito is self-hosted under the [SIL Open Font License](public/assets/fonts/OFL.txt).

## Checks

```sh
npm run typecheck
npm run lint
npm run validate:content
npm test
npm run build
npm run test:browser
```

Playwright starts a local production preview on port 4174 unless a compatible preview is already running. The suite includes full matches, isolated role/resume scenarios, real service-worker caching/update checks and phone-sized screenshots. Regression cases check held touch content before release, stable hold-control positions, navigation drafts, denied/quota storage, custom-only pools, score reset, reminders and the introductory guide. Engine simulations run separately per roster size to avoid a single load-sensitive timeout. [Verification and limits](docs/evidence/verification.md) · [Milestones](docs/implementation-plan.md)

## GitHub Pages

The [workflow](.github/workflows/pages.yml) installs from the lockfile, checks types, lint, content and engine behavior, builds the site, runs Chromium smoke tests against the repository base path and packages `dist/`. Pushes to main and pull requests run verification.

The Git remote is [uki-hub/local-undercover-game](https://github.com/uki-hub/local-undercover-game), with local `main` tracking `origin/main`. For later publication, select **Settings → Pages → Source → GitHub Actions**. From the default branch, run **Validate and prepare Pages** manually with **publish** enabled. Publication requires that explicit workflow input and a passing verification job. The action uses GitHub's Pages artifact and deployment flow. [GitHub Pages starter workflow](https://github.com/actions/starter-workflows/blob/main/pages/static.yml)

Local builds default to `/local-undercover-game/`. Set `PAGES_BASE` to another leading/trailing-slash project path for both build and browser tests. The workflow derives it from the repository name. No remote deployment was performed.
