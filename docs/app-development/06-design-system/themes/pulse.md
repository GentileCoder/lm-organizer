# Pulse — bold modern SaaS

**Shipped.** Near-black, high-contrast, a vivid violet accent — dense and confident, closer to a
Linear/Vercel-style dashboard than a personal-organizer aesthetic.

## Fonts

`https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap`

- Heading: `'Sora', sans-serif` — bold geometric
- Body: `'IBM Plex Sans', sans-serif`

## Tokens (`src/styles/tokens.css`)

| Token | Dark (default) | Light |
|---|---|---|
| bg | `#08090B` | `#F7F7F9` |
| surface / surface-raised | `#121316` (same tone for both — no distinct raised step) | `#FFFFFF` |
| border | `#2A2D33` | `#E3E4E8` |
| text | `#F2F3F5` | `#101114` |
| text-muted | `#9096A1` | `#6B6F7A` |
| text-faint | `#5C606B` | `#9CA0AA` |
| primary | `#7C5CFC` | `#6A46F2` |
| primary-text | `#08090B` (dark text — the dark-mode violet is too light for white text) | `#FFFFFF` |
| success | `#34D399` | `#16A672` |
| danger | `#FB5A5A` | `#E0433D` |
| danger-strong | `#FF3B3B` | `#C22E28` |
| warning | `#F5A623` | `#C97A0A` |
| info | `#4C9EFF` | `#2F7DE0` |
| card shadow | `none` | `none` |

## Distinctive elements

- `surface` and `surface-raised` are the same value — the mockup's dashboard used hairline
  `1px` dividers between stat cells (a shared border color between adjoining cells) rather than a
  separate "raised" tone; the shipped theme keeps that flatter, denser feel.
- No decorative header elements.
