const fs = require('fs');
let content = fs.readFileSync('src/pages/Shop.tsx', 'utf8');

content = content.replace(
  `        body: JSON.stringify({
          packageId: pkg.id,
          amount: pkg.price,
          hotCoins: pkg.amount
        })`,
  `        body: JSON.stringify({
          packageId: pkg.id,
          amount: pkg.price,
          hotCoins: pkg.amount,
          buyerEmail: user.email || 'test@example.com',
          buyerName: user.displayName || user.email?.split('@')[0] || 'Usuário'
        })`
);

fs.writeFileSync('src/pages/Shop.tsx', content);
