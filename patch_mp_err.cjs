const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

const regex = /res\.status\(200\)\.json\(\{ error: error\.message \|\| 'Erro ao criar preferência de pagamento' \}\);/g;
const replacement = "res.status(200).json({ error: error.message || 'Erro ao criar preferência de pagamento', details: error.cause || error });";

server = server.replace(regex, replacement);
fs.writeFileSync('server.ts', server);
console.log('Patched error reporting');
