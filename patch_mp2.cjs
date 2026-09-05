const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

// The MP Webhook Simulator sometimes sends an action of "test.created" or a topic of "test" and missing ID.
// Let's make sure we safely return 200 OK for these test events.
const replacement = `
    const type = req.body?.type || req.query?.topic || req.body?.topic || req.body?.action;
    
    // Se for teste do simulador do Mercado Pago
    if (type && type.includes('test')) {
      console.log('[Webhook] Test request received from simulator. Returning 200 OK.');
      return res.status(200).send('OK');
    }
`;
server = server.replace(/const type = req\.body\?\.type \|\| req\.query\?\.topic \|\| req\.body\?\.topic;/g, replacement);

fs.writeFileSync('server.ts', server);
console.log('Patched test simulator');
