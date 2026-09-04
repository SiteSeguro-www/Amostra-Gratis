const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace dynamic imports with static imports
// Wait, I can just change `.js` to `.ts` in dynamic imports for tsx/vercel
code = code.replace(/await import\('\.\/api-handlers\/([^']+)\.js'\)/g, "await import('./api-handlers/$1.ts')");

fs.writeFileSync('server.ts', code);
console.log("Fixed dynamic imports in server.ts");
