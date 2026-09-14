# Block — neo-brutalist

Thick black borders, flat bold colors, hard offset "sticker" shadows — a graphic, confident,
poster-like mood. Uses the same card-based layout as the live app (borders/shadows instead of
elevation), so no structural blocker to shipping this later.

## Fonts

`https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Mono:wght@400;700&display=swap`

- Heading/display: `'Archivo Black', sans-serif` — ultra-bold, uppercase-friendly
- Body/labels: `'Space Mono', monospace`

## Tokens

Uses its own token shape rather than the shared 13-token set the shipped themes use — brutalism
here is built from a smaller, more literal palette (mostly ink + one accent), not a full semantic
set:

| Token | Light | Dark |
|---|---|---|
| bg | `#F2F0EA` | `#121212` |
| surface (cards) | `#FFFFFF` | `#1A1A1A` |
| border | `#111111` (2–3px, not hairline) | `#F5F3EE` |
| text | `#111111` | `#F5F3EE` |
| accent | `#FF4D2E` | `#FF4D2E` (constant — vivid enough on both) |
| ink (button fill) | `#111111` | `#F5F3EE` |
| ink text | `#F5E03F` | `#111111` |
| shadow color | `#111111` | `#F5F3EE` |

A fixed highlight yellow (`#F5E03F`) is used for a category-dot accent in the mockup, not tokenized
— treat it as a literal accent color if this gets built for real.

## Shape / distinctive elements

- **Borders, not hairlines**: 2–3px solid borders everywhere, never `1px`.
- **Hard offset shadows**: `4px 4px 0 <shadow color>` — a flat "sticker" shadow with zero blur,
  the opposite of the shipped themes' soft/none shadow treatment.
- **Zero or near-zero border radius.**
- Dark mode inverts border/shadow color (black → off-white) rather than dimming — a deliberate
  choice so the thick-border graphic language stays legible against a dark background.
