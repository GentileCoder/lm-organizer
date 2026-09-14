# Aurora — glass & gradient

Frosted-glass panels floating over a violet/teal gradient mesh, glowing accent dots — a modern
"glassmorphism" mood. Uses the same card-based layout as the live app (glass panels stand in for
cards), so no structural blocker to shipping this later — the main added cost vs. the other
non-structural directions is real: `backdrop-filter: blur()` on many simultaneous cards has a real
performance cost on lower-end phones that the flat-color themes don't, worth testing on an actual
device before shipping this one.

## Fonts

`https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Work+Sans:wght@400;500;600&display=swap`

- Heading: `'Outfit', sans-serif` — modern rounded geometric
- Body: `'Work Sans', sans-serif`

## Tokens

| Token | Light | Dark |
|---|---|---|
| bg (gradient) | `linear-gradient(135deg, #EAF2FF 0%, #F3ECFF 50%, #FFF0F6 100%)` | `linear-gradient(135deg, #0E1030 0%, #1B1240 50%, #2B0F3A 100%)` |
| glass panel bg | `rgba(255,255,255,0.55)` | `rgba(255,255,255,0.07)` |
| glass border | `rgba(255,255,255,0.7)` | `rgba(255,255,255,0.14)` |
| text | `#1D2036` | `#F1F0FA` |
| muted | `#6B7290` | `#9C9BC4` |
| accent (primary) | `#6C5CE7` | `#8B7CFF` |
| accent text | `#FFFFFF` | `#0E1030` |
| success | `#16A38A` | `#2FE0B8` |
| danger | `#E2554B` | `#FF6B6B` |
| info | `#2FA7DE` | `#5CC8FF` |
| card shadow | `0 8px 32px rgba(108,92,231,.18)` | `0 8px 32px rgba(0,0,0,.4)` |

## Shape / distinctive elements

- Every panel is `background: <glass bg>` + `backdrop-filter: blur(14–16px)` + a translucent
  white border — this is the one direction that leans on blur/translucency as its core visual
  device, not just a color palette.
- Accent dots (event/task indicators) get a matching `box-shadow: 0 0 8px <color>` glow.
- `16px` card radius, `999px` pill tabs/buttons/inputs.
