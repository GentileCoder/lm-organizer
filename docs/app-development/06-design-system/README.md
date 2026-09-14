# Personal design system — not built yet

This is a placeholder for a **future cross-app** system. What already exists is
[`lm-organizer-design-system.md`](lm-organizer-design-system.md) — a complete writeup of LM
Organizer's *actual, current, single-app* design (colors, type, spacing, components), documented in
the same shape as `docs/frontend_building/AAXON_OS_DESIGN_SYSTEM.md`. That document describes what's
real today. This one is about whether/when that gets generalized into something a second app could
also use.

The intent (stated explicitly, not yet acted on): a personal design system for Alejandro's own apps,
structured the same way `docs/frontend_building/AAXON_OS_DESIGN_SYSTEM.md` is structured — a single
authoritative source for color tokens, type scale, spacing/radii/elevation, motion, and component
anatomy — but with **its own name, own palette, and own typography**, not a copy of AAXON's actual
values. AAXON's document is a good structural template to follow; its brand is not.

`lm-organizer-design-system.md` is the natural seed for this, if/when it happens — it's already
real, already documented, and already close to scale-shaped (see that doc's §7) even though it isn't
tokenized as a formal scale yet.

> **Note:** `lm-organizer-design-system.md` still describes the single-theme system as it existed
> right after the Vue migration. Since then the app grew into a **7-theme, light+dark selectable
> system** (`src/styles/tokens.css`, `src/theme/themes.js`) — the doc hasn't been updated to match
> yet. Treat it as a description of the *original* shipped look, not the current one, until it's
> revised.

All 13 explored directions now have matching per-theme documentation, split by whether they shipped:

- [`themes/`](themes/) — the **7 shipped** themes (Deepwork, Paper, Pulse, Sunset, Real Madrid,
  Cuba, Brazil), values copied from the live `src/styles/tokens.css`, plus exactly which decorative
  touches (stars, stripes, the Sunset glow) actually made it into `AppHeader.vue`/`ThemeAccent.vue`
  versus what only existed in the original mockup.
- [`designs/`](designs/) — the **6 that weren't shipped** (Bloom, Block,
  Aurora, Terminal, and Editorial/Swiss — the two that hit a real structural limitation rather than
  just not being chosen), so their full color/font specs survive independent of any chat session or
  Claude Design artifact link.

## Why this isn't written yet

A design system is only worth having once there's a real second (or third) app that needs to look
consistent with the first — building one preemptively for a single app is the same mistake as
installing Tailwind/Element Plus "just in case" (see
`../01-frontend-vue/stack-and-structure.md`). LM Organizer's current styling
(`src/styles/tokens.css`) is a small, app-specific token layer, deliberately *not* generalized into a
reusable system yet.

## What to define, when it's time

Following the AAXON doc's shape (see that file for the full structure this is patterned after):

1. **Identity** — a name for the system, and the handful of decisions that won't change per-app:
   default light or dark, a two-typeface rule (one display face for headings, one UI face for
   everything else) or a one-typeface rule, an icon set.
2. **Color tokens** — semantic names (`--color-primary`, `--color-surface`, `--color-danger`, …),
   not raw hex sprinkled through components. Both light and dark values, using AAXON's convention of
   a transparent-overlay `-subtle` tint in dark mode rather than a flat lighter color, if that
   approach is kept.
3. **Type scale** — a fixed set of `--text-*` sizes and named semantic classes (`.text-h2`,
   `.text-body`, `.text-caption`) so components never hardcode a font-size.
4. **Spacing/radii/elevation/motion scales** — small, fixed sets, not ad hoc per-component values.
5. **Component anatomy** — for each shared component (Button, Card, Input, Badge, Modal, …): exact
   variants, sizes, states (hover/focus/disabled/loading), and the specific "don't do this" rules
   that prevent inconsistency (e.g. AAXON's "never add a `label` prop to a button for convenience").
6. **Branding vs. theming as two independent axes**, if this system is ever meant to serve more than
   one "brand" of Alejandro's own apps — color scheme (light/dark) and brand accent color should
   never be conflated into the same switch. Likely unnecessary for a personal system serving apps
   that all share one identity; only add this axis if that stops being true.

## Where this will live once started

`docs/app-development/06-design-system/tokens.md`, `components.md`, etc. — mirroring the structure
above, once there's a concrete palette/typography decision and a second app to actually validate it
against.

## Open decisions for whenever this gets started

- Primary accent color — LM Organizer no longer has just one; it now ships 7 selectable identities
  (see `../lm-organizer-design-system.md`'s stale-notice above). A cross-app system would need its
  own single answer, independent of any one theme's choice.
- Default color scheme — no longer dark-only; every LM Organizer theme now has both light and dark.
  A cross-app system still needs its own default, but "does it need to support light mode at all"
  is already answered (yes) by the app itself.
- Typeface pairing — LM Organizer now uses a different pairing per theme rather than one system
  face; a cross-app system would need to pick just one (or its own small set).
- Icon set — LM Organizer's real app still uses plain emoji for nav/section icons (the Claude
  Design mockups avoid emoji per that tool's own content rules, which don't apply to the shipped
  app) — keep that low-effort approach, or standardize on an icon library like `lucide-vue-next`
  the way the AAXON spec does?
