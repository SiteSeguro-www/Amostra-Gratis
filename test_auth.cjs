const { getAuth } = require('firebase-admin/auth');

try {
  const auth = getAuth();
  console.log("Auth is working.");
} catch(e) {
  console.log("Auth failed:", e);
}
