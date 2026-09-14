# Real Madrid — fan identity

**Shipped.** White/navy/gold with bold athletic type. Deliberately does not reproduce the club's
actual crest artwork anywhere — colors, typography, and a generic star motif only (see
"Distinctive elements" below for exactly what that means in practice).

## Fonts

`https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&display=swap`

- Heading: `'Bebas Neue', sans-serif` — bold condensed, jersey-numeral-esque
- Body: `'Barlow', sans-serif`

## Tokens (`src/styles/tokens.css`)

| Token | Light (default) | Dark |
|---|---|---|
| bg / surface / surface-raised | `#FFFFFF` | `#0B1330` / `#121B3D` |
| border | `#E2E6ED` | `#26315E` |
| text | `#14213D` | `#F2F4FA` |
| text-muted | `#6B7690` | `#8892B8` |
| text-faint | `#9CA6BC` | `#5C6690` |
| primary | `#0A3D91` (royal blue) | `#3B6FD1` |
| primary-text | `#FFFFFF` (blue is dark enough in both modes) | `#FFFFFF` |
| success | `#2E8B57` | `#4CD68B` |
| danger | `#D6433C` | `#FF6B6B` |
| danger-strong | `#B4291E` | `#FF4D3D` |
| warning / gold | `#D9A404` | `#F2B705` |
| info / flag-blue | `#0A3D91` (same as primary — no separate info hue needed) | `#3B6FD1` |
| card shadow | `none` | `none` |

## Distinctive elements

Implemented in `components/layout/AppHeader.vue` (not tokens — these are markup, gated on
`themeStore.themeId === 'realmadrid'`):

- **3 small inline SVG stars** (a plain 5-point star path, not a club crest) in `--color-gold`,
  next to the text "Hala Madrid" — a nod to fan culture and trophy count, not a reproduction of any
  specific badge artwork.
- **A 2-color stripe** (`--color-primary`, `--color-gold`) directly under the header.

The original mockup (`designs`-style source, not shipped) also had a faint dotted
"starfield" texture behind the header in dark mode — that detail did **not** make it into the real
`AppHeader.vue`/`ThemeAccent.vue` implementation. Only the stars + stripe above are actually live;
don't assume the mockup and the shipped component are pixel-identical beyond what's listed here.
