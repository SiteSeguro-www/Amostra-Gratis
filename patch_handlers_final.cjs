const fs = require('fs');
const glob = require('glob');

const files = glob.sync('api-handlers/*.ts');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('getAuth()') && !content.includes('ensureFirebase()')) {
    content = content.replace(/const adminAuth = getAuth\(\);/g, "ensureFirebase();\n    const adminAuth = getAuth();");
    
    if (!content.includes('function ensureFirebase()')) {
        const ensureFunc = `
function ensureFirebase() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      try {
        let parsed = JSON.parse(serviceAccount);
        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
        initializeApp({
          credential: cert(parsed),
          projectId: firebaseConfig.projectId,
          storageBucket: firebaseConfig.storageBucket
        });
      } catch (e) {
        initializeApp({ projectId: firebaseConfig.projectId, storageBucket: firebaseConfig.storageBucket });
      }
    } else {
      initializeApp({ projectId: firebaseConfig.projectId, storageBucket: firebaseConfig.storageBucket });
    }
  }
}
`;
        content = content.replace("export const handle", ensureFunc + "\nexport const handle");
    }
    
    fs.writeFileSync(file, content);
    console.log(`Patched ${file}`);
  }
}
