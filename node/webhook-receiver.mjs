// Receive stream results and verify their signature (Node.js 18+, no dependencies).
// Start a stream job with POST /stream and a callback_url pointing here; the response gives you
// the webhook_secret. Usage: KWERY_WEBHOOK_SECRET=... node webhook-receiver.mjs
import http from 'node:http';
import crypto from 'node:crypto';

const SECRET = process.env.KWERY_WEBHOOK_SECRET;
if (!SECRET) throw new Error('Set KWERY_WEBHOOK_SECRET (from the POST /stream response)');

http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/kwery/webhook') {
    res.writeHead(404).end();
    return;
  }
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    // Verify against the raw body, before parsing it.
    const raw = Buffer.concat(chunks).toString('utf8');
    const sig = req.headers['x-kwery-signature'] || '';
    const ts = req.headers['x-kwery-timestamp'] || '';

    if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) {
      res.writeHead(401).end('stale timestamp');
      return;
    }
    const expected = 'v1=' + crypto.createHmac('sha256', SECRET).update(`${ts}.${raw}`).digest('hex');
    const ok = sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    if (!ok) {
      res.writeHead(401).end('bad signature');
      return;
    }

    // Acknowledge fast, then process.
    res.writeHead(202).end('ok');
    const payload = JSON.parse(raw);
    for (const item of payload.results || []) {
      const c = item.result?.content;
      console.log(c ? `${c.name}: from ${c.price_min} ${c.currency}` : `no data: ${item.result?.reason}`);
    }
  });
}).listen(process.env.PORT || 9000, () => console.log('listening on :' + (process.env.PORT || 9000)));
