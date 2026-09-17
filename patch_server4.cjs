const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

const replacement = `
// __dirname and __filename removed for vercel compatibility
`;

server = server.replace(/let __filename = '';[\s\S]*?__dirname = __dirname \|\| process\.cwd\(\);\s*}/g, replacement);

fs.writeFileSync('server.ts', server);
console.log('Removed __dirname and __filename');
