# kwery examples

Runnable examples for the [kwery API](https://docs.kwery.co): product and price data from
marketplaces and price comparison sites, in one JSON shape.

| What | cURL | Node.js | Python |
|------|------|---------|--------|
| Look up one product and wait for the result | [curl.sh](curl/curl.sh) | [single-lookup.mjs](node/single-lookup.mjs) | [single_lookup.py](python/single_lookup.py) |
| Submit a batch, poll, download | [curl.sh](curl/curl.sh) | [batch.mjs](node/batch.mjs) | [batch.py](python/batch.py) |
| Receive and verify webhook deliveries | | [webhook-receiver.mjs](node/webhook-receiver.mjs) | [webhook_receiver.py](python/webhook_receiver.py) |

## Setup

1. [Sign up](https://kwery.co/signup) (1,000 free credits, no card) and copy your API key
   (`kwy_live_…`) from the dashboard.
2. Export it:

   ```bash
   export KWERY_API_KEY=kwy_live_...
   ```

3. Run an example:

   ```bash
   node node/single-lookup.mjs 4006381333962          # Node.js 18+, no dependencies
   pip install -r python/requirements.txt
   python python/single_lookup.py 4006381333962
   ```

Every example queries idealo.de by GTIN. Change `source`, `country` and `key` for any other
[source](https://docs.kwery.co/sources).

**Try it without a key:** set `KWERY_BASE_URL=https://docs.kwery.co/_mock/api-reference` and any
dummy key. The mock server returns static example responses, without live data and without using
credits. Its job status never reaches `finished`, so the batch examples only complete against the
live API.

## Good to know

- Check `error` first. Validation errors come back as HTTP 200 with `"error": true` and a `message`.
- Results are kept for 72 hours after a job finishes.
- You pay only for completed results: a found product, or a freshly checked "not found". Polling,
  downloads and failed lookups are free. See [Pricing](https://docs.kwery.co/guides/pricing).

## Links

[Quickstart](https://docs.kwery.co/guides/getting-started) ·
[API reference](https://docs.kwery.co/api-reference) ·
[Webhooks](https://docs.kwery.co/guides/webhooks) ·
[Errors & limits](https://docs.kwery.co/guides/errors-and-limits) ·
support@kwery.co

MIT licensed.
