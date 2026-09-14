# Migrating a single-`index.html`-on-GitHub-Pages app to Vue + Firebase

This is the concrete version of `docs/frontend_building/FRONTEND_MIGRATION_PLAYBOOK.md`, for the
specific (common) starting shape: one hand-built `index.html` (maybe assembled from a few source
files by a small build script), committed straight to `main`, served by GitHub Pages with no build
step, talking to some backend via a simple static auth token.

## 1. Preserve the legacy app — don't delete it

```bash
git mv src legacy/src
git mv build.js legacy/build.js
git mv index.html legacy/index.html   # the last known-good deployed build
```

`git mv` (not delete-and-recreate) keeps file history intact. You need the legacy code available and
untouched for two things the migration playbook requires: reading it in full before porting anything
(§2 of that doc), and the second-pass audit after the first pass "looks done" (§7). Don't clean it up
until the new app has actually shipped and been verified.

## 2. The new Vite app claims the same root paths — this affects the live site immediately on push

Vite's entry point is conventionally `index.html` at the repo root — the same path GitHub Pages was
serving the legacy build from. The moment you `git push` the new (unbuilt) Vite `index.html`,
**the live GitHub Pages site breaks**, because Pages serves the raw file with no build step, and a
Vite entry file needs one. Two implications:

- Don't push until you're ready for the live site to go dark (or until the new deploy pipeline is
  ready to take over immediately after).
- If you're keeping GitHub Pages at all rather than switching hosts (see
  `../02-firebase/hosting-and-deployment.md` for why Firebase Hosting was chosen here instead), set
  up the GitHub Actions build-and-deploy workflow *before* pushing the new source, so there's no gap
  where the repo has new source but the live site has nothing built from it.

## 3. Read every legacy file in full before writing any Vue code

Not excerpts, not "the parts that look relevant." Legacy vanilla-JS files accumulate scattered
helper functions, secondary features, and old-data-shape migration-on-read logic months apart from
the main code path — a skim reliably misses real functionality. Concretely, watch for:

- **Fields that are derived, not stored**, despite documentation implying otherwise (e.g. a
  "progress" percentage actually computed from subtask completion at render time, even though an old
  README's example data shape showed it as a plain stored field).
- **Data-shape migration functions** that silently upgrade an old format when data loads — these
  must be ported, since old-shaped data may still be sitting in a live user's saved file.
- **Dead code that looks load-bearing** — a whole render function that's defined but never actually
  called anymore, superseded by an inline version elsewhere. Confirm what's *actually* invoked, not
  just what's defined, before deciding what to port.
- **Secondary/bulk actions** — select-all, undo/dismiss, a history dropdown, an autocomplete/assist
  endpoint distinct from the main flow. These get skipped disproportionately often because the
  primary flow doesn't need them to "work."

## 4. Check the *current* backend, not what the legacy frontend assumes

Backends drift out from under old frontends. Before porting any endpoint call, confirm its current
contract from the actual backend source — field names, enum values, and whether the route still
exists at all may have changed since the legacy JS was last touched.

## 5. Translate patterns, don't transliterate code

| Legacy pattern | New pattern |
|---|---|
| A global mutable state object | A Pinia store |
| DOM-ID-keyed `innerHTML =` render functions | A reactive template |
| Inline `onclick="..."` strings | `@click` handlers |
| Scattered `fetch()` calls, ad hoc per feature | One services layer, one `httpClient` wrapper |
| One big file mixing state/render/network for a feature | Split along store/service/component boundaries |

## 6. If the migration also swaps the auth mechanism, do it without an outage

See `../02-firebase/authentication.md`'s "Migrating an existing auth mechanism without an outage"
section — the backend needs to accept both the old and new auth method during the transition window,
because the still-live legacy frontend depends on the old one right up until the new frontend is
actually deployed and confirmed working.

## 7. Pick router mode and build config based on where you're actually deploying

Don't default to Vue Router's history mode "because it's the modern default" if you're staying on
GitHub Pages — see `../01-frontend-vue/stack-and-structure.md`'s router table. If you're switching
hosts as part of the migration (e.g. to Firebase Hosting, which supports history mode natively),
make that decision explicit and document it as a deliberate deviation from the framework's default,
not an oversight.

## 8. Verify in a real browser, not just build/lint

A placeholder/missing config value (Firebase, an API key, anything a third-party SDK needs at boot)
can throw synchronously and blank the entire page with zero build or lint signal. See
`../01-frontend-vue/build-order-and-verification.md` for the actual verification loop used.

## 9. Do the second-pass audit for real

Once the first pass "looks done" — re-read the legacy source again, specifically hunting for what
got skipped. The categories that recur:

- Fields a shared component silently drops because the first consumer that used it didn't need them.
- Secondary/bulk actions (see §3).
- Filters/controls present on some but not all of several similar legacy surfaces.
- Stateless assist endpoints (autocomplete, validation-on-type) that don't show up when tracing "what
  does the main submit button call."

Treat this as a real, scoped second pass — not something to let trickle in ad hoc as issues are
noticed later.

## 10. Run every account, every section, the default landing state

Not just whichever account/section you happened to be looking at while building. See
`../01-frontend-vue/build-order-and-verification.md`.
