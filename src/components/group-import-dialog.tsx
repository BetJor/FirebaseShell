"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getUserGroups, type GetUserGroupsOutput, type GetUserGroupsInput } from "@/ai/flows/getUserGroups";
import type { UserGroup } from "@/lib/types";

interface GroupImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (selectedGroups: UserGroup[]) => void;
  existingGroups: UserGroup[];
}

export function GroupImportDialog({ isOpen, onClose, onImport, existingGroups }: GroupImportDialogProps) {
  const { user } = useAuth();
  const [availableGroups, setAvailableGroups] = useState<GetUserGroupsOutput>([]);
  const [selectedGroups, setSelectedGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user?.email) {
      setIsLoading(true);
      setError(null);
      getUserGroups(user.email as GetUserGroupsInput)
        .then((groups) => {
          const existingGroupIds = new Set(existingGroups.map(g => g.id));
          // Filtrar los grupos que ya han sido importados
          setAvailableGroups(groups.filter(g => !existingGroupIds.has(g.id)));
        })
        .catch((err) => {
          console.error("Failed to fetch Google Groups:", err);
          setError("No se pudieron cargar los grupos desde Google Workspace. Revisa la configuración del servidor y los permisos.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, user, existingGroups]);

  const handleSelectGroup = (group: UserGroup, checked: boolean | "indeterminate") => {
    if (checked) {
      setSelectedGroups((prev) => [...prev, group]);
    } else {
      setSelectedGroups((prev) => prev.filter((g) => g.id !== group.id));
    }
  };

  const handleConfirmImport = () => {
    onImport(selectedGroups);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Grupos de Google</DialogTitle>
          <DialogDescription>
            Selecciona los grupos de Google Workspace que quieres hacer visibles en esta aplicación.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error de Carga</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!isLoading && !error && availableGroups.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">No hay nuevos grupos disponibles para importar o no perteneces a ningún grupo.</p>
          )}
          {!isLoading && !error && availableGroups.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {availableGroups.map((group) => (
                <div key={group.id} className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50">
                  <Checkbox
                    id={group.id}
                    onCheckedChange={(checked) => handleSelectGroup(group, checked)}
                  />
                  <Label htmlFor={group.id} className="flex flex-col">
                    <span className="font-medium">{group.name}</span>
                    <span className="text-xs text-muted-foreground">{group.id}</span>
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleConfirmImport}
            disabled={selectedGroups.length === 0 || isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Importar {selectedGroups.length > 0 ? `(${selectedGroups.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
