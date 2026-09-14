# Getting `gcloud` actually working on macOS

This is the part that ate the most real time in this project — not because any of it was
conceptually hard, but because several unrelated tools failed in confusing ways that had nothing to
do with the actual deploy. Full detail here; fast lookup in `../TROUBLESHOOTING.md`.

## Don't use Homebrew if it's already broken for unrelated reasons

`brew install --cask google-cloud-sdk` (or even `brew info` on it) can fail with something like:

```
unknown or unsupported macOS version: "26.2" (MacOSVersion::Error)
```

This is **Homebrew's own version-detection code** not recognizing a very new macOS version string —
nothing to do with Google Cloud. Don't try to fix or work around Homebrew for this; bypass it
entirely with Google's official installer, which doesn't depend on Homebrew at all:

```bash
curl https://sdk.cloud.google.com | bash
```

## The installer's bundled Python bootstrapping can fail on an old system Python

```
TypeError: unsupported operand type(s) for |: 'type' and 'type'
```

This happens because the gcloud CLI's own internals now use `X | Y` union-type syntax (Python
3.10+), and if your system `python3` resolves to 3.9 (`python3 --version`), the install/bootstrap
script fails immediately. Check what's actually available:

```bash
which -a python3 python3.10 python3.11   # Homebrew often has a newer one already
```

Fix: point gcloud at a newer interpreter explicitly, both for finishing the install and permanently:

```bash
CLOUDSDK_PYTHON=/opt/homebrew/bin/python3.11 ~/google-cloud-sdk/install.sh --quiet
```

Then persist it in `.zshrc` (alongside the PATH/completion sourcing the installer already asks to
add):

```bash
export CLOUDSDK_PYTHON=/opt/homebrew/bin/python3.11
```

## The installer's "install a newer bundled Python" step can fail — that's OK

You may see this mid-install:

```
sudo: a terminal is required to read the password; either use the -S option...
Failed to install the required Python. Error: Installer failed..
```

This is gcloud trying to install its *own* bundled Python 3.14 via a `sudo`-requiring step, which
fails in any non-interactive shell (no TTY for the password prompt). **This is non-fatal** — the
rest of the install finishes ("Update done!") and gcloud works fine once `CLOUDSDK_PYTHON` points at
a real interpreter you already have. Ignore this specific error.

## Authenticating — and checking you're the account you think you are

```bash
gcloud init            # first time — opens a browser, asks which project to use
gcloud auth login      # to add/switch to a different account later
gcloud config list     # shows the currently active account
gcloud projects list --format="table(projectId,name)"   # shows what THAT account can see
```

**If your target project doesn't show up in `gcloud projects list`, you're logged into the wrong
Google account** — this is common if you have more than one (e.g. a personal one and one used for a
specific project's GCP resources). Run `gcloud auth login` again, pick the correct account in the
browser, and re-check.

```bash
gcloud config set project <project-id>   # so you don't need --project on every command
```

## `--update-env-vars` and JSON values with commas

```bash
gcloud functions deploy foo --update-env-vars=ALLOWED_USERS='{"a":"1","b":"2"}'
# ERROR: Bad syntax for dict arg: ["b":"2"}]
```

gcloud's dict-flag syntax normally splits on `,` to separate multiple `KEY=VALUE` pairs — and a JSON
value with more than one entry has commas *inside* it, which collides with that parser. Fix: tell
gcloud to use a different separator character for this one flag, freeing up commas to appear
literally in the value:

```bash
--update-env-vars='^;^ALLOWED_USERS={"a":"1","b":"2"}'
```

The `^;^` prefix changes the pair-separator from `,` to `;` for this argument only. Pick any
character that doesn't appear in your value. Reference: `gcloud topic escaping`.

## "A Cloud Run service with this name already exists" (409)

```
gcloud functions deploy foo --gen2 ...
ERROR: ResponseError: status=[409] ... Could not create Cloud Run service foo. A Cloud Run
service with this name already exists. Please redeploy the function with a different name.
```

This means the existing service was created **directly through Cloud Run** (or an older/different
deploy path), not through the separate Cloud Functions API — even though the two products are
functionally identical under the hood now, they're tracked separately, and `gcloud functions deploy`
tries to create a *new* Cloud Run service and collides with the one that's already there.

**Fix: deploy through `gcloud run deploy` directly instead**, using its `--function` flag (which
supports the same `functions_framework`-style Python source, no Dockerfile needed):

```bash
gcloud run deploy your-service-name \
  --region=your-region \
  --source=./your-source-dir \
  --function=your_entry_point \
  --allow-unauthenticated \
  --update-env-vars='^;^KEY=value'
```

This updates the existing service in place instead of trying to create a competing one.

## Enabling an API mid-deploy

```
API [cloudfunctions.googleapis.com] not enabled on project [x]. Would you like to enable and retry?
```

Just answer `y`. This is a one-time, free, required step for a project that hasn't used that
specific API before (even if the underlying service already exists via a different path) — it isn't
a sign anything is misconfigured.

## Cost sanity check

For a personal, low-traffic backend: Cloud Build gives 120 free build-minutes/day (a small Python
function takes 1–2 minutes to build); Cloud Run/Functions gives 2 million free requests/month plus a
generous compute allowance. Redeploying an already-existing service doesn't change its billing
category. The only thing that isn't unconditionally free forever is a small amount of Artifact
Registry storage for each build's container image — negligible for occasional redeploys, and only a
theoretical concern after a very large number of them.
