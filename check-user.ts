import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0668923042",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-fb36f72e-d6e7-437c-8175-890b834eee0f");

async function checkUser() {
  const userId = 'qUnpXsYwxnZOPcV7nWVKVVEfhhs1';
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    console.log('User data:', userSnap.data());
  } else {
    console.log('User not found');
  }
}

checkUser();
