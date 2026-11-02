# Undercover — implementation rules

- **Purpose**
  - Definitive behavior for the first release; these are this game's custom rules.
  - Cosmetic avatars, animations, timers, and presentation never change assignments or outcomes.
  - Initial game language is Bahasa Indonesia. All fixed display copy uses the JSON language packs defined in the [content/localization specification](./language-and-word-packs.md).

- **Roster and configuration**
  - 3–20 players; names required, trimmed, case-insensitively unique, 1–20 characters.
  - Each player selects one of the 10 cosmetic avatars; repeated avatars allowed.
  - Each player receives one base role: Civilian, Undercover, Mr. White, or Fool.
  - Require at least one Undercover and more Civilians than Undercover + Mr. White initially.
  - At most one Mr. White and one Fool; their counts are configurable between zero and one.
  - At most one Justice, one Revenger, one Couple pair; each player gets at most one permanent modifier.
  - Couple members must be distinct and cannot be Fool. Justice and Revenger may overlay any base role.
  - Mime is temporary, can overlap a permanent modifier, and excludes Mr. White.
  - Assign roles randomly after validating that all constraints can be satisfied.
  - Select the Couple from eligible players, then Justice/Revenger from players without a permanent modifier.
  - Treat assignments as immutable for the match; only Mime ownership rotates.

- **Starting presets — playtest defaults**
  - Classic, 6 players: 5 Civilians, 1 Undercover; other roles/modifiers off.
  - Light chaos, 6 players: 4 Civilians, 1 Undercover, 1 Fool; Mime on.
  - Medium chaos, 8 players: 5 Civilians, 2 Undercover, 1 Fool; Mime, Justice, Revenger on.
  - Full chaos, 10 players: 6 Civilians, 2 Undercover, 1 Mr. White, 1 Fool; every modifier on.
  - Presets require their listed roster size. For other sizes, validate custom counts before starting; never silently alter selected counts.

- **Words and disclosure**
  - Select one Indonesian triple: A/B are similar; C is different but shares plausible context with both.
  - Randomly map A/B to Civilian/Undercover once per match. Every member of a base role receives its mapped word.
  - Fool always receives C; Mr. White receives no word.
  - Never shuffle all three words indiscriminately or give different Undercover players different words.
  - Show word cards without Civilian/Undercover/Fool labels; the recipient does not know which of those identities they hold.
  - Show Mr. White explicitly, including the bluffing and final-guess instructions.
  - Show permanent abilities privately; clearly explain their effect and personal win objective where relevant.
  - Before any word is revealed, run a private introduction handoff for every player. Couple members see their partner's name; others see neutral readiness text. This avoids publicly exposing who belongs to the Couple.
  - Then run individual named word handoffs; each secret is visible only while its reveal control is held.

- **Word content and selection**
  - Load the bundled Indonesian dictionary from editable `public/words/id.json`; application code must not contain a duplicate or fallback playable word list.
  - Example: pulpen / pensil / papan tulis; sendok / garpu / piring; bantal / guling / kasur.
  - At least 100 curated triples; familiar Indonesian, short phrases allowed, no offensive or obscure vocabulary.
  - Categories include school, home, kitchen, food/drink, clothing, animals, and transport; display Indonesian labels.
  - Difficulty reflects semantic closeness and clue overlap, not spelling length.
  - Validate IDs, metadata, nonempty entries, pairwise-distinct normalized words, and explicit guess aliases.
  - Custom triples use the same schema and validation; persist locally and allow editing/deleting outside active matches.
  - Category/difficulty filters must leave a nonempty available pool; otherwise explain the setup error.
  - Word source can include bundled and local sets or local custom sets only. Category/difficulty filters apply to either source. An empty custom-only pool blocks starting/rematching, without a bundled fallback. Old settings default to the combined pool.
  - Exclude the last 20 used triple IDs where possible. If exhausted, choose the least recently played available triple; randomize equal-recency ties.
  - Snapshot the selected triple, aliases, word language, and pack version into the match so later content edits or UI language changes cannot change an ongoing game.
  - New word languages require their own curated JSON pack; never translate an active match or mix languages within a triple.

- **Clue and discussion phase**
  - After all reveals, assign the first Mime publicly, if enabled, and show the public ready screen.
  - First speaker is uniformly random among living players, including Mr. White.
  - Keep a stable circular order. At each new elimination cycle, rotate the starter to the next living player.
  - During an extra clue round, keep the current cycle's order.
  - Each living player gives one spoken clue; Mime gestures instead. The app shows whose turn it is.
  - No secret-word repetition, spelling, translation, or writing; Mime additionally cannot speak.
  - Clues happen in person. No audio recording, automatic judging, or text submission.
  - After the clue round, allow discussion, then run action voting.
  - Timers are optional and off by default; configurable clue/discussion durations. Expiry prompts advancement but never automatically eliminates anyone.
  - Pause timers while hidden; resume remaining time on return.
  - During public ready/clue/discussion screens, a living player may re-read their pinned card through player selection, a named handoff and hold-to-reveal. This pauses the visible timer and preserves the turn and match progress. The reminder is unavailable during ballots, death effects and results. Interruptions conceal it; reload returns to the saved match phase without reopening the reminder.

- **Action voting**
  - Each living player privately chooses Voting or Petunjuk lagi; one confirmed vote each.
  - A named handoff precedes every ballot; confirmed choices cannot be viewed or edited by subsequent players.
  - Strict majority chooses the action. A tie uses an equal-probability wheel between the two actions.
  - Justice never participates as a tie breaker in this ballot.
  - Reveal the resulting action only, with no vote counts or individual choices.
  - Voting starts elimination ballots. Petunjuk lagi starts one more clue/discussion round.
  - After that extra round, proceed to elimination voting; do not offer another action ballot this cycle.
  - A new cycle starts after a completed elimination sequence; its extra-clue allowance resets.

- **Elimination voting and ties**
  - Each living player privately selects one other living player; no self-votes, abstentions, or votes by eliminated players.
  - Freeze voter/target eligibility at ballot creation; reject duplicate, wrong-phase, or out-of-turn submissions.
  - Highest vote total is eliminated. A tie means two or more players share that highest total.
  - If a living Justice exists and is not a tied candidate, reveal Justice's modifier and request a choice among tied candidates only.
  - If Justice is dead, absent, or tied, use the wheel with equal probability for every tied candidate.
  - No revote or no-elimination fallback; this version always resolves a completed elimination ballot.
  - Freeze tied candidates and commit a wheel result once. Animation, skip, backgrounding, or reload must not draw again.
  - Reveal the selected player and base role, plus applicable modifiers/death effects. Keep all words hidden until match end.
  - Never show raw totals, vote breakdowns, or vote identities.

- **Fool**
  - A direct voting elimination grants a personal win, recorded immediately and scored at match completion.
  - Revenge and linked partner deaths do not grant this win.
  - The match continues; Fool remains eliminated and cannot vote or give clues.
  - Fool is neutral, excluded from both faction counts, and earns no ordinary faction points.

- **Mr. White**
  - Direct voting elimination grants exactly one typed guess of the Civilian word.
  - Normalize case, Unicode, and repeated/outer spaces. Accept the canonical answer or a curated alias only; no fuzzy matching or automatic synonym inference.
  - Wrong guess: remain eliminated; continue resolution. Do not reveal the correct word.
  - Correct guess: record a solo terminal claim; finish any pending partner/revenge effects before showing the final result.
  - Offer this direct-vote guess before draining the pending death queue; the eliminated player can still have a queued Revenger effect.
  - Death from other causes grants no guess. Mr. White otherwise belongs to the impostor faction.

- **Couple**
  - Members know each other's names before word reveals; base roles and words remain private.
  - Their objective replaces ordinary faction objectives: finish as the only two living players.
  - Any death of either member kills the other through the death queue.
  - While both survive, suppress ordinary faction victories, even if a faction would otherwise win.
  - If only those two survive, Couple wins. If the pair breaks, resume ordinary victory checks after the full death queue resolves.
  - An intact pair's underlying base roles still supply their words; they do not receive an extra shared word.

- **Revenger and death queue**
  - Every death is processed once, identified by player ID and cause.
  - Mark the player dead, enqueue linked partner death first, then the dead Revenger's pending choice if applicable.
  - Revenger chooses any other currently living player; the choice is mandatory unless none exists.
  - Process the target's death through the same queue; a coupled target also kills their partner.
  - Remove stale/dead targets before displaying a revenge choice; never kill or trigger a player twice.
  - Only the initial direct vote death can trigger Fool victory or a Mr. White guess.
  - Freeze normal gameplay while death effects or choices remain unresolved; persist pending choices for reload safety.

- **Mime**
  - Publicly assign to an eligible living player after initial word reveals.
  - Owner gives all their clues through gestures until reassignment.
  - Rotate once after the entire elimination cycle, including all linked deaths, if the match continues.
  - Select randomly among eligible living players not used in the current rotation cycle.
  - When exhausted, start a new eligible pool; avoid the immediately previous Mime if another option exists.
  - Skip gracefully if no eligible player remains. Death chains do not cause multiple rotations.

- **Final evaluation — after all effects resolve**
  1. Correct Mr. White claim: that player wins solo; previously earned Fool personal win remains recorded.
  2. No survivors: main result is a draw; previously earned Fool personal win remains recorded.
  3. Exactly two survivors who are the intact Couple: Couple victory.
  4. Intact Couple with additional survivors: continue playing, suppressing faction victories.
  5. At least one living Civilian and no living impostors: Civilian victory.
  6. At least one living impostor and impostor count at least living Civilian count: impostor victory.
  7. Only a neutral Fool survives: draw; survival does not grant Fool victory.
  8. Otherwise: continue to the next cycle.

- **Scoring and results**
  - Award one point per winning faction member, including eliminated members; exclude Couple members and Fool from ordinary faction awards.
  - Couple victory awards one point to each partner. Mr. White solo victory awards one point to that player only.
  - Fool direct-vote personal win adds one point regardless of the eventual main result.
  - Score once per match ID; reloads and repeated result events cannot award again.
  - A confirmed session-score reset is available before a match or after results, never during unfinished play. Clear points while retaining the scored-match ledger, roster, preferences and word history; old results must not re-award reset points.
  - At match end reveal every player's base role, modifiers, and all three words, including an unused Fool word if no Fool was enabled.
  - Rematch preserves names, avatars, settings, and session scores; clear votes/effects, select a fresh triple, and reshuffle all roles.
  - Eliminated players never reenter the match or participate in public decisions.

- **Privacy and interruption invariants**
  - Every private screen enters concealed with the current player's name; no previous player's selections remain mounted.
  - Secret reveal clears immediately on release, pointer cancel, focus loss, hidden page, navigation, and resume.
  - Provide an accessible press-and-hold equivalent that conceals on key release/blur; do not make secrets permanently toggled by default.
  - Persist progress, not reveal visibility; reloads require another named handoff.
  - Results and public screens must not contain hidden private words in accessible labels or stale outgoing DOM.
  - Confirm restart/end-match actions. Browser Back must not become an undo path into old private screens.
