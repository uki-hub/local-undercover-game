# Role reveals and event scenes — implementation plan

Requested 2 November 2026. This change supersedes the earlier hidden-base-role, introduction-round, and nonterminal Fool defaults.

Follow-up plan: hide Warga/Undercover labels and emblems on private word/reminder cards; continue revealing Fool, White and special abilities. Add a persisted `mimeReveal` splash after dealing and each new Mime assignment, then begin clues directly. Make elimination summaries explicitly state name, role, cause and next effect; add names to Justice/revenge/guess messages. Verify privacy, round/reload behavior, summaries and small-phone layouts; update current rules and evidence. This correction supersedes base-role disclosure in the original plan below.

1. **Inspect existing behavior.** Read handoff, rules, design/technical specs, engine, match/setup screens, persistence, Indonesian copy, and existing tests. Complete before implementation.
2. **Simplify the opening.** Start new games/rematches in `word`, retaining named handoffs and hold-to-reveal privacy. Include base-role emblem/name, word, ability, and Couple partner in the same private card. Keep legacy `intro` snapshots readable.
3. **Terminal solo wins.** Direct voting elimination gives Fool the sole victory. A correct Mr. White guess gives Mr. White the sole victory. These end play immediately and cancel pending death choices; indirect Fool/White deaths do not grant solo wins. Score once per match, including across reloads.
4. **Shared visual language.** Add original SVG emblems for all four base roles and four modifiers. Use in setup, held cards, abilities, public role reveals, and scores. Cosmetic animal avatars remain independent of roles.
5. **Event scenes.** Add reusable full-screen themed presentation and decorative effects. Cover action decisions, each role's elimination, partner/revenge deaths, Justice summons, revenge summons/target selection, correct/incorrect guesses, round/Mime announcements, and each victory/draw. Use gold/orange for Fool, red for revenge/death, purple winged scales for Justice, and distinct faction/solo victory palettes. Continue buttons remain available without waiting for animation.
6. **Reliable transitions.** Persist Justice/revenge announcements and victory splash as explicit engine phases. Animation never commits choices or random results. Public scenes contain no secret words before the final scoreboard. Respect OS/app reduced motion, safe areas, and 320px phones.
7. **Verification and docs.** Update engine/browser coverage for opening, terminal claims, queued-effect cancellation, announcements, reloads, private-card concealment, reduced motion, and small screens. Run typecheck, lint, content validation, unit tests, production build, and relevant browser checks. Update handoff, rules, technical/design specs, README and verification/progress records.

Local repository work only; no publication.

Completed, including the follow-up correction. Typecheck, lint, content validation, 40 unit tests, production build and 26 browser tests passed. [Verification and visual evidence](./evidence/verification.md#disclosure-mime-and-summary-follow-up). Physical-device checks remain listed in that record.
