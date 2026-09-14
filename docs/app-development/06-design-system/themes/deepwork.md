# Deepwork — refined dark

**Shipped.** The default theme, and the closest evolution of the app's original navy/gold identity
— same family of colors, but with real depth (soft shadows, absent from the original), a richer
navy, and a warmer, more saturated amber.

## Fonts

`https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Manrope:wght@400;500;600;700&display=swap`

- Heading: `'Space Grotesk', sans-serif` — geometric, technical
- Body: `'Manrope', sans-serif`

## Tokens (`src/styles/tokens.css`)

| Token | Dark (default) | Light |
|---|---|---|
| bg | `#0A0D14` | `#F5F6F8` |
| surface | `#10141C` | `#FFFFFF` |
| surface-raised | `#171D28` | `#FFFFFF` |
| border | `#232B38` | `#E1E4EA` |
| text | `#EDEFF3` | `#12141A` |
| text-muted | `#8A94A6` | `#6B7280` |
| text-faint | `#5C6474` | `#9CA3AF` |
| primary | `#E3A03D` | `#C9861E` |
| primary-text | `#0A0D14` (dark text — amber is too light for white text) | `#FFFFFF` |
| success | `#4FC38A` | `#2F9563` |
| danger | `#E2604D` | `#C94A32` |
| danger-strong | `#FF6B6B` | `#E0392A` |
| warning | `#D98C2B` | `#B9790F` |
| info | `#5B9EE8` | `#3B7FC4` |
| card shadow | `0 8px 20px rgba(0,0,0,.28)` | `0 8px 20px rgba(16,20,28,.08)` |

`--color-gold` and `--color-flag-blue` (used by the fan-identity themes' decorations) are set equal
to `primary`/`info` here — Deepwork has no decorative motif of its own, so these just need a sane,
harmless value.

## Distinctive elements

- Real elevation: every `.card`/`.sc` gets a soft shadow — the one clearly "upgraded, not just
  recolored" element versus the app's original flat design.
- No decorative header elements (`ThemeAccent.vue`/`AppHeader.vue`'s fan-identity block both render
  nothing for this theme).
