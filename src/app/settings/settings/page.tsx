"use client";

import { useEffect, useState, useCallback } from "react";
import { MasterDataManager } from "@/components/master-data-manager";
import {
    getCategories,
    getSubcategories,
    getAffectedAreas,
    addMasterDataItem,
    updateMasterDataItem,
    deleteMasterDataItem,
    getResponsibilityRoles,
} from "@/lib/data";
import { useToast } from "@/components/shell/hooks/use-toast";
import type { MasterDataItem } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
    const { toast } = useToast();
    const [masterData, setMasterData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>("");

    const loadData = useCallback(async (currentTab?: string) => {
        setIsLoading(true);
        try {
            const [categories, subcategories, affectedAreas] = await Promise.all([
                getCategories(),
                getSubcategories(),
                getAffectedAreas(),
            ]);

            const subcategoriesWithCategoryName = subcategories.map(s => ({
              ...s, 
              categoryName: categories.find(c => c.id === s.categoryId)?.name || ''
            }));
            
            subcategoriesWithCategoryName.sort((a, b) => {
              if (a.categoryName < b.categoryName) return -1;
              if (a.categoryName > b.categoryName) return 1;
              if (a.name < b.name) return -1;
              if (a.name > b.name) return 1;
              return 0;
            });

            const data = {
                categories: { 
                    title: "Categories", 
                    data: categories, 
                    columns: [{ key: 'name', label: "Nom" }] 
                },
                subcategories: { 
                    title: "Subcategories", 
                    data: subcategoriesWithCategoryName, 
                    columns: [{ key: 'name', label: "Nom" }, { key: 'categoryName', label: "Categoria" }] 
                },
                affectedAreas: { 
                    title: "Àrees Afectades", 
                    data: affectedAreas, 
                    columns: [{ key: 'name', label: "Nom" }] 
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


    const handleSave = async (collectionName: string, item: MasterDataItem) => {
        try {
            const { id, ...dataToSave } = item as any;
            
            const propertiesToRemove = ['categoryName', 'creationRoleNames', 'analysisRoleNames', 'closureRoleNames'];
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
            <h1 className="text-3xl font-bold tracking-tight">Configuració</h1>
            <p className="text-muted-foreground">
                Aquí podràs gestionar les taules mestres de l'aplicació, com ara categories, tipus d'acció, etc.
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
