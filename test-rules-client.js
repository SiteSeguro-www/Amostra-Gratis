import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, updateDoc, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
    try {
        let user;
        const email = "test_bot_" + Date.now() + "@test.com";
        const pass = "123456";
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, pass);
            user = cred.user;
            console.log("Created user:", user.uid);
        } catch (e) {
            console.error("Could not create:", e);
            return;
        }

        const userRef = doc(db, 'users', user.uid);
        
        console.log("Setting doc...");
        await setDoc(userRef, {
            uid: user.uid,
            displayName: "Test Bot",
            username: "testbot",
            email: email,
            createdAt: new Date().toISOString(),
            role: "user",
            followersCount: 0,
            followingCount: 0,
            hotCoins: 0,
            lastSeen: new Date().toISOString()
        });
        console.log("Doc created.");

        console.log("Trying to update lastSeen...");
        await updateDoc(userRef, {
            lastSeen: new Date().toISOString()
        });
        console.log("Updated lastSeen successfully!");
        
    } catch(e) {
        console.error("Error:", e);
    }
}
run();
