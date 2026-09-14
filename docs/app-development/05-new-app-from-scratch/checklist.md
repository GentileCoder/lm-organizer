# Starting a brand-new app on this stack

No legacy code to migrate — a genuinely new personal app. Shorter path than the migration guide, but
the same underlying decisions.

## 1. Decide hosting before writing routes

This determines Vue Router's mode and the Vite `base` config from day one — see
`../01-frontend-vue/stack-and-structure.md`'s router table. Deciding this after building a bunch of
routes just means redoing router config later; deciding it first means you build the right thing
once.

## 2. Decide whether this app needs a custom backend at all

If it only talks to Firebase (Firestore, Firebase Storage) with Firebase Security Rules doing access
control, it doesn't need a custom backend — skip `03-backend/` entirely. Only add a Cloud
Run/Functions layer if the app needs to keep a third-party API key server-side, needs one CORS
boundary in front of multiple upstreams, or needs to sit in front of storage (like a GCS bucket)
that has no native per-user browser-safe access control of its own.

## 3. Set up Firebase (if the app needs real auth)

`../02-firebase/project-setup.md` → `authentication.md` → `hosting-and-deployment.md`, in that
order — auth and hosting are independent decisions, but project setup has to happen before either.

## 4. Scaffold

```bash
npm create vite@latest <app-name> -- --template vue
```

Then trim/add per `../01-frontend-vue/stack-and-structure.md` — install only what the app actually
needs, not the full template spec by default.

## 5. Build bottom-up

`../01-frontend-vue/build-order-and-verification.md` — auth → services → store → utils → shared
components → views → shell → styles → deploy pipeline.

## 6. Get the deploy pipeline working early

Even against a half-built app. A hosting/build-config mistake found on day one costs a few minutes
to fix; the same mistake found after twenty components exist costs an afternoon of confused
debugging that has nothing to do with the actual app code.

## 7. Verify with a real browser at every milestone

Not just `npm run build && npm run lint`. See the verification loop in
`../01-frontend-vue/build-order-and-verification.md` and the specific failure classes in
`../01-frontend-vue/gotchas.md` that only show up this way.

## Which storage should a new app actually use?

| Situation | Choice |
|---|---|
| Simple app-owned data, no existing GCS/backend infra | Firestore, with Firebase Security Rules for per-user access control — no custom backend needed at all |
| Already has GCS + a working Cloud Run proxy from a prior project | Keep that pattern (`../03-backend/cloud-run-python-pattern.md`) rather than migrating storage just for the sake of using "the Firebase way" |
| Needs to proxy a genuinely third-party API (not GCP) that requires a secret | A custom backend either way — Cloud Run is a fine place for it |

Don't switch storage backends on an app that already has a working one just for consistency with a
different app's stack — match the tool to what the app actually needs.
