"""Look up one product and get the result in the same response.

Usage: python single_lookup.py <gtin>
"""
import os
import sys

import requests

BASE = os.environ.get("KWERY_BASE_URL", "https://api.kwery.co")
HEADERS = {"Authorization": f"Bearer {os.environ['KWERY_API_KEY']}"}

gtin = sys.argv[1] if len(sys.argv) > 1 else "4006381333962"

# "wait": True holds the request open for up to 120 s. It accepts exactly one value.
data = requests.post(
    f"{BASE}/job",
    headers=HEADERS,
    json={"source": "idealo", "country": "de", "key": "gtin", "values": [gtin], "wait": True},
    timeout=130,
).json()
if data.get("error"):
    sys.exit(data["message"])

if "results" not in data:
    # Still running when the wait ran out: poll GET /job/{id}, or see batch.py.
    print(f"Not finished yet, job {data['job']['_id']}")
    sys.exit(0)

for r in data["results"]:
    c = r.get("content")
    if not c:
        print(f"{r.get('query', {}).get('value') or r.get('key')}: {r.get('reason', 'no data')}")
        continue
    currency = c.get("currency") or ((c.get("offers") or [{}])[0].get("currency") or "")
    print(c.get("name"))
    print(f"  {c.get('offers_count')} offers, from {c.get('price_min')} to {c.get('price_max')} {currency}")
    for o in (c.get("offers") or [])[:5]:
        print(f"  {o.get('price')} {o.get('currency')}  {o.get('seller_name')}")
