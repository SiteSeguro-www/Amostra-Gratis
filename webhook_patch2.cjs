const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target = "if (newStatus === 'paid' && currentData.status !== 'paid' && currentData.status !== 'delivered') {";
const replacement = "if (newStatus === 'paid' && currentData.status !== 'paid' && currentData.status !== 'delivered' && externalReference.type !== 'hotcoins') {";

content = content.replace(target, replacement);

fs.writeFileSync('server.ts', content);
