"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, PlusCircle, Trash2, Loader2 } from "lucide-react";
import type { MasterDataItem, ActionCategory } from "@/lib/types";
import { useTranslations } from "@/hooks/use-translations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";


type ColumnDefinition = {
    key: string;
    label: string;
};

type MasterDataCollection = {
    title: string;
    data: MasterDataItem[];
    columns: ColumnDefinition[];
};

type MasterDataManagerProps = {
    data: Record<string, MasterDataCollection>;
    onSave: (collectionName: string, item: MasterDataItem) => void;
    onDelete: (collectionName: string, itemId: string) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isLoading: boolean;
};

export function MasterDataManager({ data, onSave, onDelete, activeTab, setActiveTab, isLoading }: MasterDataManagerProps) {
    const t = useTranslations("Settings");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
    const [currentItem, setCurrentItem] = useState<Partial<MasterDataItem>>({});
    
    const categories = useMemo(() => data.categories?.data as ActionCategory[] || [], [data.categories]);

    const handleAddNew = () => {
        setEditingItem(null);
        setCurrentItem({});
        setIsDialogOpen(true);
    };

    const handleEdit = (item: MasterDataItem) => {
        setEditingItem(item);
        setCurrentItem(item);
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (activeTab) {
            onSave(activeTab, currentItem as MasterDataItem);
            setIsDialogOpen(false);
        }
    };
    
    const getColumnValue = (item: MasterDataItem, columnKey: string) => {
        const value = (item as any)[columnKey];
        if (columnKey === 'categoryName' && !value) {
            return <span className="text-muted-foreground italic">N/A</span>;
        }
        return value;
    };

    const renderFormField = (colKey: string, value: any, onChange: (field: string, value: any) => void) => {
      if (colKey === 'categoryId') {
          return (
              <Select onValueChange={(val) => onChange(colKey, val)} defaultValue={value}>
                  <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoria" />
                  </SelectTrigger>
                  <SelectContent>
                      {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
          );
      }

      return (
          <Input
              id={colKey}
              value={value || ''}
              onChange={(e) => onChange(colKey, e.target.value)}
          />
      );
    };

    const currentColumns = data[activeTab]?.columns || [];

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between">
                <TabsList>
                    {Object.keys(data).map(key => (
                        <TabsTrigger key={key} value={key}>
                            {data[key].title}
                        </TabsTrigger>
                    ))}
                </TabsList>
                <Button onClick={handleAddNew} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('addNew')}
                </Button>
            </div>
            
            {Object.keys(data).map(key => (
                <TabsContent key={key} value={key}>
                    <div className="rounded-md border mt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {data[key].columns.map(col => <TableHead key={col.key}>{col.label}</TableHead>)}
                                    <TableHead className="text-right">{t('col.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={data[key].columns.length + 1} className="h-24 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                        </TableCell>
                                    </TableRow>
                                ) : data[key].data.map(item => (
                                    <TableRow key={item.id}>
                                        {data[key].columns.map(col => (
                                            <TableCell key={col.key}>{getColumnValue(item, col.key)}</TableCell>
                                        ))}
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>{t('deleteConfirmation')}</AlertDialogTitle>
                                                        <AlertDialogDescription>{t('deleteConfirmationMessage')}</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => onDelete(key, item.id!)}>{t('continue')}</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            ))}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem ? `${t('edit')} ${data[activeTab]?.title.slice(0, -1)}` : `${t('addNew')} ${data[activeTab]?.title.slice(0, -1)}`}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {currentColumns.map(col => {
                           if (col.key !== 'categoryName') { // Don't show read-only computed fields in form
                            const formKey = col.key === 'name' && activeTab === 'subcategories' ? 'name' : col.key;
                            const label = col.key === 'categoryId' ? 'Categoría' : col.label;
                            
                            return (
                              <div key={col.key} className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor={col.key} className="text-right">{label}</Label>
                                <div className="col-span-3">
                                  {renderFormField(
                                      activeTab === 'subcategories' && col.key === 'name' ? 'name' : col.key,
                                      (currentItem as any)[col.key === 'categoryName' && activeTab === 'subcategories' ? 'categoryId' : col.key],
                                      (field, value) => setCurrentItem(prev => ({ ...prev, [field]: value }))
                                  )}
                                </div>
                              </div>
                            )
                          }
                          return null;
                        })}
                         {activeTab === 'subcategories' && (
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="categoryId" className="text-right">Categoría</Label>
                                <div className="col-span-3">
                                    <Select 
                                        onValueChange={(value) => setCurrentItem(prev => ({...prev, categoryId: value}))}
                                        defaultValue={(currentItem as ActionSubcategory)?.categoryId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona una categoria" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">{t('cancel')}</Button>
                        </DialogClose>
                        <Button onClick={handleSave}>{t('continue')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Tabs>
    );
}
