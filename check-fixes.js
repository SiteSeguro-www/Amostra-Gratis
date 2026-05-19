import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function checkFixes() {
    console.log("Checking specific users based on earlier output...");
    // Let's get the users
    const users = ["1px2bc9ph9eiWc2FNS1EWujrOPU2", "9E49rt7lTPWtGdeGA9LcSuOyacI2", "w8waNxH7AKXFzWtI4i8NlmFxvP42"];
    for(const u of users) {
        const d = await getDoc(doc(db, "users", u));
        console.log(`User ${u} exists: ${d.exists()}`);
    }

    const g = await getDoc(doc(db, "system_stats", "global"));
    console.log("Stats exists:", g.exists(), g.data());
}
checkFixes();
