"use client";

import { useEffect, useState, useCallback } from "react";
import { MasterDataManager } from "@/components/master-data-manager";
import {
    getActionTypes,
    addMasterDataItem,
    updateMasterDataItem,
    deleteMasterDataItem,
    getResponsibilityRoles,
    getPermissionRules,
} from "@/lib/data";
import { useToast } from "@/components/shell/hooks/use-toast";
import type { MasterDataItem, PermissionRule, ResponsibilityRole } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function WorkflowPage() {
    const { toast } = useToast();
    const [masterData, setMasterData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>("");

    const loadData = useCallback(async (currentTab?: string) => {
        setIsLoading(true);
        try {
            const [actionTypes, responsibilityRoles, permissionRules] = await Promise.all([
                getActionTypes(),
                getResponsibilityRoles(),
                getPermissionRules(),
            ]);

            const actionTypesWithRoleNames = actionTypes.map(at => ({
                ...at,
                creationRoleNames: (at.possibleCreationRoles || [])
                    .map(roleId => responsibilityRoles.find(r => r.id === roleId)?.name || roleId)
                    .join(', '),
                analysisRoleNames: (at.possibleAnalysisRoles || [])
                    .map(roleId => responsibilityRoles.find(r => r.id === roleId)?.name || roleId)
                    .join(', '),
                closureRoleNames: (at.possibleClosureRoles || [])
                    .map(roleId => responsibilityRoles.find(r => r.id === roleId)?.name || roleId)
                    .join(', '),
            }));

            const permissionRulesWithNames = permissionRules.map(rule => ({
                ...rule,
                actionTypeName: actionTypes.find(at => at.id === rule.actionTypeId)?.name || rule.actionTypeId,
                readerRoleNames: (rule.readerRoleIds || []).map(id => responsibilityRoles.find(r => r.id === id)?.name).join(', '),
                authorRoleNames: (rule.authorRoleIds || []).map(id => responsibilityRoles.find(r => r.id === id)?.name).join(', '),
            }));


            const data = {
                actionTypes: { 
                    title: "Tipos de Acción", 
                    data: actionTypesWithRoleNames, 
                    columns: [
                        { key: 'name', label: "Nombre" },
                        { key: 'creationRoleNames', label: "Creación" },
                        { key: 'analysisRoleNames', label: "Análisis" },
                        { key: 'closureRoleNames', label: "Cierre" },
                    ] 
                },
                responsibilityRoles: { 
                    title: "Roles de Responsabilidad", 
                    data: responsibilityRoles, 
                    columns: [
                        { key: 'name', label: 'Nombre' },
                        { key: 'type', label: 'Tipo' },
                        { key: 'email', label: 'Email' },
                        { key: 'emailPattern', label: 'Patrón Email' },
                    ] 
                },
                 permissionMatrix: {
                    title: "Matriz de Permisos",
                    data: permissionRulesWithNames,
                    columns: [
                        { key: 'actionTypeName', label: "Tipo de Acción" },
                        { key: 'status', label: 'Estado' },
                        { key: 'readerRoleNames', label: 'Lectores' },
                        { key: 'authorRoleNames', label: 'Autores' },
                    ],
                },
            };
            setMasterData(data);
            
            if (!activeTab || !data[activeTab]) {
                setActiveTab(Object.keys(data)[0]);
            } else if (currentTab) {
                setActiveTab(currentTab);
            }

        } catch (error) {
            console.error("Failed to load master data:", error);
            toast({
                variant: "destructive",
                title: "Error de carga",
                description: "No se han podido cargar los datos maestros.",
            });
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, toast]);
    
    useEffect(() => {
        if(!masterData) {
            loadData();
        }
    }, [loadData, masterData]);


    const handleSave = async (collectionName: string, item: MasterDataItem | PermissionRule) => {
        try {
            const { id, ...dataToSave } = item as any;
            
            const propertiesToRemove = ['actionTypeName', 'readerRoleNames', 'authorRoleNames', 'categoryName', 'creationRoleNames', 'analysisRoleNames', 'closureRoleNames'];
            propertiesToRemove.forEach(prop => {
                if (prop in dataToSave) {
                    delete dataToSave[prop];
                }
            });

            if (id) {
                await updateMasterDataItem(collectionName, id, dataToSave);
                toast({ title: "Elemento actualizado", description: "El elemento se ha actualizado correctamente." });
            } else {
                await addMasterDataItem(collectionName, dataToSave);
                toast({ title: "Elemento creado", description: "El elemento se ha creado correctamente." });
            }
            await loadData(collectionName);
        } catch (error) {
            console.error(`Error saving item in ${collectionName}:`, error);
            toast({ variant: "destructive", title: "Error al guardar", description: "No se pudo guardar el elemento." });
        }
    };

    const handleDelete = async (collectionName: string, itemId: string) => {
        try {
            await deleteMasterDataItem(collectionName, itemId);
            toast({ title: "Elemento eliminado", description: "El elemento se ha eliminado correctamente." });
            await loadData(collectionName);
        } catch (error) {
            console.error(`Error deleting item from ${collectionName}:`, error);
            toast({ variant: "destructive", title: "Error al eliminar", description: "No se pudo eliminar el elemento." });
        }
    };


    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Gestión del Workflow</h1>
            <p className="text-muted-foreground">
                Define los roles y los permisos que gobiernan el ciclo de vida de las acciones de mejora.
            </p>
            {isLoading && !masterData ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : masterData ? (
                <MasterDataManager 
                    data={masterData}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isLoading={isLoading}
                />
            ) : (
                <p>No se han podido cargar los datos.</p>
            )}
        </div>
    );
}
