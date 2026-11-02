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
2. Follow **Pemain → Peran → Kata → Waktu**, one step per page. Use **Lanjut**, **Kembali**, or the numbered navigation bar to move between steps; saved choices stay selected. There is no mode/preset picker. Configure roles, word filters, then optional timers; **Bagikan peran** appears on the last step. Invalid roles or an empty word pool block starting even when jumping ahead. With Fool enabled, **Fool mendapat kata** chooses the third word or no word; **Fool boleh mulai dulu** includes/excludes Fool from the first-round opener draw. Both default on, including older saves, and survive step navigation, reloads and rematches. Later rounds rotate normally. Civilians must initially outnumber Undercover and Mr. White combined.
3. Go straight to named word handoffs. Tap **Saya …, siap** and hold **Tahan untuk melihat** to see your secret word, special ability and any partner's name. Warga/Undercover identities stay hidden, including their emblems; Fool and Mr. White identify themselves explicitly. Release before passing. A keyboard user can hold Space or Enter on the same control.
4. If enabled, a dedicated splash announces this round's Pantomim by name after word dealing and after each reassignment. Tap **Mulai petunjuk** to begin clues; Pantomim gestures. Discuss, then vote privately for elimination or one extra clue round. Confirm every choice. After the extra round, elimination is mandatory.
5. Elimination votes exclude the voter. Action ties use an equal-chance draw. A living, untied Hakim breaks elimination ties. Other ties use the same fair draw, presented as a case-opening-style reel: fast cards, a slow approach, red heartbeat pulses, zoom/bounce and an impact reveal. **Lewati putaran** snaps to the committed choice; **Lihat hasil** applies it. Reduced motion shows the static result immediately.
6. Follow the colored event scenes through elimination effects. A directly voted Fool or a correct Mr. White guess ends play immediately, canceling pending effects. Other eliminations finish the chain before team victory checks. The victory splash precedes the word/score summary. **Main lagi** keeps players, avatars, settings and scores, then deals new roles and words.

The Indonesian UI uses short, casual wording for teens; role descriptions, hints, rules and the optional four-step **Panduan singkat** explain the same game rules. **Beranda** returns from the roster to Home. Unsaved player edits and custom-word drafts (including aliases and filters) survive step navigation and Settings/rules/Back/Escape within the open page; **Simpan** commits them and **Batal** discards them. Drafts do not survive reload or closing the page. Opening Settings/rules preserves the current setup step; reload returns to Home with saved roster/settings retained.

Survivor strips show names even when avatars repeat. During ready, clues or discussion, **Lihat kartu pribadi** lets a living player choose their own name, complete another named handoff, and hold to re-read their original card. Release before returning. This pauses the on-screen timer while preserving the turn, votes and match revision; it is unavailable during voting and death effects. On short phones, the reveal omits the decorative portrait and uses compact instructions so held content and controls fit without jumping.

**Pengaturan → Nolkan skor sesi** confirms before clearing points, and is available before a match or after results. Players, settings, word history and the scored-match ledger remain; reloading an old result cannot restore cleared points. Reset is unavailable during unfinished games.

With Mr. White enabled on **Peran**, **Mr. White boleh mulai dulu** includes/excludes him from the first-round opener draw independently of Fool. It defaults on, including older saves, and survives navigation, reloads and rematches. When off, Mr. White still gives a clue after the opener; later rounds rotate normally. Mr. White always receives no word.

| Role | Rule |
| --- | --- |
| Warga | Share one word. Win with a living civilian and no living impostors. |
| Undercover | Share the related word. The impostor team wins at parity with living civilians. |
| Mr. White | Gets no word. A direct vote elimination grants one typed guess of the civilian word. A correct canonical answer or curated alias ends the game with a solo win; pending effects are canceled. |
| Fool | Gets the third word or no word, according to setup. No-word cards/reminders explain bluffing; results show “Tanpa kata”. A direct vote elimination ends the game with a solo win. Indirect deaths grant no win. |
| Pasangan | Partners learn one another's names. One death takes both. An intact pair postpones faction wins and wins together as the final two. |
| Pembalas | On death, chooses a living target. Linked deaths and revenge deaths trigger applicable abilities. |
| Hakim | Chooses among tied elimination leaders when alive and outside the tie. |
| Pantomim | A public, rotating gesture-only clue giver. Mr. White is ineligible. |

Fool is neutral for parity. Faction points include eliminated teammates and exclude partners and Fool. A draw gives no faction points. See the full [rulebook](docs/game-rules.md) or **Cara bermain** in the game.

All eight roles/modifiers have original SVG emblems, separate from animal avatars. Warga/Undercover emblems appear in setup, public eliminations and final results, never on their private word/reminder cards. Decisions, deaths, dedicated Mime announcements, Justice and revenge summons, guesses and victories use themed animated scenes. Elimination summaries explicitly name the player, revealed roles and cause (voting, partner or revenge), plus any next effect. Continue buttons work immediately. **Kurangi gerakan** and the OS preference remove decorative motion; words stay hidden until **Lihat peran dan skor**. [Implementation plan](docs/event-scenes-plan.md)

## Privacy, resume and offline

Words mount only while held. Release, cancellation, blur, backgrounding and navigation conceal them. Private choices always restart at a named handoff after interruption. Voter identities and totals stay off public screens.

The versioned active match lives in `sessionStorage`. Reload the same tab and tap **Lanjutkan permainan**. Closing a tab can discard its active match. Local storage keeps the roster, settings, custom triples, word history and score ledger. Storage failures show a notice that recent progress/scores may be lost on reload or closing; in-memory play remains available. The notice stays out of held-card layouts. Device owners can inspect browser storage.

Open the production build online over HTTPS or localhost. Wait for **Siap main offline** before disconnecting. The service worker precaches the shell, UI translations, dictionary, font, portraits and lazy 3D chunk. An updated worker waits until all windows using the previous version close. The active match pins its own words and aliases.

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
