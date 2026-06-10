import json
import urllib.request
import os

TOKEN = os.environ.get("GITHUB_TOKEN", "")
REPO = "ecoinboxhub/Christian_task_app"
TAG = "v1.1.0"
APK_PATH = "android/app/build/outputs/apk/debug/app-debug.apk"

def create_release():
    url = f"https://api.github.com/repos/{REPO}/releases"
    data = {
        "tag_name": TAG,
        "name": TAG,
        "body": "Full AI-powered React Native build with offline fixes and updated icons.",
        "draft": False,
        "prerelease": False
    }
    req = urllib.request.Request(url, data=json.dumps(data).encode(), headers={
        "Authorization": f"Bearer {TOKEN}",
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
    })
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            return res["id"], res["upload_url"].split("{")[0]
    except urllib.error.HTTPError as e:
        print(f"Error creating release: {e.read().decode()}")
        if e.code == 422:
            return get_release_by_tag()
        raise

def get_release_by_tag():
    url = f"https://api.github.com/repos/{REPO}/releases/tags/{TAG}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {TOKEN}",
        "Accept": "application/vnd.github+json"
    })
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode())
        return res["id"], res["upload_url"].split("{")[0]

def upload_asset(upload_url):
    file_name = "BelieversTaskFlow_v1.1.0_OfflineFixed.apk"
    url = f"{upload_url}?name={file_name}"
    with open(APK_PATH, "rb") as f:
        file_data = f.read()
    
    req = urllib.request.Request(url, data=file_data, headers={
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Length": len(file_data)
    })
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode())
        print(f"Successfully uploaded: {res['browser_download_url']}")

if __name__ == "__main__":
    try:
        release_id, upload_url = create_release()
        upload_asset(upload_url)
    except Exception as e:
        print(f"Failed: {e}")
