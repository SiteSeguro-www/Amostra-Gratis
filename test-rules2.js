import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function testRules() {
    try {
        console.log("Checking if we still get auth errors when doing a random operation...");
        // Actually I can't authenticate easily.
        // Wait, the presence collection is fully open: allow create, update, delete: if true;
        // Let's test if we can create a presence doc.
        const presenceRef = doc(db, "presence", "test-id-1234");
        await updateDoc(presenceRef, {
            status: "online"
        }).catch(async (e) => {
            if (e.code === 'not-found') {
               // expected. Let's try setDoc
               const { setDoc } = require('firebase/firestore');
               await setDoc(presenceRef, { status: "online" });
               console.log("Presence set successfully!");
            } else {
               throw e;
            }
        });

    } catch (e) {
        console.error("Test failed:", e);
    }
}
testRules();
