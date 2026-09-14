# Cuba — fan identity

**Shipped.** A script logotype and a warm Havana palette in light mode; a "tropical night" teal-navy
in dark mode. Uses national colors and a generic star motif — not any specific emblem artwork.

## Fonts

`https://fonts.googleapis.com/css2?family=Pacifico&family=Rubik:wght@400;500;600;700&display=swap`

- Heading: `'Pacifico', cursive` — script, evokes hand-painted Havana signage. Used only for the
  app title and the "This month"-style section labels — never for small UI text (stat values,
  buttons, tabs all stay on the body face), since a script face reads poorly at small sizes.
- Body: `'Rubik', sans-serif`

## Tokens (`src/styles/tokens.css`)

| Token | Light (default) | Dark |
|---|---|---|
| bg | `#FFF7EC` | `#0F2A3D` |
| surface / surface-raised | `#FFFFFF` | `#1E4459` |
| border | `#E3DCC9` | `#2C566E` |
| text | `#1F2A44` | `#F5F0E4` |
| text-muted | `#8C8471` | `#9DB3BE` |
| text-faint | `#BFB79E` | `#6B8590` |
| primary (flag red) | `#E4402E` | `#FF6B5B` |
| primary-text | `#FFFFFF` (red is dark enough in both modes) | `#FFFFFF` |
| success | `#2E9E62` | `#4FC98A` |
| danger | `#E4402E` (same as primary — Cuba reuses one red for both) | `#FF6B5B` |
| danger-strong | `#B82E1F` | `#D9432E` |
| warning | `#D9930A` | `#E8A83A` |
| info (turquoise) | `#1FA9A0` | `#3FD6C6` |
| gold | `#D9930A` | `#F5C542` |
| flag-blue | `#1B4B93` | `#4A8FE0` |
| card shadow | `0 8px 20px rgba(31,42,68,.08)` | `0 8px 20px rgba(0,0,0,.3)` |

## Distinctive elements

Implemented in `components/layout/AppHeader.vue`, gated on `themeStore.themeId === 'cuba'`:

- **One inline SVG star** (`--color-gold` fill, 14×14) rendered directly **inline with the title**
  (`My Organizer`) — this is the one fan-identity theme where the star sits next to the title
  itself rather than in a separate row below it (Real Madrid and Brazil both use a below-title row
  with a count + text label; Cuba has no such row).
- **A 5-band stripe** under the header echoing the flag's proportions:
  `flag-blue, white, primary (red), white, flag-blue`.
