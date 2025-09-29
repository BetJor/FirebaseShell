"use client"

import { useState, useEffect, useRef } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { getPrompt, getUsers } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2, PlusCircle, Trash2, CalendarIcon, Save, Mic, MicOff, Wand2 } from "lucide-react"
import type { ImprovementAction, User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/components/shell/hooks/use-toast"
import { suggestAnalysisAndActions, type SuggestAnalysisOutput } from "@/ai/flows/improveAnalysis"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "./ui/separator"


const analysisSchema = z.object({
  causes: z.string().min(1, "El análisis de causas es requerido."),
  proposedActions: z.array(
    z.object({
      id: z.string().optional(),
      description: z.string().min(1, "La descripción es requerida."),
      responsibleUserId: z.string().min(1, "El responsable es requerido."),
      dueDate: z.date({ required_error: "La fecha de vencimiento es requerida." }),
      status: z.enum(["Pendent", "Implementada", "Implementada Parcialment", "No Implementada"]).default("Pendent"),
    })
  ).min(1, "Se debe proponer al menos una acción."),
  verificationResponsibleUserId: z.string().min(1, "El responsable de verificación es requerido."),
})

type AnalysisFormValues = z.infer<typeof analysisSchema>

interface AnalysisSectionProps {
  action: ImprovementAction;
  user: User;
  isSubmitting: boolean;
  onSave: (data: any) => void;
}

export function AnalysisSection({ action, user, isSubmitting, onSave }: AnalysisSectionProps) {
  const { toast } = useToast()

  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // States for AI and Mic functionality
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  let finalTranscript = '';
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<SuggestAnalysisOutput | null>(null);
  const [isSuggestionDialogOpen, setIsSuggestionDialogOpen] = useState(false);
  const [hasAnalysisPrompt, setHasAnalysisPrompt] = useState(false);

  const form = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisSchema),
    defaultValues: {
      causes: action.analysis?.causes || "",
      proposedActions: action.analysis?.proposedActions.map(pa => ({...pa, dueDate: new Date(pa.dueDate), status: pa.status || 'Pendent'})) || [],
      verificationResponsibleUserId: action.analysis?.verificationResponsibleUserId || "",
    },
  })

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "proposedActions",
  })

  useEffect(() => {
    async function loadData() {
        setIsLoadingUsers(true);
        try {
            const fetchedUsers = await getUsers();
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Failed to load users for analysis section", error);
            toast({ variant: "destructive", title: "Error", description: "No se han podido cargar los usuarios." });
        } finally {
            setIsLoadingUsers(false);
        }
    }
    loadData();
  }, [toast]);

  useEffect(() => {
    async function checkPrompts() {
      const analysisPrompt = await getPrompt("analysisSuggestion");
      setHasAnalysisPrompt(!!analysisPrompt);
    }
    checkPrompts();
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        form.setValue('causes', finalTranscript + interimTranscript);
      };

      recognition.onend = () => setIsRecording(false);
      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        toast({ variant: "destructive", title: "Error de reconocimiento de voz" });
        setIsRecording(false);
      };
      recognitionRef.current = recognition;
    }
    return () => recognitionRef.current?.stop();
  }, [form, toast, finalTranscript]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      finalTranscript = form.getValues('causes');
      recognitionRef.current.start();
    }
    setIsRecording(!isRecording);
  };

  const handleGenerateSuggestion = async () => {
    setIsGeneratingSuggestion(true);
    try {
      const response = await suggestAnalysisAndActions({ observations: action.description });
      setAiSuggestion(response);
      setIsSuggestionDialogOpen(true);
    } catch (error) {
      console.error("Error generating analysis suggestion:", error);
      toast({ variant: "destructive", title: "Error de la IA", description: "No se ha podido generar la sugerencia." });
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (aiSuggestion) {
      form.setValue('causes', aiSuggestion.causesAnalysis, { shouldValidate: true });
      
      const newActions = aiSuggestion.proposedActions.map(action => ({
        id: crypto.randomUUID(),
        description: action.description,
        responsibleUserId: '', // User must select this
        dueDate: new Date(), // Defaults to today, user must change
        status: 'Pendent' as const
      }));
      replace(newActions);
    }
    setIsSuggestionDialogOpen(false);
    setAiSuggestion(null);
  };


  const onSubmit = (values: AnalysisFormValues) => {
    const analysisData = {
        ...values,
        proposedActions: values.proposedActions.map(pa => ({
            ...pa,
            id: pa.id || crypto.randomUUID(),
        })),
        analysisResponsible: {
            id: user.id,
            name: user.name || "Usuario desconocido",
            avatar: user.avatar || undefined,
        },
        analysisDate: new Date().toISOString(),
    }
    onSave(analysisData)
  }

  if (isLoadingUsers) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="h-6 w-6 animate-spin"/></div>
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Análisis de Causas y Plan de Acción</CardTitle>
            <CardDescription>Realiza el análisis de las causas raíz y define las acciones a emprender.</CardDescription>
          </div>
          {hasAnalysisPrompt && (
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateSuggestion}
              disabled={isGeneratingSuggestion}
              title="Generar Análisis con IA"
            >
              {isGeneratingSuggestion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Generar Análisis con IA</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="causes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Análisis de las Causas</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder="Describe el análisis realizado para identificar las causas raíz del problema..."
                        className="resize-y pr-12"
                        {...field}
                      />
                    </FormControl>
                    <div className="absolute right-2 top-2 flex flex-col gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={toggleRecording}
                        className={cn("h-8 w-8", isRecording && "bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-500")}
                        title="Activar/desactivar el micrófono"
                      >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Acciones Propuestas</h3>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 p-4 border rounded-md items-start">
                   <div className="flex-1 flex flex-col gap-4">
                     <FormField
                        control={form.control}
                        name={`proposedActions.${index}.description`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descripción de la acción</FormLabel>
                                <FormControl>
                                    <Textarea {...field} placeholder="p. ej., Revisar y actualizar el procedimiento P-01" rows={2} className="resize-y" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name={`proposedActions.${index}.responsibleUserId`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Responsable</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un usuario" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {users.map((user) => (
                                            <SelectItem key={user.id} value={user.id!}>{user.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name={`proposedActions.${index}.dueDate`}
                        render={({ field }) => (
                            <FormItem>
                               <FormLabel>Fecha Vencimiento</FormLabel>
                               <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? (
                                        format(field.value, "PPP", { locale: es })
                                        ) : (
                                        <span>Selecciona una fecha</span>
                                        )}
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date < new Date()}
                                        initialFocus
                                    />
                                </PopoverContent>
                               </Popover>
                               <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                   </div>
                   <div className="flex items-center">
                     <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                     </Button>
                   </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: "", responsibleUserId: "", dueDate: new Date(), status: 'Pendent' })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Acción
              </Button>
            </div>

            <FormField
              control={form.control}
              name="verificationResponsibleUserId"
              render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-lg font-semibold">Responsable de la Verificación</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger className="md:max-w-sm">
                                <SelectValue placeholder="Selecciona el usuario que verificará la eficacia" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {users.map((user) => (
                                <SelectItem key={user.id} value={user.id!}>{user.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Análisis y Avanzar
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>

    <Dialog open={isSuggestionDialogOpen} onOpenChange={setIsSuggestionDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sugerencia de la IA</DialogTitle>
            <DialogDescription>El asistente ha generado el siguiente análisis y plan de acción. ¿Quieres aceptar estos cambios?</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-6">
            <div className="space-y-2">
              <Label htmlFor="suggestion-causes" className="font-semibold text-base">Análisis de Causas Sugerido</Label>
              <Textarea id="suggestion-causes" readOnly value={aiSuggestion?.causesAnalysis || ''} rows={8} className="resize-y bg-muted/50" />
            </div>
            <Separator />
            <div className="space-y-4">
               <h4 className="font-semibold text-base">Acciones Correctivas Sugeridas</h4>
               <ul className="space-y-2 list-disc pl-5">
                {aiSuggestion?.proposedActions.map((action, index) => (
                    <li key={index}>{action.description}</li>
                ))}
               </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuggestionDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAcceptSuggestion}>Aceptar y Rellenar Formulario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
