# App Development Playbook

A personal, lived-experience playbook for building and migrating personal apps on the stack used
for LM Organizer: **Vue 3 + Vite + Pinia** frontend, **Firebase Authentication + Hosting**, and a
small **Python Cloud Run** backend in front of whatever storage the app actually needs (GCS,
Firestore, etc.).

This is different from [`docs/frontend_building/`](../frontend_building/), which is a
domain-agnostic template spec written for a multi-app design-system ecosystem (AAXON). That doc set
tells you the *general* shape a frontend should have. This one tells you what actually happened the
first time that shape got applied to a real, personal, two-user app — including every wrong turn,
every tool that didn't work the first time, and the fixes. Read `frontend_building/` for the
architecture rules; read this for how the rubber actually met the road.

## How this is organized

| Folder | What's in it |
|---|---|
| [`01-frontend-vue/`](01-frontend-vue/) | The trimmed-down Vue stack actually used, the build order, and Vue-specific bugs hit and fixed |
| [`02-firebase/`](02-firebase/) | Setting up a Firebase project, Authentication (incl. the username-not-email trick), and Hosting |
| [`03-backend/`](03-backend/) | The Python Cloud Run backend pattern, and the real pain of getting `gcloud` working on macOS |
| [`04-migrations/`](04-migrations/) | Concrete steps for migrating a single-`index.html`-on-GitHub-Pages app to this stack |
| [`05-new-app-from-scratch/`](05-new-app-from-scratch/) | Checklist for starting a brand new app on this stack, no legacy code involved |
| [`06-design-system/`](06-design-system/) | LM Organizer's actual current design system (colors, type, components), plus a placeholder for a future cross-app version |
| [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) | Flat, searchable log of every concrete error hit so far, with the actual fix |

## Which doc to start with

- **Migrating an old single-`index.html` app off GitHub Pages?** Start at
  [`04-migrations/static-html-github-pages-to-vue-firebase.md`](04-migrations/static-html-github-pages-to-vue-firebase.md).
  It links back into the other folders at the point each topic becomes relevant.
- **Starting a brand new app with no legacy code?** Start at
  [`05-new-app-from-scratch/checklist.md`](05-new-app-from-scratch/checklist.md).
- **Something broke and you just want the fix?** Check
  [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) first — it's flat and symptom-first on purpose.

## Source of truth

This playbook was written from the LM Organizer migration (vanilla-JS single-file PWA → Vue 3 SPA on
Firebase). Treat every concrete value that's specific to that project (project IDs, bucket names,
UIDs) as an *example*, not something to copy literally into a different app.
