
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": "actions-plus-64181820-69508",
  "appId": "1:683988267197:web:cf51a20f0cbc8a070d47d4",
  "apiKey": "AIzaSyCR3BqpFS2XqHEKD5C_tGEr6J7Nq6l6HvU",
  "authDomain": "actions-plus-64181820-69508.firebaseapp.com",
  "messagingSenderId": "683988267197"
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
const auth = getAuth(app);
const storage = getStorage(app);

export { app as firebaseApp, auth, db, storage };
