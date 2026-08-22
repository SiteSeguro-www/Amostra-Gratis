const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

// 1. Add missing fields to users update
rules = rules.replace(
  "['displayName', 'photoURL', 'coverURL', 'bio', 'username', 'links', 'mercadoPagoId', 'balance', 'totalRating', 'reviewCount', 'rating', 'followersCount', 'followingCount']",
  "['displayName', 'photoURL', 'coverURL', 'bio', 'username', 'links', 'mercadoPagoId', 'balance', 'totalRating', 'reviewCount', 'rating', 'followersCount', 'followingCount', 'hotCoins', 'fontStyle', 'borderStyle', 'backgroundStyle']"
);

// 2. Add user_items rules before ORDERS
const userItemsRule = `
    match /user_items/{id} {
      allow read: if isSignedIn() && (isAdmin() || resource.data.userId == request.auth.uid);
      allow create: if isSignedIn() && incoming().userId == request.auth.uid;
      allow update: if isSignedIn() && (isAdmin() || resource.data.userId == request.auth.uid);
      allow delete: if isAdmin();
    }
`;

rules = rules.replace(
  "    // -------------------------------------------------------------------------\n    // ORDERS & FINANCE",
  "    // -------------------------------------------------------------------------\n    // USER ITEMS\n    // -------------------------------------------------------------------------\n" + userItemsRule + "\n    // -------------------------------------------------------------------------\n    // ORDERS & FINANCE"
);

fs.writeFileSync('firestore.rules', rules);
