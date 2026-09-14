# Swiss — International Typographic Style

Strict grid, zero rounded corners, one red accent, hairline rules, generous whitespace — the
other direction with a real structural blocker (same reason as Editorial, see below), not just an
unbuilt palette.

## Fonts

`https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;700;900&display=swap`

One grotesque family at multiple weights (400/500/700/900) throughout — no heading/body split,
matching the classic Swiss-design convention of one typeface family carrying the whole hierarchy
through weight alone (the same way real International Typographic Style work uses Helvetica/Akzidenz
at every weight rather than pairing two families).

## Tokens

| Token | Light | Dark |
|---|---|---|
| bg | `#FFFFFF` | `#0D0D0D` |
| text | `#111111` | `#F2F2F2` |
| muted | `#767676` | `#8A8A8A` |
| rule color (replaces border) | `#DDDDDD` | `rgba(255,255,255,.16)` |
| accent | `#E63328` | `#FF3B2F` |

Only 5 tokens total — by far the smallest palette of any direction explored, deliberately: Swiss
design communicates almost entirely through grid, alignment, and one accent color, not a semantic
color system. Stat "cards" here are just grid columns separated by a `1px` vertical rule, with a
big `900`-weight numeral — no background, no border, no radius at all.

## Why this one wasn't shippable as just a token swap

Same underlying issue as Editorial: **zero corner radius and no card backgrounds at all** — every
section is separated by a rule line or whitespace, never a box. The live app's shared `.card`/`.sc`
utility classes assume a background + border + radius; Swiss's identity is specifically the
*absence* of those. A faithful version needs the same kind of second, chrome-less layout mode
Editorial would need, not a set of new token values. Also, unlike every other explored direction,
this one uses **no rounded corners anywhere** — the live app's shape tokens (`--radius-*`) are
shared across all 7 shipped themes precisely because they're all in the "rounded, friendly" family;
Swiss would need its own zero-radius override on top of a new layout, doubling the work relative to
Editorial.
