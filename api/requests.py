# Private: reads the request list back for /admin. Needs "Authorization: Bearer <ADMIN_TOKEN>",
# where ADMIN_TOKEN is an env var set in Vercel (Settings -> Environment Variables). Never put the
# token in the repo. GET returns the newest 500 records; DELETE ?id=<id> removes one record.
import hmac, json, os, urllib.parse, urllib.request
from http.server import BaseHTTPRequestHandler

LIST_KEY = "fv:requests"
PAGE = 500

def _kv_url():
    return os.environ.get("KV_REST_API_URL") or os.environ.get("UPSTASH_REDIS_REST_URL")

def _kv_token():
    return os.environ.get("KV_REST_API_TOKEN") or os.environ.get("UPSTASH_REDIS_REST_TOKEN")

def _kv(*command):
    url, token = _kv_url(), _kv_token()
    if not url or not token:
        raise RuntimeError("not configured")
    req = urllib.request.Request(url, data=json.dumps(list(command)).encode(), headers={
        "Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=8) as r:
        return json.loads(r.read())

def authorized(headers):
    token = os.environ.get("ADMIN_TOKEN") or ""
    given = headers.get("Authorization") or headers.get("authorization") or ""
    if given[:7].lower() == "bearer ":
        given = given[7:].strip()
    else:
        given = ""
    if not token or not given:
        return False
    return hmac.compare_digest(token.encode(), given.encode())

class handler(BaseHTTPRequestHandler):
    def _send(self, code, body):
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Robots-Tag", "noindex")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())

    def _gate(self):
        if not os.environ.get("ADMIN_TOKEN"):
            self._send(503, {"ok": False, "error": "not configured"}); return False
        if not authorized(self.headers):
            self._send(401, {"ok": False, "error": "Wrong or missing token"}); return False
        if not (_kv_url() and _kv_token()):
            self._send(503, {"ok": False, "error": "not configured"}); return False
        return True

    def do_GET(self):
        if not self._gate():
            return
        try:
            raw = _kv("LRANGE", LIST_KEY, 0, PAGE - 1).get("result", []) or []
            rows = []
            for r in raw:
                try:
                    rows.append(json.loads(r))
                except Exception:
                    continue
        except Exception as e:
            return self._send(500, {"ok": False, "error": str(e)})
        self._send(200, {"ok": True, "rows": rows})

    def do_DELETE(self):
        if not self._gate():
            return
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        wanted = (qs.get("id") or [""])[0].strip()
        if not wanted or len(wanted) > 32:
            return self._send(400, {"ok": False, "error": "Missing id"})
        try:
            raw = _kv("LRANGE", LIST_KEY, 0, -1).get("result", []) or []
            removed = 0
            for r in raw:
                try:
                    if json.loads(r).get("id") == wanted:
                        removed += int(_kv("LREM", LIST_KEY, 1, r).get("result", 0))
                        break
                except Exception:
                    continue
        except Exception as e:
            return self._send(500, {"ok": False, "error": str(e)})
        if not removed:
            return self._send(404, {"ok": False, "error": "No record with that id"})
        self._send(200, {"ok": True, "removed": removed})

    def do_POST(self):
        self._send(405, {"ok": False, "error": "GET or DELETE"})
