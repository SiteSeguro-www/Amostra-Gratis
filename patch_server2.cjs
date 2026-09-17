const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(
  "import fs from 'fs';\nconst firebaseConfig = JSON.parse(fs.readFileSync(new URL('./firebase-applet-config.json', import.meta.url), 'utf8'));",
  "import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };"
);

fs.writeFileSync('server.ts', server);
console.log('Reverted to with { type: json }');
