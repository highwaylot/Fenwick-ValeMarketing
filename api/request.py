# The request form. POST JSON {name, contact, business, note, botcheck} from the site's own pages;
# stores one JSON record per request in a Redis list (fv:requests) on Vercel KV / Upstash over REST.
# Stdlib only. No email is sent from here; read the list back at /admin (api/requests.py).
import json, os, re, secrets, time, urllib.parse, urllib.request
from http.server import BaseHTTPRequestHandler

LIST_KEY = "fv:requests"
LIST_CAP = 5000            # oldest records fall off past this
RATE_LIMIT = 5             # requests per IP...
RATE_WINDOW = 3600         # ...per hour
MAX_BODY = 16 * 1024

LIMITS = {"name": (2, 80), "contact": (5, 120), "business": (0, 120), "note": (0, 1000)}

def _kv_url():
    return os.environ.get("KV_REST_API_URL") or os.environ.get("UPSTASH_REDIS_REST_URL")

def _kv_token():
    return os.environ.get("KV_REST_API_TOKEN") or os.environ.get("UPSTASH_REDIS_REST_TOKEN")

def configured():
    return bool(_kv_url() and _kv_token())

def _kv(*command):
    url, token = _kv_url(), _kv_token()
    if not url or not token:
        raise RuntimeError("not configured")
    req = urllib.request.Request(url, data=json.dumps(list(command)).encode(), headers={
        "Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=8) as r:
        return json.loads(r.read())

def _clean(value, limit):
    # collapse runs of whitespace, but keep line breaks in the note
    s = str(value or "").replace("\r\n", "\n").replace("\r", "\n")
    s = re.sub(r"[ \t\f\v]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s).strip()
    return s[:limit]

def validate(data):
    """Returns (record, error). record is None when error is set. Honeypot handled by the caller."""
    if not isinstance(data, dict):
        return None, "Bad request"
    out = {}
    for field, (lo, hi) in LIMITS.items():
        raw = data.get(field, "")
        if not isinstance(raw, (str, int, float)):
            return None, "Bad request"
        value = _clean(raw, hi + 1)
        if len(value) < lo:
            if field == "name":
                return None, "Enter your name."
            return None, "Enter a phone number or an email address."
        if len(value) > hi:
            return None, f"Keep {field} under {hi} characters."
        out[field] = value
    if not re.search(r"[0-9@]", out["contact"]):
        return None, "Enter a phone number or an email address."
    return out, None

def client_ip(headers):
    fwd = headers.get("x-forwarded-for") or headers.get("X-Forwarded-For") or ""
    ip = fwd.split(",")[0].strip() or headers.get("x-real-ip") or headers.get("X-Real-IP") or ""
    return re.sub(r"[^0-9a-fA-F.:]", "", ip)[:64] or "unknown"

def referer_path(headers):
    ref = headers.get("Referer") or headers.get("referer") or ""
    try:
        path = urllib.parse.urlparse(ref).path or "/"
    except Exception:
        path = "/"
    return path[:200]

def same_origin(headers):
    """Same-origin only: no CORS headers are ever sent, and a cross-site Origin is refused outright."""
    origin = headers.get("Origin") or headers.get("origin")
    if not origin:
        return True
    host = (headers.get("x-forwarded-host") or headers.get("X-Forwarded-Host") or headers.get("Host") or "").split(",")[0].strip().lower()
    try:
        ohost = (urllib.parse.urlparse(origin).netloc or "").lower()
    except Exception:
        return False
    return bool(host) and ohost == host

def make_record(fields, page, now=None):
    return {
        "id": secrets.token_urlsafe(6),
        "ts": int(now if now is not None else time.time()),
        "page": page,
        "name": fields["name"],
        "contact": fields["contact"],
        "business": fields["business"],
        "note": fields["note"],
    }

class handler(BaseHTTPRequestHandler):
    def _send(self, code, body):
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())

    def do_GET(self):
        self._send(405, {"ok": False, "error": "POST only"})

    def do_OPTIONS(self):
        self._send(405, {"ok": False, "error": "POST only"})

    def do_POST(self):
        if not same_origin(self.headers):
            return self._send(403, {"ok": False, "error": "Forbidden"})
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length < 0 or length > MAX_BODY:
                raise ValueError("too big")
            data = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            return self._send(400, {"ok": False, "error": "Bad request"})

        if not isinstance(data, dict):
            return self._send(400, {"ok": False, "error": "Bad request"})

        if str(data.get("botcheck") or "").strip():  # honeypot: real visitors never fill this hidden field
            return self._send(200, {"ok": True})     # pretend success, drop it silently

        fields, error = validate(data)
        if error:
            return self._send(400, {"ok": False, "error": error})

        if not configured():
            return self._send(503, {"ok": False, "error": "not configured"})

        ip = client_ip(self.headers)
        try:
            count = int(_kv("INCR", f"fv:rl:{ip}").get("result", 0))
            if count == 1:
                _kv("EXPIRE", f"fv:rl:{ip}", RATE_WINDOW)
        except Exception:
            return self._send(500, {"ok": False, "error": "Couldn't save that right now. Try again in a bit."})
        if count > RATE_LIMIT:
            return self._send(429, {"ok": False, "error": "Too many requests from this connection. Try again in an hour."})

        record = make_record(fields, referer_path(self.headers))
        try:
            _kv("LPUSH", LIST_KEY, json.dumps(record))
            _kv("LTRIM", LIST_KEY, 0, LIST_CAP - 1)
        except Exception:
            return self._send(500, {"ok": False, "error": "Couldn't save that right now. Try again in a bit."})
        self._send(200, {"ok": True})
