import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function setAllOnline() {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    console.log(`Updating ${snapshot.size} users to online...`);
    const now = new Date().toISOString();
    let count = 0;
    
    for (const d of snapshot.docs) {
        try {
            await updateDoc(doc(db, 'users', d.id), {
                lastSeen: now
            });
            count++;
            console.log(`- Updated ${d.id}`);
        } catch (e) {
            console.error(`- Error updating ${d.id}:`, e);
        }
    }
    console.log(`Successfully updated ${count} users.`);
}

setAllOnline().catch(console.error);
