import json
import os
import functions_framework
from google.cloud import storage

BUCKET_NAME = "alejandro-live-manager-app"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

def get_user_file(request):
    """Returns the GCS filename for the token, or None if unauthorized."""
    users = json.loads(os.environ.get("USERS", "{}"))
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "").strip()
    return users.get(token)

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