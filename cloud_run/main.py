import json
import os
import functions_framework
import firebase_admin
from firebase_admin import auth as firebase_auth
from google.cloud import storage

BUCKET_NAME = "alejandro-live-manager-app"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

# Uses Application Default Credentials — Cloud Run provides these via the
# service account attached to the service, no key file needed.
firebase_admin.initialize_app()

def get_user_file(request):
    """Returns the GCS filename allowlisted for the caller, or None if unauthorized.

    Tries two auth methods so the old frontend keeps working while the new one is
    being verified in production:

    1. A Firebase ID token, verified, then mapped through ALLOWED_USERS (a Cloud Run
       env var: {"<firebase-uid>": "<gcs-filename>"}) — the real, per-person auth.
    2. The legacy static bearer token, mapped through USERS — kept only until the
       Firebase-based frontend is confirmed working end-to-end. Remove USERS and this
       fallback once that's true; a valid Firebase account alone isn't sufficient
       either way, the uid must also appear in ALLOWED_USERS.
    """
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    if not token:
        return None

    try:
        decoded = firebase_auth.verify_id_token(token)
        allowed_users = json.loads(os.environ.get("ALLOWED_USERS", "{}"))
        file_name = allowed_users.get(decoded["uid"])
        if file_name:
            return file_name
    except Exception:
        pass

    legacy_users = json.loads(os.environ.get("USERS", "{}"))
    return legacy_users.get(token)

@functions_framework.http
def organizer(request):
    if request.method == "OPTIONS":
        return ("", 204, CORS)

    file_name = get_user_file(request)
    if not file_name:
        return (json.dumps({"error": "Unauthorized"}), 401, {**CORS, "Content-Type": "application/json"})

    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(file_name)

    if request.method == "GET":
        if not blob.exists():
            return ("{}", 200, {**CORS, "Content-Type": "application/json"})
        data = blob.download_as_text()
        return (data, 200, {**CORS, "Content-Type": "application/json"})

    if request.method == "POST":
        data = request.get_data(as_text=True)
        blob.upload_from_string(data, content_type="application/json")
        return (json.dumps({"ok": True}), 200, {**CORS, "Content-Type": "application/json"})

    return ("Method not allowed", 405, CORS)