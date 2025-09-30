"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/shell/hooks/use-toast";
import { getPrompt, updatePrompt } from "@/services/ai-service";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  improveWriting: z.string().min(10, "El prompt ha de tenir almenys 10 caràcters."),
  analysisSuggestion: z.string().min(10, "El prompt ha de tenir almenys 10 caràcters."),
  correctiveActions: z.string().min(10, "El prompt ha de tenir almenys 10 caràcters."),
});

type AiSettingsFormValues = z.infer<typeof formSchema>;

export default function AiSettingsPage() {
  const { toast } = useToast();
  const form = useForm<AiSettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      improveWriting: "",
      analysisSuggestion: "",
      correctiveActions: "",
    },
  });

  const { formState: { isSubmitting, isLoading } } = form;

  useEffect(() => {
    async function loadPrompts() {
      try {
        const [improvePrompt, analysisPrompt, correctivePrompt] = await Promise.all([
          getPrompt("improveWriting"),
          getPrompt("analysisSuggestion"),
          getPrompt("correctiveActions"),
        ]);
        form.reset({
          improveWriting: improvePrompt,
          analysisSuggestion: analysisPrompt,
          correctiveActions: correctivePrompt,
        });
      } catch (error) {
        console.error("Failed to load AI prompts:", error);
        toast({
          variant: "destructive",
          title: "Error de Càrrega",
          description: "No s'han pogut carregar els prompts de la IA des de la base de dades.",
        });
      }
    }
    loadPrompts();
  }, [form, toast]);

  async function onSubmit(values: AiSettingsFormValues) {
    try {
      await Promise.all([
        updatePrompt("improveWriting", values.improveWriting),
        updatePrompt("analysisSuggestion", values.analysisSuggestion),
        updatePrompt("correctiveActions", values.correctiveActions),
      ]);
      toast({
        title: "Configuració Desada",
        description: "Els prompts de la IA s'han actualitzat correctament.",
      });
       form.reset(values);
    } catch (error) {
      console.error("Failed to save AI prompts:", error);
      toast({
        variant: "destructive",
        title: "Error en Desar",
        description: "No s'han pogut desar els canvis en la configuració de la IA.",
      });
    }
  }

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Configuració de l'IA</h1>
        <p className="text-muted-foreground">
            Gestiona els prompts i altres paràmetres dels assistents d'Intel·ligència Artificial.
        </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardContent className="pt-6 space-y-6">
              <FormField
                control={form.control}
                name="improveWriting"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt de Millora d'Observacions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Introdueix aquí el prompt que utilitzarà l'IA per a millorar les observacions..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="analysisSuggestion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt de Suggeriment d'Anàlisi i Accions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Introdueix el prompt per a l'assistent que suggereix anàlisis de causes i accions correctives..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="correctiveActions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt d'Accions Correctives</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Introdueix el prompt per a l'assistent de propostes d'accions..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Desar Canvis
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
