import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

const CATEGORY_MAP = {
  "Sexting": "sexting",
  "Avaliação": "avaliacao",
  "Chamada de Video": "chamada-video",
  "Pack do Pé": "pack-pe",
  "Pack fotos e videos Explicito": "pack-explicito",
  "Pack fotos e videos Sensual": "pack-sensual"
};

async function syncExistingServices() {
    console.log("Iniciando sincronização de categorias...");
    const servicesSnap = await getDocs(collection(db, 'services'));
    let updated = 0;

    for (const serviceDoc of servicesSnap.docs) {
        const data = serviceDoc.data();
        // Se a categoria está em formato amigável, converte para o formato interno lowercase-slug
        if (data.category && CATEGORY_MAP[data.category]) {
            await updateDoc(serviceDoc.ref, {
                category: CATEGORY_MAP[data.category]
            });
            updated++;
            console.log(`Serviço ${serviceDoc.id} atualizado: ${data.category} -> ${CATEGORY_MAP[data.category]}`);
        }
    }
    console.log(`Sincronização concluída. ${updated} serviços atualizados.`);
}

syncExistingServices();
