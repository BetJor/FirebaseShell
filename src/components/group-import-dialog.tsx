
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
import { Loader2, Terminal, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { getUserGroups, type GetUserGroupsOutput, type GetUserGroupsInput } from "@/services/google-groups-service";
import type { UserGroup } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { checkAdminEmailEnv, getAdminEmailEnv } from "@/services/config-service";
import { cn } from "@/lib/utils";

function ErrorDisplay({ error, hasAdminEmailEnv, adminEmail }: { error: string | null, hasAdminEmailEnv: boolean | null, adminEmail: string | null }) {
    if (!error) return null;

    const isConfigError = error.includes("Google Workspace") || error.includes("403");

    if (isConfigError) {
        return (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error de Configuració</AlertTitle>
                <AlertDescription>
                   La importació ha fallat. Això normalment es deu a una configuració incorrecta. Si us plau, revisa els següents punts:
                </AlertDescription>
                <Accordion type="single" collapsible className="w-full mt-4 text-xs">
                  <AccordionItem value="item-1">
                    <AccordionTrigger 
                      className={cn(hasAdminEmailEnv === true && "text-green-600")}
                    >
                      Pas 1: Variable d'Entorn
                    </AccordionTrigger>
                    <AccordionContent>
                      {adminEmail ? (
                        <p>Variable configurada amb el valor: <span className="font-semibold">{adminEmail}</span></p>
                      ) : (
                        <p>Assegura't que el fitxer `.env` (o `.env.local`) a l'arrel del projecte contingui la variable `GSUITE_ADMIN_EMAIL` amb l'email d'un administrador del teu domini de Google Workspace.</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Pas 2: Activar l'API Admin SDK</AccordionTrigger>
                    <AccordionContent>
                      Ves a la teva consola de Google Cloud, cerca "Admin SDK API" a la llibreria d'APIs i assegura't que estigui habilitada per a aquest projecte.
                    </AccordionContent>
                  </AccordionItem>
                   <AccordionItem value="item-3">
                    <AccordionTrigger>Pas 3: Delegació a tot el domini (Domain-Wide Delegation)</AccordionTrigger>
                    <AccordionContent>
                        Aquest és el pas més important. A la Consola d'Administració de Google Workspace, ves a `Seguretat` &gt; `Control d'accés i de dades` &gt; `Controls d'API` &gt; `Delegació a tot el domini`. Afegeix un nou client d'API i proporciona l'ID de client del teu Compte de Servei i l'àmbit d'OAuth: `https://www.googleapis.com/auth/admin.directory.group.readonly`. Assegura't que l'estat sigui "Autoritzat".
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
            </Alert>
        );
    }

    return (
        <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error de Càrrega</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
}

export function GroupImportDialog({ isOpen, onClose, onImport, existingGroups }: GroupImportDialogProps) {
  const { user } = useAuth();
  const [availableGroups, setAvailableGroups] = useState<GetUserGroupsOutput>([]);
  const [selectedGroups, setSelectedGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAdminEmailEnv, setHasAdminEmailEnv] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkAdminEmailEnv().then(setHasAdminEmailEnv);
      getAdminEmailEnv().then(setAdminEmail);

      if (user?.email) {
        setIsLoading(true);
        setError(null);
        setSelectedGroups([]);
        getUserGroups(user.email as GetUserGroupsInput)
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
          
          <ErrorDisplay error={error} hasAdminEmailEnv={hasAdminEmailEnv} adminEmail={adminEmail} />
          
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
