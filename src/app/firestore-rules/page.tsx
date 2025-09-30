"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/shell/hooks/use-toast";
import { getAclEntries, setAclEntries, type AclEntry } from "@/services/ai-service";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";


const formSchema = z.object({
  rules: z.string().min(1, "Les regles no poden estar buides."),
});

type RulesFormValues = z.infer<typeof formSchema>;

function aclEntriesToString(entries: AclEntry[]): string {
    if (!entries || entries.length === 0) return "";
    // Pretty print the JSON
    return JSON.stringify(entries, null, 2);
}

function stringToAclEntries(str: string): AclEntry[] | null {
    try {
        const parsed = JSON.parse(str);
        // Add basic validation to ensure it's an array of objects with expected properties
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'object' && 'collection' in item && 'permissions' in item)) {
            return parsed as AclEntry[];
        }
        return null;
    } catch (e) {
        return null;
    }
}


export default function FirestoreRulesPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RulesFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rules: "",
    },
  });

  const { formState: { isSubmitting, isDirty } } = form;

  useEffect(() => {
    async function loadRules() {
      setIsLoading(true);
      setError(null);
      try {
        const entries = await getAclEntries();
        form.reset({ rules: aclEntriesToString(entries) });
      } catch (e: any) {
        console.error("Failed to load Firestore ACL entries:", e);
        setError("No s'han pogut carregar les regles de Firestore des del servidor.");
        toast({
          variant: "destructive",
          title: "Error",
          description: "No s'han pogut carregar les regles de Firestore.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadRules();
  }, [form, toast]);

  async function onSubmit(values: RulesFormValues) {
    const newEntries = stringToAclEntries(values.rules);

    if (!newEntries) {
        toast({
            variant: "destructive",
            title: "Error de Format",
            description: "El text introduït no és un JSON vàlid amb l'estructura esperada.",
        });
        return;
    }

    try {
      await setAclEntries(newEntries);
      toast({
        title: "Regles Desades",
        description: "Les regles de Firestore s'han actualitzat correctament.",
      });
      form.reset({ rules: aclEntriesToString(newEntries) }); // Reset to mark form as not dirty
    } catch (e: any) {
      console.error("Failed to save Firestore ACL entries:", e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No s'han pogut desar les regles de Firestore."
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Editor de Regles de Firestore</h1>
      <p className="text-muted-foreground">
        Edita les regles de seguretat de la base de dades Firestore. Aquests canvis afectaran directament la seguretat de les dades. Fes-ho amb precaució.
      </p>
      {error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error de Càrrega</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Controller
                  name="rules"
                  control={form.control}
                  render={({ field }) => (
                    <Textarea
                      placeholder="Carregant les regles de Firestore..."
                      className="min-h-[400px] font-mono text-sm"
                      {...field}
                    />
                  )}
                />
              )}
            </CardContent>
          </Card>
          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Desar Regles
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
