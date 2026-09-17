const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

function init() {
  if (getApps().length === 0) {
    try {
      throw new Error("parsing failed");
    } catch(e) {
      console.log("Caught error");
    }
  }
}
init();
try {
  getFirestore();
} catch(e) {
  console.log("getFirestore threw:", e.message);
}
