const fs = require('fs');

const files = [
  'api-handlers/presigned-url.ts',
  'api-handlers/upload.ts',
  'api-handlers/notify-follow.ts',
  'api-handlers/toggle-follow.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('getAuth()') && !content.includes('ensureFirebase()')) {
    console.log(`${file} MISSING ensureFirebase`);
  } else {
    console.log(`${file} OK`);
  }
}
