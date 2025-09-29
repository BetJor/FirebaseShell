"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getPrompt } from "@/lib/data"
import { useToast } from "@/components/shell/hooks/use-toast"
import { useState, useMemo, useEffect, useRef } from "react"
import { Loader2, Mic, MicOff, Wand2, Save, Send, Ban, ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { improveWriting, type ImproveWritingOutput } from "@/ai/flows/improveWriting"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "./ui/command"
import { Label } from "@/components/ui/label"
import type { ImprovementAction, ImprovementActionType, ResponsibilityRole, AffectedArea, Center } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { evaluatePattern } from "@/lib/pattern-evaluator"

const formSchema = z.object({
  title: z.string().min(1, "El título es requerido."),
  category: z.string().min(1, "La categoría es requerida."),
  subcategory: z.string().min(1, "La subcategoría es requerida."),
  affectedAreasIds: z.array(z.string()).min(1, "Debes seleccionar al menos un área implicada."),
  centerId: z.string().optional(),
  assignedTo: z.string({ required_error: "Debes seleccionar un grupo responsable." }).min(1, "Debes seleccionar un grupo responsable."),
  description: z.string().min(1, "Las observaciones son requeridas."),
  typeId: z.string().min(1, "El tipo de acción es requerido."),
})

interface ActionFormProps {
    mode: 'create' | 'edit' | 'view';
    initialData?: ImprovementAction;
    masterData: any;
    isSubmitting: boolean;
    onSubmit: (values: any, status?: 'Borrador' | 'Pendiente Análisis') => void;
    onCancel?: () => void;
    key?: string; // Add key prop
}

const ReadOnlyField = ({ label, value }: { label: string, value?: string | string[] }) => {
    if (!value) return null;
    return (
        <div className="grid gap-1.5">
            <Label className="text-primary">{label}</Label>
            <div className="text-sm font-medium">
              {Array.isArray(value) ? value.join(', ') : value}
            </div>
        </div>
    )
}

export function ActionForm({
    mode,
    initialData,
    masterData,
    isSubmitting,
    onSubmit,
    onCancel
}: ActionFormProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  let finalTranscript = '';

  const [isImprovingText, setIsImprovingText] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<ImproveWritingOutput | null>(null);
  const [isSuggestionDialogOpen, setIsSuggestionDialogOpen] = useState(false);
  const [hasImprovePrompt, setHasImprovePrompt] = useState(false);
  const [isCenterPopoverOpen, setIsCenterPopoverOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      title: initialData.title || "",
      description: initialData.description || "",
      assignedTo: initialData.assignedTo || "",
      category: initialData.categoryId || "",
      subcategory: initialData.subcategoryId || "",
      affectedAreasIds: initialData.affectedAreasIds || [],
      centerId: initialData.centerId || "",
      typeId: initialData.typeId || "",
    } : {
      title: "",
      category: "",
      subcategory: "",
      affectedAreasIds: [],
      centerId: "",
      assignedTo: "",
      description: "",
      typeId: "",
    },
  })


  useEffect(() => {
    async function checkPrompts() {
      const improvePrompt = await getPrompt("improveWriting");
      setHasImprovePrompt(!!improvePrompt);
    }
    checkPrompts();
  }, []);

  const selectedCategoryId = form.watch("category");
  const selectedActionTypeId = form.watch("typeId");
  const selectedCenterId = form.watch("centerId");

  const filteredSubcategories = useMemo(() => {
    if (!selectedCategoryId || !masterData?.subcategories) return [];
    return masterData.subcategories.filter((sc: any) => sc.categoryId === selectedCategoryId);
  }, [selectedCategoryId, masterData]);
  
  useEffect(() => {
    if (form.getValues("category") !== initialData?.categoryId) {
       form.resetField("subcategory", { defaultValue: "" });
    }
  }, [selectedCategoryId, form, initialData]);

  // Dynamic responsible options logic
  const responsibleOptions = useMemo(() => {
    if (!selectedActionTypeId || !masterData || !user) return [];
    
    const actionType: ImprovementActionType | undefined = masterData.actionTypes.find((t: any) => t.id === selectedActionTypeId);
    if (!actionType?.possibleAnalysisRoles) return [];

    const options: { value: string, label: string }[] = [];
    
    actionType.possibleAnalysisRoles.forEach(roleId => {
      const role: ResponsibilityRole | undefined = masterData.responsibilityRoles.find((r: any) => r.id === roleId);
      if (role) {
        if (role.type === 'Fixed' && role.email) {
          options.push({ value: role.email, label: `${role.name} (${role.email})` });
        } else if (role.type === 'Pattern' && role.emailPattern) {
            const center: Center | undefined = masterData.centers.find((c: any) => c.id === selectedCenterId);
            const context = {
                action: { 
                    creator: user,
                    center: center
                }
            };
            const resolvedEmail = evaluatePattern(role.emailPattern, context);
            if (resolvedEmail && !resolvedEmail.includes('{')) {
               options.push({ value: resolvedEmail, label: `${role.name} (${resolvedEmail})` });
            }
        }
      }
    });

    return options;
  }, [selectedActionTypeId, selectedCenterId, masterData, user]);

  useEffect(() => {
    form.resetField("assignedTo", { defaultValue: "" });
  }, [selectedActionTypeId, selectedCenterId, form]);


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
        form.setValue('description', finalTranscript + interimTranscript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        toast({
            variant: "destructive",
            title: "Error de reconocimiento de voz",
            description: "No se ha podido acceder al micrófono o ha ocurrido un error.",
        })
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
       console.warn("Speech Recognition not supported in this browser.");
    }
    
    return () => {
        recognitionRef.current?.stop();
    }
  }, [form, toast, finalTranscript]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
        toast({
            variant: "destructive",
            title: "Navegador no compatible",
            description: "Tu navegador no soporta el reconocimiento de voz.",
        })
        return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      finalTranscript = form.getValues('description');
      recognitionRef.current.start();
    }
    setIsRecording(!isRecording);
  };

  const handleImproveText = async () => {
    const currentDescription = form.getValues('description');
    if (!currentDescription.trim()) {
        toast({
            variant: "destructive",
            title: "Campo vacío",
            description: "No hay texto para mejorar.",
        });
        return;
    }

    setIsImprovingText(true);
    try {
        const response = await improveWriting({ text: currentDescription });
        setAiSuggestion(response);
        setIsSuggestionDialogOpen(true);
    } catch (error) {
        console.error("Error improving text:", error);
        toast({
            variant: "destructive",
            title: "Error de la IA",
            description: "No se ha podido mejorar el texto.",
        });
    } finally {
        setIsImprovingText(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (aiSuggestion) {
        form.setValue('description', aiSuggestion, { shouldValidate: true });
    }
    setIsSuggestionDialogOpen(false);
    setAiSuggestion(null);
  };

    const handleSendForAnalysisSubmit = () => {
        form.handleSubmit((values) => onSubmit(values, 'Pendiente Análisis'))();
    };

    const handleDraftSubmit = () => {
        const values = form.getValues();
        onSubmit(values, 'Borrador');
    };
  
  const disableForm = isSubmitting || mode === 'view';

  if (mode === 'view' && initialData) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Detalles de la Acción</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <ReadOnlyField label="Tipo de Acción" value={initialData.type} />
                    <ReadOnlyField label="Categoría" value={initialData.category} />
                    <ReadOnlyField label="Subcategoría" value={initialData.subcategory} />
                    <ReadOnlyField label="Áreas Funcionales Implicadas" value={initialData.affectedAreas} />
                    <ReadOnlyField label="Centro" value={initialData.center} />
                    <ReadOnlyField label="Asignado A (Responsable Análisis)" value={initialData.assignedTo} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Observaciones</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                        {initialData.description}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          
          <FormField
            control={form.control}
            name="typeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Acción</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={disableForm}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo de acción" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {masterData?.actionTypes.map((type: any) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Categoriza la acción de mejora.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asunto</FormLabel>
                <FormControl>
                  <Input placeholder="p. ej., Optimización del proceso de facturación" {...field} disabled={disableForm} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={disableForm}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {masterData?.categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategoría</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={disableForm || !selectedCategoryId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una subcategoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredSubcategories.map((sub: any) => (
                         <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
             <FormField
              control={form.control}
              name="centerId"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                    <FormLabel>Centro</FormLabel>
                    <Popover open={isCenterPopoverOpen} onOpenChange={setIsCenterPopoverOpen}>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value
                                ? masterData.centers.find(
                                    (center: Center) => center.id === field.value
                                )?.name
                                : "Selecciona un centre"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                        <Command>
                            <CommandInput placeholder="Cerca un centre..." />
                            <CommandEmpty>No se ha trobat cap centre.</CommandEmpty>
                            <CommandGroup>
                            {masterData?.centers.map((center: Center) => (
                                <CommandItem
                                value={center.name}
                                key={center.id}
                                onSelect={() => {
                                    form.setValue("centerId", center.id);
                                    setIsCenterPopoverOpen(false);
                                }}
                                >
                                <Check
                                    className={cn(
                                    "mr-2 h-4 w-4",
                                    center.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                />
                                {center.name}
                                </CommandItem>
                            ))}
                            </CommandGroup>
                        </Command>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField
              control={form.control}
              name="affectedAreasIds"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>Áreas Funcionales Implicadas</FormLabel>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <FormControl>
                         <Button
                            variant="outline"
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value?.length && "text-muted-foreground"
                            )}
                            >
                            <span className="truncate">
                                {field.value?.length > 0
                                ? field.value
                                    .map(
                                    (id) =>
                                        masterData?.affectedAreas.find(
                                        (area: AffectedArea) => area.id === id
                                        )?.name
                                    )
                                    .filter(Boolean)
                                    .join(", ")
                                : "Selecciona áreas"}
                            </span>
                            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[300px]" align="start">
                        <DropdownMenuLabel>Áreas Afectadas</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {masterData?.affectedAreas.map((area: AffectedArea) => (
                             <DropdownMenuCheckboxItem
                                key={area.id}
                                checked={field.value?.includes(area.id!)}
                                onCheckedChange={(checked) => {
                                    const currentSelection = field.value || [];
                                    const newSelection = checked
                                        ? [...currentSelection, area.id!]
                                        : currentSelection.filter(id => id !== area.id);
                                    field.onChange(newSelection);
                                }}
                             >
                                {area.name}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asignado A</FormLabel>
                  <Select 
                  onValueChange={field.onChange} 
                  value={field.value} 
                  disabled={disableForm || responsibleOptions.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una persona responsable" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {responsibleOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Asigna a la persona encargada del análisis.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observaciones</FormLabel>
                 <div className="relative">
                  <FormControl>
                      <Textarea
                      placeholder="Describe la no conformidad o el área de mejora..."
                      className="resize-y min-h-[120px] pr-24"
                      {...field}
                      disabled={disableForm}
                      />
                  </FormControl>
                  {mode !== 'view' && (
                    <div className="absolute right-2 top-2 flex flex-col gap-2">
                        <Button 
                            type="button" 
                            size="icon" 
                            variant="ghost" 
                            onClick={toggleRecording}
                            disabled={disableForm}
                            className={cn("h-8 w-8", isRecording && "bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-500")}
                            title="Activar/desactivar el micrófono"
                        >
                            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            <span className="sr-only">{isRecording ? "Detener grabación" : "Iniciar grabación"}</span>
                        </Button>
                        {hasImprovePrompt && (
                          <Button 
                              type="button" 
                              size="icon" 
                              variant="ghost" 
                              onClick={handleImproveText}
                              disabled={disableForm || isImprovingText}
                              className="h-8 w-8"
                              title="Mejorar texto con IA"
                          >
                              {isImprovingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                              <span className="sr-only">Mejorar texto con IA</span>
                          </Button>
                        )}
                    </div>
                  )}
                 </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {mode === 'create' && (
              <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleDraftSubmit} disabled={disableForm}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Guardar Borrador
                  </Button>
                  <Button type="button" onClick={handleSendForAnalysisSubmit} disabled={disableForm}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Enviar para Análisis
                  </Button>
              </div>
          )}

          {mode === 'edit' && (
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    <Ban className="mr-2 h-4 w-4" />
                    Cancelar
                </Button>
                <Button type="button" onClick={handleDraftSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Borrador
                </Button>
                 <Button type="button" onClick={handleSendForAnalysisSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Enviar para Análisis
                </Button>
            </div>
          )}
        </form>
      </Form>

      <Dialog open={isSuggestionDialogOpen} onOpenChange={setIsSuggestionDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sugerencia de la IA</DialogTitle>
            <DialogDescription>El asistente ha generado la siguiente descripción. ¿Quieres aceptar estos cambios?</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
            <div className="space-y-2">
              <Label htmlFor="suggestion-description">Descripción mejorada</Label>
              <Textarea id="suggestion-description" readOnly value={aiSuggestion || ''} rows={10} className="resize-y" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuggestionDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAcceptSuggestion}>Aceptar Sugerencia</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
