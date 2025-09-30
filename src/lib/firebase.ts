import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: 'actions-plus-64181820-69508',
  appId: '1:683988267197:web:cf51a20f0cbc8a070d47d4',
  apiKey: 'AIzaSyCR3BqpFS2XqHEKD5C_tGEr6J7Nq6l6HvU',
  authDomain: 'actions-plus-64181820-69508.firebaseapp.com',
  messagingSenderId: '683988267197',
};

// Singleton pattern to initialize and get Firebase services
const getFirebaseApp = (): FirebaseApp => {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
};

let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let storageInstance: FirebaseStorage | null = null;

export const getDb = (): Firestore => {
  if (!dbInstance) {
    dbInstance = initializeFirestore(getFirebaseApp(), {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  }
  return dbInstance;
};

export const getAuth = (): Auth => {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
};

export const getStorage = (): FirebaseStorage => {
  if (!storageInstance) {
    storageInstance = getStorage(getFirebaseApp());
  }
  return storageInstance;
};

// For parts of the code that might still want the raw app object
export const firebaseApp = getFirebaseApp();
