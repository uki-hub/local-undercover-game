# Avatar verification · 2 November 2026

Run `npm run avatars` from the repository root. It starts its own loopback Vite server, captures the rigs with Chromium, writes ten transparent 416 × 416 WebP portraits under `public/assets/avatars`, then checks the actual React Three Fiber badge. Set `CHROMIUM_EXECUTABLE_PATH` to choose a desktop browser binary, or install Playwright Chromium. Windows also checks the standard Google Chrome installation.

- [Neutral roster](./avatar-roster.webp) and [animated roster](./avatar-motion.webp). The reel cycles through neutral, blink, yawn and one species-specific clip for all ten animals.
- [Live Cat at 240 CSS pixels](./avatar-live.png). An open upper mask preserves the ears and a separate circular disk clips the lower chest.
- Resculpted all ten original rigs with species-specific head contours, coat markings and portrait poses. The lower jaw and mouth lining move together during yawns. Static and live portraits share the same studio lights and camera.
- Verified all 66 manifest clip entries render a changed midpoint and return pixel-for-pixel to neutral. Tested upper-edge transparency at quarter, midpoint and three-quarter poses. Raised the raccoon's framing after its ears clipped in the first capture.
- Verified live rendering for all ten, reusing the same canvas through model changes and screen replacement. Checked draw calls stop between clips, offscreen and during a simulated hidden-document event. Both system and in-game reduced motion show WebPs. Forced WebGL context loss and checked static fallback on the current and subsequent screen.
- Tested Chrome 156.0.8078.79 on Windows with Intel Iris Xe (D3D11), including a 390 × 844 viewport. Neutral poses submitted 4,332–5,671 triangles across 14–26 main-pass draws. Four-frame batches at 288 × 288 with GPU readback averaged 0.91 ms per render on this desktop. The ten transparent previews total 171,364 bytes.
- Physical mobile GPU, battery and touch behavior still require device testing.
