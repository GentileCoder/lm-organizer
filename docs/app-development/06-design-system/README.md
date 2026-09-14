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

- Primary accent color (LM Organizer currently uses `#C9A227`, a muted gold — keep, or pick
  something new and distinct from any one app's identity?)
- Default color scheme (LM Organizer is dark-only today — does the system need to support light
  mode at all, or standardize on dark-first?)
- Typeface pairing (LM Organizer currently just uses the system UI font stack — no display face)
- Icon set (LM Organizer uses plain emoji for nav/section icons today — keep that low-effort
  approach, or standardize on an icon library like `lucide-vue-next` the way the AAXON spec does?)
