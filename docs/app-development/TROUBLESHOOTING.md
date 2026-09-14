# Troubleshooting — symptom → cause → fix

Every entry here is a real error hit during the LM Organizer migration, in the order encountered.
Flat and symptom-first on purpose — search for what you're seeing, not for what topic it belongs to.
Each links to the fuller writeup where there is one.

---

**Blank page after building/deploying, no visible error on screen**
→ A third-party SDK (Firebase) is throwing synchronously during boot because its config is
empty/placeholder — check the browser console specifically, e.g. `auth/invalid-api-key`. Not a
rendering bug; it means real config hasn't been filled in yet.
Details: `01-frontend-vue/gotchas.md` #5.

---

**`zsh: command not found: gcloud`**
→ The Google Cloud CLI isn't installed. `curl https://sdk.cloud.google.com | bash` (don't use
Homebrew if it's already broken for unrelated reasons — see next entry).
Details: `03-backend/gcloud-cli-setup.md`.

---

**`brew info --cask google-cloud-sdk` (or any brew command) crashes with `unknown or unsupported macOS version`**
→ Homebrew's own version-detection bug on a very new macOS version, unrelated to Google Cloud.
Bypass Homebrew entirely with the official installer (previous entry).

---

**gcloud install fails with `TypeError: unsupported operand type(s) for |: 'type' and 'type'`**
→ System `python3` is too old (3.9) for the current gcloud CLI, which needs 3.10+. Find a newer
interpreter (`which -a python3.10 python3.11`) and set `CLOUDSDK_PYTHON` to it, both to finish
installing and permanently in `.zshrc`.
Details: `03-backend/gcloud-cli-setup.md`.

---

**gcloud install shows `sudo: a terminal is required...` / `Failed to install the required Python`**
→ Non-fatal — that's gcloud trying to install its own optional bundled Python, which needs
interactive `sudo`. The SDK still finishes installing and works fine with `CLOUDSDK_PYTHON` pointed
at an existing interpreter. Ignore this specific error.

---

**`gcloud projects list` doesn't show the project you expect**
→ You're authenticated as the wrong Google account. `gcloud auth login` again with the correct one,
re-check with `gcloud projects list --format="table(projectId,name)"`.

---

**`gcloud functions deploy --update-env-vars=KEY={"a":"1","b":"2"}` → `Bad syntax for dict arg`**
→ gcloud's dict-flag parser splits on commas, which collides with commas inside your JSON value.
Prefix with a different separator: `--update-env-vars='^;^KEY={"a":"1","b":"2"}'`.
Details: `03-backend/gcloud-cli-setup.md`.

---

**`gcloud functions deploy --gen2` → 409 "A Cloud Run service with this name already exists"**
→ The existing service was created directly through Cloud Run, not the separate Cloud Functions
API. Deploy through `gcloud run deploy <name> --source=... --function=<entry> --allow-unauthenticated`
instead — it updates the existing service rather than trying to create a new one.
Details: `03-backend/gcloud-cli-setup.md`.

---

**"API [x.googleapis.com] not enabled on project. Would you like to enable and retry?"**
→ Answer `y`. One-time, free, required step; not a sign of misconfiguration.

---

**Firebase login succeeds (network tab shows 200 + a valid idToken), but the UI shows no error and nothing happens**
→ Not a credentials problem. Vue Router's guard only re-evaluates on navigation, not on a reactive
state change — a successful login must explicitly `router.push(...)` afterward, or the app silently
stays on the login screen despite being authenticated. Same issue applies to logout.
Details: `01-frontend-vue/gotchas.md` #3 and #4.

---

**A form's dropdown looks selected but clicking "submit" silently does nothing**
→ A `<select v-model>` was initialized to a value (often `''`) that matches no `<option>`. The
browser shows the first option as visually selected; the bound ref stays at its initial (wrong)
value; the submit handler's own validation blocks silently. Initialize the ref to a real option
value.
Details: `01-frontend-vue/gotchas.md` #2.

---

**`npx firebase-tools login` doesn't open a browser, prints a manual-code flow instead**
→ Happens in some non-interactive/automated shell contexts. Run it from a genuinely interactive
terminal, where it can launch a real browser and use the local-callback flow instead.

---

**Playwright: `browserType.launch: Executable doesn't exist at .../chromium_headless_shell-XXXX/...`**
→ A Playwright package version bump expects a newer browser build than what's cached locally.
`npx playwright install chromium` to fetch the matching one.

---

**Firebase Console → Authentication → Users shows accounts you don't recognize**
→ Don't assume they're for the app you're building, especially on a GCP project that's had other
things deployed on it before. Confirm before wiring login flows to them.
Details: `02-firebase/project-setup.md`.

---

**A number field's `0` value keeps getting silently replaced with an empty value**
→ Somewhere, a `value || fallback` is treating a legitimate `0` as "missing" because `0` is falsy in
JS. Use `value ?? fallback` (nullish coalescing) instead, wherever `0`/`false` are meaningful values.
Details: `01-frontend-vue/gotchas.md` #1.
