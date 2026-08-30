# Aaxon OS Design System

The design system that powers **Aaxon OS** (the Atrineo Suite shell and its
micro-frontends). Implemented as `@aaxon/design-system`, a token layer + a set
of headless-backed Vue 3 components (`At*`) shared by every app in the suite.

Source of truth: Figma file `N6diJZdZBCrYOQ4OCwyYxW`. Tokens live in
`libs/@aaxon/design-system/src/tokens/*.css`; components live in
`libs/@aaxon/design-system/src/components/`.

---

## 1. Brand identity

- **Wordmark**: "aaxon", geometric sans, solid black, tight tracking, no
  rounded terminals — reads as technical/precise rather than playful.
- **Mark**: a rounded-square badge (`border-radius: 24px` on a ~303×181 tile)
  filled with the primary accent pink (`#FE138C`), containing a white glyph.
  The rounded-square-badge-with-glyph pattern is reused across the suite for
  per-app logos (Monitor, Coach, Researcher, CRM, KDSF, H3, Science, Workflow,
  Reports, Projects, Personal, Agents — each app gets its own colored variant
  of the same badge shape, see `src/assets/logo-*.svg`).
- **Tone**: precise, dense, data-forward. Not a consumer-friendly brand — it
  reads as an operator/analyst tool.

---

## 2. Color palette

### 2.1 Primitives

| Scale | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|---|
| Neutral | `#f9f9fa` | `#f5f5f7` | `#f0f0f2` | `#d0d0de` | `#ababc0` | `#888899` | `#606070` | `#353a44` | `#1d2028` | `#050510` |
| Accent (pink — brand) | `#fff0f7` | `#ffb3dc` | `#ff80c7` | — | `#fe3ba2` | `#fe138c` | `#c5006e` | `#8b0055` | — | — |

| Token | 500 | 600 |
|---|---|---|
| Purple | `#8b19cb` | `#7013a8` |
| Green | `#4abe75` | `#2e9454` |
| Info (blue) | `#15aadc` | `#0095c8` |
| Warning | `#f5b000` *(400)* | `#b07800` |
| Error | `#d03838` | `#c03545` |

The neutral scale is a cool, slightly blue-violet gray (not true gray) —
`#050510` at the dark end, `#f9f9fa` at the light end. This tint carries
through every surface and border color, which is part of why the UI reads as
"cool/technical" rather than warm.

### 2.2 Brand accent (overrideable per organization)

```css
--color-primary:            var(--accent-500);   /* #fe138c */
--color-primary-hover:      var(--accent-600);   /* #c5006e */
--color-primary-active:     var(--accent-700);   /* #8b0055 */
--color-primary-subtle:     var(--accent-50);    /* #fff0f7 */
--color-primary-foreground: #ffffff;
```

These are the only color tokens meant to be swapped at runtime for
white-labeling — every component reads `--color-primary*`, never
`--accent-*` directly.

### 2.3 Semantic colors

| Role | Color | Subtle bg (light) | Text |
|---|---|---|---|
| Success | `--green-500` `#4abe75` | `#f0fbf4` | `--green-600` |
| Warning | `--warning-400` `#f5b000` | `#fffbeb` | `--warning-600` |
| Danger | `--error-500` `#d03838` | `#fff0f0` | `--error-600` |
| Info | `--info-500` `#15aadc` | `#ebf9ff` | `--info-600` |

### 2.4 Surfaces, borders, text — light mode

| Token | Value |
|---|---|
| `--color-bg` | `--neutral-50` `#f9f9fa` |
| `--color-surface` | `#ffffff` |
| `--color-surface-raised` (cards/panels) | `#ffffff` |
| `--color-surface-2` (subtle overlay) | `--neutral-200` `#f0f0f2` |
| `--color-border` | `--neutral-300` `#d0d0de` |
| `--color-border-strong` | `--neutral-400` `#ababc0` |
| `--color-text` | `--neutral-900` `#050510` |
| `--color-text-muted` | `--neutral-600` `#606070` |
| `--color-text-subtle` | `--neutral-500` `#888899` |

### 2.5 Dark mode (`[data-theme="dark"]`)

Dark mode is not a simple invert — surfaces step up in a 3-level hierarchy
(`bg` → `surface` → `surface-raised`/`surface-2`) rather than one flat panel
color, and every "subtle" semantic background becomes a **transparent
overlay** (`rgba(accent, 0.12)`) instead of a light tint, since a light tint
on a dark canvas doesn't work:

| Token | Value |
|---|---|
| `--color-bg` | `--neutral-900` `#050510` (canvas) |
| `--color-surface` | `#111318` (base layer) |
| `--color-surface-raised` | `--neutral-800` `#1d2028` (cards) |
| `--color-surface-2` | `#3f4450` (overlay/modals) |
| `--color-border` | `--neutral-700` `#353a44` |
| `--color-border-strong` | `--neutral-600` `#606070` |
| `--color-text` | `--neutral-200` `#f0f0f2` |
| `--color-text-muted` | `--neutral-500` `#888899` |
| `--color-primary-subtle` | `rgba(254, 19, 140, 0.12)` |

Theme is switched with a `data-theme="dark"` attribute (no separate dark
build) — all components consume semantic tokens, never raw hex, so they
theme automatically.

---

## 3. Typography

Two-family system: a **display face for headings** and a **workhorse UI face
for everything else**.

| Role | Family |
|---|---|
| Display / H1–H3 | **Satoshi** (400/500/700), via Fontshare |
| UI / body / captions | **Plus Jakarta Sans** (400/500/600/700, italic 400), via Google Fonts |
| Monospace | SFMono-Regular, Consolas, Liberation Mono, Menlo |

### Type scale

| Token | Size | Typical use |
|---|---|---|
| `--text-xs` | 11px | Caption |
| `--text-sm` | 13px | Small UI text, badges |
| `--text-base` | 14px | Body-SM, default UI text |
| `--text-md` | 15px | Card headers |
| `--text-lg` | 17px | — |
| `--text-xl` | 20px | — |
| `--text-2xl` | 24px | — |
| `--text-3xl` | 32px | H2 |
| `--text-4xl` | 48px | — |
| `--text-5xl` | 80px | Display 2XL |

Weights: `--font-normal` 400 · `--font-medium` 500 · `--font-semibold` 600 ·
`--font-bold` 700.

Line heights: `--leading-tight` 1.1 (display) · `--leading-heading` 1.2 (H2 /
UI-MD) · `--leading-normal` 1.5 (body) · `--leading-caption` 1.4 (caption).

Letter spacing: display `-0.3px` (tightened) · heading `-0.01em` · caption
`0.02em` (opened up) · normal `0`.

`-webkit-font-smoothing: antialiased` is applied on interactive text
components (buttons, badges) — a deliberate crispness choice at small sizes.

---

## 4. Spacing

A base-4 scale, used for padding, gap, and margin everywhere via
`var(--space-N)`:

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |
| `--space-20` | 80px |
| `--space-24` | 96px |

---

## 5. Shape — radius & elevation

### 5.1 Border radius

| Token | Value | Used for |
|---|---|---|
| `--radius-sm` | 4px | — |
| `--radius-md` | 8px | Inputs, selects |
| `--radius-lg` | 12px | — |
| `--radius-xl` | 16px | Cards |
| `--radius-full` | 9999px | Buttons (pill), badges, avatars, spinners |

**Buttons and badges are pills**, not rounded rects — this is the single
most distinctive shape signature of the system. Cards use a softer `16px`
rounded rect. Inputs use a tighter `8px`. The brand mark itself uses `24px`
on a rounded-square tile, sitting between the card and pill radii.

### 5.2 Elevation

Three shadow levels, each with a defined role — elevation is used sparingly
and is reserved for real z-axis separation, not decoration:

| Level | Shadow | Use |
|---|---|---|
| `--elevation-sm` | `0 2px 4px 0 rgba(24,28,38,.08)` | Cards, containers, table rows |
| `--elevation-md` | `0 6px 12px -1px rgba(24,28,38,.16)` | Card hover, tooltips, FABs |
| `--elevation-lg` | `0 16px 32px -6px rgba(24,28,38,.16)` | Dropdowns, flyouts, popovers |

In dark mode the shadow tint switches from a cool navy (`rgba(24,28,38,…)`)
to pure black at higher opacity (`rgba(0,0,0,.35)` / `.55`), since colored
shadows disappear against a dark canvas.

Accent/success card variants (see §6.3) trade the shadow for a tinted border
instead — elevation and "this card matters" are treated as separate,
non-stacking signals.

### 5.3 Motion

| Token | Value |
|---|---|
| `--transition-fast` | 120ms ease |
| `--transition-normal` | 200ms ease |

Used for hover/focus state changes (border color, background, box-shadow).
No spring/bounce easing anywhere — motion is utilitarian and fast.

---

## 6. Component conventions

All components are prefixed `At*` (`AtButton`, `AtCard`, `AtInput`,
`AtBadge`, `AtSelect`, `AtCheckbox`, `AtRadio`, `AtToggle`, `AtModal`,
`AtTabs`, `AtTable`, `AtAvatar`, `AtDropdown`, `AtAlert`, `AtToast`,
`AtProgress`, `AtSpinner`, `AtNavbar`, `AtStatCard`, `AtAppTile`), built on
top of **reka-ui v2** headless primitives (`modelValue` / `update:modelValue`
convention throughout — never `checked`/`value`).

### 6.1 Buttons — pill, 5 variants, 3 sizes

- Shape: full pill (`--radius-full`), `1px` border (transparent unless
  bordered variant).
- Sizes: `sm` 32px / `md` 40px / `lg` 48px height, horizontal padding
  16 / 20 / 24px.
- Variants:
  - **primary** — filled brand pink, white text. Hover lightens
    (`accent-500 → accent-400`, i.e. hover is *lighter*, not darker — the
    opposite of most systems).
  - **secondary** — near-white fill, neutral border, dark text.
  - **accent** — filled purple, for a secondary call-to-action distinct from
    brand pink.
  - **destructive** — red-on-tint (not solid red) with a red border — a
    quieter, less alarming danger action than a fully filled red button.
  - **ghost** — transparent, muted text, fills with `--color-surface-2` on
    hover.
- Text goes in the default `<slot>`, not a `label` prop. Icons go in the
  `#icon` named slot.
- Loading state fades label/icon to `opacity: 0` and overlays a spinning ring
  built from `border-top-color: transparent` — no layout shift.
- Focus ring: `2px solid var(--color-primary)`, `2px` offset.

### 6.2 Badges — pill, low-saturation fills

Same pill radius as buttons but much smaller (`4px 12px` padding, `12px`
font). Each semantic/brand color uses a consistent 3-part formula: `6%`
opacity background tint, `24%` opacity border tint, solid darker text color
(e.g. signal = `rgba(pink,.06)` bg / `rgba(pink,.24)` border / `#c4006a`
text). In dark mode the opacities jump to `24%`/`50%` and text lightens
— badges never go fully solid/filled.

### 6.3 Cards — 16px radius, soft shadow, tinted-border variants

- Base: white/raised surface, `1px` neutral border, `--radius-xl` (16px),
  `--elevation-sm` shadow, `overflow: hidden`.
- Optional `header`/`footer` slots get their own padding and a hairline
  divider border.
- **accent** / **success** variants replace the neutral border with a
  transparent-tinted brand/green border (`rgba(pink, .28)` /
  `rgba(green, .3)`) and drop the shadow entirely — a colored card is "flat
  but framed," never "flat and floating."
- Padding is a controlled scale (`none`/`sm`/`md`/`lg` → 0/12/20/24px), not
  arbitrary utility classes.

### 6.4 Inputs — 8px radius, focus ring, label above

- `flex-column` wrapper: label → field → hint/error, `4px` gap.
- Field: `36px` height, `1px` `--color-border-strong` border,
  `--radius-md` (8px).
- Focus: border turns brand pink + a `3px` soft glow
  (`box-shadow: 0 0 0 3px var(--color-primary-subtle)`) — the same
  focus-ring pattern (colored border + subtle-tint glow) repeats across
  inputs, selects, and checkboxes.
- Error state swaps the same glow to the danger subtle color rather than
  introducing a new visual language.
- Text content uses `label`/`hint` props (not `helper`) — text-bearing
  form controls use props; toggle-like controls (`AtCheckbox`, `AtButton`)
  use slots. See the project `CLAUDE.md` for the full prop/slot map — it's
  the most common integration bug in this system.

---

## 7. Design principles (inferred from the tokens/components)

1. **Cool-tinted neutrals, not true gray.** Every neutral has a faint
   blue-violet cast, which keeps the whole UI color-coordinated with the
   pink brand accent even in "gray" areas.
2. **Pills for actions, rounded rects for containers.** Radius communicates
   role: `--radius-full` = "you can click this," `--radius-xl`/`--radius-md`
   = "this holds content."
3. **Tint-and-border over solid fill for status.** Badges, destructive
   buttons, and accent/success cards all prefer a light tint + colored
   border/text over a fully saturated fill — status is communicated without
   shouting.
4. **Elevation is structural, not decorative.** Only 3 shadow levels, each
   mapped to a specific z-axis role (rest / hover-and-floating / overlay).
   Tinted-border variants opt out of shadow rather than combining both.
5. **Everything themes through semantic tokens.** Components never
   hardcode a hex value for anything that changes between light/dark or
   between organizations — only the token *definitions* change.
6. **Two-typeface hierarchy, not a type-weight hierarchy.** Headings get a
   structurally different, denser display face (Satoshi); body/UI text
   never borrows it.
