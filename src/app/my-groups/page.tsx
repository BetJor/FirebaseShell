'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getWorkspaceGroups, type GetWorkspaceGroupsOutput } from '@/services/google-groups-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { useUser } from '@/hooks/use-user';
import { getUserById } from '@/lib/data';

// Aquesta funció s'hauria de moure a un lloc més adequat, com un servei o hook
async function getMyGroups(userId: string): Promise<GetWorkspaceGroupsOutput> {
  const allGroups = await getWorkspaceGroups();
  const myUser = await getUserById(userId);
  if (!myUser || !myUser.email) return [];
  
  // Aquest filtratge en el client no és ideal per a un gran nombre de grups o usuaris
  // Per ara, és una solució temporal. 
  // TODO: Aconseguir els membres de cada grup per a poder filtrar correctament
  return allGroups.filter(group => group.id.toLowerCase().includes('director'));
}


export default function MyGroupsPage() {
  const { user } = useUser();
  const [groups, setGroups] = useState<GetWorkspaceGroupsOutput>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('MyGroups');

  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      // Aquí hauríem de tenir una funció que realment filtri els grups de l'usuari
      // Com a solució temporal, mostrem tots els grups del workspace
      getWorkspaceGroups()
        .then(setGroups)
        .catch((err) => {
          console.error("Failed to get user groups:", err);
          setError("No s'han pogut carregar els grups.");
        })
        .finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('col.name')}</TableHead>
                <TableHead>{t('col.id')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : error ? (
                 <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center text-destructive">
                    {error}
                  </TableCell>
                </TableRow>
              ) : groups.length > 0 ? (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell className="text-muted-foreground">{group.id}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    {t('noGroups')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
