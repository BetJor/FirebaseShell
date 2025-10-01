
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
import { Loader2, Terminal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getWorkspaceGroups, type GetWorkspaceGroupsOutput } from "@/services/google-groups-service";
import type { UserGroup } from "@/lib/types";
import { useUser } from "@/hooks/use-user";

function ErrorDisplay({ error }: { error: string | null }) {
    if (!error) return null;

    return (
        <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error d'Importació</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
}

interface GroupImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (selectedGroups: UserGroup[]) => void;
  existingGroups: UserGroup[];
}


export function GroupImportDialog({ isOpen, onClose, onImport, existingGroups }: GroupImportDialogProps) {
  const [availableGroups, setAvailableGroups] = useState<GetWorkspaceGroupsOutput>([]);
  const [selectedGroups, setSelectedGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  
  useEffect(() => {
    if (isOpen && user) {
        setIsLoading(true);
        setError(null);
        setSelectedGroups([]);
        getWorkspaceGroups()
          .then((groups) => {
            const existingGroupIds = new Set(existingGroups.map(g => g.id));
            setAvailableGroups(groups.filter(g => !existingGroupIds.has(g.id)));
          })
          .catch((err) => {
            console.error("Failed to fetch Google Groups:", err);
            setError(err.message || "No se pudieron cargar los grupos desde Google Workspace.");
          })
          .finally(() => {
            setIsLoading(false);
          });
    }
  }, [isOpen, existingGroups, user]);

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
          <DialogTitle>Importar Grups de Google</DialogTitle>
          <DialogDescription>
            Selecciona els grups de Google Workspace que vols fer visibles en aquesta aplicació.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          
          <ErrorDisplay error={error} />
          
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
