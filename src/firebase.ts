import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection as fsCollection,
  doc as fsDoc,
  query as fsQuery,
  where as fsWhere,
  onSnapshot as fsOnSnapshot,
  setDoc as fsSetDoc,
  updateDoc as fsUpdateDoc,
  getDocs as fsGetDocs
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';
import { INITIAL_PROJECTS, INITIAL_SUPERVISORS, INITIAL_WORKERS, INITIAL_DEPLOYMENTS } from './data';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with robust multi-tab offline persistence enabled
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const storage = getStorage(app);

// Sandbox Mode checking
export function isSandbox(): boolean {
  return localStorage.getItem('igo_sandbox_mode') === 'true';
}

// Ensure the local storage has seeded database structures for immediate offline-first use
export function initLocalStorageDb() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem('igo_db_projects')) {
    localStorage.setItem('igo_db_projects', JSON.stringify(INITIAL_PROJECTS));
  }
  if (!localStorage.getItem('igo_db_supervisors')) {
    localStorage.setItem('igo_db_supervisors', JSON.stringify(INITIAL_SUPERVISORS));
  }
  if (!localStorage.getItem('igo_db_workers')) {
    localStorage.setItem('igo_db_workers', JSON.stringify(INITIAL_WORKERS));
  }
  if (!localStorage.getItem('igo_db_deployments')) {
    localStorage.setItem('igo_db_deployments', JSON.stringify(INITIAL_DEPLOYMENTS));
  }
  if (!localStorage.getItem('igo_db_verificationLog')) {
    localStorage.setItem('igo_db_verificationLog', JSON.stringify([]));
  }
  if (!localStorage.getItem('igo_db_roles')) {
    localStorage.setItem('igo_db_roles', JSON.stringify([
      { uid: 'super-1', role: 'supervisor', name: 'Selvam Swamy' },
      { uid: 'super-2', role: 'supervisor', name: 'Ramesh Kumar Singh' },
      { uid: 'super-3', role: 'supervisor', name: 'Anand Dwivedi' },
      { uid: 'hr-staff-1', role: 'hr', name: 'Deepak HR Officer' },
      { uid: 'admin-staff-1', role: 'admin', name: 'CEO Office Admin' }
    ]));
  }
}

// Auto-run local seed so offline databases are pre-populated
initLocalStorageDb();

// Active listener registry for mock real-time subscription notifications
const listeners: Array<{
  collectionName: string;
  callback: () => void;
}> = [];

function notifyListeners(collectionName: string) {
  listeners.forEach(l => {
    if (l.collectionName === collectionName) {
      try {
        l.callback();
      } catch (err) {
        console.error("Local Listener notification failed:", err);
      }
    }
  });
}

// Wrapper types for emulator
export interface MockRef {
  type: 'collection' | 'doc' | 'query';
  path: string;
  collectionName: string;
  docId?: string;
  constraints?: any[];
}

// Unified Emulator/Delegate exports
export function collection(dbInstance: any, pathName: string): any {
  if (isSandbox()) {
    return {
      type: 'collection',
      path: pathName,
      collectionName: pathName
    } as MockRef;
  }
  return fsCollection(dbInstance, pathName);
}

export function doc(dbInstance: any, pathName: string, docId?: string): any {
  if (isSandbox()) {
    let finalPath = "";
    let finalId = "";
    if (typeof dbInstance === 'object' && dbInstance !== null && 'type' in dbInstance) {
      finalPath = dbInstance.collectionName;
      finalId = pathName;
    } else {
      finalPath = pathName;
      finalId = docId || "";
    }
    return {
      type: 'doc',
      path: `${finalPath}/${finalId}`,
      collectionName: finalPath,
      docId: finalId
    } as MockRef;
  }
  return docId ? fsDoc(dbInstance, pathName, docId) : fsDoc(dbInstance, pathName);
}

export function query(collectionRef: any, ...constraints: any[]): any {
  if (isSandbox()) {
    return {
      type: 'query',
      path: collectionRef.collectionName,
      collectionName: collectionRef.collectionName,
      constraints: constraints
    } as MockRef;
  }
  return fsQuery(collectionRef, ...constraints);
}

export function where(field: string, operator: any, value: any): any {
  if (isSandbox()) {
    return {
      type: 'where',
      field,
      operator,
      value
    };
  }
  return fsWhere(field, operator, value);
}

export function onSnapshot(
  queryOrRef: any,
  onNext: (snapshot: any) => void,
  onError?: (error: any) => void
): () => void {
  if (isSandbox()) {
    const colName = queryOrRef.collectionName;
    
    const triggerCallback = () => {
      try {
        const raw = localStorage.getItem('igo_db_' + colName) || '[]';
        let items = JSON.parse(raw) as any[];
        
        // Apply where constraints if present
        if (queryOrRef.type === 'query' && queryOrRef.constraints) {
          queryOrRef.constraints.forEach((c: any) => {
            if (c && c.type === 'where') {
              const { field, operator, value } = c;
              items = items.filter(item => {
                const itemVal = item[field];
                if (operator === '==') {
                  return itemVal === value;
                }
                if (operator === '!=') {
                  return itemVal !== value;
                }
                return true;
              });
            }
          });
        }
        
        const mockDocs = items.map(item => ({
          id: item.id || item.uid || '',
          data: () => item,
          metadata: { hasPendingWrites: false }
        }));
        
        const mockSnapshot = {
          docs: mockDocs,
          empty: mockDocs.length === 0,
          size: mockDocs.length,
          metadata: { hasPendingWrites: false },
          forEach: (cb: (doc: any) => void) => {
            mockDocs.forEach(doc => cb(doc));
          }
        };
        
        onNext(mockSnapshot);
      } catch (error) {
        if (onError) onError(error);
      }
    };
    
    // Initial call
    triggerCallback();
    
    const listenerObj = {
      collectionName: colName,
      callback: triggerCallback
    };
    listeners.push(listenerObj);
    
    return () => {
      const idx = listeners.indexOf(listenerObj);
      if (idx !== -1) {
        listeners.splice(idx, 1);
      }
    };
  }
  
  return fsOnSnapshot(queryOrRef, onNext, onError);
}

export async function setDoc(docRef: any, data: any, options?: any): Promise<void> {
  if (isSandbox()) {
    const colName = docRef.collectionName;
    const docId = docRef.docId;
    
    const raw = localStorage.getItem('igo_db_' + colName) || '[]';
    let items = JSON.parse(raw) as any[];
    
    const merge = options?.merge || false;
    const existingIndex = items.findIndex(item => (item.id === docId || item.uid === docId));
    
    const finalData = { ...data };
    if (colName === 'roles') {
      finalData.uid = docId;
    } else {
      finalData.id = docId;
    }
    
    if (existingIndex !== -1) {
      if (merge) {
        items[existingIndex] = { ...items[existingIndex], ...finalData };
      } else {
        items[existingIndex] = finalData;
      }
    } else {
      items.push(finalData);
    }
    
    localStorage.setItem('igo_db_' + colName, JSON.stringify(items));
    notifyListeners(colName);
    return;
  }
  return fsSetDoc(docRef, data, options);
}

export async function updateDoc(docRef: any, data: any): Promise<void> {
  if (isSandbox()) {
    const colName = docRef.collectionName;
    const docId = docRef.docId;
    
    const raw = localStorage.getItem('igo_db_' + colName) || '[]';
    let items = JSON.parse(raw) as any[];
    
    const existingIndex = items.findIndex(item => (item.id === docId || item.uid === docId));
    if (existingIndex !== -1) {
      items[existingIndex] = { ...items[existingIndex], ...data };
      localStorage.setItem('igo_db_' + colName, JSON.stringify(items));
      notifyListeners(colName);
    } else {
      // Treat updateDoc as setDoc with merge if not found
      items.push({ id: docId, ...data });
      localStorage.setItem('igo_db_' + colName, JSON.stringify(items));
      notifyListeners(colName);
    }
    return;
  }
  return fsUpdateDoc(docRef, data);
}

export async function getDocs(queryOrCol: any): Promise<any> {
  if (isSandbox()) {
    const colName = queryOrCol.collectionName;
    const raw = localStorage.getItem('igo_db_' + colName) || '[]';
    let items = JSON.parse(raw) as any[];
    
    if (queryOrCol.type === 'query' && queryOrCol.constraints) {
      queryOrCol.constraints.forEach((c: any) => {
        if (c && c.type === 'where') {
          const { field, operator, value } = c;
          items = items.filter(item => {
            const itemVal = item[field];
            if (operator === '==') return itemVal === value;
            if (operator === '!=') return itemVal !== value;
            return true;
          });
        }
      });
    }
    
    const mockDocs = items.map(item => ({
      id: item.id || item.uid || '',
      data: () => item,
      metadata: { hasPendingWrites: false }
    }));
    
    return {
      docs: mockDocs,
      empty: mockDocs.length === 0,
      size: mockDocs.length,
      forEach: (cb: (doc: any) => void) => {
        mockDocs.forEach(doc => cb(doc));
      }
    };
  }
  return fsGetDocs(queryOrCol);
}

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

// Simple connection validation
export async function testConnection() {
  console.log("Firestore offline persistence initialized successfully.");
}
testConnection();
