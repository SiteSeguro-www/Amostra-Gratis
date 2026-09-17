const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(
  "import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };",
  "import fs from 'fs';\nlet firebaseConfig: any = {};\ntry {\n  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');\n  if (fs.existsSync(configPath)) {\n    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));\n  }\n} catch (e) {}"
);

fs.writeFileSync('server.ts', server);
console.log('Patched firebase config json');
