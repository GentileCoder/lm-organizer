# Sunset — warm gradient

**Shipped.** The one theme whose background is a gradient, not a flat color — verified to work
because every real usage of `--color-bg` in the codebase is the `background:` shorthand, which
accepts a `linear-gradient(...)` value directly (see `body` in `styles/base.css` and the lock
screen in `LoginView.vue`).

## Fonts

`https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&family=Mulish:wght@400;500;600;700&display=swap`

- Heading: `'DM Sans', sans-serif`
- Body: `'Mulish', sans-serif`

## Tokens (`src/styles/tokens.css`)

| Token | Light (default) | Dark |
|---|---|---|
| bg | `linear-gradient(160deg, #FFD9A0 0%, #FF9A76 45%, #FF6F91 100%)` | `linear-gradient(160deg, #2B1B3D 0%, #5A2A4D 45%, #8A3B4D 100%)` |
| surface / surface-raised | `rgba(255,255,255,0.82)` | `rgba(20,10,25,0.55)` |
| border | `rgba(255,255,255,0.9)` | `rgba(255,255,255,0.1)` |
| text | `#4A2A2E` | `#FCE9E4` |
| text-muted | `#8C6B6E` | `#C9A7B0` |
| text-faint | `#B79599` | `#95737C` |
| primary | `#E8503A` | `#FF8A5B` |
| primary-text | `#FFFFFF` | `#2B1B3D` (dark text — the dark-mode coral is too light for white text) |
| success | `#3FA66B` | `#5FCB8D` |
| danger | `#D6455B` | `#FF6B81` |
| danger-strong | `#B22E42` | `#E0435C` |
| warning | `#C97A1E` | `#E8A34A` |
| info | `#D98A3D` | `#FFB37A` |
| card shadow | `0 10px 28px rgba(180,80,60,.2)` | `0 10px 28px rgba(0,0,0,.35)` |

## Distinctive elements

- **The only theme with a background gradient**, and the only one with a decorative background
  element: `components/layout/ThemeAccent.vue` renders a `position: fixed`, `filter: blur(50px)`
  glowing circle (colored via `--color-primary`) in the top-right corner, `z-index: -1` so it sits
  behind all real content. Every other theme renders nothing from that component.
- Translucent surfaces (`rgba(...)` backgrounds) so the gradient shows through cards slightly —
  the "glassy" read comes from opacity, not `backdrop-filter` blur (that was Aurora's device, not
  shipped — see `../designs/aurora.md`).
