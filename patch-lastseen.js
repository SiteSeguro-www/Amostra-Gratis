import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function patchMissingLastSeen() {
    console.log("Fetching all users to verify lastSeen...");
    const usersSnap = await getDocs(collection(db, 'users'));
    let patched = 0;
    const now = new Date().toISOString();

    for(const userDoc of usersSnap.docs) {
        const data = userDoc.data();
        if (!data.lastSeen) {
            console.log(`User ${data.email} is missing lastSeen! Patching...`);
            await setDoc(userDoc.ref, { lastSeen: now }, { merge: true });
            patched++;
        }
    }
    console.log(`Done patching. ${patched} users fixed.`);
}
patchMissingLastSeen();
