# Build order and verification

## Build bottom-up

Same principle as `docs/frontend_building/FRONTEND_BUILD_PLAYBOOK.md` §2, applied in practice:

1. **`firebase.js` + the auth store + a login view.** Nothing else works without this — every
   other layer either needs an authenticated user or needs to redirect to one.
2. **Services layer** (`httpClient.js` wrapping fetch with the Firebase ID token, one thin
   `*Api.js` per backend resource).
3. **The data store**, matching the backend's actual persistence shape (see
   `stack-and-structure.md`).
4. **Pure utils** — pull calculation/formatting logic out of the old code verbatim into standalone,
   testable functions *before* building any component that uses them. If the legacy app had a
   "silently upgrade old data shapes on load" function, port it into a utils function and call it
   from the store's load step — it's easy to forget this exists at all if you're not looking at the
   legacy file line by line.
5. **Shared components**, built to serve every consumer that will need them, not just the first
   screen that happens to need one.
6. **Views**, thin — a route, a store, a composable, some components.
7. **Router + app shell.**
8. **Styles** — token layer ported from the existing palette, not redesigned.
9. **Deploy pipeline** (see `../02-firebase/hosting-and-deployment.md`) — get this working early,
   even against a half-built app, so hosting/build-config problems surface while they're cheap to
   fix.
10. **Backend cutover**, if the migration also changes the backend's auth (see
    `../03-backend/cloud-run-python-pattern.md`'s zero-downtime pattern).
11. **Second-pass audit** against the legacy source, if this was a migration — see
    `../04-migrations/`.
12. **Manual run-through** in a real browser, every account, every section, default landing state.

## Verification: a passing build proves almost nothing

`npm run build` succeeding and `npm run lint` being clean tell you the code is syntactically valid
and stylistically consistent. They tell you **nothing** about whether it actually works. Three
specific failure classes only show up in a real browser:

1. **A third-party SDK throwing synchronously during boot** (e.g. Firebase's `initializeApp`/auth
   calls throwing `auth/invalid-api-key` on a placeholder config) blanks the *entire* page with no
   error UI and no build/lint signal — only visible in the browser console.
2. **A form control silently no-op'ing** — e.g. a `<select v-model>` whose ref doesn't match any
   `<option>`'s value on mount. The dropdown visually shows a selection; the underlying model stays
   empty; the "add" button's own validation then silently blocks submission. No error, no console
   warning, nothing wrong-looking in the rendered HTML.
3. **A route guard not re-firing when you expect it to** — Vue Router's `beforeEach` only runs on an
   actual navigation attempt, not just because some reactive state (like "is the user logged in?")
   changed. A successful login/logout has to explicitly call `router.push(...)`, or the UI silently
   sits on the current route forever despite the underlying auth state having actually changed —
   with zero error anywhere.

None of these are hypothetical — all three happened during this project. See
`gotchas.md` for the full writeups and `../TROUBLESHOOTING.md` for the fast-lookup version.

### The actual verification loop used

A quick, repeatable way to check for class (1) and (2) without a human clicking through everything
every time — a small one-off Playwright script:

```js
import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
page.on('pageerror', err => errors.push('pageerror: ' + err.message))
await page.goto('http://localhost:3080/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
console.log('BODY:', await page.textContent('body'))
console.log('ERRORS:', JSON.stringify(errors, null, 2))
await browser.close()
```

Run with `npx playwright install chromium` once, then `node that-script.mjs` against the dev server
or a deployed URL any time you want a fast, objective "did this actually load without throwing"
check — much faster than manually opening DevTools every time, and it catches synchronous boot
crashes that a human might dismiss as "still loading."

For class (3) and anything involving real user interaction (login, data mutation, navigation), a
human still has to actually click through it — a script checking for console errors won't notice
"nothing happened when it should have."
