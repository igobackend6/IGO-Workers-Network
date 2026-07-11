// One-time migration: convert projects/{id}.requiredSkills from string[] to {skill,count}[]
// to match the new "Add to cart" style quantity selector in the HR Projects tab.
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const keyPath = process.argv[2] || process.env.GOOGLE_APPLICATION_CREDENTIALS;
const credential = keyPath ? cert(JSON.parse(readFileSync(keyPath, 'utf8'))) : applicationDefault();

initializeApp({ credential });
const db = getFirestore();

const snap = await db.collection('projects').get();
for (const doc of snap.docs) {
  const data = doc.data();
  if (!Array.isArray(data.requiredSkills) || data.requiredSkills.length === 0) continue;
  if (typeof data.requiredSkills[0] === 'object') {
    console.log(`Skipping ${doc.id} (already migrated)`);
    continue;
  }
  const migrated = data.requiredSkills.map((skill) => ({ skill, count: 1 }));
  await doc.ref.update({ requiredSkills: migrated });
  console.log(`Migrated ${doc.id}:`, migrated);
}

console.log('Done.');
