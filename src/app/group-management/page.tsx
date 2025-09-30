"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import type { UserGroup } from "@/lib/types";
import { getGroups, deleteGroup } from "@/lib/data";
import { useToast } from "@/components/shell/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function GroupManagementPage() {
  const { toast } = useToast();
  
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedGroups = await getGroups();
      setGroups(fetchedGroups);
    } catch (error) {
      console.error("Failed to load groups:", error);
      toast({ variant: "destructive", title: "Error de Carga", description: "No se han podido cargar los grupos." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleDelete = async (groupId: string) => {
    try {
      await deleteGroup(groupId);
      toast({ title: "Grupo Eliminado", description: "El grupo se ha eliminado de la lista de la aplicación." });
      await loadGroups();
    } catch (error) {
      console.error("Failed to delete group:", error);
      toast({ variant: "destructive", title: "Error al Eliminar", description: "No se ha podido eliminar el grupo." });
    }
  };

  const handleImport = () => {
    toast({ title: "Funcionalidad no implementada", description: "La importación de grupos de Google se añadirá próximamente." });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Grupos</h1>
          <p className="text-muted-foreground">Gestiona los grupos de Google Workspace que son relevantes para esta aplicación.</p>
        </div>
        <Button onClick={handleImport}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Importar Grupos de Google
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Grupo</TableHead>
                  <TableHead>ID (Email del Grupo)</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : groups.length > 0 ? (
                  groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell className="text-muted-foreground">{group.id}</TableCell>
                      <TableCell className="text-muted-foreground">{group.description}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará el grupo de la lista de grupos visibles en la aplicación, pero no lo borrará de Google Workspace.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(group.id!)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No hay grupos importados. Haz clic en 'Importar' para empezar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
