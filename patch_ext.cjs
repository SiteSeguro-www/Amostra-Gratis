const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

const extRefLogic = `
          external_reference: JSON.stringify({
            orderId,
            serviceId,
            serviceTitle: (serviceTitle || '').substring(0, 50),
            sellerId,
            buyerId,
            amount
          }),
`;

server = server.replace(/external_reference: JSON\.stringify\(\{\s*orderId,\s*serviceId,\s*serviceTitle,\s*sellerId,\s*buyerId,\s*amount\s*\}\),/g, extRefLogic);

fs.writeFileSync('server.ts', server);
console.log('Patched external_reference');
