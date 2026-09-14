# Setting up a Firebase project

## Add Firebase to an existing GCP project — don't create a new one

If the app's backend already lives on a GCP project (Cloud Run, GCS, etc.), add Firebase **on top
of that same project** rather than creating a fresh one. Firebase is a layer on an existing GCP
project, not a separate platform — this keeps everything (billing, IAM, the backend's service
account) in one place, and means the Cloud Run backend's default service account can verify Firebase
tokens with zero extra credential setup (see `../03-backend/cloud-run-python-pattern.md`).

In the Firebase console, this is available directly by navigating to
`https://console.firebase.google.com/project/<your-gcp-project-id>/overview` — Firebase will offer
to "add Firebase" to that project if it hasn't been added yet.

## Register a web app to get the config values

Console → **"+ Agregar app"** (label is locale-dependent — "Add app" in English) → the Web (`</>`)
icon → give it a nickname → optionally check "Also configure Firebase Hosting for this app" if you
know you'll use Firebase Hosting (harmless to check even if unsure — hosting can also be configured
later, at no cost either way) → Register.

This produces a `firebaseConfig` object:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "...",
  appId: "1:...:web:...",
}
```

**Only `apiKey`, `authDomain`, `projectId`, and `appId` are needed** unless the app also uses
Firebase Storage or Analytics directly (`storageBucket`/`messagingSenderId` are for those). Don't
carry unused fields into the app's env vars just because Firebase's snippet included them.

### These values are not secrets

Commit them. Firebase's own documentation confirms client-side exposure of this config is expected
and safe — access control happens via the backend verifying tokens and its own allowlist (see
`authentication.md`), never by hiding this object. Treat it the same way you'd treat a public API
base URL: fine to commit, not something to put behind a gitignored `.env` or a CI secret.

## Enable Email/Password sign-in

Console → search **"Authentication"** in the "Buscar productos" / product search box (its exact
spot in the left-nav categories varies by console version and can move — search is the reliable
way to find it, don't hunt through category menus) → **Sign-in method** tab → **Email/Password** →
enable → save.

## Before creating any users: check who's already there

**Don't assume a Firebase project is a blank slate**, especially one added to an existing GCP
project that's had other work done on it. Check **Authentication → Users** before creating new
accounts — a project that's been used for anything else may already have unrelated users in it. Ask
"are these mine, for this app, or leftover from something else?" before wiring the frontend to
whatever's already listed; don't assume the first entries you see are the ones you're looking for.

## Checklist

- [ ] Firebase added to the **existing** GCP project, not a new one
- [ ] Web app registered, config copied into the app's env files (safe to commit — see above)
- [ ] Email/Password provider enabled
- [ ] Confirmed which Auth users are actually meant for this app before building against them
