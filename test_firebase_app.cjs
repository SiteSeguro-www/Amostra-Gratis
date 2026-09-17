const { initializeApp, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

try {
  initializeApp({ projectId: 'demo-project' });
  console.log("Apps initialized:", getApps().length);
  const auth = getAuth();
  console.log("Auth works with default app.");
} catch(e) {
  console.log("Failed:", e);
}
