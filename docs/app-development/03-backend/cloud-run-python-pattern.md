# A minimal Python Cloud Run backend

## When you actually need this layer

Per `docs/frontend_building/FRONTEND_BUILD_PLAYBOOK.md` §9: only when the frontend would otherwise
need a secret client-side, or needs to sit behind one CORS/auth boundary in front of storage it
doesn't talk to directly (e.g. a GCS bucket, which has no browser-safe way to expose per-user
access control on its own). If a new app can talk to Firestore/Firebase Storage directly with
Firebase's own security rules doing the access control, skip this layer entirely — it's one more
service to run, deploy, and keep in sync for no benefit.

## The shape

A single `functions_framework`-decorated HTTP handler, deployed to Cloud Run, doing three things:
CORS, auth, and a thin proxy to storage.

```python
import json, os
import functions_framework
import firebase_admin
from firebase_admin import auth as firebase_auth
from google.cloud import storage

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

# No args needed — Cloud Run provides Application Default Credentials via the
# service account attached to the service. No key file, no extra IAM role.
firebase_admin.initialize_app()

def get_user_file(request):
    token = request.headers.get("Authorization", "").replace("Bearer ", "").strip()
    if not token:
        return None
    try:
        decoded = firebase_auth.verify_id_token(token)
    except Exception:
        return None
    allowed_users = json.loads(os.environ.get("ALLOWED_USERS", "{}"))
    return allowed_users.get(decoded["uid"])   # the actual access-control gate

@functions_framework.http
def handler(request):
    if request.method == "OPTIONS":
        return ("", 204, CORS)
    file_name = get_user_file(request)
    if not file_name:
        return (json.dumps({"error": "Unauthorized"}), 401, {**CORS, "Content-Type": "application/json"})
    # ...GET reads a GCS blob, POST overwrites it. See authentication.md for why a
    # valid Firebase login alone isn't the whole access-control story.
```

`requirements.txt` needs `firebase-admin` in addition to whatever storage client you're using
(`google-cloud-storage`, `google-cloud-firestore`, …).

## Why "GET the whole blob, POST the whole blob" is fine for a small app

A single JSON document read/written whole, with no partial-update endpoint, is a legitimate and
simple choice for an app with a small state size and a small number of users — it avoids ever having
to reconcile partial updates or handle merge conflicts. It stops being fine once either the document
gets large enough that re-saving it on every keystroke is slow, or more than one person edits
concurrently often enough that last-write-wins data loss becomes a real problem. Don't build
partial-update/merge logic preemptively; add it if and when that actually happens.

## The debounce belongs on the frontend, not the backend

Since there's no partial-update endpoint, the frontend should debounce writes (~400ms, see
`../01-frontend-vue/stack-and-structure.md`) so rapid interaction doesn't turn into a save-per-click
flood. The backend itself stays simple — it doesn't need to know or care how often it's called.
