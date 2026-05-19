import { readFileSync } from 'fs';

const fbRules = readFileSync('firestore.rules', 'utf8');
console.log(fbRules.includes("hasOnly(['lastSeen'])"));
