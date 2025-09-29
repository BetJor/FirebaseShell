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
                    title: "Tipus d'Acció", 
                    data: actionTypesWithRoleNames, 
                    columns: [
                        { key: 'name', label: "Nom" },
                        { key: 'creationRoleNames', label: "Creació" },
                        { key: 'analysisRoleNames', label: "Anàlisi" },
                        { key: 'closureRoleNames', label: "Tancament" },
                    ] 
                },
                responsibilityRoles: { 
                    title: "Rols de Responsabilitat", 
                    data: responsibilityRoles, 
                    columns: [
                        { key: 'name', label: 'Nom' },
                        { key: 'type', label: 'Tipus' },
                        { key: 'email', label: 'Email' },
                        { key: 'emailPattern', label: 'Patró Email' },
                    ] 
                },
                 permissionMatrix: {
                    title: "Matriu de Permisos",
                    data: permissionRulesWithNames,
                    columns: [
                        { key: 'actionTypeName', label: "Tipus d'Acció" },
                        { key: 'status', label: 'Estat' },
                        { key: 'readerRoleNames', label: 'Lectors' },
                        { key: 'authorRoleNames', label: 'Autors' },
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
                title: "Error de càrrega",
                description: "No s'han pogut carregar les dades mestres.",
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
                toast({ title: "Element actualitzat", description: "L'element s'ha actualitzat correctament." });
            } else {
                await addMasterDataItem(collectionName, dataToSave);
                toast({ title: "Element creat", description: "L'element s'ha creat correctament." });
            }
            await loadData(collectionName);
        } catch (error) {
            console.error(`Error saving item in ${collectionName}:`, error);
            toast({ variant: "destructive", title: "Error en desar", description: "No s'ha pogut desar l'element." });
        }
    };

    const handleDelete = async (collectionName: string, itemId: string) => {
        try {
            await deleteMasterDataItem(collectionName, itemId);
            toast({ title: "Element eliminat", description: "L'element s'ha eliminat correctament." });
            await loadData(collectionName);
        } catch (error) {
            console.error(`Error deleting item from ${collectionName}:`, error);
            toast({ variant: "destructive", title: "Error en eliminar", description: "No s'ha pogut eliminar l'element." });
        }
    };


    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Gestió del Workflow</h1>
            <p className="text-muted-foreground">
                Defineix els rols i els permisos que governen el cicle de vida de les accions de millora.
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
                <p>No s'han pogut carregar les dades.</p>
            )}
        </div>
    );
}
