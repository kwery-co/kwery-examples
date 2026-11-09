#!/usr/bin/env bash
# kwery API with cURL. Needs KWERY_API_KEY; KWERY_BASE_URL is optional (defaults to the live API).
set -euo pipefail
BASE="${KWERY_BASE_URL:-https://api.kwery.co}"
AUTH="Authorization: Bearer ${KWERY_API_KEY:?set KWERY_API_KEY}"

# 1. One product, result in the same response ("wait": up to 120 s, one value only).
curl -s "$BASE/job" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"source":"idealo","country":"de","key":"gtin","values":["4006381333962"],"wait":true}'
echo

# 2. A batch (up to 1,000 values): submit, then poll, then download.
JOB=$(curl -s "$BASE/job" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"source":"idealo","country":"de","key":"gtin","values":["4006381333962","4719512101148"]}' \
  | sed -n 's/.*"_id":"\([0-9a-f]*\)".*/\1/p')
echo "job: $JOB"

curl -s "$BASE/job/$JOB" -H "$AUTH"            # status: { "error": false, "job": { "status": ... } }
echo
curl -s "$BASE/job/$JOB/download" -H "$AUTH"   # results, once status is "finished"
echo
