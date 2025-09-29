

"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { getActionById, updateAction, getUsers } from "@/lib/data"
import type { ImprovementAction, User } from "@/lib/types"
import { ActionForm } from "@/components/action-form"
import { Button } from "@/components/ui/button"
import { AnalysisSection } from "@/components/analysis-section"
import { VerificationSection } from "@/components/verification-section"
import { ClosureSection } from "@/components/closure-section"
import { ActionDetailsPanel } from "@/components/action-details-panel"
import { Loader2, FileEdit, Edit, Star } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import type { ProposedActionStatus } from "@/lib/types"
import { useRouter } from "next/navigation"
import { UpdateActionStatusDialog } from "./update-action-status-dialog"
import { useFollowAction } from "@/hooks/use-follow-action"
import { useActionState } from "@/hooks/use-action-state"
import { useTabs } from "@/components/shell/hooks/use-tabs"
import { ActionStatusBadge } from "./action-status-badge"


interface ActionDetailsTabProps {
    initialAction: ImprovementAction;
    masterData: any;
}

const safeParseDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === 'string') {
        try {
            // ISO 8601 format is preferred
            return parseISO(date);
        } catch (e) {
            console.warn(`Could not parse date string: ${date}`, e);
            return null;
        }
    }
    if (date && typeof date.toDate === 'function') { // Firebase Timestamp
        return date.toDate();
    }
    return null;
}


export function ActionDetailsTab({ initialAction, masterData }: ActionDetailsTabProps) {
    const { toast } = useToast()
    const router = useRouter();
    const { closeCurrentTab } = useTabs();
    const { user } = useAuth()
    const { actions, setActions } = useActionState();

    const [action, setAction] = useState<ImprovementAction | null>(initialAction);
    const [isEditing, setIsEditing] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [users, setUsers] = useState<User[]>([]);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [selectedProposedAction, setSelectedProposedAction] = useState<any>(null);
    
    const { handleToggleFollow, isFollowing } = useFollowAction();


    useEffect(() => {
      async function loadUsers() {
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
      }
      loadUsers();
    }, []);

    useEffect(() => {
        const updatedAction = actions.find(a => a.id === initialAction.id);
        setAction(updatedAction || initialAction);
    }, [actions, initialAction]);
    
    const handleActionUpdate = async () => {
        if (!action) return;
        const updatedActionData = await getActionById(action.id);
        if (updatedActionData) {
            setActions(prev => prev.map(a => a.id === updatedActionData.id ? updatedActionData : a));
        }
    }

    const handleEditSubmit = async (formData: any, status?: 'Borrador' | 'Pendiente Análisis') => {
        if (!action) return;
        setIsSubmitting(true);
        try {
            const dataToUpdate: any = { ...formData };
            if (status) {
              dataToUpdate.status = status;
            }
            
            await updateAction(action.id, dataToUpdate, masterData, status);
            toast({
                title: "Acción guardada",
                description: "Los cambios se han guardado correctamente.",
            });

            if (status === 'Pendiente Análisis') {
                closeCurrentTab();
            } else {
                setIsEditing(false);
                await handleActionUpdate();
            }
        } catch (error) {
            console.error("Error updating action:", error);
            toast({
                variant: "destructive",
                title: "Error al guardar",
                description: "No se ha podido actualizar la acción.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleAnalysisSave = async (analysisData: any) => {
        if (!action) return;
        setIsSubmitting(true);
        try {
          await updateAction(action.id, {
            analysis: analysisData,
            status: "Pendiente Comprobación",
          });
          
          toast({
            title: "Análisis guardado",
            description: "El análisis de causas se ha guardado y el estado ha avanzado.",
          });
    
          await handleActionUpdate();
    
        } catch (error) {
          console.error("Error saving analysis:", error);
          toast({
              variant: "destructive",
              title: "Error al guardar",
              description: "No se pudo guardar el análisis.",
          });
        } finally {
          setIsSubmitting(false);
        }
    }

    const handleVerificationSave = async (verificationData: any) => {
        if (!action) return;
        setIsSubmitting(true);
        try {
          await updateAction(action.id, {
            verification: verificationData,
            status: "Pendiente de Cierre",
          });
          
          toast({
            title: "Verificación guardada",
            description: "La verificación se ha guardado y el estado ha avanzado.",
          });
    
          await handleActionUpdate();
    
        } catch (error) {
          console.error("Error saving verification:", error);
          toast({
              variant: "destructive",
              title: "Error al guardar",
              description: "No se pudo guardar la verificación.",
          });
        } finally {
          setIsSubmitting(false);
        }
    };

    const handleClosureSave = async (closureData: any) => {
        if (!action || !user) return;
        setIsSubmitting(true);
        try {
            await updateAction(action.id, {
                closure: {
                    ...closureData,
                    closureResponsible: {
                        id: user.id,
                        name: user.name || 'Unknown User',
                        avatar: user.avatar || undefined,
                    },
                    date: new Date().toISOString(),
                },
                status: 'Finalizada',
            });
            
            toast({
                title: "Acción cerrada",
                description: "La acción de mejora se ha cerrado correctamente.",
            });
            closeCurrentTab();
            router.push("/actions");
            router.refresh();
    
        } catch (error) {
            console.error("Error saving closure:", error);
            toast({
                variant: "destructive",
                title: "Error al cerrar",
                description: "No se pudo cerrar la acción.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleUpdateProposedActionStatus = async (proposedActionId: string, newStatus: ProposedActionStatus) => {
        if (!action) return;
        setIsSubmitting(true);
        try {
            await updateAction(action.id, {
                updateProposedActionStatus: {
                    proposedActionId,
                    status: newStatus,
                }
            });
            toast({
                title: "Estado actualizado",
                description: "El estado de la acción propuesta se ha actualizado.",
            });
            await handleActionUpdate();
        } catch (error) {
            console.error("Error updating proposed action status:", error);
            toast({ variant: "destructive", title: "Error al actualizar el estado." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!action) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    const isAnalysisTabDisabled = action?.status === 'Borrador';
    const isVerificationTabDisabled = action?.status === 'Borrador' || action?.status === 'Pendiente Análisis';
    const isClosureTabDisabled = action?.status === 'Borrador' || action?.status === 'Pendiente Análisis' || action?.status === 'Pendiente Comprobación';
  
    const isUserAuthorizedForCurrentStep = (() => {
        if (!user || !action) return false;
        
        switch (action.status) {
            case 'Pendiente Análisis':
                return user.email === action.responsibleGroupId;
            case 'Pendiente Comprobación':
                return user.id === action.analysis?.verificationResponsibleUserId;
            case 'Pendiente de Cierre':
                return user.id === action.creator.id;
            default:
                return false;
        }
    })();

    const getStatusColorClass = (status?: ProposedActionStatus) => {
      if (!status) return "border-gray-300";
      switch (status) {
        case "Pendent":
          return "border-gray-400";
        case "Implementada":
          return "border-green-500";
        case "Implementada Parcialment":
          return "border-yellow-500";
        case "No Implementada":
          return "border-red-500";
        default:
          return "border-gray-300";
      }
    };

    const renderReadOnlyContent = (titleKey: string, descriptionKey: string, content: React.ReactNode) => (
        <Card>
            <CardHeader>
                <CardTitle>{titleKey}</CardTitle>
                <CardDescription>{descriptionKey}</CardDescription>
            </CardHeader>
            <CardContent>
                {content}
            </CardContent>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
            <div className="lg:col-span-3 flex flex-col gap-6">
                <header className="flex items-center gap-4">
                     <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleToggleFollow(action.id, e)}
                        title={isFollowing(action.id) ? "Dejar de seguir" : "Seguir acción"}
                        className="h-8 w-8"
                      >
                        <Star className={cn("h-5 w-5", isFollowing(action.id) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                      </Button>
                    <h1 className="text-3xl font-bold tracking-tight">{action.actionId}: {action.title}</h1>
                    <ActionStatusBadge status={action.status} isCompliant={action.closure?.isCompliant} />
                </header>

                <Tabs defaultValue="details" className="w-full">
                    <TabsList>
                        <TabsTrigger value="details">Detalles</TabsTrigger>
                        <TabsTrigger value="analysis" disabled={isAnalysisTabDisabled}>Causas y Acción Propuesta</TabsTrigger>
                        <TabsTrigger value="verification" disabled={isVerificationTabDisabled}>Verificación de Implantación</TabsTrigger>
                        <TabsTrigger value="closure" disabled={isClosureTabDisabled}>Cierre de la Acción</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details" className="mt-4">
                       <div className="space-y-6">
                           
                           {isEditing ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Editando Acción de Mejora</CardTitle>
                                        <CardDescription>Estás modificando los detalles de esta acción. Guarda los cambios cuando hayas terminado.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ActionForm 
                                            key={action.id} // Add key to force re-render when action changes
                                            mode='edit'
                                            initialData={action}
                                            masterData={masterData}
                                            isSubmitting={isSubmitting}
                                            onSubmit={handleEditSubmit}
                                            onCancel={() => setIsEditing(false)}
                                        />
                                    </CardContent>
                                </Card>
                            ) : (
                                <>
                                 {action.status === "Borrador" && (
                                    <div className="flex items-start justify-between gap-4">
                                        <Button onClick={() => setIsEditing(true)} className="ml-auto">
                                            <FileEdit className="mr-2 h-4 w-4" /> Editar Borrador
                                        </Button>
                                    </div>
                                 )}
                                 <ActionForm 
                                    mode='view'
                                    initialData={action}
                                    masterData={masterData}
                                    isSubmitting={isSubmitting}
                                    onSubmit={handleEditSubmit}
                                />
                                </>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="analysis" className="mt-4">
                        {action.status === 'Pendiente Análisis' && isUserAuthorizedForCurrentStep && user ? (
                            <AnalysisSection
                                action={action}
                                user={user}
                                isSubmitting={isSubmitting}
                                onSave={handleAnalysisSave}
                            />
                        ) : action.analysis ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Causas y Acción Propuesta</CardTitle>
                                    <CardDescription>
                                        Análisis realizado por {action.analysis.analysisResponsible?.name} el {safeParseDate(action.analysis.analysisDate) ? format(safeParseDate(action.analysis.analysisDate)!, "PPP", { locale: es }) : ''}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">Análisis de las Causas</h3>
                                        <p className="text-muted-foreground whitespace-pre-wrap">{action.analysis.causes}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <h3 className="font-semibold text-lg mb-4">Acción Propuesta</h3>
                                        <div className="space-y-4">
                                            {action.analysis.proposedActions.map((pa) => (
                                                <div key={pa.id} className={cn("p-4 border-l-4 rounded-lg bg-muted/30", getStatusColorClass(pa.status))}>
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <p className="font-medium">{pa.description}</p>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                Responsable: {users.find(u => u.id === pa.responsibleUserId)?.name || pa.responsibleUserId} | Fecha Vencimiento: {safeParseDate(pa.dueDate) ? format(safeParseDate(pa.dueDate)!, "dd/MM/yyyy") : ''}
                                                            </p>
                                                             <p className="text-sm text-muted-foreground mt-1">
                                                                Estado: <span className="font-semibold">{pa.status || 'Pendente'}</span>
                                                            </p>
                                                        </div>
                                                        {user?.id === pa.responsibleUserId && action.status !== 'Finalizada' && (
                                                          <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                              setSelectedProposedAction(pa);
                                                              setIsStatusDialogOpen(true);
                                                            }}
                                                          >
                                                            <Edit className="mr-2 h-3 w-3" />
                                                            Actualizar Estado
                                                          </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                     <Separator />
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">Responsable de la Verificación</h3>
                                        <p className="text-muted-foreground">
                                            {users.find(u => u.id === action.analysis?.verificationResponsibleUserId)?.name || action.analysis?.verificationResponsibleUserId || 'No asignado'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-center text-muted-foreground py-10">
                            <p>El análisis se podrá realizar una vez la acción esté en estado 'Pendiente de Análisis' y seas el responsable asignado.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="verification" className="mt-4">
                        {action.status === 'Pendiente Comprobación' && isUserAuthorizedForCurrentStep && user && action.analysis ? (
                            <VerificationSection
                                action={action}
                                user={user}
                                isSubmitting={isSubmitting}
                                onSave={handleVerificationSave}
                            />
                        ) : action.verification ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Comprobación de la Implantación</CardTitle>
                                    <CardDescription>
                                        Verificación realizada por {action.verification.verificationResponsible?.name} el {safeParseDate(action.verification.verificationDate) ? format(safeParseDate(action.verification.verificationDate)!, "PPP", { locale: es }) : ''}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">Observaciones Generales</h3>
                                        <p className="text-muted-foreground whitespace-pre-wrap">{action.verification.notes}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <h3 className="font-semibold text-lg mb-4">Estado de las Acciones Propuestas</h3>
                                        <div className="space-y-4">
                                            {action.analysis?.proposedActions.map((pa, index) => (
                                                <div key={`${pa.id}-${index}`} className="p-4 border rounded-lg">
                                                    <p className="font-medium">{pa.description}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Estado: <span className="font-semibold">{action.verification?.proposedActionsVerificationStatus?.[pa.id] || 'Pendiente de Verificación'}</span>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-center text-muted-foreground py-10">
                                <p>La verificación se podrá realizar una vez se haya completado el análisis de causas y seas el responsable asignado.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="closure" className="mt-4">
                        {action.status === 'Pendiente de Cierre' && isUserAuthorizedForCurrentStep && user ? (
                            <ClosureSection
                            isSubmitting={isSubmitting}
                            onSave={handleClosureSave}
                            />
                        ) : action.closure ? (
                            <Card>
                            <CardHeader>
                                <CardTitle>Cierre de la Acción</CardTitle>
                                <CardDescription>
                                    Cerrada por {action.closure.closureResponsible.name} el {safeParseDate(action.closure.date) ? format(safeParseDate(action.closure.date)!, "PPP", { locale: es }) : ''}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-base mb-2">Resultado del Cierre</h3>
                                    <p className={cn("font-medium", action.closure.isCompliant ? "text-green-600" : "text-red-600")}>
                                        {action.closure.isCompliant ? "Conforme" : "No Conforme"}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-base mb-2">Observaciones Finales</h3>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{action.closure.notes}</p>
                                </div>
                            </CardContent>
                            </Card>
                        ) : (
                             <div className="text-center text-muted-foreground py-10">
                                <p>El cierre se podrá realizar una vez se haya completado la verificación y seas el responsable asignado.</p>
                            </div>
                        )}
                    </TabsContent>

                </Tabs>
            </div>

            <aside className="lg:col-span-1">
                <ActionDetailsPanel action={action} onActionUpdate={handleActionUpdate} />
            </aside>

            {isStatusDialogOpen && selectedProposedAction && (
                <UpdateActionStatusDialog
                    isOpen={isStatusDialogOpen}
                    setIsOpen={setIsStatusDialogOpen}
                    proposedAction={selectedProposedAction}
                    onSave={handleUpdateProposedActionStatus}
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    )
}
