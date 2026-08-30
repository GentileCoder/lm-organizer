# LM Organizer

A personal organizer PWA. Vue 3 + Vite SPA, deployed to Firebase Hosting, backed by a Google Cloud Run
proxy in front of a GCS bucket, with Firebase Authentication gating access. Hosting and auth share
the same `gentilecoder` Firebase/GCP project.

The previous hand-built single-`index.html` vanilla-JS version lives in [`legacy/`](legacy/) for
reference during the migration audit — it is not built or deployed anymore.

---

## Stack

- **Vue 3** (Composition API, `<script setup>`) + **Vite**
- **Pinia** for state — one `organizer` store holding the whole synced data blob, plus an `auth` store wrapping Firebase
- **vue-router** (history mode — Firebase Hosting's rewrite rule handles the deep-link fallback)
- **Firebase Authentication** (username, mapped to a synthetic email — see `src/utils/accounts.js`) for real login, replacing the old shared-bearer-token lock screen
- **Firebase Hosting** for the built static site
- Plain CSS custom properties (`src/styles/tokens.css`) carrying over the app's existing dark palette — no design system swap

## Development

```bash
npm install
npm run dev       # http://localhost:3080/
npm run build     # outputs to dist/
npm run lint
```

Environment variables live in `.env.development` / `.env.production` (both committed — see
`.env.example` for what each one is and why none of them are secret). Firebase config values are
public identifiers, not secrets; access control happens in the Cloud Run backend's allowlist, not
by hiding the client config.

## Deployment

Deploys go through the [Firebase CLI](https://firebase.google.com/docs/cli):

```bash
npm run build
npx firebase-tools deploy --only hosting
```

(`.firebaserc` already points at the `gentilecoder` project, and `firebase.json` configures `dist`
as the public directory with an SPA rewrite.) The first time, you'll need `npx firebase-tools login`
to authenticate with the Google account that has access to `gentilecoder`.

To automate this on push to `main` instead of deploying by hand, run `npx firebase-tools init
hosting:github` from the repo — it walks you through creating a service account and wires up the
GitHub Actions workflow + repo secret itself; not set up yet since it needs your GitHub/Google
auth interactively.

## Backend & storage

Unchanged from before: one JSON blob (`organizer.json` per user) in a GCS bucket
(`alejandro-live-manager-app`, project `gentilecoder`, `europe-west3`), read/written through the
`alejandro-lm-worker` Cloud Run function in [`cloud_run/main.py`](cloud_run/main.py). What changed
is *how* a request proves who it is:

- The frontend attaches a Firebase ID token (`Authorization: Bearer <token>`), refreshed
  automatically by the Firebase SDK — not a permanent secret typed in once and stored forever.
- The backend verifies that token with `firebase-admin`, then looks the resulting Firebase `uid` up
  in `ALLOWED_USERS`, a Cloud Run env var mapping `{"<uid>": "<gcs-filename>"}`. A valid Firebase
  login alone isn't sufficient — only uids in that map get a file back. This is what keeps the app
  closed to just the people who should have it.

### Remaining manual setup (not done by this migration — needs your GCP/Firebase console access)

1. Enable **Firebase Authentication** on the `gentilecoder` GCP project, turn on the **Email/Password**
   provider, and create the two accounts (you + Thais) by hand, using `usernameToEmail()`'s output
   as the email field — there's no public sign-up flow.
2. Fill in `VITE_FIREBASE_*` in `.env.development` and `.env.production` from Firebase Console →
   Project settings → Your apps.
3. Firebase Hosting's own domain (`gentilecoder.web.app` / `gentilecoder.firebaseapp.com`) is
   authorized for Auth automatically; add a custom domain here too, if you get one.
4. Read the *current* Cloud Run `USERS` env var (`gcloud run services describe alejandro-lm-worker
   --format=...` or the console) before setting `ALLOWED_USERS`, so both existing data files keep
   being used — don't guess the filenames.
5. Deploy the updated `cloud_run/` (with `ALLOWED_USERS` set) once both Firebase accounts exist and
   you have their uids.
6. `npx firebase-tools login`, then `npm run build && npx firebase-tools deploy --only hosting`.

## Data shape

```json
{
  "tasks": [{ "id": 1, "text": "...", "done": false }],
  "notes": [{ "id": 1, "text": "...", "done": false }],
  "goals": [{ "id": 1, "text": "...", "plan": "...", "tasks": [{ "id": 1, "text": "...", "done": false }] }],
  "shopping": [{ "id": 1, "name": "...", "items": [{ "id": 1, "text": "...", "done": false, "price": 0, "url": "" }] }],
  "events": [{ "id": 1, "date": "2026-04-10", "time": "10:00", "title": "...", "category": "Work", "recurring": "none", "exceptions": [] }],
  "eventCategories": [{ "name": "Work", "color": "#4A90D9" }],
  "finance": {
    "incomeSources": [{ "id": "inc1", "name": "Salary", "amount": 3000, "frequency": "monthly" }],
    "expenseCategories": ["Housing", "Food"],
    "expenses": [{ "id": "exp1", "category": "Housing", "amount": 800, "recurring": "monthly", "withdrawDay": 1, "startDate": "2026-01-01" }],
    "minijob": [{ "id": "minijob1", "date": "2026-04-10", "amount": 50, "description": "Salary" }],
    "budgets": {}
  },
  "review": [{ "id": 1, "text": "...", "date": "2026-04-10" }],
  "investments": [{ "id": 1, "name": "...", "initial": 50000, "annualROI": 12.3, "years": [] }]
}
```

Goal progress and shopping-list totals are *derived* from subtask/item state at render time, not
stored fields — despite what an earlier version of this doc implied.

## Known limitations

- The Gemini AI chat feature referenced by older docs is fully deactivated in the legacy app and
  was not migrated — reviving it is new scope, not part of this rewrite.
- The entire data blob is re-saved on every change (debounced ~400ms client-side); there's still no
  partial-update endpoint.
