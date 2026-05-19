import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function checkUsers() {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    console.log(`Found ${snapshot.size} users.`);
    for (const d of snapshot.docs) {
        const data = d.data();
        console.log(`- ${d.id}: uid=${data.uid}, createdAt=${data.createdAt}, lastSeen=${data.lastSeen}`);
    }
}

checkUsers().catch(console.error);
