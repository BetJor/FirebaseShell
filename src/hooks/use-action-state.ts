
"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import type { ImprovementAction } from '@/lib/types';
import { getActions } from '@/lib/data';
import { useAuth } from './use-auth';

interface ActionStateContextType {
    actions: ImprovementAction[];
    isLoading: boolean;
    error: Error | null;
    setActions: React.Dispatch<React.SetStateAction<ImprovementAction[]>>;
}

const ActionStateContext = createContext<ActionStateContextType | undefined>(undefined);

export function ActionStateProvider({ children }: { children: ReactNode }) {
    const [actions, setActions] = useState<ImprovementAction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            getActions()
                .then(fetchedActions => {
                    setActions(fetchedActions);
                    setError(null);
                })
                .catch(err => {
                    console.error("Failed to load actions:", err);
                    setError(err);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            // If there's no user, clear actions and stop loading.
            setActions([]);
            setIsLoading(false);
        }
    }, [user]);

    return (
        <ActionStateContext.Provider value={{ actions, isLoading, error, setActions }}>
            {children}
        </ActionStateContext.Provider>
    );
}

export function useActionState() {
    const context = useContext(ActionStateContext);
    if (context === undefined) {
        throw new Error('useActionState must be used within an ActionStateProvider');
    }
    return context;
}
