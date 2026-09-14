# LM Organizer Design System

The design system actually in use by **LM Organizer** today — documented in the same shape as
`docs/frontend_building/AAXON_OS_DESIGN_SYSTEM.md`, but describing a real, small, single-app system
rather than a mature multi-app one. This is a *description of what exists*, not a redesign — every
value here is transcribed from the running app, not invented for this document.

Source of truth: `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/utilities.css`, and the
component files under `src/components/` and `src/views/`. There is no separate design tool (Figma
etc.) — the CSS *is* the source of truth.

This is the concrete starting point referenced by [`README.md`](README.md)'s placeholder for a
future personal, cross-app design system — if that ever gets built, this document is what it would
generalize from.

---

## 1. Identity

- **Tone**: dark, minimal, utilitarian — a personal daily-use tool, not a polished consumer
  product. Density and legibility over decoration.
- **No light mode.** The app has exactly one theme, a deep navy dark palette. There is no
  `[data-theme]` switching mechanism at all — unlike a multi-tenant system, this doesn't need one
  yet.
- **One typeface, one weight family.** No display/heading face distinct from body text — hierarchy
  comes entirely from size, weight, and color, never font family.
- **Emoji as the icon system.** Nav items and actions use plain emoji (▦ ◎ ⊕ € 📈 ✏ for
  sections; ✕ ✎ 🔁 🔒 for actions) instead of an icon library. Zero dependency, and gives the app a
  personal, informal character distinct from a corporate tool.
- **No elevation.** There is no `box-shadow` anywhere in the app. Hierarchy is communicated purely
  by background-color steps and 1px borders — a flatter, more utilitarian feel than a
  shadow-based system.

---

## 2. Color palette

Single dark theme — no primitives scale, no light-mode variants. These are the actual tokens in
`tokens.css`:

### 2.1 Surfaces, borders, text

| Token | Value | Role |
|---|---|---|
| `--color-bg` | `#060c18` | Page canvas |
| `--color-surface` | `#0c1525` | Inset surfaces — header, nav bar, input fields |
| `--color-surface-raised` | `#0f1e35` | Cards, raised panels, pill-tab default background |
| `--color-border` | `#1c2e4a` | Default hairline borders, dividers |
| `--color-text` | `#e8e8e8` | Primary text |
| `--color-text-muted` | `#888888` | Secondary/label text |
| `--color-text-faint` | `#555555` | Disabled/placeholder-weight text |

Three dark surface steps (`bg` → `surface` → `surface-raised`), same idea as a multi-level dark-mode
hierarchy in a larger system, just with navy-blue undertones instead of neutral gray — every
"neutral" in this palette is actually a very dark, desaturated blue, which is what keeps the whole
UI feeling cohesive rather than a generic black-on-white-inverted dark mode.

### 2.2 Semantic colors

| Role | Token | Value | Used for |
|---|---|---|---|
| Primary / brand | `--color-primary` | `#c9a227` (muted gold) | Active nav/tab state, primary buttons, focus border, highlighted totals |
| Success | `--color-success` | `#3d9e75` | Positive amounts, completed/done state, "income" |
| Danger | `--color-danger` | `#d85a30` | Negative amounts, "expense," destructive emphasis |
| Danger (strong) | `--color-danger-strong` | `#e05c5c` | Higher-alarm negative states (investment loss, series-delete confirmation) |
| Info | `--color-info` | `#4a90d9` | Links (e.g. a shopping item's URL), the default "Work" category color |

Gold is deliberately the **only warm color** against an otherwise cool navy palette — it's what
makes "this is active / this is the total / this is the brand" register instantly without needing a
second visual language.

### 2.3 Categorical accents (calendar event categories)

The one place color varies by *user data* rather than by a fixed design-system role — a small
qualitative palette for telling several categories apart at a glance, not part of the semantic set
above:

| Category | Color |
|---|---|
| Work | `#4A90D9` (= `--color-info`) |
| Personal | `#3d9e75` (= `--color-success`) |
| Health | `#E05C5C` (= `--color-danger-strong`) |
| Social | `#9B6DD4` (purple — the one hue with no semantic-token equivalent) |
| Travel | `#E08A3C` (orange — distinct from `--color-danger`) |
| Other | `#888888` (= `--color-text-muted`) |

Users can add their own categories with a free-choice color picker — this table is only the
shipped default set.

---

## 3. Typography

**No formal type scale.** This is a real, honest gap compared to a mature system like AAXON's —
sizes were chosen per-element by feel when the legacy CSS was first written, then ported as-is
rather than retrofitted into a scale. Documenting the sizes actually in use, smallest to largest:

| Size | Typical use |
|---|---|
| 9px | Chart bar labels, "+N more" overflow chips, recurring-event badge |
| 10px | Category label on calendar chips, weekday abbreviations |
| 11px | Stat-tile labels, section labels (`.section-label`, `.inv-label`), small buttons |
| 12px | Tab/pill text (finance tabs, mode switcher), form hint text |
| 13px | Pill-tab text, secondary body text, `.sbtn` button label |
| 14px | **Base body text** — default for cards, inputs, nav labels, `.pbtn` button label |
| 15px | Header title, month/section headers, default stat-tile value |
| 16px | Goal title, calendar nav arrows |
| 18–20px | Lock-screen title |
| 22px | Day-mode calendar number |
| 26px | Total monthly income figure |
| 40px | Lock-screen icon, investment star rating |

One family, one stack, everywhere:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

Weights used: `400` (default), `500` (labels, button text, emphasis), `600` (headings, totals),
`700` (rare — investment score label). No named weight tokens exist (`--font-medium` etc.) — weights
are written as literal numbers per component.

**If this ever gets formalized**, the natural next step is exactly what AAXON does: collapse this
list into a fixed `--text-xs` … `--text-2xl` scale and named semantic classes (`.text-caption`,
`.text-body`, `.text-h2`) so components stop hardcoding `font-size: 13px` directly. Not done yet
because a single-app system with one contributor hasn't needed the consistency guarantee that buys.

---

## 4. Spacing

**No spacing scale either** — gaps/padding are literal px values chosen per component, not a
`--space-N` token set. The values actually in use cluster tightly, which is worth noting as "this
would slot into a scale easily if one were added":

Commonly used: `4px, 6px, 8px, 10px, 12px, 14px, 16px, 24px` — almost entirely base-2/base-4
already, just not tokenized. `.card` uses `14px` padding / `10px` bottom margin; button padding
ranges from `6px 12px` (`.sbtn`) to `10px 16px` (`.pbtn`).

---

## 5. Shape — radius, elevation, motion

### 5.1 Border radius

| Token | Value | Used for |
|---|---|---|
| `--radius-sm` | 6px | Icon buttons, bordered header buttons |
| `--radius-md` | 8px | Inputs, selects, textareas, standalone action buttons (`.pbtn`, `.sbtn`) |
| `--radius-lg` | 12px | Cards, stat tiles |
| `--radius-full` | 20px | Tab/segmented-control pills (nav, finance tabs, goal/shopping-list tabs) |

**Pills are reserved for tab/filter controls, not general buttons** — the inverse of AAXON's
convention (where pills mean "clickable action" broadly). Here, a pill shape specifically signals
"one of several mutually exclusive options"; a rounded-rect (`--radius-md`) button always means "do
a thing." This distinction is consistent throughout the app and worth preserving if the system is
ever formalized.

Circular elements (task/goal/shopping-item done-toggles) use a literal `border-radius: 50%` at
16–18px diameter, not a token — small enough and specific enough (always exactly a filled/unfilled
circle) that it hasn't needed one.

### 5.2 Elevation

**None.** No `box-shadow` exists anywhere in the codebase. Every surface is either the page
background, the inset `--color-surface`, or the raised `--color-surface-raised` — hierarchy is
background-color and 1px-border only. If elevation is ever introduced, it should be for a genuine
new need (a real floating overlay/popover), not retrofitted onto existing cards, which would be a
visual regression from the current flat, calm feel.

### 5.3 Motion

| Token | Value |
|---|---|
| `--transition-fast` | 120ms ease |

Used sparingly — border-color on input focus, and one hand-written `0.3s ease` on the goal
progress-bar fill width (not tokenized; would become `--transition-normal` if a second speed is ever
needed). No hover elevation changes (nothing to animate, given no shadows), no spring/bounce easing.

---

## 6. Component conventions

No component library (`At*` or otherwise) — plain HTML elements styled with scoped `<style>` blocks
per Vue component, plus a small set of genuinely shared, non-scoped utility classes in
`styles/utilities.css` (`.card`, `.pill-tab`, `.sc`/`.sl`/`.sv` stat tiles, `.cal-*` calendar
primitives — see that file directly for the full list, it's short enough to read in one pass).

### 6.1 Buttons — three tiers, rounded-rect (not pill)

| Class | Padding | Font size | Role |
|---|---|---|---|
| `.pbtn` | `10px 16px` | 14px | Primary action (Add, Save, Calculate) |
| `.sbtn` | `6px 12px` | 13px | Secondary/inline action (row-level Save, Add inside a card) |
| `.icon-btn` | `3px 6px` | 13px | Icon-only action (✎ edit), transparent, muted → full text color on hover |
| `.del-btn` | `4px` | 14px | Delete (✕), transparent, muted, no hover-color change (intentionally quiet) |
| `.hbtn` | `4px 8px` | 12px | Header-level secondary action (Log out), bordered, transparent fill |

All filled buttons (`.pbtn`/`.sbtn`) use solid `--color-primary` fill with white text — there is no
`secondary`/`destructive`/`ghost` variant system the way AAXON has; a destructive action (delete)
is instead just `.del-btn`'s quiet transparent style plus, for anything consequential (deleting an
entire recurring event series), an inline **confirmation step** rendered in place rather than a
modal — see `EventRow.vue`'s confirm-then-choose pattern.

### 6.2 Cards — one variant, no shadow

```css
.card {
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); /* 12px */
  padding: 14px;
  margin-bottom: 10px;
}
```

No accent/success/tinted-border variants exist — every card looks the same regardless of what it
contains. Color meaning is carried by the *text inside* the card (a colored amount, a colored
status label), never by the card container itself.

### 6.3 Stat tiles

`.sc` (container) / `.sl` (label, 11px muted) / `.sv` (value, 15px default) — a fixed label-over-value
pattern used throughout Finance and Investment for things like "Monthly income," "Balance," "This
week." Value color is set with an inline `style` per instance (`color: var(--color-success)` for a
positive figure, `--color-danger` for negative) rather than a `variant` prop — the pattern is
consistent in practice but not yet enforced by a component API, since there's no shared `StatTile`
component, just the shared CSS classes reused across each view's own markup.

### 6.4 Pills (tabs / segmented controls)

```css
.pill-tab {
  padding: 6px 14px;
  border-radius: var(--radius-full); /* 20px */
  background: var(--color-surface-raised);
  color: var(--color-text-muted);
}
.pill-tab.active {
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
}
```

Used for: main nav, calendar month/week/day mode switcher, finance sub-tabs, goal tabs, shopping
list tabs, workspace (tasks/notes/review) tabs. This is the single most-reused pattern in the whole
app — every place the user picks one of several mutually exclusive views uses exactly this pill
treatment.

### 6.5 Inputs — simple focus, no glow

```css
input, select, textarea {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md); /* 8px */
  padding: 10px 12px;
  font-size: 14px;
}
input:focus, select:focus, textarea:focus {
  border-color: var(--color-primary);
}
```

Focus is a border-color change only — no `box-shadow` ring the way a more elaborate system would
add (AAXON's inputs get a `3px` soft glow on focus; this app's don't, consistent with having no
elevation/shadow system at all). Simpler, and arguably a bit less visible for accessibility — a
candidate improvement if this system is ever tightened up, without needing to introduce shadows
generally.

### 6.6 Event/category color bars

A pattern specific to this app, not present in AAXON: a thin (3px) solid-colored vertical bar on
the left edge of a calendar event row, using that event's category color — a lightweight way to
scan a list of events by category without needing a full colored badge on every row.

---

## 7. Design principles (inferred from the code)

1. **Cool navy neutrals, one warm accent.** Every "neutral" surface is actually a very dark blue,
   not gray — and gold is the *only* warm hue anywhere, which is what makes "primary/active/total"
   register instantly against an otherwise monochrome-feeling palette.
2. **Pills mean "pick one," rectangles mean "do a thing."** Shape encodes a specific kind of
   interaction (mutually-exclusive selection vs. a one-shot action), consistently, everywhere in the
   app — the opposite mapping from AAXON's "pills are always clickable," but just as internally
   consistent.
3. **Flat by default.** No shadows exist; hierarchy is background-step + border only. Any future
   addition of elevation should be reserved for something that's genuinely floating above the page
   (an overlay/popover), not applied to existing cards.
4. **Status lives in text color, not container color.** Cards, stat tiles, and rows never change
   their own background/border to signal "this is good/bad" — only the specific number or label
   inside does, via `--color-success`/`--color-danger`.
5. **One typeface, size and weight only.** No display face, no monospace usage anywhere in the UI.
   Simpler than a two-typeface system, and appropriate for an app this size — revisit only if a
   genuinely distinct "headline" moment ever needs its own visual register.
6. **Category color is the one data-driven hue.** Every other color in the app maps to a fixed
   design-system role (primary/success/danger/info/muted); only calendar event categories let color
   vary per user-entered data, and even there, the *default* categories deliberately reuse the same
   semantic hues (Work = info-blue, Personal = success-green) rather than inventing an unrelated
   palette.
7. **No scale, but scale-shaped.** Neither type sizes nor spacing values are tokenized into a formal
   scale today, but the actual values in use already cluster on clean base-2/base-4 steps — this
   system is one refactor away from a formal `--text-*`/`--space-*` scale whenever that consistency
   guarantee becomes worth the effort (see §3, §4).
