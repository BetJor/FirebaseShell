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
                    title: "Categorías", 
                    data: categories, 
                    columns: [{ key: 'name', label: "Nombre" }] 
                },
                subcategories: { 
                    title: "Subcategorías", 
                    data: subcategoriesWithCategoryName, 
                    columns: [{ key: 'name', label: "Nombre" }, { key: 'categoryName', label: "Categoría" }] 
                },
                affectedAreas: { 
                    title: "Áreas Afectadas", 
                    data: affectedAreas, 
                    columns: [{ key: 'name', label: "Nombre" }] 
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
            <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
            <p className="text-muted-foreground">
                Aquí podrás gestionar las tablas maestras de la aplicación, como categorías, tipos de acción, etc.
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
