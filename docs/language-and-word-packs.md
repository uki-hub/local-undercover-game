# Undercover — language packs and editable word assets

- **Scope**
  - The Indonesian packs below ship with the application. See the [maintenance guide](../README.md).
  - Release one uses Bahasa Indonesia for interface and words. Prepare the architecture for English without requiring English content now.
  - Maintain two independent resources: interface translations and curated playable word sets.

- **Translation library**
  - Use i18next with react-i18next. The integration provides React hooks and namespaced resources. [Official guide](https://react.i18next.com/latest/using-with-hooks).
  - Initial language, fallback language, and only enabled language: id. Unsupported saved settings resolve to id; browser language must not switch this release to English.
  - Initialize with bundled Indonesian JSON resources; no HTTP translation backend, automatic translator, or browser-language detector is required.
  - Use i18next interpolation and plural handling for names/counts, with complete sentences instead of concatenated fragments. [JSON resource format](https://www.i18next.com/misc/json-format).
  - Derive supported locales from the locale manifest; use Indonesian fallback when the chosen locale/key is unavailable. [Configuration](https://www.i18next.com/overview/configuration-options).

- **Interface resource files**
  - src/locales/manifest.json: registered locale codes, native display names, enabled status, namespaces, and available word-pack metadata.
  - src/locales/id/common.json: shared actions, dialogs, category/difficulty labels, generic errors, offline/update text, accessibility copy.
  - src/locales/id/game.json: setup, handoffs, reveal, clues, ballots, effects, results, score messages.
  - src/locales/id/roles.json: role/modifier display names, objectives, and private ability instructions.
  - src/locales/id/rules.json: complete player-facing rule explanations.
  - src/locales/id/avatars.json: animal display labels, keyed by stable animal IDs.
  - Future resources use matching files under src/locales/en/. Do not add empty or incomplete English packs to the selectable language list.

- **Display-text rules**
  - Write short, casual Indonesian for teens. Use familiar words and direct instructions; keep all game conditions, limits, role names and privacy steps accurate. Role descriptions, private hints, guide steps, errors and event summaries follow the same tone.
  - Fixed user-facing text, including button labels, placeholders, toast/error copy, dialogs, alt text, and ARIA labels, comes from JSON language resources.
  - Components reference stable translation keys. Engine events and validation errors expose stable codes plus parameters, translated at the presentation boundary.
  - Internal enums, IDs, asset paths, and role logic stay language-independent.
  - Player names and secret words remain literal data; never use them as translation keys or automatically translate them.
  - Familiar role names may retain their established spelling as values in roles.json; still provide Indonesian descriptions and never inline those labels in components.
  - Required Indonesian keys cannot be missing in a release. Fallback is runtime resilience, not a substitute for complete resources.

- **Word assets**
  - public/words/id.json: editable Indonesian source of truth; at least 100 release triples.
  - public/words/en.json: future separately curated English word pack; not required or enabled initially.
  - Do not define playable dictionaries in TS/TSX files, reducers, components, or fallback arrays. Test fixtures may be small synthetic examples separate from production content.
  - Load word JSON through a base-aware static asset URL compatible with the repository path on GitHub Pages.
  - A JSON file is a static asset, not a server API. Cache it explicitly for offline play.

- **Word JSON schema**
  - Root schemaVersion: positive integer describing the file format.
  - Root contentVersion: nonempty version string; change when editing published content.
  - Root locale: language code matching this pack, initially id.
  - Root sets: array of triple objects.
  - Each triple: id, categoryId, difficulty, wordA, wordB, foolWord.
  - Optional aliasesA and aliasesB: arrays of curated accepted Mr. White answers for the corresponding word; omitted arrays mean no extra aliases.
  - id: stable, unique within the pack. Keep existing IDs when correcting wording; use a new ID for a new semantic triple.
  - categoryId: stable key with a matching category label in common.json.
  - difficulty: easy, medium, or hard; translate their display labels through the UI pack.
  - wordA/wordB/foolWord: nonempty distinct strings after normalization. A/B are similar; Fool is related but different.
  - Keep words, aliases, and relationships manually curated in the pack's language. Do not machine-translate a triple at runtime.
  - Category labels are edited in the UI JSON; adding an existing-category triple requires only the word JSON.

- **Validation and loading**
  - Use Zod for shape/metadata validation; check IDs, categories, difficulty, duplicate/empty normalized words, aliases, and locale consistency.
  - Validate source JSON and required translation keys in CI through the planned validate:content command; report filename, set ID/index, and field.
  - Reject invalid packs before assignment. Show an Indonesian error with retry/recovery options; do not substitute invented hardcoded words.
  - Keep the bundled source immutable during a session. In-app custom triples are separate localStorage data using the same schema, not writes to the hosted JSON.
  - Store word language, contentVersion, selected words, and aliases in the active match snapshot. Resource updates affect subsequent matches only.
  - Namespace recent IDs/custom content by word language, so matching IDs across future languages do not interfere.

- **Manual word maintenance workflow**
  1. Open public/words/id.json in a text editor.
  2. Add/edit/remove complete triples; preserve valid JSON without comments or trailing commas.
  3. Update category labels in common.json only if adding a category; increment contentVersion.
  4. Run content validation and tests; inspect semantic fairness and accepted aliases.
  5. Build and redeploy the static site. No application-code changes are needed for normal word edits.
  6. Let the new service-worker/content version apply between matches; ongoing matches retain their snapshots.

- **Future English addition workflow**
  1. Copy the five Indonesian namespaces to src/locales/en/ and translate their values while preserving keys/placeholders.
  2. Register English and its resources in the JSON locale manifest; the resource loader must discover registered files without changes to gameplay code.
  3. Validate key coverage, interpolation/plural forms, layout expansion, and fallback behavior before enabling the locale.
  4. If English words are desired, curate public/words/en.json and register that word pack separately. English UI alone does not create English word content.
  5. Add the enabled-language selector in settings when more than one complete UI locale exists; keep word-language selection explicit when multiple packs exist.
  6. Default word language to the selected UI language only when its pack exists; otherwise retain an explicitly selected available pack. Never mix words or silently change an active match.
  7. Rebuild/redeploy and verify offline resources. English translation content itself is outside the initial release.

- **Acceptance**
  - Every screen, error, role explanation, animal label, and accessibility label works in Indonesian from JSON resources.
  - Updating valid word JSON changes the available dictionary after deployment; no source-code dictionary exists.
  - Missing/corrupt word assets cannot create a match with undefined or fallback words; existing match snapshots still resume safely.
  - Translation resource validation catches missing keys/placeholders; simulated longer text does not clip controls.
  - Indonesian packs work offline and under a GitHub Pages repository path; unsupported locales fall back safely.
