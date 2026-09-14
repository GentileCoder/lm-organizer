# Firebase Hosting and deployment

## Config files

`firebase.json` at the repo root:

```json
{
  "hosting": {
    "site": "your-site-name",
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

The `rewrites` entry is what makes Vue Router's normal `createWebHistory()` mode work — every
unmatched path falls back to `index.html`, and the SPA's own router takes over from there. This is
the thing GitHub Pages can't do natively (see `../01-frontend-vue/stack-and-structure.md`'s router
table).

`.firebaserc`:

```json
{ "projects": { "default": "your-gcp-project-id" } }
```

## No `base` path needed in `vite.config.js`

Unlike a GitHub Pages *project* page (which needs `base: '/repo-name/'` because it's served under a
subpath), Firebase Hosting serves from the domain root — `https://your-site.web.app/` or a custom
domain, never a subpath. Leave `base` unset (Vite's default, `/`).

## Deploying

```bash
npm run build
npx firebase-tools deploy --only hosting
```

First time, authenticate: `npx firebase-tools login`. **This may not auto-open a browser in every
CLI environment** (observed: it fell back to a manual-code-paste flow when run from an automated
shell) — if that happens, run it from a genuinely interactive terminal instead, where it can launch
a real browser and use the local-callback flow.

## Getting a custom `*.web.app` name instead of the project-ID-based default

A project's default Hosting site is named after the project ID
(`your-project-id.web.app`), which might not be the name you want for a specific app sharing a GCP
project with other things. Firebase supports multiple named "sites" within one project:

```bash
npx firebase-tools hosting:sites:create your-app-name --project your-project-id
```

The name **must be globally unique across every Firebase project on Earth**, not just yours — be
ready to try a second choice. Then point `firebase.json` at it:

```json
{ "hosting": { "site": "your-app-name", "public": "dist", "rewrites": [...] } }
```

and redeploy. **Additional named sites are automatically covered by the project's Firebase Auth
authorized domains** — no manual "authorized domains" edit was needed after creating a second site
and logging in from it; verified by testing a real login attempt against the new domain rather than
assuming.

## Custom domain (a domain you actually own)

A separate, later step, independent of which registrar you bought the domain from: Console →
Hosting → "Add custom domain" → follow the DNS verification steps it gives you. Two things regardless
of host:

- A DNS record at your registrar pointing at the host.
- Adding that domain to Firebase Auth's **Authorized domains** list (Authentication → Settings) —
  *this* one is not automatic the way a second `*.web.app` site is.

## CI auto-deploy on push

Don't hand-roll the GitHub Actions workflow and service-account secret for this — Firebase's own
CLI scaffolds it:

```bash
npx firebase-tools init hosting:github
```

This needs your interactive GitHub + Google login to create the service account and wire up the
repo secret; it can't be done non-interactively from an automated session. Until you've run it,
deploying is a manual `npm run build && npx firebase-tools deploy --only hosting` — which is a
perfectly fine way to operate for a personal app that deploys a few times a week, not something to
feel obligated to automate immediately.

## Cost

For a personal app at this traffic scale, this is effectively free: Firebase Hosting's free tier is
10GB storage / 360MB per day of transfer, several orders of magnitude more than a small SPA bundle
needs. Being on the Blaze (pay-as-you-go) plan doesn't change this — it only means charges are
*possible* if you exceed the free tier, not that hosting a small personal app costs anything by
default.
