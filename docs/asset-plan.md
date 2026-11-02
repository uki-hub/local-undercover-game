# Undercover — 3D asset delivery plan

- **Required result**
  - Ten original, recognizable, articulated low-poly animals, matching the depth and friendly expression of [the goal](./goal-design.png).
  - Each has a working live Three.js representation, a neutral preview portrait, a yawn, blinking, and species-specific idle motion.
  - The original procedural rigs live in `src/avatars`. All ten captured previews and their verification results are available in the [asset evidence](./evidence/avatar-verification.md).

- **Default construction path**
  - Build original procedural animals from low-poly geometry and articulated transform groups in Three.js/React Three Fiber.
  - Share reusable eye, eyelid, ear, muzzle, jaw, paw, and material components where applicable.
  - This is the default implementation path; it does not require Blender, paid downloads, or an external asset service.
  - GLB assets may replace procedural models when equivalent quality, licensing, framing, and animations are verified. Export to GLB is optional.
  - Preserve an asset manifest abstraction so the rest of the game does not depend on the source format.
  - Every animal must be recognizable without its label. Generic spheres, emoji, and a screenshot masquerading as a live avatar do not complete this milestone.

- **Roster and distinguishing features**
  - Cat: triangular ears, short muzzle, whiskers; ear twitch and paw stretch.
  - Pig: rounded snout with nostrils, folded ears; nose wiggle and head bob.
  - Monkey: contrasting facial patch, rounded ears, expressive brow; head scratch and shoulder stretch.
  - Chicken: short beak, red comb and wattles, rounded wings; head bob and wing stretch. Visually distinct from Owl.
  - Bear: broad head, small round ears, short muzzle; sleepy head dip and shoulder stretch.
  - Raccoon: dark eye mask, pointed snout, rounded ears; paw rub and curious head tilt. Use canonical asset ID raccoon.
  - Dog: broad muzzle, distinctive floppy/perked ears; head tilt and pant.
  - Snake: legless coiled silhouette, elongated neck, forked tongue; tongue flick and coil sway. Frame the head prominently.
  - Owl: large forward eyes, facial disk, feather shapes; head turn and feather ruffle.
  - Rat: large round ears, pointed snout, visible whiskers; nose twitch and paw grooming.
  - All ten also support a brief blink, a recognizable mouth/jaw yawn, and gentle neutral movement.
  - Indonesian display labels: Kucing, Babi, Monyet, Ayam, Beruang, Rakun, Anjing, Ular, Burung Hantu, Tikus.
  - Store these display labels in the `avatars` JSON translation namespace; model/manifest code uses stable animal IDs and translation keys.

- **Style and framing**
  - Shape the brow, cheek and muzzle as connected planes. The tuxedo cat's blaze, the bear's tan snout and the raccoon's eye mask follow the contours of the head. Layered irises and catchlights keep the gaze readable in small cards.
  - Faceted low-poly silhouettes, matte materials, friendly eyes, soft shadows, consistent camera angle and scale.
  - Animal-specific natural colors are allowed; use blue/gray circular backgrounds coordinated with the interface.
  - Face and upper torso sit inside the circular badge; ears/head may rise above it.
  - Separate background disk from the animal. Mask the bottom to the circular edge while preserving upper overflow.
  - Keep all extreme poses within the badge's allocated safe bounds; never obscure names, words, or touch targets.
  - Match perceived head size across species; a snake or owl must not appear miniature beside the bear.

- **Animation contract**
  - Common actions: neutral idle, blink, yawn, selection reaction; additional named species idles.
  - Articulate the jaw/mouth for yawn, eyelids for blink, and relevant joints for species motion.
  - Procedural transform/morph animation and authored clips are both valid. Both need smooth easing and neutral-pose restoration.
  - Common action names are stable in the manifest; list available species actions per animal.
  - Schedule short idle actions every roughly 5–12 seconds with varied timing; avoid immediate repeats.
  - Only the featured live avatar runs idle actions; grid previews may scale/bounce on interaction.
  - Tick frames only during active motion; stop between clips. Pause on hidden/offscreen views.
  - Cosmetic randomness is separate from gameplay randomness; reduced motion renders the static neutral pose.
  - No action hints at player identity, secret word, vote, guilt, or an upcoming elimination.

- **Preview pipeline and loading**
  - Generate matching transparent WebP portraits by rendering the actual models in neutral poses through a reproducible local capture task.
  - Preserve the same camera, lighting, framing, and materials across previews and live scenes.
  - Manifest includes stable ID, display-label translation key, source kind, model key/URL, preview URL, camera/framing data, available animations, and attribution if needed.
  - Use one persistent live canvas with selected-model replacement, shared resources, lazy loading, and cleanup.
  - Bundle all neutral previews for instant selection and offline fallback.
  - Model/animation loading failures or lost WebGL contexts fall back to the matching preview without stopping the match.
  - Procedural geometry lives with application source; GLBs, previews, fonts, and licenses live under explicit asset folders with base-aware URLs.

- **Budget and provenance**
  - Treat 300 KB per externally packaged model as an optimization target, not permission to omit rigging or essential motion.
  - Reuse geometry/materials, limit mesh counts, and measure frame time on phone-sized views before adding postprocessing.
  - Prefer simple lighting and cheap soft/contact-style shadows over expensive render effects.
  - Record authorship/licensing of every external model, font, or texture. Original procedural models require no purchased assets.

- **Completion evidence**
  - Contact sheet showing all 10 neutral animals.
  - Browser capture or short preview demonstrating yawn/blink and one species motion for every animal.
  - Checks for lower crop, upper overflow, consistent scale, recovery after repeated actions, and reduced motion.
  - No final avatar is a temporary placeholder; missing models/animations remain explicitly unfinished work.
