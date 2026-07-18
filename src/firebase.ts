import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
  collection as fsCollection,
  doc as fsDoc,
  query as fsQuery,
  where as fsWhere,
  onSnapshot as fsOnSnapshot,
  setDoc as fsSetDoc,
  updateDoc as fsUpdateDoc,
  getDocs as fsGetDocs
} from 'firebase/firestore';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};
const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '(default)';

// A missing/invalid config (e.g. no .env file locally) makes initializeApp/getAuth throw
// synchronously at module-evaluation time. Left unguarded, that exception propagates up
// through the entire static import graph and aborts main.tsx before it ever calls
// createRoot().render() — the whole page silently goes blank with no error in the console,
// since it's a module-instantiation failure rather than a caught runtime error.
// Catching it here and exposing `firebaseInitError` lets main.tsx render a real error
// screen instead.
export let firebaseInitError: string | null = null;

const REQUIRED_KEYS: (keyof typeof firebaseConfig)[] = ['projectId', 'appId', 'apiKey', 'authDomain'];
const missingKeys = REQUIRED_KEYS.filter((key) => !firebaseConfig[key]);

let app: FirebaseApp | undefined;
let dbInstance: Firestore | undefined;
let authInstance: Auth | undefined;

if (missingKeys.length > 0) {
  firebaseInitError =
    `Missing Firebase config: ${missingKeys.map((k) => `VITE_FIREBASE_${k.replace(/[A-Z]/g, (c) => '_' + c).toUpperCase()}`).join(', ')}. ` +
    `Create a .env file (see .env.example) with your Firebase project's SDK config.`;
} else {
  try {
    app = initializeApp(firebaseConfig);
    // Initialize Firestore with robust multi-tab offline persistence enabled
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, firestoreDatabaseId);
    authInstance = getAuth(app);
  } catch (e) {
    firebaseInitError = e instanceof Error ? e.message : String(e);
  }
}

if (firebaseInitError) {
  console.error('[firebase] Initialization failed:', firebaseInitError);
}

// db/auth are asserted non-null: every consumer only runs once App.tsx has confirmed
// firebaseInitError is null (see main.tsx), so these are always populated by the time
// anything actually calls into them.
export const db = dbInstance as Firestore;
export const auth = authInstance as Auth;

export const collection = fsCollection;
export const doc = fsDoc;
export const query = fsQuery;
export const where = fsWhere;
export const onSnapshot = fsOnSnapshot;
export const setDoc = fsSetDoc;
export const updateDoc = fsUpdateDoc;
export const getDocs = fsGetDocs;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
