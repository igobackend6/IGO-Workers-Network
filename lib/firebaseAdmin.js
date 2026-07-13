import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

function resolveCredential() {
  // Vercel (and any non-GCP host): service account JSON supplied via env var,
  // either raw JSON or base64-encoded (base64 avoids shell/CLI escaping issues
  // with the private key's newlines).
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim();
    const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    return cert(JSON.parse(json));
  }
  // Local dev: path to a downloaded service account key file.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    return cert(JSON.parse(readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')));
  }
  // Cloud Run / GCP: Application Default Credentials from the runtime service account.
  return applicationDefault();
}

function getApp() {
  const existing = getApps();
  if (existing.length > 0) return existing[0];
  return initializeApp({ credential: resolveCredential() });
}

export const db = getFirestore(getApp());
export const auth = getAuth(getApp());
