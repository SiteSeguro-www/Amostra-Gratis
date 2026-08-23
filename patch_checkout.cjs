const fs = require('fs');

let content = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

const coinPackagesCode = `
const COIN_PACKAGES = [
  { id: 'coins_50', amount: 50, price: 5, popular: false, title: 'Pacote 50 HotCoins' },
  { id: 'coins_120', amount: 120, price: 10, popular: true, bonus: '20% BÔNUS', title: 'Pacote 120 HotCoins' },
  { id: 'coins_300', amount: 300, price: 20, popular: false, bonus: '50% BÔNUS', title: 'Pacote 300 HotCoins' },
  { id: 'coins_800', amount: 800, price: 50, popular: false, bonus: '100% BÔNUS', title: 'Pacote 800 HotCoins' },
];
`;

if (!content.includes('COIN_PACKAGES')) {
  content = content.replace(
    "const Checkout = () => {",
    coinPackagesCode + "\nconst Checkout = () => {"
  );
}

const mockServiceCode = `
      if (serviceId.startsWith('coins_')) {
        const pkg = COIN_PACKAGES.find(p => p.id === serviceId);
        if (pkg) {
          setService({
            id: pkg.id,
            title: pkg.title,
            price: pkg.price,
            sellerId: 'packzinhu',
            sellerName: 'Packzinhu',
            coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
            description: \`Recarga de \${pkg.amount} HotCoins para sua carteira.\`,
          });
          setSeller({
            uid: 'packzinhu',
            displayName: 'Packzinhu Oficial',
            username: 'packzinhu',
            verified: true,
            photoURL: '/favicon.png',
          });
          setLoading(false);
          return;
        }
      }
`;

content = content.replace(
  "async function fetchServiceAndSeller() {",
  "async function fetchServiceAndSeller() {\n      if (!serviceId) return;\n" + mockServiceCode
);
// Make sure we didn't add multiple `if (!serviceId) return;`
content = content.replace(/if \(!serviceId\) return;\n\s*if \(!serviceId\) return;/g, "if (!serviceId) return;");

const paymentCode = `
      let response;
      if (service.id.startsWith('coins_')) {
        const pkg = COIN_PACKAGES.find(p => p.id === service.id);
        const idToken = await user.getIdToken();
        response = await fetch(getApiUrl('/api/create-wallet-preference'), {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${idToken}\`
          },
          body: JSON.stringify({
            packageId: service.id,
            amount: Number(service.price),
            hotCoins: pkg ? pkg.amount : 0,
            buyerEmail: user.email || 'test@example.com',
            buyerName: user.displayName || user.email?.split('@')[0] || 'Usuário'
          }),
        });
      } else {
        response = await fetch(getApiUrl('/api/create-mercadopago-preference'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: service.id,
            serviceTitle: service.title,
            amount: Number(service.price),
            sellerId: service.sellerId,
            buyerId: user.uid,
            buyerName: user.displayName || user.email?.split('@')[0] || 'Usuário',
            buyerEmail: user.email,
          }),
        });
      }
`;

content = content.replace(
  /const response = await fetch\(getApiUrl\('\/api\/create-mercadopago-preference'\), \{[\s\S]*?\}\);/,
  paymentCode.trim()
);

fs.writeFileSync('src/pages/Checkout.tsx', content);
