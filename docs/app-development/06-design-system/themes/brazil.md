# Brazil — fan identity

**Shipped.** Canarinho yellow as the primary accent against green and flag-blue, with a friendly
rounded display face — a deliberately different typographic mood from Real Madrid's condensed
athletic type, even though both are football-adjacent themes. Uses national-team colors and a
well-known nickname/stat ("Pentacampeão" — five World Cup titles), not any federation crest artwork.

## Fonts

`https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Poppins:wght@400;500;600;700&display=swap`

- Heading: `'Baloo 2', sans-serif` — bold, rounded, playful
- Body: `'Poppins', sans-serif`

## Tokens (`src/styles/tokens.css`)

| Token | Light (default) | Dark |
|---|---|---|
| bg | `#FFFDF5` | `#081C2E` |
| surface / surface-raised | `#FFFFFF` | `#0F2A3F` |
| border | `#E3EFE0` | `#1F4661` |
| text | `#0A2E52` (flag blue) | `#F2F7F2` |
| text-muted | `#748577` | `#8FA8A0` |
| text-faint | `#A8B8A6` | `#5C7A72` |
| primary (canarinho yellow) | `#FFCC29` | `#FFCC29` (constant — yellow reads well on both) |
| primary-text | `#0A2E52` (dark navy — yellow is too light for white text, in **both** modes) | `#0A2E52` |
| success (green) | `#00A859` | `#2ECC71` |
| danger | `#E2543D` | `#FF6B5B` |
| danger-strong | `#C23D28` | `#E0392A` |
| warning | `#D9930A` | `#E0A83A` |
| info / flag-blue | `#0A2E52` (same as text) | `#4A90D2` |
| gold | `#F2B705` | `#FFCC29` |
| card shadow | `none` | `none` |

## Distinctive elements

Implemented in `components/layout/AppHeader.vue`, gated on `themeStore.themeId === 'brazil'`:

- **5 inline SVG stars** (`--color-gold` fill) in a row below the title, next to the label
  "Pentacampeão" — the same pattern Real Madrid uses (count + label in a `fan-row`), just with a
  different count and label reflecting Brazil's own well-known nickname.
- **A 3-color stripe** under the header: `success (green), primary (yellow), flag-blue` — echoing
  the flag's three main hues, the one fan-identity stripe with three bands instead of two (Real
  Madrid) or five (Cuba).
