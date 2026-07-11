// One-time seed script: creates the 3 static Firebase Auth accounts (HR, Admin, CEO)
// and their Firestore role documents, plus the HR-approved supervisor phone allowlist.
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json node scripts/seed-auth.mjs
//
// Get the service account key from:
//   Firebase Console -> Project Settings -> Service Accounts -> Generate new private key
//
// Safe to re-run: existing users/docs are updated in place, not duplicated.

import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || '(default)';

function loadCredential() {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyPath) {
    const json = JSON.parse(readFileSync(keyPath, 'utf8'));
    return cert(json);
  }
  // Falls back to gcloud application-default credentials if already logged in.
  return applicationDefault();
}

const app = initializeApp({ credential: loadCredential() });
const auth = getAuth(app);
const db = getFirestore(app, FIRESTORE_DATABASE_ID);

const STATIC_ACCOUNTS = [
  { email: 'hr@igogroups.com', password: 'IgohrGroups86!', role: 'hr', name: 'Deepak HR Officer' },
  { email: 'admin@igogroups.com', password: 'Igofamily123!', role: 'admin', name: 'CEO Office Admin' },
  { email: 'ceo@igogroups.in', password: 'CEOofIgo27!', role: 'admin', name: 'CEO Office' },
];

const PRE_APPROVED_SUPERVISORS = [
  { id: 'super-1', name: 'Selvam Swamy', phone: '9876543210', assignedState: 'Tamil Nadu', assignedDistrict: 'Madurai', workerCount: 5, lastActiveAt: new Date().toISOString() },
  { id: 'super-2', name: 'Ramesh Kumar Singh', phone: '8765432109', assignedState: 'Bihar', assignedDistrict: 'Patna', workerCount: 4, lastActiveAt: new Date().toISOString() },
  { id: 'super-3', name: 'Anand Dwivedi', phone: '7654321098', assignedState: 'Uttar Pradesh', assignedDistrict: 'Lucknow', workerCount: 3, lastActiveAt: new Date().toISOString() },
];

async function upsertAuthUser({ email, password, name }) {
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, { password, displayName: name });
    console.log(`Updated existing auth user: ${email} (${existing.uid})`);
    return existing.uid;
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      const created = await auth.createUser({ email, password, displayName: name, emailVerified: true });
      console.log(`Created auth user: ${email} (${created.uid})`);
      return created.uid;
    }
    throw err;
  }
}

async function seed() {
  for (const account of STATIC_ACCOUNTS) {
    const uid = await upsertAuthUser(account);
    await db.collection('roles').doc(uid).set(
      { uid, role: account.role, name: account.name, email: account.email },
      { merge: true }
    );
    console.log(`  -> roles/${uid} set to role=${account.role}`);
  }

  for (const sup of PRE_APPROVED_SUPERVISORS) {
    await db.collection('supervisors').doc(sup.id).set(sup, { merge: true });
    console.log(`Pre-approved supervisor phone: ${sup.phone} (${sup.name})`);
  }

  console.log('\nSeeding complete.');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
