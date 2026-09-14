# Bloom — soft pastel

Light, low-contrast, cozy — a "personal journal / calm wellness app" mood, in the same card-based
layout the live app already uses (no structural blocker to shipping this as a real theme later).

## Fonts

`https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700&family=Nunito+Sans:wght@400;600;700&display=swap`

- Heading: `'Quicksand', sans-serif` — soft, rounded geometric
- Body: `'Nunito Sans', sans-serif`

## Tokens

| Token | Light | Dark |
|---|---|---|
| bg | `#F4F1FA` | `#211C2E` |
| surface / raised | `#FFFFFF` | `#2A2438` |
| border | `#E4DEF2` | `#453C5C` |
| text | `#3A3550` | `#EDE9F5` |
| muted | `#8D84A8` | `#A79BC4` |
| accent (primary) | `#9B87C4` | `#B39EDD` |
| accent text | `#FFFFFF` | `#211C2E` |
| success | `#7FA98A` | `#8FC49A` |
| danger | `#D98484` | `#E29A9A` |
| info | `#7FA9C9` | `#9AC4DE` |
| card shadow | `0 10px 24px rgba(155,135,196,.18)` | `0 10px 24px rgba(0,0,0,.35)` |
| input bg | `#FFFFFF` | `#2A2438` |

Dark mode uses a muted plum instead of black, keeping the palette soft rather than switching to a
harsh dark mode — that's the one deliberate design call in this direction beyond direct color
inversion.

## Shape / distinctive elements

- Very generous rounding — `18px` cards, pill (`999px`) tabs and buttons, larger than the shipped
  themes' shared `--radius-lg` (12px).
- Soft, diffused shadows with a colored tint (`rgba(155,135,196,...)` in light mode) rather than a
  neutral black shadow.
- No other decorative motifs — palette and shape alone carry the identity.
