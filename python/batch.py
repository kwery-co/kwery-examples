"""Submit a batch, poll until it finishes, download the results.

Usage: python batch.py <gtin> [<gtin> ...]
"""
import os
import sys
import time

import requests

BASE = os.environ.get("KWERY_BASE_URL", "https://api.kwery.co")
HEADERS = {"Authorization": f"Bearer {os.environ['KWERY_API_KEY']}"}


def call(method, path, **kwargs):
    data = requests.request(method, f"{BASE}{path}", headers=HEADERS, timeout=60, **kwargs).json()
    if data.get("error"):
        raise RuntimeError(data["message"])
    return data


values = sys.argv[1:] or ["4006381333962", "4719512101148"]

# 1. Submit (up to 1,000 values per job).
job = call("POST", "/job", json={"source": "idealo", "country": "de", "key": "gtin", "values": values})["job"]
print(f"job {job['_id']} submitted")

# 2. Poll. The status sits under "job": {"error": false, "job": {"status", "done", "all"}}.
while True:
    status = call("GET", f"/job/{job['_id']}")["job"]
    print(f"  {status['status']} {status.get('done', 0)}/{status.get('all', len(values))}")
    if status["status"] == "finished":
        break
    if status["status"] in ("failed", "expired"):
        raise RuntimeError(f"job {status['status']}: {status.get('reason', '')}")
    time.sleep(3)

# 3. Download (kept for 72 hours). Add .csv to the path for a CSV export.
for r in call("GET", f"/job/{job['_id']}/download")["results"]:
    c = r.get("content")
    value = r.get("query", {}).get("value") or r.get("key")
    if not c:
        print(f"{value}: {r.get('reason')}")
        continue
    currency = c.get("currency") or ((c.get("offers") or [{}])[0].get("currency") or "")
    print(f"{value}: {c['name']}, from {c.get('price_min')} {currency}")
