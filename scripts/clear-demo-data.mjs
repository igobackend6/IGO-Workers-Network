// One-time cleanup: remove the seeded demo projects/supervisors/workers/deployments
// so the app starts from a clean, fully dynamic (user-entered) state.
// Does NOT touch the `roles` collection (real HR/Admin/CEO static accounts).
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const keyPath = process.argv[2] || process.env.GOOGLE_APPLICATION_CREDENTIALS;
const credential = keyPath ? cert(JSON.parse(readFileSync(keyPath, 'utf8'))) : applicationDefault();

initializeApp({ credential });
const db = getFirestore();

const collections = ['projects', 'supervisors', 'workers', 'deployments'];

for (const colName of collections) {
  const snap = await db.collection(colName).get();
  for (const doc of snap.docs) {
    await doc.ref.delete();
    console.log(`Deleted ${colName}/${doc.id}`);
  }
}

console.log('\nDemo data cleared. `roles` collection left untouched.');
