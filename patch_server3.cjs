const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

const replacement = `
let __filename = '';
let __dirname = '';
try {
  __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} catch (e) {
  __filename = __filename || process.cwd() + '/server.js';
  __dirname = __dirname || process.cwd();
}
`;

server = server.replace(/const __filename = fileURLToPath\(import\.meta\.url\);\s*const __dirname = path\.dirname\(__filename\);/g, replacement);

fs.writeFileSync('server.ts', server);
console.log('Patched import meta url');
