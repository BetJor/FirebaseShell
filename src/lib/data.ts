
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, Timestamp, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "./types";

// Funció per obtenir un usuari per ID
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      // Transforma Timestamps de Firebase a objectes Date
      const user: User = {
        id: userSnap.id,
        name: userData.name,
        email: userData.email,
        image: userData.image,
        role: userData.role || 'User', // Assumeix rol 'User' si no està definit
        createdAt: (userData.createdAt as Timestamp)?.toDate(),
        lastLogin: (userData.lastLogin as Timestamp)?.toDate(),
        dashboardLayout: userData.dashboardLayout || [],
      };
      return user;
    } else {
      console.log("No such user!");
      return null;
    }
  } catch (error) {
    console.error("Error getting user by ID:", error);
    throw new Error("Could not fetch user.");
  }
}

// Funció per actualitzar un usuari
export async function updateUser(userId: string, data: Partial<User>): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, data);
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Could not update user.");
  }
}

// Funció per crear un usuari (pot ser útil per al primer login)
export async function createUser(userId: string, data: Omit<User, 'id' | 'createdAt'>): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      ...data,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Could not create user.");
  }
}
