# Shipped themes

The 7 real, selectable themes live in the app today — pick one from the in-app **Settings** screen,
each with its own light and dark mode. This folder documents them the same way
[`../designs/`](../designs/) documents the 6 that weren't shipped, so the
full set of 13 explored directions has matching documentation regardless of which ones made it into
the app.

**Source of truth is always `src/styles/tokens.css`** — every value below was copied from there,
not from the original Claude Design mockups (a few tokens, like `--color-primary-text` and
`--color-warning`, were added during implementation and don't appear in the mockups at all — see
each file for what's genuinely new versus carried over).

| Theme | Mood | File |
|---|---|---|
| Deepwork | Refined dark navy + amber, the closest evolution of the app's original look | [`deepwork.md`](deepwork.md) |
| Paper | Warm editorial, cream/terracotta light, dim-brown dark | [`paper.md`](paper.md) |
| Pulse | Bold near-black SaaS dashboard, vivid violet accent | [`pulse.md`](pulse.md) |
| Sunset | Warm gradient background, glassy cards | [`sunset.md`](sunset.md) |
| Real Madrid | Fan-identity theme — white/navy/gold, athletic type | [`real-madrid.md`](real-madrid.md) |
| Cuba | Fan-identity theme — Havana palette, flag-echoing stripe | [`cuba.md`](cuba.md) |
| Brazil | Fan-identity theme — canarinho yellow, flag-echoing stripe | [`brazil.md`](brazil.md) |

See `../../../TROUBLESHOOTING.md` and `../lm-organizer-design-system.md`'s stale-notice for how this
multi-theme system came together and what's now out of date in the older single-theme writeup.
