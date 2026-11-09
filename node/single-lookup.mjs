// Look up one product and get the result in the same response.
// Usage: node single-lookup.mjs <gtin>     (Node.js 18+, no dependencies)
const BASE = process.env.KWERY_BASE_URL || 'https://api.kwery.co';
const KEY = process.env.KWERY_API_KEY;
if (!KEY) throw new Error('Set KWERY_API_KEY');

const gtin = process.argv[2] || '4006381333962';
const headers = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

// `wait: true` holds the request open for up to 120 s. It accepts exactly one value.
const res = await fetch(`${BASE}/job`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ source: 'idealo', country: 'de', key: 'gtin', values: [gtin], wait: true }),
});
const data = await res.json();
if (data.error) throw new Error(data.message);

if (!data.results) {
  // Still running when the wait ran out: poll GET /job/{id}, or see batch.mjs.
  console.log(`Not finished yet, job ${data.job._id}`);
} else {
  for (const r of data.results) {
    const c = r.content;
    if (!c) {
      console.log(`${r.query?.value ?? r.key}: ${r.reason || 'no data'}`);
      continue;
    }
    const currency = c.currency ?? c.offers?.[0]?.currency ?? '';
    console.log(c.name);
    console.log(`  ${c.offers_count} offers, from ${c.price_min} to ${c.price_max} ${currency}`);
    for (const o of (c.offers || []).slice(0, 5)) {
      console.log(`  ${o.price} ${o.currency}  ${o.seller_name}`);
    }
  }
}
