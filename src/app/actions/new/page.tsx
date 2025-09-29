
"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { createAction, getActionTypes, getCategories, getSubcategories, getAffectedAreas, getResponsibilityRoles, getCenters } from "@/lib/data"
import { ActionForm } from "@/components/action-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useTabs } from "@/components/shell/use-tabs"
import { useActionState } from "@/hooks/use-action-state"


export default function NewActionPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const { closeCurrentTab } = useTabs();
  const { setActions } = useActionState();
  
  const [masterData, setMasterData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false)


  useEffect(() => {
    async function loadMasterData() {
      try {
        setIsLoadingData(true);
        const [types, cats, subcats, areas, roles, centers] = await Promise.all([
          getActionTypes(),
          getCategories(),
          getSubcategories(),
          getAffectedAreas(),
          getResponsibilityRoles(),
          getCenters(),
        ]);
        setMasterData({
            actionTypes: types,
            categories: cats,
            subcategories: subcats,
            affectedAreas: areas,
            responsibilityRoles: roles,
            centers: centers,
        })
      } catch (error) {
        console.error("Failed to load master data", error);
        toast({
          variant: "destructive",
          title: "Error de carga",
          description: "No se han podido cargar los datos maestros. Por favor, recarga la página.",
        })
      } finally {
        setIsLoadingData(false);
      }
    }
    loadMasterData();
  }, [toast]);


  const onSubmit = async (values: any, status: 'Borrador' | 'Pendiente Análisis') => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: "Debes haber iniciado sesión para crear una acción.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const actionData = {
        ...values,
        status,
        creator: {
          id: user.id,
          name: user.name || "Usuario desconocido",
          avatar: user.avatar || undefined,
        },
      };
      const newAction = await createAction(actionData, masterData);
      
      // Optimistic update of the global state
      setActions(prevActions => [newAction, ...prevActions]);

      toast({
        title: "Acción Creada",
        description: "La nueva acción de mejora se ha creado correctamente.",
      });
      
      closeCurrentTab();
      router.push("/actions");

    } catch (error) {
      console.error("Error creating action:", error);
      toast({
        variant: "destructive",
        title: "Error al crear la acción",
        description: "Ha habido un problema al guardar la acción. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
      <Card>
        <CardHeader>
          <CardTitle>Crear Nueva Acción de Mejora</CardTitle>
          <CardDescription>Rellena el formulario para crear una nueva acción. Empezará en estado 'Borrador'.</CardDescription>
        </CardHeader>
        <CardContent>
           {isLoadingData ? (
             <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
           ) : (
            <ActionForm
                mode="create"
                masterData={masterData}
                isSubmitting={isSubmitting}
                onSubmit={onSubmit}
            />
           )}
        </CardContent>
      </Card>
  )
}
