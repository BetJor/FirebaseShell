import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth as getFirebaseAuth,
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
let app: FirebaseApp;
const initFirebaseApp = (): FirebaseApp => {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return app;
};

let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let storageInstance: FirebaseStorage | null = null;

export const useDb = (): Firestore => {
  if (!dbInstance) {
    dbInstance = initializeFirestore(initFirebaseApp(), {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  }
  return dbInstance;
};

export const useAuthService = (): Auth => {
  if (!authInstance) {
    authInstance = getFirebaseAuth(initFirebaseApp());
  }
  return authInstance;
};

export const useStorage = (): FirebaseStorage => {
  if (!storageInstance) {
    storageInstance = getStorage(initFirebaseApp());
  }
  return storageInstance;
};

// For parts of the code that might still want the raw app object
export const firebaseApp = initFirebaseApp();
