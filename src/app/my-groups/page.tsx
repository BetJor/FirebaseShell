
"use client";

import { useState, useEffect, useCallback } from 'react';
import { getGroups } from '@/lib/data';
import type { UserGroup } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, Users } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function MyGroupsPage() {
  const [myGroups, setMyGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const loadMyGroups = useCallback(async () => {
    if (!user || !user.groupIds) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (user.groupIds.length === 0) {
        setMyGroups([]);
        return;
      }
      
      const allImportedGroups = await getGroups();
      const userGroups = allImportedGroups.filter(group => user.groupIds!.includes(group.id));
      setMyGroups(userGroups);
      
    } catch (err: any) {
      console.error("Failed to load user's groups from Firestore:", err);
      setError(err.message || 'An unknown error occurred while fetching group data.');
    } finally {
      setIsLoading(false);
    }
    
  }, [user]);

  useEffect(() => {
    loadMyGroups();
  }, [loadMyGroups]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregant els teus grups...</span>
      </div>
    );
  }

  if (error) {
    return (
       <div className="container mx-auto p-4">
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error de Càrrega</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Els Meus Grups</h1>
      </div>

      {myGroups.length === 0 ? (
        <Card className="text-center">
          <CardHeader>
              <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
            <CardTitle>No pertanys a cap grup importat</CardTitle>
            <CardDescription>Actualment no ets membre de cap dels grups gestionats per aquesta aplicació.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myGroups.map(group => (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle>{group.name}</CardTitle>
                <CardDescription>{group.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {group.description || 'Sense descripció.'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
