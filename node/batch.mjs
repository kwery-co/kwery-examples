// Submit a batch, poll until it finishes, download the results.
// Usage: node batch.mjs <gtin> [<gtin> ...]     (Node.js 18+, no dependencies)
const BASE = process.env.KWERY_BASE_URL || 'https://api.kwery.co';
const KEY = process.env.KWERY_API_KEY;
if (!KEY) throw new Error('Set KWERY_API_KEY');

const values = process.argv.slice(2);
if (!values.length) values.push('4006381333962', '4719512101148');
const headers = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function call(path, init = {}) {
  const data = await (await fetch(`${BASE}${path}`, { headers, ...init })).json();
  if (data.error) throw new Error(data.message);
  return data;
}

// 1. Submit (up to 1,000 values per job).
const { job } = await call('/job', {
  method: 'POST',
  body: JSON.stringify({ source: 'idealo', country: 'de', key: 'gtin', values }),
});
console.log(`job ${job._id} submitted`);

// 2. Poll. The status sits under `job`: { error: false, job: { status, done, all } }.
for (;;) {
  const { job: status } = await call(`/job/${job._id}`);
  console.log(`  ${status.status} ${status.done ?? 0}/${status.all ?? values.length}`);
  if (status.status === 'finished') break;
  if (status.status === 'failed' || status.status === 'expired') {
    throw new Error(`job ${status.status}${status.reason ? `: ${status.reason}` : ''}`);
  }
  await new Promise((r) => setTimeout(r, 3000));
}

// 3. Download (kept for 72 hours). Add .csv to the path for a CSV export.
const { results } = await call(`/job/${job._id}/download`);
for (const r of results) {
  const c = r.content;
  const value = r.query?.value ?? r.key;
  const currency = c?.currency ?? c?.offers?.[0]?.currency ?? '';
  console.log(c ? `${value}: ${c.name}, from ${c.price_min} ${currency}` : `${value}: ${r.reason}`);
}
