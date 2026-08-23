const fs = require('fs');

// Fix server.ts
let serverContent = fs.readFileSync('server.ts', 'utf8');
serverContent = serverContent.replace(
  "app.post('/api/create-coins-preference'",
  "app.post('/api/create-wallet-preference'"
);
fs.writeFileSync('server.ts', serverContent);

// Fix Shop.tsx
let shopContent = fs.readFileSync('src/pages/Shop.tsx', 'utf8');
shopContent = shopContent.replace(
  "getApiUrl('/api/create-coins-preference')",
  "getApiUrl('/api/create-wallet-preference')"
);

fs.writeFileSync('src/pages/Shop.tsx', shopContent);
