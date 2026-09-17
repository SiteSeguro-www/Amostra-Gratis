const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(
  "import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };",
  "import fs from 'fs';\nconst firebaseConfig = JSON.parse(fs.readFileSync(new URL('./firebase-applet-config.json', import.meta.url), 'utf8'));"
);

fs.writeFileSync('server.ts', server);
console.log('Patched import assertion');
