import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, updateDoc, doc, getDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function testDiff() {
    try {
        console.log("Trying to update a specific user...");
        // This won't work without being authenticated as the user due to rules.
        // We'll just look at the raw users out there.
    } catch(e) {
        console.error(e);
    }
}
testDiff();
