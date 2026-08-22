const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(
  "['displayName', 'photoURL', 'coverURL', 'bio', 'username', 'links', 'mercadoPagoId', 'balance', 'totalRating', 'reviewCount', 'rating', 'followersCount', 'followingCount', 'hotCoins', 'fontStyle', 'borderStyle', 'backgroundStyle']",
  "['displayName', 'photoURL', 'coverURL', 'bio', 'username', 'links', 'mercadoPagoId', 'balance', 'totalRating', 'reviewCount', 'rating', 'followersCount', 'followingCount', 'hotCoins', 'fontStyle', 'borderStyle', 'backgroundStyle', 'badges']"
);

fs.writeFileSync('firestore.rules', rules);
