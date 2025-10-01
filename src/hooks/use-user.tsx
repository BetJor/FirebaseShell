"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { type User as FirebaseUser } from 'firebase/auth';
import type { User, UserGroup } from '@/lib/types';
import { getUserById, updateUser, createUser, getGroups } from '@/lib/data';
import { getGroupMembersRecursive } from '@/services/google-groups-service';
import { useAuth } from '@/hooks/use-auth';
import { useAuthService } from '@/lib/firebase';
import isEqual from 'lodash.isequal';

interface UserContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isImpersonating: boolean;
  impersonateUser: (userToImpersonate: User) => void;
  stopImpersonating: () => void;
  updateDashboardLayout: (layout: string[]) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const IMPERSONATION_KEY = 'impersonation_original_user';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const auth = useAuthService();

  const syncUserGroups = useCallback(async (email: string, existingGroupIds: string[]): Promise<string[] | null> => {
    console.log(`[use-user] Iniciando sincronització de grups per a ${email}`);
    try {
        const allImportedGroups = await getGroups();
        if (allImportedGroups.length === 0) {
            console.log('[use-user] No hi ha grups importats a l\'aplicació. Saltant sincronització.');
            return existingGroupIds;
        }

        const userGroupIds: string[] = [];
        for (const group of allImportedGroups) {
            const members = await getGroupMembersRecursive(group.id);
            if (members.some(memberEmail => memberEmail.toLowerCase() === email.toLowerCase())) {
                userGroupIds.push(group.id);
            }
        }
        
        console.log(`[use-user] Sincronització completada. L'usuari pertany a ${userGroupIds.length} grup(s).`);

        // Compara si la llista de grups ha canviat per a evitar escriptures innecessàries a Firestore
        if (isEqual([...userGroupIds].sort(), [...existingGroupIds].sort())) {
            console.log('[use-user] La pertinença a grups no ha canviat. No es requereix actualització.');
            return null; // Retorna null per a indicar que no cal actualitzar
        }
        
        return userGroupIds;
    } catch (err: any) {
        console.error("[use-user] Error durant la sincronització de grups:", err.message);
        // En cas d'error (p.ex. API de Google no disponible), no sobreescriure els grups existents
        return existingGroupIds;
    }
  }, []);

  const loadFullUser = useCallback(async (fbUser: FirebaseUser) => {
    try {
      let fullUserDetails = await getUserById(fbUser.uid);

      if (!fullUserDetails) {
        const newUserPayload: Omit<User, 'id' | 'createdAt' | 'avatar'> = {
          name: fbUser.displayName || fbUser.email || 'Anonymous User',
          email: fbUser.email!,
          role: 'User',
          lastLogin: new Date(),
          dashboardLayout: [],
          groupIds: [],
        };
        await createUser(fbUser.uid, newUserPayload);
        fullUserDetails = await getUserById(fbUser.uid);
      } else {
        const updatedUser = { ...fullUserDetails, lastLogin: new Date() };
        await updateUser(fbUser.uid, { lastLogin: updatedUser.lastLogin });
        fullUserDetails = updatedUser;
      }

      // Sincronitzar grups
      if (fullUserDetails && fullUserDetails.email) {
          const newGroupIds = await syncUserGroups(fullUserDetails.email, fullUserDetails.groupIds || []);
          if (newGroupIds !== null) { // Només actualitza si hi ha canvis
            await updateUser(fbUser.uid, { groupIds: newGroupIds });
            fullUserDetails.groupIds = newGroupIds;
          }
      }

      return fullUserDetails;
    } catch (error) {
      console.error("[UserProvider] Failed to load user data:", error);
      return null;
    }
  }, [syncUserGroups]);

  useEffect(() => {
    const initializeUser = async () => {
      setLoading(true);
      
      const impersonationData = sessionStorage.getItem(IMPERSONATION_KEY);

      if (impersonationData && firebaseUser) {
          const { impersonatedUser, originalUser } = JSON.parse(impersonationData);
          
          if (originalUser?.id === firebaseUser.uid) {
              setUser(impersonatedUser);
              setIsImpersonating(true);
              setLoading(false);
              return; 
          } else {
              sessionStorage.removeItem(IMPERSONATION_KEY);
          }
      }

      setIsImpersonating(false);
      if (firebaseUser) {
        const fullUser = await loadFullUser(firebaseUser);
        setUser(fullUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    if (!authLoading) {
      initializeUser();
    }
  }, [firebaseUser, authLoading, loadFullUser]);


  const impersonateUser = async (userToImpersonate: User) => {
    if (user?.role === 'Admin' && firebaseUser) {
      const originalUser = user;
      sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify({
        impersonatedUser: userToImpersonate,
        originalUser: originalUser
      }));
      setUser(userToImpersonate); 
      setIsImpersonating(true);
      window.location.reload(); 
    } else {
      console.error("[UserProvider] Only admins can impersonate users.");
    }
  };

  const stopImpersonating = useCallback(async () => {
    sessionStorage.removeItem(IMPERSONATION_KEY);
    setIsImpersonating(false);
    window.location.reload();
  }, []);
  
  const updateDashboardLayout = async (layout: string[]) => {
      if (!user) return;
      try {
        await updateUser(user.id, { dashboardLayout: layout });
        setUser({ ...user, dashboardLayout: layout }); // Update local state
      } catch (error) {
        console.error("Failed to update dashboard layout:", error);
      }
  };

  return (
    <UserContext.Provider value={{ 
        user, 
        loading: loading || authLoading, 
        isAdmin: user?.role === 'Admin' && !isImpersonating,
        isImpersonating,
        impersonateUser,
        stopImpersonating,
        updateDashboardLayout
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
