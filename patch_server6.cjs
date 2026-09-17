const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(
  "const adminAuth = getAuth();",
  "let adminAuth: any;\ntry { adminAuth = getAuth(); } catch (e) { console.warn('Could not initialize adminAuth in global scope:', e); }"
);
server = server.replace(/const adminAuth = getAuth\(\);/g, "let adminAuth: any;\n    try { adminAuth = getAuth(); } catch (e) { ensureFirebase(); adminAuth = getAuth(); }");

fs.writeFileSync('server.ts', server);
console.log('Patched global adminAuth');
