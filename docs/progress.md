# Development log

Read the handoff and six linked specifications. Inspected the approved three-screen board. The original workspace contained documentation and images only. Implemented the static React 19 game at the repository root. The round engine owns random outcomes. Procedural models supply live animals and captured preview portraits.

| Checkpoint | Implementation and verification |
| --- | --- |
| Scaffold | React 19, Fiber 9, Vite, Tailwind 4, Motion, Zustand, Zod and bundled i18next namespaces installed. Local production preview serves the project subpath. |
| Visual direction | Built the three reference screens, then inspected 390 × 844 captures. Enlarged portraits, headings and action cards and adjusted vertical spacing. |
| Classic game | Named introductions, word handoffs, clues, discussion, private ballots, committed wheel, elimination, scores and rematch connected. Six-player civilian win and offline rematch passed in Chrome. |
| Chaos and content | All eight roles/modifiers implemented. Seventeen engine/content/resume tests passed, including 72 seeded complete games. The editable Indonesian pack contains 112 triples across seven categories. |
| Avatars | Resculpted and captured all ten models. All 66 clips changed the rendered pose, cleared the upper edge and returned to neutral. [Avatar verification](./evidence/avatar-verification.md) |
| Privacy and offline | Browser flows passed held-card release/cancel/blur, interrupted choices, session reload, corrupt/unavailable storage, offline match completion and cold offline reopen. |
| Deployment preparation | Manual publication gate added. Production build, content validation, typecheck and lint passed. See the [verification record](./evidence/verification.md) for final coverage and limits. |
| QA follow-up | Fixed clipped/jumping held cards, panel draft loss, missing roster Home navigation, the aggregate engine timeout and listed build warnings. Added storage-failure notice, visible survivor names, confirmed score reset, custom-only words, private card reminders and a four-step guide. Updated rule/design/technical/README documentation. Typecheck, lint, content validation, production build, 36 unit tests and 18 browser tests passed; held-state regression covers four phone sizes. |
