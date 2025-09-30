"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { type User as FirebaseUser } from 'firebase/auth';
import type { User } from '@/lib/types';
import { getUserById, updateUser, createUser } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';
import { useAuthService } from '@/lib/firebase';

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

  const loadFullUser = useCallback(async (fbUser: FirebaseUser) => {
     console.log(`[UserProvider] loadFullUser called for: ${fbUser.uid}`);
    try {
      let fullUserDetails = await getUserById(fbUser.uid);

      if (!fullUserDetails) {
        console.log('[UserProvider] User not found in DB, creating...');
        const newUserPayload: Omit<User, 'id' | 'createdAt' | 'avatar'> = {
          name: fbUser.displayName || fbUser.email || 'Anonymous User',
          email: fbUser.email!,
          role: 'User',
          lastLogin: new Date(),
          dashboardLayout: [],
        };
        await createUser(fbUser.uid, newUserPayload);
        fullUserDetails = await getUserById(fbUser.uid);
      } else {
        const updatedUser = { ...fullUserDetails, lastLogin: new Date() };
        await updateUser(fbUser.uid, { lastLogin: updatedUser.lastLogin });
        fullUserDetails = updatedUser;
      }
      return fullUserDetails;
    } catch (error) {
      console.error("[UserProvider] Failed to load user data:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    console.log(`[UserProvider] useEffect triggered. authLoading: ${authLoading}, firebaseUser: ${firebaseUser?.uid}`);
    const initializeUser = async () => {
      setLoading(true);
      console.log('[UserProvider] initializeUser starting...');
      
      const impersonationData = sessionStorage.getItem(IMPERSONATION_KEY);
      console.log(`[UserProvider] impersonationData from sessionStorage: ${impersonationData ? 'found' : 'not found'}`);

      if (impersonationData && firebaseUser) {
          console.log('[UserProvider] Entering IMPERSONATION branch.');
          const { impersonatedUser, originalUser } = JSON.parse(impersonationData);
          
          if (originalUser?.id === firebaseUser.uid) {
              console.log(`[UserProvider] Impersonation valid. Setting user to ${impersonatedUser.name}`);
              setUser(impersonatedUser);
              setIsImpersonating(true);
              setLoading(false);
              return; 
          } else {
              console.warn('[UserProvider] Inconsistent impersonation state. Clearing session.');
              sessionStorage.removeItem(IMPERSONATION_KEY);
          }
      }

      console.log('[UserProvider] Entering NORMAL user loading branch.');
      setIsImpersonating(false);
      if (firebaseUser) {
        const fullUser = await loadFullUser(firebaseUser);
        console.log(`[UserProvider] Setting user to ${fullUser?.name}`);
        setUser(fullUser);
      } else {
        console.log('[UserProvider] No firebaseUser. Setting user to null.');
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
      console.log(`[UserProvider] Starting impersonation. Admin: ${originalUser.name}, Target: ${userToImpersonate.name}`);
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
    console.log('[UserProvider] Stopping impersonation.');
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
