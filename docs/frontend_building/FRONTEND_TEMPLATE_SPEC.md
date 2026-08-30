# Frontend Template Specification

Instructions for building a new Vue 3 SPA that looks and behaves like every other
app in this suite. Written to be dropped at the root of a new repo and read by a
coding agent before it writes any code.

> `AAXON_OS_DESIGN_SYSTEM.md` **is the authority for every visual value** —
> colors, type scale, spacing, radii, elevation, motion, and component anatomy.
> This document deliberately does **not** restate those numbers. Ship both files
> together; when they disagree, the design system wins.

This spec is domain-agnostic. It describes structure, conventions, and known
pitfalls — not features. Nothing here assumes what your app does.

---



## 1. Stack

Pin these. Do not substitute equivalents without a reason.

### Core (always)


| Package                             | Version | Role                                           |
| ----------------------------------- | ------- | ---------------------------------------------- |
| `vue`                               | `^3.5`  | Composition API + `<script setup>` only        |
| `vite`                              | `^6`    | Dev server + build                             |
| `@vitejs/plugin-vue`                | `^6`    | —                                              |
| `tailwindcss` + `@tailwindcss/vite` | `^4.1`  | Layout utilities. **Vite plugin, not PostCSS** |
| `pinia`                             | `^3`    | State                                          |
| `pinia-plugin-persistedstate`       | `^4`    | `persist: true` on stores that need it         |
| `vue-router`                        | `^4`    | Routing (history mode)                         |
| `vue-i18n`                          | `^11`   | i18n, `legacy: false`                          |
| `element-plus`                      | `^2.12` | Composite widgets (see §7)                     |
| `lucide-vue-next`                   | `^1`    | Icon set                                       |




### Dev

`eslint` ^9 · `eslint-plugin-vue` ^10 · `@vue/eslint-config-prettier` ^10 ·
`prettier` ^3 · `postcss` ^8 · `autoprefixer` ^10

### Optional — add only when the app needs them


| Need             | Package                                                                   |
| ---------------- | ------------------------------------------------------------------------- |
| Charts           | `echarts` + `vue-echarts`                                                 |
| Maps             | `leaflet` + `leaflet.markercluster`                                       |
| Rich text        | `@tiptap/vue-3` + `@tiptap/starter-kit` (+ `dompurify` if rendering HTML) |
| Markdown render  | `markdown-it` or `marked` (+ `dompurify`)                                 |
| Drag & drop      | `vuedraggable@next`                                                       |
| Real-time        | `socket.io-client`                                                        |
| PDF export       | `jspdf` + `html2canvas-pro`                                               |
| Spreadsheet I/O  | `xlsx`                                                                    |
| Animated numbers | `@number-flow/vue`                                                        |
| Loading spinners | `epic-spinners`                                                           |


Do not install optional packages "just in case" — each one is a bundle cost and
a maintenance surface.

### If `@aaxon/design-system` is available

If the new project can resolve `@aaxon/design-system` (token CSS + `At*`
components on `reka-ui` v2), **use it instead of** §4's local token layer and
§6's local `ui/` components. Everything else in this document — layout, stores,
services, composables, i18n, tooling — is unchanged. Element Plus may still be
kept for composite widgets not covered by the library (`el-scrollbar`,
`el-table`, `ElNotification`), or dropped entirely if the library covers them.

The rest of this spec assumes the library is **not** available and you are
implementing the AAXON API locally on top of Element Plus.

---



## 2. Directory layout

```
src/
  main.js               App bootstrap (§3)
  App.vue               Root shell — global listeners, boot-time store preloads
  router/index.js       Routes + navigation guards
  plugins/i18n.js       vue-i18n instance
  theme/                Brand resolution + runtime brand application (§5)
  styles/               Token layer, base, utility classes (§4)
  layouts/              Route-level chrome (header/sidebar/content shells)
  views/                Page components — thin, no business logic (§9)
  components/
    ui/                 Design-system components (At*, one folder each) (§6)
    <Domain>/           Feature components grouped by domain
  composables/          Reusable reactive logic (§10)
  services/             API layer — no Vue imports (§8)
  stores/               Pinia stores (§9)
  utils/                Pure functions + constants (§11)
  locales/              en.js / es.js / de.js (§12)
  assets/
public/                 Static files served as-is (logos, icons, fonts)
```

Rules:

- **One folder per** `ui/` **component**, named after it, containing the `.vue` file
(`ui/AtButton/AtButton.vue`). Keeps co-located sub-parts and stories tidy.
- **Feature components group by domain**, not by type. `components/Invoices/`,
not `components/tables/`.
- `services/` must never `import` from `vue`, a store, or a component. It is a
plain fetch layer. (One controlled exception: `httpClient.js` reads the auth
token — see §8.)
- `utils/` is pure — no I/O, no reactivity, fully unit-testable.

---



## 3. Bootstrap

`src/main.js` — this order matters:

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus from 'element-plus'
import router from './router'
import i18n from './plugins/i18n'
import { applyBrand } from './theme/brand'
import App from './App.vue'

import 'element-plus/dist/index.css'
import './styles/index.css'   // MUST come after Element Plus so tokens win

applyBrand()                  // before mount — avoids a flash of default brand

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(i18n)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
```

`src/styles/index.css` — import order is the cascade:

```css
@import 'tailwindcss';
@import './tokens.css';        /* AAXON tokens: @theme block + dark overrides */
@import './theme/brands.css';  /* per-brand --color-primary* overrides */
@import './base.css';          /* resets, scrollbars, global element styles */
@import './utilities/typography.css';
@import './utilities/elementplus.css';  /* EP skin overrides — see §6.4 */
```

`App.vue` responsibilities (keep it small):

- restore the session on mount, then preload the small set of stores the whole
app needs (current user, feature flags, reference data) — **one place only**,
never per-component
- the global auto-hide scrollbar listener (§4.5)
- global modals/toast containers that must outlive route changes

---



## 4. Styling



### 4.1 The contract

1. **Every value comes from a token.** No component ever writes a raw hex,
  px font-size, or px radius. If a value isn't in the design system, add a
   token — don't inline it.
2. **Tailwind is for layout**: flex/grid, sizing, spacing, position, overflow.
3. **Tokens and semantic utility classes are for identity**: color, typography,
  radius, elevation.
4. Component-specific CSS lives in `<style scoped>` in that component and reads
  `var(--…)`. Non-scoped `<style>` only for a class deliberately shared with
   children, and it must be commented as such.



### 4.2 `styles/tokens.css`

Transcribe the AAXON design system's §2–§5 into plain CSS custom properties
under `:root`, plus a `[data-theme='dark']` block for the dark overrides. Do not
invent a parallel naming scheme; use the exact token names from that document
(`--color-primary`, `--color-surface-raised`, `--space-4`, `--text-base`,
`--radius-full`, `--elevation-sm`, `--transition-fast`, …).

> **Do not carry token names over from other apps.** Names collide with
> different meanings across codebases — e.g. a `--radius-full` that means `24px`
> in one system and `9999px` in AAXON. A silent shape regression is the result.
> The AAXON names are the only names.



### 4.3 Exposing tokens to Tailwind 4

Tailwind 4 generates utilities from `@theme` namespaces. Most AAXON token names
**already match those namespaces**, so declare them directly in `@theme` — no
mapping layer needed. Tailwind emits them into `:root` and has the utilities
*reference* the variable, so a `[data-theme='dark']` override re-themes every
utility automatically:

```css
/* styles/tokens.css */
@theme {
  /* --color-* → bg-primary, text-muted, border-strong, … */
  --color-primary: …;
  --color-primary-subtle: …;
  --color-bg: …;
  --color-surface: …;
  --color-surface-raised: …;
  --color-surface-2: …;
  --color-border: …;
  --color-border-strong: …;
  --color-text: …;
  --color-text-muted: …;
  --color-text-subtle: …;

  /* --radius-* → rounded-md, rounded-xl, rounded-full */
  --radius-sm: …;  --radius-md: …;  --radius-lg: …;  --radius-xl: …;  --radius-full: …;

  /* --text-* → text-xs … text-5xl (font-size). AAXON's scale maps 1:1. */
  --text-xs: …;  --text-sm: …;  --text-base: …;  /* … */

  /* Base-4 spacing multiplier: p-4 → 16px, gap-2 → 8px — exactly AAXON's scale */
  --spacing: 4px;
}

/* Tokens whose AAXON name is NOT a Tailwind namespace stay in :root … */
:root {
  --elevation-sm: …;  --elevation-md: …;  --elevation-lg: …;
  --space-1: 4px;  --space-2: 8px;  /* … for use inside hand-written CSS */
  --font-normal: 400;  --font-medium: 500;  --font-semibold: 600;  --font-bold: 700;
  --leading-tight: 1.1;  --leading-heading: 1.2;  --leading-normal: 1.5;
  --transition-fast: 120ms ease;  --transition-normal: 200ms ease;
}

/* … and are bridged to Tailwind under a DIFFERENT name where useful. */
@theme inline {
  --shadow-sm: var(--elevation-sm);   /* → shadow-sm */
  --shadow-md: var(--elevation-md);
  --shadow-lg: var(--elevation-lg);
}
```

Three verified gotchas:

- **Never write a self-referencing** `@theme inline` **entry** such as
`@theme inline { --color-primary: var(--color-primary) }`. Tailwind emits that
literally into `:root, :host`, producing a cyclic custom property that resolves
to the guaranteed-invalid value. `@theme inline` is only for bridging a token
to a *different* Tailwind name (the `--elevation-`* → `--shadow-*` case above).
- `--font-*` **is Tailwind's font-*family* namespace**, but AAXON uses
`--font-normal: 400` etc. for *weight*. Keep the weight tokens in `:root`,
never in `@theme`, or Tailwind emits broken `font-normal` family utilities. Use
Tailwind's built-in `font-medium`/`font-bold`, or `var(--font-semibold)` in CSS.
- `--space-N` **is not a Tailwind namespace** — Tailwind 4 derives the whole
spacing scale from a single `--spacing` multiplier. Setting `--spacing: 4px`
makes `p-4`/`gap-6`/`mt-2` land exactly on AAXON's base-4 steps. Keep the
explicit `--space-N` vars in `:root` for hand-written CSS.



### 4.4 Dark mode and brand in the cascade

Both live in CSS, keyed off attributes on `<html>`, never written from JS:

```css
/* styles/tokens.css — after the @theme block */
[data-theme='dark'] {
  --color-bg: …;  --color-surface: …;  --color-surface-raised: …;
  --color-primary-subtle: rgba(…, .12);   /* dark uses a transparent overlay, not a tint */
  /* … */
}

/* styles/theme/brands.css — imported after tokens.css */
:root[data-brand='acme'] {
  --color-primary: …;  --color-primary-hover: …;
  --color-primary-active: …;  --color-primary-subtle: …;
}
:root[data-brand='acme'][data-theme='dark'] {
  --color-primary-subtle: rgba(…, .12);
}
```

> ⚠️ **Do not set token values with** `element.style.setProperty()`**.** Inline
> declarations on `<html>` outrank every selector, including
> `[data-theme='dark']` — so a JS-applied brand would pin the light-mode subtle
> tint in dark mode, leaving pale focus glows on a dark canvas. Attributes for
> switching; the cascade for values.



### 4.5 `styles/base.css`

Contains, at minimum:

```css
/* Overscroll: only these three. See warning below. */
html, body, main { overscroll-behavior: none; }

/* Auto-hide scrollbars: thin + transparent by default, fade in while scrolling */
* { scrollbar-width: thin; scrollbar-color: transparent transparent; }
*::-webkit-scrollbar { width: 6px; height: 6px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 3px;
  transition: background-color 400ms ease;
}
*.scrolling { scrollbar-color: rgba(0,0,0,.28) transparent; }
*.scrolling::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,.28); }

* { -webkit-tap-highlight-color: transparent; }

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-family-ui);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
}
```

`.scrolling` is toggled by a capture-phase `scroll` listener in `App.vue` that
adds the class to `event.target` and clears it ~800ms after the last event.

> ⚠️ **Never put** `overscroll-behavior: none` **on the** `*` **selector.** It applies to
> every element with `overflow != visible` — including anything using
> `.truncate` (`overflow: hidden`) — which then swallows wheel events and blocks
> the parent from scrolling. Only `html`, `body`, `main` globally; per-container
> use the Tailwind `overscroll-y-contain` class on each real scroll surface
> (panels, sidebars, list bodies, modal content).



### 4.6 `styles/utilities/typography.css`

Define semantic type classes so components never write a font-size. Build them
on the AAXON `--text-*` / `--leading-*` / letter-spacing scale, e.g.:

```css
.text-display-2xl { font-family: var(--font-family-display); font-size: var(--text-5xl);
                    font-weight: var(--font-bold); line-height: var(--leading-tight);
                    letter-spacing: -0.3px; }
.text-h2         { font-family: var(--font-family-display); font-size: var(--text-3xl);
                    font-weight: var(--font-bold); line-height: var(--leading-heading);
                    letter-spacing: -0.01em; }
.text-ui-md      { font-family: var(--font-family-ui); font-size: var(--text-md);
                    font-weight: var(--font-semibold); line-height: var(--leading-heading); }
.text-body       { font-family: var(--font-family-ui); font-size: var(--text-base);
                    font-weight: var(--font-normal); line-height: var(--leading-normal); }
.text-caption    { font-family: var(--font-family-ui); font-size: var(--text-xs);
                    font-weight: var(--font-medium); line-height: var(--leading-caption);
                    letter-spacing: 0.02em; }
```

Enforce the design system's **two-typeface rule**: the display family is used by
heading classes only. Body/UI/caption never borrow it.

### 4.7 Fonts

Self-host in `public/fonts/` with `@font-face` + `font-display: swap`. Do not
hotlink Fontshare/Google in production — it adds a third-party dependency to
first paint and leaks user IPs. Preload only the two weights above the fold.

---



## 5. Branding and theming — two independent axes

This is the single most common thing to get wrong. Keep them separate:


| Axis                   | Mechanism                                   | Values                                       |
| ---------------------- | ------------------------------------------- | -------------------------------------------- |
| **Color scheme**       | `<html data-theme="…">`                     | `light` (default, attribute absent) / `dark` |
| **Organization brand** | `--color-primary`* overrides + `data-brand` | per-tenant                                   |


**Never add a second** `data-theme` **value for a brand.** The design system reserves
that attribute for dark mode, and its §2.2 already states that `--color-primary*`
are the only tokens meant to be swapped for white-labeling. Every component reads
`--color-primary*`; nothing reads the raw accent scale.

**Color values live in CSS only** (§4.4). `theme/brand.js` resolves which brand
is active, stamps the attribute, and owns the per-brand **assets** — nothing else:

```js
/** Per-brand assets. Colors are NOT here — they live in styles/theme/brands.css. */
const BRAND_ASSETS = {
  default: {
    logoSrc: '/logo.svg',
    logoSrcAuth: '/logo.svg',           // login/splash variant (dark bg → white logo)
    logoClass: { header: 'h-8', auth: 'h-12' },
  },
  // acme: { logoSrc: '/logo-acme.svg', … }
}

const active = import.meta.env.VITE_BRAND || localStorage.getItem('brand') || 'default'
const assets = BRAND_ASSETS[active] || BRAND_ASSETS.default

export const logoSrc = assets.logoSrc
export const logoSrcAuth = assets.logoSrcAuth
export const logoClass = assets.logoClass
export const getBrand = () => active

/** Idempotent — call once in main.js before createApp(). */
export function applyBrand() {
  if (typeof document === 'undefined') return
  // Default brand sets no attribute, so the :root tokens apply untouched.
  if (active === 'default') delete document.documentElement.dataset.brand
  else document.documentElement.dataset.brand = active
}
```

Adding a brand = one `BRAND_ASSETS` entry + one `:root[data-brand='…']` block.
No component changes, because every component reads `--color-primary*` and
`brand.logoSrc` — never the raw accent scale, never a hardcoded `/logo.svg`.

Dark mode is a separate tiny module (`theme/colorScheme.js`) that writes
`data-theme`, persists the choice, and defaults to
`matchMedia('(prefers-color-scheme: dark)')`.

---



## 6. Component authoring



### 6.1 Universal rules

- `<script setup>` only. No Options API. No `export default`.
- `defineProps` with explicit `type`, `default`, and a `validator` on any prop
with a fixed value set. `defineEmits` for every emit.
- `modelValue` **/** `update:modelValue` **everywhere.** Never `checked`, never
`value`, never `.sync`-style pairs.
- Props are the API; avoid reaching into parents. Cross-cutting state goes in a
store, shared behavior in a composable.
- Naming: `ui/` components are prefixed `At*` (`AtButton`, `AtCard`, `AtInput`).
Feature components use plain domain names (`InvoiceRow`, `TeamSwitcher`).
- Keep a component under ~250 lines. Past that, extract a composable (logic) or
a sub-component (markup) — not a bigger file.



### 6.2 The prop-vs-slot map

The design system calls this out as its most common integration bug. The rule:


| Kind                              | Convention                                                   | Components                                      |
| --------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| **Text-bearing form controls**    | text via **props** — `label`, `hint`, `error`, `placeholder` | `AtInput`, `AtTextarea`, `AtSelect`             |
| **Toggle-like / action controls** | text via the **default slot**                                | `AtButton`, `AtCheckbox`, `AtRadio`, `AtToggle` |
| **Containers**                    | content via **named slots** — `header`, default, `footer`    | `AtCard`, `AtModal`, `AtAlert`                  |
| **Icons**                         | always a named `#icon` slot                                  | all                                             |


Never add a `label` prop to `AtButton` "for convenience". The inconsistency is
the bug.

### 6.3 The `ui/` set to build

Build these as needed; keep the API exactly as the design system §6 describes.

`AtButton` `AtCard` `AtInput` `AtTextarea` `AtSelect` `AtCheckbox` `AtRadio`
`AtToggle` `AtBadge` `AtAvatar` `AtModal` `AtTabs` `AtTable` `AtDropdown`
`AtAlert` `AtToast` `AtProgress` `AtSpinner` `AtNavbar` `AtStatCard`
`AtSearchBar` `AtPagination` `AtBreadcrumb` `AtConfirmDialog` `AtIcon`

Non-negotiable specifics from the design system, restated because they are the
things most often silently dropped:

- `AtButton` — full pill radius; variants `primary | secondary | accent | destructive | ghost`; sizes `sm | md | lg` at 32/40/48px height with 16/20/24px
horizontal padding; **primary's hover is *lighter*, not darker**; loading state
fades content to `opacity: 0` and overlays a border-based spinner so there is
**no layout shift**; focus ring `2px solid var(--color-primary)` with `2px`
offset — do not suppress it.
- `AtBadge` and `destructive` **buttons** use tint + border + solid text, not
a saturated fill. Status never shouts.
- `AtCard` — `--radius-xl`, `--elevation-sm`, `overflow: hidden`, padding
prop on a controlled `none|sm|md|lg` scale. `accent`/`success` variants swap
the neutral border for a tinted one **and drop the shadow** — tinted-border and
elevation never stack.
- **Focus pattern**, identical across `AtInput` / `AtSelect` / `AtCheckbox`:
border → `--color-primary`, plus `box-shadow: 0 0 0 3px var(--color-primary-subtle)`.
The error state swaps that same glow to the danger subtle color; it does not
introduce a new visual language.

`AtIcon` wraps `lucide-vue-next` behind a `name` prop so icon-set changes are one
file. Do not import lucide components directly in feature code.

### 6.4 Element Plus wrapping

Element Plus provides behavior (positioning, keyboard nav, virtual scroll); the
`At*` wrapper provides the AAXON API and styling. **Feature code imports the
wrapper, never** `el-`* **directly.** `AtSelect` wraps `el-select`, `AtTabs` wraps
`el-tabs`, `AtTable` wraps `el-table`, `AtModal` wraps `el-dialog`.

**One deliberate exception:** `el-scrollbar` **is used raw.** Its whole value is the
`wrapRef` handle that sticky headers, edge detection, and scroll-to-bottom read
(§7.3); a wrapper would hide exactly the thing you need. Use it with the shared
`wrap-class` from §7.3 and reach for `scrollbarRef.value.wrapRef` directly.

Element Plus skin overrides live in **one** file, `styles/utilities/elementplus.css`
(not optional), which must define at least:


| Class                | Applied to                          | Purpose                                                                                             |
| -------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `.at-select`         | the `el-select` root                | field skin: `--radius-md`, `--color-border-strong`, 36px height, AAXON focus ring                   |
| `.at-select-popper`  | `popper-class`                      | dropdown skin: `--radius-md`, `--elevation-lg`, option hover/selected states                        |
| `.at-tabs`           | the `el-tabs` root                  | tab strip: horizontal scroll with hidden scrollbar (no nav arrows), active tab in `--color-primary` |
| `.at-scroll-overlay` | shorthand for the §7.3 `wrap-class` | overlay scrollbar                                                                                   |


Keep every override in that file rather than scattering `:deep()` rules through
components — Element Plus internals change between minors, and you want one place
to fix when they do.

---



## 7. Element Plus — hard-won rules

These come from production incidents. Follow them.

1. `:teleported="false"` **on every select/dropdown inside a scrollable panel.**
  Teleported poppers render in `<body>`, escape the scroll container, and
   detach visually on scroll.
   The `.at-select` / `.at-select-popper` skins are defined once in
   `styles/utilities/elementplus.css` (§6.4).
2. **Never use native** `<select>`**.** Always `el-select` (wrapped as `AtSelect`)
  so styling and keyboard behavior are consistent.
3. **Overlay scrollbars** — when the scrollbar must float over content rather
  than reserve a gutter:
   Anything reading scroll position (sticky headers, edge detection, scroll-to-
   bottom) must go through `scrollbarRef.value.wrapRef`, **not** the component
   root:
4. **Never use `ElMessageBox.confirm` for anything the user might see across a
  locale change.** An `el-config-provider` re-render tears the imperative
   dialog down mid-flight. Build confirms as a `<Teleport to="body">` Vue
   component (`AtConfirmDialog`) with reactive props.
5. `ElMessage` / `ElNotification` are fine for fire-and-forget toasts, but wrap
  them in a `useNotification()` composable (§10) so call sites never import
   Element Plus and the presentation can change in one place.
6. Sticky table headers escape the scroll container's `overflow` clip in WebKit.
  If you need rounded corners on a scrollable table, apply a per-cell radius
   fallback on the first/last header and footer cells in addition to the
   container radius.
7. Element Plus CSS is imported **before** `styles/index.css` so the token layer
  and overrides win without `!important`.

---



## 8. Services — the API layer



### 8.1 Naming

- `*Api.js` — CRUD / REST resource modules (`invoicesApi.js`)
- `*.service.js` — streaming, SSE, WebSocket, or multi-step orchestration
(`chat.service.js`)

Pick one and be consistent; a mixed convention is a real cost when you're
looking for the file that talks to an endpoint.

### 8.2 `httpClient.js`

Every network call goes through one wrapper. It owns auth injection and session
expiry — nothing else does.

```js
import { useAuthStore } from '../stores/auth'

export async function fetchWithAuth(url, options = {}) {
  const { useAuth = true, ...fetchOptions } = options
  const headers = new Headers(fetchOptions.headers)

  if (useAuth) {
    const token = localStorage.getItem('authToken') || useAuthStore().token
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, { ...fetchOptions, headers })

  if (response.status === 401) {
    handleSessionExpired()
    const err = new Error('Session expired')
    err.status = 401
    throw err
  }
  return response
}

export function handleSessionExpired() {
  useAuthStore().logout()
  // Dynamic import breaks the cycle: router → store → api → httpClient → router.
  // A static import here makes the module graph circular and yields an
  // `undefined` router at boot, intermittently and only in the prod build.
  import('../router').then(({ default: router }) => {
    if (router.currentRoute?.value?.name !== 'Login') router.push({ name: 'Login' })
  })
}
```

That dynamic import is not stylistic. Keep the comment.

### 8.3 The API layer never imports UI

When a response needs to trigger something visual that isn't an error (a
consent modal, a forced upgrade prompt, a quota warning), **dispatch a**
`CustomEvent` **on** `window` and let a component listen. The service stays
dependency-free:

```js
if (response.status === 403) {
  const body = await response.clone().json().catch(() => null)
  if (body?.code === 'CONSENT_REQUIRED') {
    window.dispatchEvent(new CustomEvent('app:consent-required'))
  }
}
```



### 8.4 Resource module shape

Thin, one exported function per endpoint, throw on non-ok, return parsed JSON:

```js
import { fetchWithAuth } from './httpClient.js'
const API = import.meta.env.VITE_API_BASE_URL

export async function listInvoices(params = {}) {
  const qs = new URLSearchParams(params)
  const res = await fetchWithAuth(`${API}/invoices?${qs}`)
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
}

export async function createInvoice(data) {
  const res = await fetchWithAuth(`${API}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return res.json()
}
```

No caching, no retries, no transformation in this layer. Stores own state;
`utils/` owns transformation.

### 8.5 Backend contract

Standardize the API shape so stores and composables are reusable:

- List endpoints → `{ data: [...], pagination: { page, limit, total, totalPages } }`
- Single resource → the object
- Errors → non-2xx with `{ message, code? }`

Proxy any third-party API through your own backend rather than calling it from
the browser — it avoids CORS workarounds and keeps API keys server-side.

---



## 9. State — Pinia



### 9.1 Style

**Setup stores everywhere.** They compose with composables, type better, and
avoid the `this` binding surprises of the options syntax. Do not mix styles in
one codebase.

```js
export const useSessionStore = defineStore('session', () => {
  const user = ref(null)
  const isAuthenticated = computed(() => !!user.value)
  async function load() { user.value = await fetchMe() }
  return { user, isAuthenticated, load }
}, { persist: true })
```



### 9.2 The paginated-list store factory

Most apps grow several "list of X with pagination and filters" stores. Write the
factory once:

```js
// stores/createListStore.js
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { fetchWithAuth } from '../services/httpClient.js'

const API = import.meta.env.VITE_API_BASE_URL

/**
 * @param {string} name     Store id, also the default endpoint (plural).
 * @param {object} [opts]
 * @param {string} [opts.endpoint]  Override the endpoint path.
 * @param {Function} [opts.extend]  (ctx) => extra state/actions merged into the store.
 */
export function createListStore(name, { endpoint = name, extend } = {}) {
  return defineStore(name, () => {
    const items = ref([])
    const loading = ref(false)
    const error = ref(null)
    const pagination = reactive({ page: 1, limit: 50, total: 0, totalPages: 0 })

    async function fetchAll({ page = 1, limit = pagination.limit, ...filters } = {}) {
      loading.value = true
      error.value = null
      try {
        const params = new URLSearchParams({ page, limit })
        for (const [k, v] of Object.entries(filters)) {
          if (v === '' || v == null || v === 'all') continue
          params.set(k, Array.isArray(v) ? v.join(',') : String(v))
        }
        const res = await fetchWithAuth(`${API}/${endpoint}?${params}`)
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        const body = await res.json()
        items.value = Array.isArray(body?.data) ? body.data
                    : Array.isArray(body) ? body : []
        Object.assign(pagination, body?.pagination ?? {
          page: 1, limit: items.value.length, total: items.value.length, totalPages: 1,
        })
      } catch (e) {
        error.value = e.message
        console.error(`[${name}] fetch failed:`, e)
      } finally {
        loading.value = false
      }
    }

    const base = { items, loading, error, pagination, fetchAll }
    return { ...base, ...(extend?.(base) ?? {}) }
  })
}
```

Then `export const useInvoicesStore = createListStore('invoices')` — pagination,
loading, and error handling for free. Stores with a genuinely different shape
(boards, wizards, chat) are written by hand; do not bend the factory to fit them.

### 9.3 Conventions

- `persist: true` **only** for user preferences that should survive a reload:
locale, theme, sidebar state, last-selected filters. Never for server data —
stale localStorage caches are a debugging tax with no payoff.
- Optimistic updates: mutate in memory, call the API, roll back in `catch`.
State the rollback explicitly; don't rely on a refetch.
- When an action receives a full updated entity from the API, replace it in the
array through a private `_setItem(updated)` helper rather than open-coding the
`findIndex`/`splice` at every call site.
- **Deletes must purge every collection that holds the entity.** If an item is
cached in two places (a main list and a grouped map), removing it from only
one leaves stale references rendering in the UI.

### 9.4 The dismissable-list composable

Apps that let a user hide items from a list without deleting them (a "not relevant" / "undo"
control) end up writing the same three primitives in every store that needs it: an id list, a
function that pushes to it idempotently, and a function that clears it. Write it once, the same
way §9.2 writes the list factory once:

```js
// composables/useDismissable.js
import { ref } from 'vue'

/** Reusable dismiss/undo tracking for a Pinia setup store — mix its return
 * value into the store's own returned object. `dismissedIds` is a plain ref
 * so the store's existing `persist: { pick: [...] }` config keeps working. */
export function useDismissable() {
  const dismissedIds = ref([])

  function dismiss(id) {
    if (!dismissedIds.value.includes(id)) dismissedIds.value.push(id)
  }
  function clearDismissed() {
    dismissedIds.value = []
  }

  return { dismissedIds, dismiss, clearDismissed }
}
```

Use it inside any `defineStore(...)` setup function that needs the behavior:

```js
export const useInvoicesStore = defineStore('invoices', () => {
  const { dismissedIds, dismiss, clearDismissed } = useDismissable()
  // ...spread dismissedIds, dismiss, clearDismissed into the store's returned object
}, { persist: { pick: ['dismissedIds'] } })
```

Unlike §10's composables, this one is meant to be called from *inside* a store's setup function,
not from a component — it returns plain refs/functions to be merged into that store's own return
value, so the store keeps sole ownership of the state and its existing `persist` config.

---



## 10. Composables

Where all non-trivial logic lives. A view that has more than a handful of lines
of `<script setup>` is usually hiding a composable.

**Split by concern, not by feature.** A large feature gets several focused
composables (`useThingData`, `useThingFilters`, `useThingLifecycle`,
`useThingUrlSync`) rather than one 800-line `useThing`. Each is independently
readable and testable.

Baseline set worth having in every app:


| Composable                          | Responsibility                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `useNotification()`                 | `showSuccess/showError/showInfo/showWarning` over Element Plus — the only module importing `ElMessage` |
| `useDropdown(containerRef?)`        | open/close/toggle + click-outside auto-close                                                           |
| `useListPage({ store, fetchArgs })` | wires a list store to URL query params: page, search, filters; handles `?selected=<id>` deep links     |
| `usePageView(basePath)`             | route-derived `currentView` computed + navigation helpers for pages with `?view=a|b` modes             |
| `useRelativeTime(date)`             | reactive "3 minutes ago", locale-aware                                                                 |
| `useSocket()`                       | *(optional)* singleton socket connection; see §13                                                      |


`useDropdown` reference implementation:

```js
export function useDropdown(containerRef = null) {
  const isOpen = ref(false)
  const toggle = () => { isOpen.value = !isOpen.value }
  const open = () => { isOpen.value = true }
  const close = () => { isOpen.value = false }

  function handleClickOutside(e) {
    if (!isOpen.value) return
    if (containerRef?.value?.contains(e.target)) return
    isOpen.value = false
  }

  onMounted(() => document.addEventListener('click', handleClickOutside))
  onUnmounted(() => document.removeEventListener('click', handleClickOutside))
  return { isOpen, toggle, open, close }
}
```

Rules: always clean up listeners/intervals/observers in `onUnmounted`. A
composable that returns a module-level singleton `ref` must say so in its
docblock — it's shared state, and callers need to know.

---



## 11. Views, layouts, routing



### 11.1 Views are thin

A view resolves route params, calls a composable, and renders components. If two
views share logic, that logic belongs in a composable — the views stay wrappers.

### 11.2 Layouts

Route-level chrome only: `DefaultLayout` (header + sidebar + `<RouterView/>`),
`FocusLayout` (header only), `AuthLayout` (centered card). Layouts render
`<RouterView/>` and own nothing domain-specific.

Wire them as parent routes with children so the shell doesn't remount on
navigation:

```js
{
  path: '/invoices',
  component: DefaultLayout,
  children: [{ path: '', name: 'Invoices', component: () => import('../views/Invoices.vue') }],
}
```



### 11.3 Routing rules

- `createWebHistory()`; the server must fall back to `index.html`.
- **Lazy-load every route component** via `() => import(...)`. Layouts may be
static.
- One global `beforeEach` guard: redirect unauthenticated users to `/login`,
restore the session once, and normalize required query params (e.g. force a
default `?view=`) with a `replace` redirect.
- **URL is the source of truth** for view mode, pagination, filters, and
selection. State that mirrors the URL is derived from it, never the reverse —
it makes every screen linkable and the back button correct.
- A `catch-all: '/:pathMatch(.*)*'` → `NotFound.vue`.



### 11.4 Naming

Route `name` in PascalCase matching the view file. Paths kebab-case.

---



## 12. Internationalization

- `createI18n({ legacy: false, locale, fallbackLocale: 'en', messages })`.
- One file per locale in `src/locales/`. **Every new key goes into all locale
files in the same commit** — a missing key silently falls back and ships
untranslated text.
- Namespace by feature (`nav.*`, `common.*`, `invoices.*`), never by component
file name.
- **No HTML inside translation strings.** vue-i18n flags it as an XSS risk. For
bold/link fragments use `<i18n-t>` with slots:
  ```vue
  <i18n-t keypath="invoices.deleteConfirm" tag="p">
    <template #name><strong>{{ invoice.name }}</strong></template>
  </i18n-t>
  ```
- Persisted-locale gotcha: if the locale store uses `persist: true`, localStorage
holds a **JSON blob** (`{"locale":"es"}`), but a hand-written write holds a raw
string. The reader in `plugins/i18n.js` must handle both and validate against
the supported list before falling back to `'en'`:
  ```js
  function readPersistedLocale() {
    const raw = localStorage.getItem('locale')
    if (!raw) return 'en'
    let candidate = raw
    try {
      const parsed = JSON.parse(raw)
      candidate = typeof parsed === 'object' ? parsed?.locale : parsed
    } catch { /* raw string */ }
    return SUPPORTED.includes(candidate) ? candidate : 'en'
  }
  ```
- Element Plus locale: wrap the app in `<el-config-provider :locale="epLocale">`.
Remember §7.4 — this re-renders on locale change and will kill imperative
dialogs.
- Dates/numbers via `Intl` with the active locale. Never hand-roll formats.

---



## 13. Real-time (optional)

Only if the app has server-pushed state.

- One singleton connection in `composables/useSocket.js` — created on login,
torn down on logout. Never per-component.
- Auth via the Bearer token in the handshake; on an auth error, call the same
`handleSessionExpired()` from §8.2.
- Events mutate **stores**, not components. Components stay reactive consumers.
- Every event handler must be idempotent — reconnects replay.

---



## 14. Accessibility

Non-optional baseline:

- Semantic elements: `<button>` for actions, `<a>` for navigation, real `<label>`
bound to inputs, one `<h1>` per page with no skipped levels.
- **Preserve focus rings.** The design system specifies a `2px` primary ring at
`2px` offset. Suppress `outline` only if you replace it with an equally visible
indicator, and never on `:focus-visible`.
- Every icon-only control gets an `aria-label`.
- Modals: focus trap, `Esc` to close, focus restored to the trigger on close,
`aria-modal="true"`.
- Loading/error/empty states announced via `aria-live="polite"`.
- Contrast: the design system's semantic text colors are chosen to pass AA on
their paired backgrounds — don't recolor text ad hoc.
- Honor `prefers-reduced-motion`: reduce transitions to near-zero rather than
removing state feedback entirely.

---



## 15. Performance

- Lazy-load routes (§11.3) and heavy optional libraries (charts, maps, editors,
PDF) with dynamic `import()` at the point of use.
- `v-memo` / `shallowRef` for large immutable lists; virtualize past ~200 rows.
- Always `:key` with a stable id in `v-for`. Never the array index for lists that
reorder.
- Debounce search inputs (~300ms) and abort superseded requests with
`AbortController`.
- `defineAsyncComponent` for modals and panels that are rarely opened.
- Keep the initial bundle lean — audit with `vite build --mode production` and
`rollup-plugin-visualizer` before shipping.

---



## 16. Tooling and config



### `.prettierrc` — copy exactly

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "es5",
  "printWidth": 80,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```



### ESLint

Use **flat config** (`eslint.config.js`) — ESLint 9's `.eslintrc.cjs` legacy mode
is deprecated:

```js
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import prettier from '@vue/eslint-config-prettier'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  prettier,
  {
    rules: { 'vue/multi-word-component-names': 'off' },
  },
]
```



### `vite.config.js`

```js
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: { port: 3024, strictPort: true, allowedHosts: [/* prod hostnames */] },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
```

**Dev port convention: backend port + 1000.** If the backend this app talks to runs on `2024`,
the frontend's dev server runs on `3024` (`VITE_API_BASE_URL=http://localhost:2024` → `port:
3024`). Fixed offset, not a per-project choice — it means anyone who knows one service's dev port
can guess the other's without opening a config file, and it keeps sibling projects' dev servers
(each with their own backend+frontend pair) from colliding on the same port by coincidence.

`strictPort: true` — fail loudly rather than silently drifting to another port
and breaking the backend's CORS allowlist.

### `package.json` scripts

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint . --fix",
  "format": "prettier --write \"src/**/*.{js,vue,css}\" \"*.{js,json}\"",
  "format:check": "prettier --check \"src/**/*.{js,vue,css}\" \"*.{js,json}\""
}
```



### Environment

- Commit `.env.example` with every variable documented by a comment; `.env` is
gitignored.
- All client vars are `VITE_`-prefixed and are **public** — never put a secret in
one.
- Baseline: `VITE_API_BASE_URL`, `VITE_AUTH_URL`, `VITE_BRAND`, plus
`VITE_SOCKET_URL` if §13 applies.
- Read them once into a `utils/config.js` module rather than sprinkling
`import.meta.env` across the codebase.

---



## 17. Definition of done for a new feature

- [ ] Every color/size/radius/shadow comes from a token — no raw values
- [ ] Renders correctly in **both** light and dark (`data-theme="dark"`) —
  ```
  including a **focused** input and any `*-subtle` tint, which is where a
  light-mode-only value shows up as a pale wash on a dark canvas
  ```
- [ ] All user-facing strings exist in **all** locale files
- [ ] Loading, empty, and error states are designed, not afterthoughts
- [ ] Keyboard-navigable; focus visible; icon-only controls labeled
- [ ] Scroll containers use `overscroll-y-contain`; dropdowns inside them use
  ```
  `:teleported="false"`
  ```
- [ ] URL reflects meaningful state (page, filters, selection) — reload and back
  ```
  button behave
  ```
- [ ] Network calls go through `fetchWithAuth`; errors surface via
  ```
  `useNotification`
  ```
- [ ] No component exceeds ~250 lines; shared logic sits in a composable
- [ ] `npm run lint && npm run format:check` clean

---



## 18. Setting up a new project

1. `npm create vite@latest <app> -- --template vue`, then install §1 core.
2. Copy `AAXON_OS_DESIGN_SYSTEM.md` and this file to the repo root.
3. Create the §2 directory skeleton (empty folders with a `.gitkeep`).
4. Write `styles/tokens.css` from the design system (§4.3 — `@theme` block +
  `[data-theme='dark']` overrides), then `theme/brands.css`, `base.css`,
   `utilities/typography.css`, `utilities/elementplus.css`.
5. Self-host the two font families in `public/fonts/`.
6. Write `theme/brand.js` + `theme/colorScheme.js` (§5).
7. Write `services/httpClient.js`, `plugins/i18n.js`, `router/index.js`,
  `stores/createListStore.js`, `composables/useNotification.js`.
8. Build `AtButton`, `AtInput`, `AtCard`, `AtBadge` first — they validate the
  token layer end to end. Add the rest on demand.
9. Then, and only then, start on features.
10. Write the project's own `CLAUDE.md` documenting the domain, and have it link
  to this file rather than duplicating it.

