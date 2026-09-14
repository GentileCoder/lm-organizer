# Editorial — magazine

No card chrome at all: hairline rules, an oversized serif "hero" number for the month's balance,
underlined-by-weight text tabs instead of pills — a print-magazine-spread mood. **This is one of the
two directions with a real structural blocker** (see below), not just an unbuilt palette.

## Fonts

`https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,500&family=Source+Sans+3:wght@400;500;600;700&display=swap`

- Heading/display: `'Playfair Display', serif` — classic editorial serif, used italic for
  section titles
- Body: `'Source Sans 3', sans-serif`

## Tokens

| Token | Light | Dark |
|---|---|---|
| bg | `#FFFFFF` | `#121212` |
| text | `#111111` | `#F2F2F2` |
| muted | `#6E6E6E` | `#9A9A9A` |
| rule color (replaces border) | `#DADADA` | `rgba(255,255,255,.16)` |
| accent | `#D1263B` (editorial red) | `#FF4757` |
| success | `#2F6B4F` | `#4CAF7D` |
| danger / info | same as accent — a deliberately reduced palette, not an oversight | same as accent |
| button bg / text | `#111111` / `#FFFFFF` | `#F2F2F2` / `#121212` |

## Why this one wasn't shippable as just a token swap

Every other explored direction (built or not) still uses the app's existing card/list structure —
a `.card` box with a background, border, and padding. Editorial's whole visual identity comes from
**not having that box at all**: content is separated by thin 1px rules and whitespace, with one
oversized "hero" number (`38px` Playfair) pulled out asymmetrically next to smaller supporting
figures, and task rows are plain hairline-divided lines, not rounded cards. Applying this theme's
colors/fonts to the *existing* card-based components would just look like a re-colored version of
every other theme — the actual identity lives in layout, not tokens. Shipping this for real means
building a second layout mode (no-card variant) for every list/stat-grid/card component in the app,
which is real, additional engineering work beyond what the 7 shipped themes needed.
