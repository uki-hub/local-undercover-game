# Intense tie-break reel — implementation plan

1. Replace the circular wheel presentation with a case-opening-style horizontal reel. Use public player portraits/names or action artwork, never hidden roles/words.
2. Animate a fast start and long deceleration into the already committed candidate. Synchronize near-stop zoom/bounce and dark-to-red heartbeat pulses. End with an impact burst and an explicit named outcome.
3. Keep the engine's `wheel` phase and stored outcome. Animation, skip, resize and reload never draw randomness. Skip snaps to the committed result; acknowledgement applies it. OS/app reduced motion shows that static result immediately.
4. Verify landing geometry for 2–20 candidates, action/player ties, all candidate indexes, reload/skip, phone sizes, motion preferences and public secrecy. Update rules/design/technical docs and capture visual evidence.

Local work only. No assets, dependencies or deployment required.

Completed. Typecheck, lint, content validation, production build, 40 unit tests and all 29 browser tests passed. Inspected the actual-motion [near-stop](./evidence/tie-reel-intense-390.png) and [result](./evidence/tie-reel-result-390.png) captures. [Verification](./evidence/verification.md#suspense-reel-verification)
