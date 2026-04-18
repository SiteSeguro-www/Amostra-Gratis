import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0668923042",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-fb36f72e-d6e7-437c-8175-890b834eee0f");

async function fixUserCount() {
  try {
    const count = 13;
    console.log('Setting user count to:', count);

    await setDoc(doc(db, 'stats', 'global'), {
      userCount: count
    }, { merge: true });
    console.log('User count updated in stats/global successfully!');
  } catch (error) {
    console.error('Error fixing user count:', error);
  }
}

fixUserCount();
