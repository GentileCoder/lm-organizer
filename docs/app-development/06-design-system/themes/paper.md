# Paper — warm editorial

**Shipped.** A full inversion of Deepwork: warm cream light mode with an italic serif touch, and a
dark mode that stays warm (a dim brown-black, not navy) rather than becoming a generic dark theme.

## Fonts

`https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,500;0,600;1,500&family=Karla:wght@400;500;600;700&display=swap`

- Heading: `'Newsreader', serif` — used italic for section titles in the mockup
- Body: `'Karla', sans-serif`

## Tokens (`src/styles/tokens.css`)

| Token | Light (default) | Dark |
|---|---|---|
| bg | `#FAF6EF` | `#1C1712` |
| surface / surface-raised | `#FFFFFF` | `#241E17` / `#2C2419` |
| border | `#E8E0D2` | `#3D3427` |
| text | `#2B2620` | `#F0E9DD` |
| text-muted | `#8A7F6C` | `#A69A87` |
| text-faint | `#B0A48D` | `#7D735F` |
| primary | `#C1622D` | `#E08249` |
| primary-text | `#FFFFFF` | `#1C1712` (dark text — the lighter dark-mode terracotta needs it) |
| success | `#5B8A5A` | `#7FB07E` |
| danger | `#B0453A` | `#D9705F` |
| danger-strong | `#8F2E24` | `#C24B3A` |
| warning | `#B08A2E` | `#D1A855` |
| info | `#4A7A8C` | `#6FA3B5` |
| card shadow | `none` | `none` |

## Distinctive elements

- No card shadow in either mode — cards are just a `1px` border, no elevation, matching the flat
  "printed page" feel.
- No decorative header elements.
