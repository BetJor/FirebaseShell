"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { getPrompt, updatePrompt } from "@/lib/data"
import { useToast } from "@/components/shell/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  improveWritingPrompt: z.string(),
  analysisSuggestionPrompt: z.string(),
  correctiveActionsPrompt: z.string(),
})

type PromptId = "improveWriting" | "analysisSuggestion" | "correctiveActions";

export default function AiSettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      improveWritingPrompt: "",
      analysisSuggestionPrompt: "",
      correctiveActionsPrompt: "",
    },
  })

  useEffect(() => {
    async function loadPrompts() {
      setIsLoading(true)
      try {
        const [improvePrompt, analysisPrompt, correctiveActionsPrompt] = await Promise.all([
          getPrompt("improveWriting"),
          getPrompt("analysisSuggestion"),
          getPrompt("correctiveActions"),
        ]);
        form.setValue("improveWritingPrompt", improvePrompt);
        form.setValue("analysisSuggestionPrompt", analysisPrompt);
        form.setValue("correctiveActionsPrompt", correctiveActionsPrompt);
      } catch (error) {
        console.error("Failed to load prompts:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se han podido cargar los prompts.",
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadPrompts()
  }, [form, toast])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true)
    try {
      await Promise.all([
        updatePrompt("improveWriting", values.improveWritingPrompt),
        updatePrompt("analysisSuggestion", values.analysisSuggestionPrompt),
        updatePrompt("correctiveActions", values.correctiveActionsPrompt),
      ]);
      toast({
        title: "¡Guardado!",
        description: "Los prompts se han guardado correctamente.",
      })
    } catch (error) {
      console.error("Failed to save prompts:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se han podido guardar los prompts.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de la IA</CardTitle>
        <CardDescription>Gestiona los prompts y otros parámetros de los asistentes de Inteligencia Artificial.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Cargando configuración...
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="improveWritingPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt de Mejora de Observaciones</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={12}
                        placeholder="Introduce aquí el prompt que usará la IA para mejorar las observaciones..."
                        className="resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="analysisSuggestionPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt de Análisis de Causas</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={12}
                        placeholder="Introduce el prompt para el asistente de análisis de causas..."
                        className="resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="correctiveActionsPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt de Acciones Correctivas</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={12}
                        placeholder="Introduce el prompt para el asistente de propuestas de acciones..."
                        className="resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}
