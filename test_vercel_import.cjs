const fs = require('fs');

const dbContent = fs.readFileSync('src/lib/db.ts', 'utf8');
console.log(dbContent.substring(0, 200));
