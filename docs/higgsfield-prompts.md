# Image prompts

## Status (2026-11-16)
Higgsfield couldn't be used from Claude Code (0 credits; the free trial only works in Claude chat, Cowork and ChatGPT), so the images were generated with Canva instead.
- Welcome image removed at the owner's request (a small framed picture added nothing). In the app: `assets/images/mikveh-night-water.jpg` (banner of the mikveh-night card).
- Generated in Canva but not downloaded at full size (Canva quota ran out): the candle (Canva media `MAHbGobTatc`) and the moon phases over the hills (`MAHbGlmMJVE`). Later replaced by images the owner generated: `all-set-candle.jpg` and `empty-calendar-moons.jpg` (cropped above the Old City skyline).

## Original prompts

Generation was blocked on 2026-11-16: the account had 0 credits and the plan's free generations weren't available.
Three images are in `assets/images`; the moon glyph (`MoonPhase`) stays drawn in code.
If you add them later, save them in `assets/images/` as WebP at twice the display size. Their edges must blend
into the page color `#FBF8F5` (or `#1F2246` for the night images).

Model: `gpt_image_2_6`, quality medium. Every prompt ends with:
"No people, no figures, no faces, no text, no letters, no logos, no watermark."

1. **welcome-evening.webp** (3:4, welcome screen)
   Painted background art, calm modern animated-film style: a window at dusk with a linen curtain moved by a little
   breeze, a thin crescent moon over Jerusalem stone rooftops, first stars. Palette warm linen #FBF8F5 fading to
   deep indigo #1F2246 at the top, moon cream #F3E7C9, a touch of dusty rose #A8485F in the sky. Window and moon
   in the upper half; the lower third calm linen color for the buttons.

2. **all-set-candle.webp** (1:1, onboarding "your calendar is ready")
   One white candle burning on a stone windowsill as night falls, soft warm light, indigo sky outside with a
   crescent moon. Same palette. Subject centered, generous calm space around it, edges fading to #FBF8F5.

3. **empty-calendar-sky.webp** (16:9, calendar empty state)
   A quiet night sky with the moon in several phases faintly arranged in an arc, like a lunar month, over a low
   line of Jerusalem hills. Palette indigo #1F2246, cream #F3E7C9. Very calm, lots of empty sky.

4. **mikveh-night-water.webp** (3:2, background of the "tonight is mikveh night" card)
   Still water in a stone pool seen through an arched opening, a deep indigo night sky with a full moon, moonlight
   laying a pale gold path across the water. Palette #1F2246, #F3E7C9, a little dusty rose. Moon and arch in the
   upper third; calm dark water in the lower half where the card text sits.
