const crypto = require('crypto');
const secret = 'my-secret';
const dataId = '12345';
const ts = Date.now().toString();
const reqId = 'req-123';
const manifest = `id:${dataId};request-id:${reqId};ts:${ts};`;
const hmac = crypto.createHmac('sha256', secret);
hmac.update(manifest);
const hash = hmac.digest('hex');

const signature = `ts=${ts},v1=${hash}`;

// Simulate validation
const parts = signature.split(',');
let pTs = '', pV1 = '';
for(const p of parts) {
  const [k, v] = p.split('=');
  if(k==='ts') pTs = v;
  if(k==='v1') pV1 = v;
}
const m2 = `id:${dataId};request-id:${reqId};ts:${pTs};`;
const h2 = crypto.createHmac('sha256', secret).update(m2).digest('hex');
console.log('Matches:', h2 === pV1);
