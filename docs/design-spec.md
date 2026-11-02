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
  - Animals may have natural warm colors as in the goal; the interface palette remains white/blue/gray.
  - Preserve the goal's raised blue buttons, thin luminous blue outlines, soft ambient shadows, and circular animal badges.

- **Language and copy**
  - All interface text is Bahasa Indonesia for the initial release, including errors, role instructions, rule explanations, placeholders, and accessibility labels.
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

- **Reference screen 2 — private reveal**
  - Entry state: named handoff only; explicit readiness action before exposing a personal card.
  - Personal screen: Giliran [name], prominent animal badge, secret card, hold-to-reveal control, Selesai, oper ponsel action.
  - Concealed card shows neutral content. Held state displays the assigned word; no faction label for Civilian/Undercover/Fool.
  - Mr. White sees their no-word instructions; permanent modifiers have short separate private instructions.
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
  - Role settings: counts/toggles, preset descriptions, invalid-combination explanations, categories/difficulty, optional timers.
  - Private introductions: partner name or neutral readiness text, with identical public handoff treatment for everyone.
  - Public ready/clue/discussion: current speaker, Mime gesture cue, survivors, optional timer, advance controls.
  - Elimination ballot: living target cards, selection, confirm; exclude current voter.
  - Tie wheel: equal candidate segments, selected result, quick skip preserving that result.
  - Justice decision: tied candidates only and an explicit confirmation.
  - Elimination/effects: affected player, role reveal, understandable ordered death chain.
  - Revenge choice: valid living targets only. Mr. White guess: one text entry, clear confirmation and outcome.
  - Results: main winner, Fool personal result, all roles/three words, scores, rematch/setup.
  - Settings/rules/custom content: match the same component system and survive small-screen scrolling.

- **Avatars and motion**
  - Follow the [asset plan](./asset-plan.md): actual low-poly 3D, expressive eyes, consistent camera/lighting, upper overflow and lower circular crop.
  - Animate button compression, selected-card springs, screen entrance, avatar reactions, wheel movement, results celebration.
  - Feedback around 80–140 ms; ordinary screen transitions around 180–300 ms; wheel around 1.5–2.5 seconds.
  - Transitions support the current action; block duplicate submissions without blocking essential controls for long flourishes.
  - Featured animals blink/yawn/perform species idles; previews in lists stay inexpensive.
  - Reduced motion removes large movements and idle clips while keeping clear state changes.
  - All motion remains independent of role, word, vote, and game outcome.

- **Visual acceptance**
  - Compare setup, held reveal, and action voting screenshots to the approved board at the same logical phone width.
  - Assess spacing, hierarchy, card depth, avatar composition, blue emphasis, typography, and bottom controls, not exact image pixel identity.
  - Check longest player names, multiword secrets, 20-player lists, keyboard display, missing model previews, and disabled/pressed states.
  - Inspect every generated screen after implementation; save representative screenshots and list any visible gaps.
