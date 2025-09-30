
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

  const loadFullUser = useCallback(async (fbUser: FirebaseUser | null) => {
    setLoading(true);
    if (fbUser) {
      try {
        const impersonationData = sessionStorage.getItem(IMPERSONATION_KEY);
        if (impersonationData) {
          const { impersonatedUser, originalUser } = JSON.parse(impersonationData);
          if (originalUser?.id === fbUser.uid) {
            setUser(impersonatedUser);
            setIsImpersonating(true);
            setLoading(false);
            return;
          } else {
            sessionStorage.removeItem(IMPERSONATION_KEY);
          }
        }

        let fullUserDetails = await getUserById(fbUser.uid);

        if (!fullUserDetails) {
          console.log('User not found in DB, creating...');
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

        setUser(fullUserDetails);
        setIsImpersonating(false);
      } catch (error) {
        console.error("Failed to load user data:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    } else {
      setUser(null);
      setIsImpersonating(false);
      sessionStorage.removeItem(IMPERSONATION_KEY);
      setLoading(false);
    }
}, []);


  useEffect(() => {
    loadFullUser(firebaseUser);
  }, [firebaseUser, loadFullUser]);

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
      console.error("Only admins can impersonate users.");
    }
  };

  const stopImpersonating = useCallback(async () => {
    sessionStorage.removeItem(IMPERSONATION_KEY);
    setIsImpersonating(false);
    await loadFullUser(auth.currentUser); 
  }, [loadFullUser, auth]);
  
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
        isAdmin: user?.role === 'Admin',
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
