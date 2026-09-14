# Explored but not built

13 visual directions were designed and compared for LM Organizer in a Claude Design canvas before
7 were picked and actually shipped as real, selectable themes (see
[`../lm-organizer-design-system.md`](../lm-organizer-design-system.md) for those). These 6 weren't
chosen — but the full spec for each is captured here so they aren't lost to a session or an
artifact link going stale. Every value below was pulled directly from the mockup source, not from
memory.

| Design | Why it isn't a real theme today |
|---|---|
| [`bloom.md`](bloom.md) | Not selected — soft pastel wasn't the direction picked, no structural issue |
| [`block.md`](block.md) | Not selected — neo-brutalist wasn't the direction picked, no structural issue |
| [`aurora.md`](aurora.md) | Not selected — glass/gradient wasn't the direction picked, no structural issue |
| [`editorial.md`](editorial.md) | **Structural mismatch**: no card chrome at all — building it for real means a second layout mode for every list/card in the app, not just new colors (see `../../06-design-system` root notes on this) |
| [`terminal.md`](terminal.md) | Not selected — retro CRT wasn't the direction picked, no structural issue |
| [`swiss.md`](swiss.md) | **Structural mismatch**, same reason as Editorial — hairline-rule layout, not cards |

Bloom, Block, Aurora, and Terminal could become real themes the same way the 7 shipped ones were —
add their block to `src/styles/tokens.css`, add the theme to `src/theme/themes.js`, done. Editorial
and Swiss would need the layout work described in the root design-system doc first; their color/font
spec below is still accurate whenever that's worth doing.

Each file's colors/fonts are copy-pasteable directly into `tokens.css` in the same shape as the 7
live themes, if any of these get promoted later.
