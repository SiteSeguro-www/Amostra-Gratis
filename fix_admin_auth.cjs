const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  "const { getAuth } = require('firebase-admin/auth');\n        decodedToken = await getAuth().verifyIdToken(idToken);",
  "decodedToken = await adminAuth.verifyIdToken(idToken);"
);

fs.writeFileSync('server.ts', content);
