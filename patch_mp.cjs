const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

// 1. Update the error handling for both create preference endpoints
server = server.replace(/res\.status\(500\)\.json\(\{ error: error\.message \}\);/g, "res.status(200).json({ error: error.message });");
server = server.replace(/res\.status\(500\)\.json\(\{ error: error\.message \|\| 'Erro ao criar preferência de pagamento' \}\);/g, "res.status(200).json({ error: error.message || 'Erro ao criar preferência de pagamento' });");

// 2. Fix the webhook handler to include signature validation
const webhookSigCheck = `
    const type = req.body?.type || req.query?.topic || req.body?.topic;
    
    // Captura O payload principal e as variáveis extras que eles mandam (pode ser data.id ou direto id dependendo do evento)
    const dataId = req.body?.data?.id || req.body?.id || req.query?.id;
    
    // --- SIGNATURE VALIDATION ---
    const signature = req.headers['x-signature'] || req.headers['x-mp-signature'];
    const xRequestId = req.headers['x-request-id'];
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
    if (signature && xRequestId && secret) {
      try {
        const parts = signature.split(',');
        let ts = '';
        let v1 = '';
        for (const p of parts) {
          const [k, v] = p.split('=');
          if (k === 'ts') ts = v;
          if (k === 'v1') v1 = v;
        }
        if (ts && v1) {
          const crypto = require('crypto');
          const manifest = \`id:\${dataId};request-id:\${xRequestId};ts:\${ts};\`;
          const hmac = crypto.createHmac('sha256', secret);
          hmac.update(manifest);
          const computedHash = hmac.digest('hex');
          if (computedHash !== v1) {
            console.error('[Webhook] Signature validation failed!');
            return res.status(403).json({ error: 'Invalid signature' });
          } else {
            console.log('[Webhook] Signature validated successfully.');
          }
        }
      } catch(e) {
        console.error('[Webhook] Error validating signature:', e);
      }
    } else {
      console.log('[Webhook] Missing signature headers or secret. Skipping signature validation.');
    }
    // ----------------------------
`;

server = server.replace(/const type = req\.body\?\.type \|\| req\.query\?\.topic \|\| req\.body\?\.topic;\s*\/\/ Captura O payload principal e as variáveis extras que eles mandam \(pode ser data\.id ou direto id dependendo do evento\)\s*const dataId = req\.body\?\.data\?\.id \|\| req\.body\?\.id \|\| req\.query\?\.id;/g, webhookSigCheck);

fs.writeFileSync('server.ts', server);
console.log('Patched successfully');
