# Terminal — retro CRT

A retro terminal-window look: scanlines, a blinking cursor, `KEY.......VALUE` dot-leader stats,
checklist-style `[ ]` task rows — the most different compositional treatment among the four
non-structural directions here (Bloom/Block/Aurora keep the card grammar; Terminal replaces cards
with a bordered "terminal panel" and plain-text report formatting). Would need real component
markup changes (dot-leader alignment, `[ ]` checklist rendering, the terminal window chrome) beyond
a pure token swap — more than Bloom/Block/Aurora, less than Editorial/Swiss's full layout rebuild.

## Fonts

`https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap`

One monospace family throughout — no heading/body split, matching a real terminal's single
typeface.

## Tokens

| Token | Dark (CRT default) | Light ("paper terminal") |
|---|---|---|
| bg | `#05100A` | `#F4ECD8` |
| surface (panels) | `#0B1F14` | `#EFE3C4` |
| border | `#1C3B2A` | `#D8C39A` |
| text | `#4AFF9E` (phosphor green) | `#7A4A12` (sepia/amber-brown) |
| muted | `#2E8F63` | `#A67C3D` |
| accent | `#B6FFDA` | `#B8651B` |
| success | `#4AFF9E` | `#5B7A3A` |
| danger | `#FF6B6B` | `#B23A2E` |
| info | `#4AD9FF` | `#4A7A8C` |
| scanline opacity | `1` | `0` |

The "light mode" here isn't a conventional light theme — it's a second retro palette (amber
monochrome monitor / sepia paper), which is why scanlines are toggled off rather than restyled: they
only make sense against the CRT-green dark mode.

## Distinctive elements (would need component work, not just tokens)

- A terminal "window chrome" bar with three small dots + a filename (`organizer.sh`).
- `repeating-linear-gradient` scanline overlay, opacity driven by the `dark` toggle.
- A blinking cursor (`@keyframes blink`, `step-start`, 1s) next to the input field.
- Stats rendered as `LABEL....... value` with literal dot-leader characters, not a stat-tile grid.
- Task rows as `[ ] Task name    time` instead of card rows with a done-toggle circle.
