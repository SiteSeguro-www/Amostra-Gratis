import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function checkServiceFields() {
    console.log("Inspecionando a estrutura dos serviços...");
    const servicesSnap = await getDocs(collection(db, 'services'));
    
    if (servicesSnap.empty) {
        console.log("Nenhum serviço encontrado.");
        return;
    }

    const firstService = servicesSnap.docs[0].data();
    console.log("Estrutura do primeiro serviço:", Object.keys(firstService));
    console.log("Exemplo de categoria encontrada:", firstService.category);
}

checkServiceFields();
