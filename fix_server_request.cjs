const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  `      const userId = decodedToken.uid;
      const { packageId, amount, hotCoins } = req.body;`,
  `      const userId = decodedToken.uid;
      const { packageId, amount, hotCoins, buyerEmail, buyerName } = req.body;`
);

content = content.replace(
  `          payer: {
            name: decodedToken.name || 'Anônimo',
            email: decodedToken.email || 'anonimo@example.com',
          },`,
  `          payer: {
            name: buyerName || decodedToken.name || 'Anônimo',
            email: buyerEmail || decodedToken.email || 'test@example.com',
          },`
);

fs.writeFileSync('server.ts', content);
