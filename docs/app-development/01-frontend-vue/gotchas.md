# Vue/frontend gotchas actually hit

Every one of these happened during the LM Organizer migration, was found either by manual review or
by an actual browser test, and got fixed. Check here before assuming a bug is something exotic.

## 1. `value || fallback` clobbers a legitimate `0`

```js
// Wrong — 0 is falsy in JS, so a real price of €0 becomes ''
c.items.push({ price: price || '' })

// Right
c.items.push({ price: price ?? '' })
```

Any field where `0` (or `false`) is a meaningful, distinct-from-"empty" value must use `??`
(nullish coalescing), never `||`, when supplying a default. This is easy to miss because it only
manifests when someone actually enters the falsy-but-valid value — a quick manual test with "1"
never catches it.

## 2. A `<select v-model>` whose initial value matches no `<option>`

```vue
<script setup>
const form = ref({ category: '' }) // categories are ['Housing', 'Food', ...] — '' isn't one of them
</script>
<template>
  <select v-model="form.category">
    <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
  </select>
</template>
```

The browser renders the `<select>` showing its *first* `<option>` highlighted (standard HTML
behavior for a `<select>` with no matching selected value) — but `form.category` stays `''`,
because Vue's `v-model` only updates on a user-initiated `change` event, never automatically to
match what the browser happens to be displaying. If the submit handler checks `if (!form.category)
return`, it silently blocks submission the very first time, even though the dropdown looks
perfectly normal and selected.

**Fix:** always initialize a `<select v-model>` ref to a real value from the actual options list
(e.g. `categories.value[0] || ''`), never to a bare `''` unless `''` is itself a valid, present
option.

## 3. A successful auth state change with no navigation to show for it

```js
// LoginView.vue — WRONG: nothing happens after a successful login except the promise resolving
async function submit() {
  await authStore.login(email, password)
}
```

Vue Router's `beforeEach` guard evaluates once per **navigation attempt**. It does not re-run just
because some reactive ref it reads (`isAuthenticated`) changed value while the user is sitting still
on the current route. A successful login updates the store's `user` ref (via Firebase's
`onAuthStateChanged` callback), but if nothing calls `router.push(...)` afterward, the app just...
stays on `/login` — authenticated, with zero visible error, looking exactly like a failed login.

**Fix:** explicitly navigate after every state-changing auth action:

```js
async function submit() {
  const ok = await authStore.login(email, password)
  if (ok) router.push({ name: 'Home' })
}

// same for logout
async function logout() {
  await authStore.logout()
  router.push({ name: 'Login' })
}
```

This bug is nasty specifically because **everything else "worked"** — the network request
succeeded, Firebase issued a real token, no exception was thrown, no console error appeared. The
only symptom was "the button doesn't seem to do anything," which looks exactly like a credentials
problem and wastes real debugging time checking the wrong layer (verify with the browser Network
tab's actual response body before assuming the auth attempt itself failed).

## 4. Router's initial navigation races an async session restore

```js
// main.js — WRONG ORDER
app.use(pinia)
app.use(router)          // triggers the FIRST navigation + guard evaluation, right now
useAuthStore().init().then(() => app.mount('#app'))   // session restore finishes later
```

`app.use(router)` kicks off vue-router's initial navigation (and therefore the first `beforeEach`
guard check) immediately — it is **not** gated on `app.mount()`. If your auth store's session
restore (Firebase's `onAuthStateChanged`, which is inherently asynchronous) hasn't resolved yet, the
guard sees a not-yet-populated `user` ref, concludes "not logged in," and redirects an
already-logged-in returning user straight to the login screen.

**Fix:** delay installing the router itself, not just mounting, until the session restore promise
resolves:

```js
app.use(pinia)
useAuthStore().init().then(() => {
  app.use(router)   // now the first guard check sees the real, restored auth state
  app.mount('#app')
})
```

## 5. A third-party SDK throwing synchronously blanks the whole page

An empty/placeholder Firebase config (before the real project exists) causes `auth/invalid-api-key`
to throw the moment the app tries to use Auth — not a rejected promise your code can catch, a thrown
error during module evaluation / component setup. The result: a completely blank page, no error
banner, nothing in the DOM. The **only** place this is visible is the browser console.

Don't assume "blank page" means a rendering/logic bug in your own components before checking the
console. This exact failure mode is expected and harmless *before* real backend config exists —
it's a "not configured yet" signal, not a code defect, once you know to look for it.

## 6. Local date vs. UTC date for "today"

```js
// Wrong — UTC, can be a day off from local time near midnight
const today = new Date().toISOString().slice(0, 10)

// Right — matches local calendar date
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
```

Use one shared local-date helper everywhere a "YYYY-MM-DD for today" string is needed, and never
reach for `toISOString()` for that purpose — it's UTC, and it'll only visibly disagree with the
calendar near midnight in whatever timezone the user actually is in, which makes it an easy thing to
never notice during development.
