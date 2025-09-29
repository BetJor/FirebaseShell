"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/shell/hooks/use-toast";
import { getFirestoreRules, saveFirestoreRules } from "@/services/ai-service";
import { Loader2, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function FirestoreRulesPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRules() {
      setIsLoading(true);
      setError(null);
      try {
        const currentRules = await getFirestoreRules();
        setRules(currentRules);
      } catch (err: any) {
        setError("Error al cargar las reglas de Firestore.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRules();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await saveFirestoreRules(rules);
      toast({
        title: "Reglas guardadas",
        description: "Las reglas de Firestore se han guardado correctamente.",
      });
    } catch (err: any) {
      setError("Error al guardar las reglas de Firestore.");
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al guardar las reglas de Firestore.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reglas de Firestore</CardTitle>
        <CardDescription>Edita las reglas de seguridad de Firestore directamente desde la aplicación.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando reglas...</span>
          </div>
        ) : (
          <Textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            className="h-[calc(100vh-22rem)] font-mono text-xs"
            placeholder="Cargando reglas..."
          />
        )}
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaving ? "Guardando..." : "Guardar"}
        </Button>
      </CardContent>
    </Card>
  );
}
