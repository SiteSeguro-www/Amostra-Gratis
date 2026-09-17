const fs = require('fs');
const path = require('path');

const filesToPatch = [
  'api-handlers/presigned-url.ts',
  'api-handlers/upload.ts',
  'api-handlers/notify-follow.ts',
  'api-handlers/toggle-follow.ts'
];

for (const file of filesToPatch) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const adminAuth = getAuth\(\);/g, "const adminAuth = getAuth();");
  // ensure ensureFirebase() exists and is called before getAuth
  if (content.includes('getAuth()') && !content.includes('ensureFirebase()')) {
     console.log(`Missing ensureFirebase in ${file}`);
  }
}
