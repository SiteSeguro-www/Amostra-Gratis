const fs = require('fs');

let dbFile = fs.readFileSync('src/lib/db.ts', 'utf8');

// Replace top level await with just a null db for Vercel
const replacement = `
let db: any = null;

// Removed better-sqlite3 for Vercel compatibility
`;

dbFile = dbFile.replace(/let db: any = null;[\s\S]*?}\s*}\s*/, replacement);

fs.writeFileSync('src/lib/db.ts', dbFile);
console.log('Patched db.ts clean');
