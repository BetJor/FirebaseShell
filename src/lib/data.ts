import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
  addDoc,
  deleteDoc,
  type Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';
import type { User } from './types';

// Funció per obtenir un usuari per ID
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userRef = doc(getDb(), 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      // Transforma Timestamps de Firebase a objectes Date
      const user: User = {
        id: userSnap.id,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
        role: userData.role || 'User', // Assumeix rol 'User' si no està definit
        createdAt: (userData.createdAt as Timestamp)?.toDate(),
        lastLogin: (userData.lastLogin as Timestamp)?.toDate(),
        dashboardLayout: userData.dashboardLayout || [],
      };
      return user;
    } else {
      console.log('No such user!');
      return null;
    }
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw new Error('Could not fetch user.');
  }
}

// Funció per actualitzar un usuari
export async function updateUser(
  userId: string,
  data: Partial<Omit<User, 'id'>>
): Promise<void> {
  try {
    const userRef = doc(getDb(), 'users', userId);
    await updateDoc(userRef, data);
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Could not update user.');
  }
}

// Funció per crear un usuari (pot ser útil per al primer login)
export async function createUser(
  userId: string,
  data: Omit<User, 'id' | 'createdAt' | 'avatar'>
): Promise<void> {
  try {
    const userRef = doc(getDb(), 'users', userId);
    await setDoc(userRef, {
      ...data,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Could not create user.');
  }
}

// Funció per obtenir tots els usuaris
export async function getUsers(): Promise<User[]> {
  const usersCol = collection(getDb(), 'users');
  const usersSnap = await getDocs(usersCol);
  const usersList = usersSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate(),
      lastLogin: (data.lastLogin as Timestamp)?.toDate(),
    } as User;
  });
  return usersList;
}

// Funció per afegir un usuari (per a gestió manual)
export async function addUser(data: Omit<User, 'id'>): Promise<string> {
  const usersCol = collection(getDb(), 'users');
  const docRef = await addDoc(usersCol, {
    ...data,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
  });
  return docRef.id;
}

// Funció per eliminar un usuari
export async function deleteUser(userId: string): Promise<void> {
  const userRef = doc(getDb(), 'users', userId);
  await deleteDoc(userRef);
}
