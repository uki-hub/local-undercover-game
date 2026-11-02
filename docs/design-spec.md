# Undercover — visual and interaction specification

- **Approved target**
  - [goal-design.png](./goal-design.png) is the user-supplied visual goal, copied unchanged from the attachment.
  - Reference dimensions: 1536 × 1024; it is a design board showing three separate mobile screens.
  - Recreate its visual language through functional components; each phone displays one current game screen.
  - Its fox, rabbit, and panda are sample artwork. Implement only the approved cat/pig/monkey/chicken/bear/raccoon/dog/snake/owl/rat roster.

- **Visual character**
  - Premium, playful, friendly; tactile depth from layered surfaces, rounded corners, lighting, and restrained shadows.
  - White and cool gray form the surfaces; saturated blue marks primary actions and selection.
  - Very dark navy/gray text, readable contrast, clear large headings, generous spacing.
  - Animals use natural warm colors. Setup and ordinary input screens retain white/blue/gray; public event scenes use the role palettes described below.
  - Preserve the goal's raised blue buttons, thin luminous blue outlines, soft ambient shadows, and circular animal badges.

- **Language and copy**
  - All interface text is Bahasa Indonesia for the initial release, including errors, role instructions, rule explanations, placeholders, and accessibility labels.
  - Use short, casual sentences that teens can scan. Prefer familiar wording such as “pura-pura tahu”, “keluar”, and “offline” over formal terms. Keep role names, win conditions, limits and privacy instructions clear.
  - The Indonesian copy quoted below is a design target; store it in JSON translation resources and render through i18next/react-i18next.
  - Use stable keys and complete translated sentences with placeholders for player names/counts; avoid concatenated sentence fragments.
  - Animal/role/category labels come from their language-pack keys, not model code or enum names.
  - Allow natural text wrapping and longer future English strings; no fixed-width text containers that clip translations.
  - Expose no English language option until its resources are supplied and enabled; see the [language-pack plan](./language-and-word-packs.md).

- **Starting tokens — tune by comparison**
  - Primary blue approximately #0875FF; deep accent #0754DC; ink #10162E.
  - Page #F4F8FC; surface #FFFFFF; muted surface #EAF1F8; secondary text #67758E; pale blue #CFE3FF.
  - Spacing rhythm: 4/8/12/16/24/32 pixels. Small screen horizontal padding around 20 pixels.
  - Cards approximately 20–28 pixel radii; major controls approximately 18–24 pixels; badges circular.
  - Body text 16–18 pixels; major headings approximately 28–36 pixels; word reveal approximately 36–48 pixels, shrinking safely for phrases.
  - Use one self-hosted, licensed rounded sans-serif family with strong bold weights; record its license.
  - Tokens are implementation starting points, not a reason to ignore the reference appearance.

- **Phone layout**
  - Target portrait 360–480 CSS pixels wide; validate 320-pixel width and 360×640/390×844/430×932 viewports.
  - Constrain the game column on wider screens; one screen remains centered.
  - Use safe-area padding and a viewport strategy that tolerates mobile browser chrome and keyboard changes.
  - Keep primary actions near the bottom when space permits; allow content to scroll on smaller screens without overlap.
  - Landscape gets a gentle portrait suggestion with reachable controls, rather than an assumed browser orientation lock.
  - Touch targets at least 44×44 pixels; no essential hover gestures.
  - Reserve reveal-card space in both concealed/held states so the hold control does not jump. At short phone heights (690 CSS pixels or less), omit the decorative reveal portrait/icon and use compact copy. Long custom words shrink while remaining readable. Test the held content itself, not only controls after release.

- **Reference screen 1 — player setup**
  - Brand at top, settings access, large Siap bermain? heading.
  - Two-column player card grid: circular animal badge, visible name, selected outline.
  - Tap a player to edit name/avatar; changing the avatar updates their card.
  - Add-player action, player-count validation, bottom Lanjut control leading to role settings.
  - Avatar picker shows all 10 choices, selected state, name, and live selected preview.
  - Longer rosters scroll; names and actions remain distinguishable when avatars repeat.
  - Provide a Beranda action from the roster. Preserve unsaved player/custom-word drafts across panel navigation until explicit save/cancel; reload is outside draft persistence.

- **Step-by-step setup**
  - Show one step at a time: Pemain → Peran → Kata → Waktu. Remove the “Pilihan mode” preset cards.
  - A compact numbered breadcrumb bar sits above the heading on every setup step, including player editing. Use an ordered navigation list, chevrons, a blue current-step marker and `aria-current="step"`; each step is a clickable button with at least a 44×44 touch target.
  - Lanjut/Kembali move sequentially. The bar can jump to any step without losing saved choices or unsaved player drafts. Settings/rules return to the same step. Step changes scroll to the top and focus the main content.
  - Peran contains role counts/toggles and conditional Fool options. Kata contains word source/category/difficulty and pool feedback. Waktu contains optional clue/discussion timers and the only Bagikan peran action.
  - Invalid role combinations block Peran's Lanjut; missing/empty word pools block Kata's Lanjut. Validate all settings again on Waktu; jumping ahead cannot enable an invalid start. Provide a direct correction action to the relevant step.

- **Reference screen 2 — private reveal**
  - Entry state: named handoff only; explicit readiness action before exposing a personal card.
  - Personal screen: Giliran [name], prominent animal badge, secret card, hold-to-reveal control, Selesai, oper ponsel action.
  - Concealed card shows neutral content. Held Warga/Undercover cards display the assigned word with no base-role name, emblem or faction-colored art. Fool/White explicitly display their role. Include abilities and Couple partner in this same card; reminders use the same disclosure rules.
  - Mr. White and a Fool configured without a word see their respective no-word instructions, without an empty word element; permanent modifiers have short separate private instructions.
  - Secret content disappears before any exit transition or handoff; animate card chrome rather than lingering text.
  - A faint pressed halo communicates the hold gesture without obstructing the word.

- **Reference screen 3 — action voting**
  - Round badge, surviving-player avatar strip, Apa selanjutnya? heading.
  - Large Voting and Petunjuk lagi choice cards; private choice plus explicit confirmation.
  - Use the goal's raised blue/outlined white treatment as emphasis; neither choice is submitted automatically or preselected.
  - Named handoff between voters. After all vote, show the selected action only.
  - Survivor strips include visible names so repeated avatars remain identifiable on touch devices.
  - The extra-clue limit removes this ballot after the additional clue round; display a clear transition to elimination voting.

- **Other required screens**
  - Home: resume available match, start setup, rules, offline-ready status, settings access.
  - Home also offers an optional four-step guide. Settings offers confirmed score reset outside unfinished games. Failed storage reads/writes show a localized in-memory-play notice outside held-card layouts.
  - Role settings: counts/toggles and invalid-combination explanations, followed by separate word and timer steps.
  - Enabling Fool reveals two independent toggles: “Fool mendapat kata” and “Fool boleh mulai dulu”. Both start on. Helper copy explains the third-word/no-word choice and first-round opener eligibility. Hiding Fool or changing setup steps preserves these preferences.
  - New matches skip the introduction round; private word handoffs contain all personal information together. Legacy introduction saves remain supported.
  - Public ready/clue/discussion: current speaker, Mime gesture cue, survivors, optional timer, advance controls.
  - Dedicated Mime splash: prominent player name/portrait, Mime emblem, current round, gesture-only instructions and first speaker. Show after dealing and after each reassignment; its primary action starts clues directly.
  - Elimination ballot: living target cards, selection, confirm; exclude current voter.
  - Tie reel: public portraits/names or action art scroll past a fixed gold pointer. A fast start becomes a long deceleration. Dark burgundy turns red with double-beat pulses, subtle zoom/bounce, an ECG trace and an impact burst. The centered card and explicit named result agree.
  - Justice decision: tied candidates only and an explicit confirmation.
  - Elimination/effects: affected player, role reveal, understandable ordered death chain.
  - Revenge choice: valid living targets only. Mr. White guess: one text entry, clear confirmation and outcome.
  - Results: dedicated victory splash, then roles/assigned words, scores, rematch/setup. A no-word Fool shows “Tanpa kata” instead of the unused third word. Fool is a terminal solo winner.
  - Settings/rules/custom content: match the same component system and survive small-screen scrolling.

- **Avatars and motion**
  - Follow the [asset plan](./asset-plan.md): actual low-poly 3D, expressive eyes, consistent camera/lighting, upper overflow and lower circular crop.
  - Animate button compression, selected-card springs, screen entrance, avatar reactions, suspense-reel movement and results celebration.
  - Feedback around 80–140 ms; ordinary screen transitions around 180–300 ms. Tie reel lasts 6.6 seconds; near-stop heartbeat effects begin at 3.3 seconds and intensify at 5.1. Skip remains available throughout and snaps to the committed card. Reduced motion bypasses all suspense movement/pulses.
  - Transitions support the current action; block duplicate submissions without blocking essential controls for long flourishes.
  - Featured animals blink/yawn/perform species idles; previews in lists stay inexpensive.
  - Reduced motion removes large movements and idle clips while keeping clear state changes.
  - Cosmetic animal motion remains independent of role, word, vote, and game outcome. Role/event animations illustrate already committed public events.
  - Full-phone event palettes: green Warga victory, violet Undercover, ice-blue White, gold/orange Fool, rose Couple, purple Justice, red revenge/death, blue clues and slate draw/failed guess. Header and safe areas inherit the scene palette.
  - Justice uses animated ivory wings behind floating scales; Fool and faction wins use confetti; deaths use stylized falling red droplets; Couple uses floating hearts. Emblems enter with a brief scale/tilt spring and gently hover. No flashing effects.
  - Elimination scenes put the affected player's name in the heading and spell out role(s), cause and next effect in sentences; chain entries include each player's role. Justice/revenge/guess summaries name the actor. Continue actions are immediate. Never auto-dismiss. Motion preferences preserve static art, text and color.

- **Visual acceptance**
  - Compare setup, held reveal, and action voting screenshots to the approved board at the same logical phone width.
  - Assess spacing, hierarchy, card depth, avatar composition, blue emphasis, typography, and bottom controls, not exact image pixel identity.
  - Check longest player names, multiword secrets, 20-player lists, keyboard display, missing model previews, and disabled/pressed states.
  - Inspect every generated screen after implementation; save representative screenshots and list any visible gaps.
