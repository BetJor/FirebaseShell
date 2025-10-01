'use server';

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    // When running in a Google Cloud environment, application default credentials
    // are used automatically.
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
    console.log('[user-service] Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('[user-service] Firebase Admin SDK initialization error:', error.message);
    // We don't throw here to avoid crashing the server on boot, 
    // but subsequent calls that need the Admin SDK will fail.
  }
}

/**
 * Retrieves the Google ID from a Firebase UID.
 * This is necessary to interact with Google Workspace APIs.
 * @param uid The Firebase user ID.
 * @returns A promise that resolves to the Google ID.
 */
export async function getGoogleIdFromFirebaseUid(uid: string): Promise<string> {
    if (!admin.apps.length) {
        throw new Error("El SDK d'administrador de Firebase no està inicialitzat. Revisa els registres del servidor.");
    }
    
    const userRecord = await admin.auth().getUser(uid);
    const googleProvider = userRecord.providerData.find(
        (provider) => provider.providerId === 'google.com'
    );

    if (!googleProvider || !googleProvider.uid) {
        throw new Error(`L'usuari amb UID ${uid} no té un proveïdor de Google associat o no té UID de proveïdor.`);
    }
    
    return googleProvider.uid;
}
