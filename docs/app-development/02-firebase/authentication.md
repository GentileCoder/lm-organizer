# Authentication: Firebase Email/Password, real usernames, and per-user data

## Why Firebase Auth over a homegrown JWT service

For a small, closed app (a handful of known people, no public sign-up), a custom login endpoint
issuing your own JWTs *sounds* simpler, but doing it properly means you're now responsible for:
password hashing, brute-force/rate-limiting protection, token expiry + refresh, and a password-reset
flow — or you skip those and end up with the same "long-lived unrotatable secret" problem a real
auth system exists to solve. Firebase Authentication gives all of that for free, and the backend
integration is a couple of lines (`firebase_admin.auth.verify_id_token`). Reach for a fully custom
auth backend only if you specifically need zero third-party dependency regardless of the extra work.

## The "username, not email" trick

Firebase's Email/Password provider requires an email-**shaped** identifier, but nothing about it
requires that address to be real or deliverable — Firebase only actually attempts to *send* mail to
it in two specific flows: email verification and password-reset. If your app never calls
`sendEmailVerification` or `sendPasswordResetEmail`, and only ever calls
`signInWithEmailAndPassword` directly, Firebase never tries to reach that address at all — it's
purely a lookup key matched against a password.

This lets a login screen show a plain **username** field while Firebase still sees a normal email
address underneath:

```js
// utils/accounts.js
const USERNAME_DOMAIN = 'yourapp.local'
export function usernameToEmail(username) {
  return `${username.trim().toLowerCase()}@${USERNAME_DOMAIN}`
}
```

```js
// LoginView.vue
const ok = await authStore.login(usernameToEmail(username.value), password.value)
```

Create the matching Firebase user with that exact synthetic email
(`alejandro@yourapp.local`) in the console, with whatever real password you choose. The user only
ever types their plain username.

### The real cost of this trick: no self-service password reset

The standard "forgot password" flow sends a real email — which cannot arrive at a fake `.local`
address, since there's no mailbox there. **Don't rely on the console's "reset password" button
either** — it also just sends that same undeliverable email. The actual fallback, when someone
forgets a password, is a one-off script using the Admin SDK, run locally:

```js
// node, with firebase-admin installed and credentialed (e.g. via `gcloud auth application-default login`)
const admin = require('firebase-admin')
admin.initializeApp()
await admin.auth().updateUser('<uid>', { password: 'newpassword' })
```

This sets the password directly, no email involved. Keep this script (or the one-liner) handy
rather than rediscovering it under pressure the first time someone actually forgets a password.

## Per-user data isolation: a valid login is not the same as authorization

Firebase Auth proves **who** someone is. It does not, by itself, restrict **which app** they're
allowed to use, or **which data** they should see — anyone with a Google account can sign up for
Firebase Auth on your project unless you've locked that down. For a closed app, add an explicit
allowlist on the backend mapping each Firebase `uid` to the specific resource they're allowed to
read/write:

```python
# Cloud Run backend
decoded = firebase_auth.verify_id_token(token)
allowed_users = json.loads(os.environ.get("ALLOWED_USERS", "{}"))
file_name = allowed_users.get(decoded["uid"])   # None ⇒ unauthorized, even with a valid token
```

`ALLOWED_USERS` here is `{"<uid>": "<their-data-file>", ...}` — set as a backend env var, not
something a client can influence. This is what actually keeps the app closed to just the people who
should have it; the login screen alone doesn't.

## Migrating an existing auth mechanism without an outage

If a migration also replaces an old auth scheme (e.g. a static shared bearer token) with Firebase,
**the old frontend is still live and being used right up until the new one is actually deployed.**
Shipping backend code that only understands the new mechanism breaks the still-live old frontend
immediately, before the new one is even confirmed working.

Make the backend accept **either** during the transition:

```python
def get_user_file(request):
    token = ...
    try:
        decoded = firebase_auth.verify_id_token(token)
        allowed_users = json.loads(os.environ.get("ALLOWED_USERS", "{}"))
        file_name = allowed_users.get(decoded["uid"])
        if file_name:
            return file_name
    except Exception:
        pass
    # Legacy path — remove once the new frontend is confirmed working end-to-end.
    legacy_users = json.loads(os.environ.get("USERS", "{}"))
    return legacy_users.get(token)
```

Remove the legacy branch (and its env var) only after the new frontend has been verified live, in
production, by every real user — not before.

## Mapping Firebase error codes to UI messages

Don't leak *which* part was wrong (email vs. password) — it helps an attacker enumerate valid
accounts for no benefit to a legitimate user who just mistyped something:

```js
function mapAuthError(code) {
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(code)) {
    return 'Wrong username or password.'
  }
  if (code === 'auth/too-many-requests') return 'Too many attempts — try again later.'
  return 'Sign-in failed — check your connection and try again.'
}
```
