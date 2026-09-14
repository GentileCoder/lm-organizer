# The Vue stack, trimmed for a personal app

`docs/frontend_building/FRONTEND_TEMPLATE_SPEC.md` describes the full AAXON-ecosystem stack —
Tailwind, Element Plus, vue-i18n, a shared `At*` component library, brand theming. A personal app
used by one or two people doesn't need most of that, and installing it "just in case" is dead
weight and a maintenance surface with no payoff. Here's what actually got used, and why each cut was
made.

## Core stack (always)

| Package | Role |
|---|---|
| `vue` ^3.5 | Composition API + `<script setup>` only |
| `vite` ^6 + `@vitejs/plugin-vue` | Dev server + build |
| `pinia` ^3 | State |
| `vue-router` ^4 | Routing — history mode **or** hash mode depending on host, see below |
| `firebase` (JS SDK) | Auth (and Hosting's build output, not a runtime dependency) |

## Deliberately skipped, and why

| Skipped | Why |
|---|---|
| Tailwind | A small app's existing CSS is usually simpler to port to CSS custom properties than to re-author as utility classes. Reach for Tailwind only if the app has enough surface area that hand-written CSS is genuinely slower. |
| Element Plus | Native `<select>`/`<input>`/`<textarea>` styled with your own tokens is enough until you actually need a composite widget (virtualized table, date picker) it provides for free. |
| vue-i18n | Single-language, single-user(ish) apps don't need it. Add it the day a second language is a real requirement, not before. |
| `pinia-plugin-persistedstate` | Firebase's own SDK already persists the auth session (IndexedDB) — a second persistence layer for the same concern is redundant. Use it for genuine UI-preference persistence (theme, last-selected filter) if that need shows up. |
| A `ui/At*` component library | Only pays for itself once a *second* app needs to share the same visual identity. For one app, style the handful of real components you have directly. |

## Directory layout used

```
src/
  main.js               Bootstrap: pinia → (wait for auth restore) → router → mount
  App.vue               Header/nav chrome (only when authenticated) + <RouterView/>
  firebase.js           initializeApp + getAuth, config from import.meta.env
  router/index.js       Routes + the single auth guard
  stores/
    auth.js             Firebase user state, login()/logout(), session-restore promise
    <domain>.js          App data — see "One store, not five" below
  services/
    httpClient.js        fetchWithAuth: attaches the Firebase ID token, handles 401
    <resource>Api.js      Thin GET/POST wrappers, no logic
  utils/                 Pure functions — calculations, formatting, constants
  views/                 One per route, thin
  components/
    <Domain>/             Feature components grouped by domain
    layout/                Header, nav — app chrome
  styles/
    tokens.css             Existing palette promoted to named custom properties
    base.css               Resets, global element styles
    utilities.css           Classes genuinely shared across many components (cards, pill buttons, stat tiles) — non-scoped on purpose, commented as such
```

## One data store, not one per domain

The template spec's default is a Pinia store per domain (`useInvoicesStore`, `useUsersStore`, …),
each with its own `fetchAll`/save cycle. That assumes independent REST resources. A backend that
persists the **entire app state as one JSON blob** via a single GET/POST doesn't have independent
resources — five stores each debounce-saving independently would race and silently overwrite each
other's writes.

Instead: **one store matching the actual persistence unit**, internally organized into clear
sections, with one shared debounced-save action that every mutation calls through:

```js
export const useOrganizerStore = defineStore('organizer', () => {
  const data = reactive({ tasks: [], notes: [], /* … */ })
  let saveTimer = null

  function persist() {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(persistNow, 400)
  }

  function addTask(text) {
    data.tasks.push({ id: Date.now(), text, done: false })
    persist()
  }
  // …one function per real mutation, each ending in persist()
})
```

The rule of thumb: **match your store boundaries to your backend's actual save boundaries**, not to
a generic "one store per noun" convention.

## Router mode depends on where you're deploying

| Host | Router mode | Why |
|---|---|---|
| GitHub Pages (project page, no custom rewrite) | `createWebHashHistory()` | No server-side fallback to `index.html` for unmatched deep links without the `404.html` copy trick. Hash mode needs zero server config. |
| Firebase Hosting | `createWebHistory()` | `firebase.json`'s `rewrites: [{ source: "**", destination: "/index.html" }]` handles the fallback natively — clean URLs work out of the box. |
| Netlify / Vercel | `createWebHistory()` | Same — both support an SPA rewrite/redirect rule natively. |

Decide this **before** building routes, not after — switching later just means deleting a
`base: '/repo-name/'` from `vite.config.js` and one import in `router/index.js`, but it's still a
decision worth making up front so you don't build around the wrong assumption (e.g. relying on
`#/x` fragments for something that later needs to be a real shareable link).

## Debounced save, not save-per-keystroke or save-on-every-render

Every store mutation should end by calling a shared `persist()` that debounces (≈400ms) into the
backend's whole-blob save. This coalesces rapid bursts (fast toggling, typing) into far fewer
network requests than the legacy pattern of "save immediately after literally every mutation," while
still saving quickly enough that nothing feels laggy or gets lost on an accidental tab close.
