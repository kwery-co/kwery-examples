"""Receive stream results and verify their signature.

Start a stream job with POST /stream and a callback_url pointing here; the response gives you
the webhook_secret. Usage: KWERY_WEBHOOK_SECRET=... python webhook_receiver.py
"""
import hashlib
import hmac
import json
import os
import time

from flask import Flask, request

SECRET = os.environ["KWERY_WEBHOOK_SECRET"].encode()
app = Flask(__name__)


@app.post("/kwery/webhook")
def webhook():
    # Verify against the raw body, before parsing it.
    raw = request.get_data()
    sig = request.headers.get("X-Kwery-Signature", "")
    ts = request.headers.get("X-Kwery-Timestamp", "")

    if abs(time.time() - float(ts or 0)) > 300:
        return "stale timestamp", 401
    expected = "v1=" + hmac.new(SECRET, f"{ts}.{raw.decode()}".encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return "bad signature", 401

    for item in json.loads(raw).get("results", []):
        c = (item.get("result") or {}).get("content")
        print(f"{c['name']}: from {c.get('price_min')} {c.get('currency')}" if c else "no data")
    return "ok", 202


if __name__ == "__main__":
    app.run(port=int(os.environ.get("PORT", 9000)))
