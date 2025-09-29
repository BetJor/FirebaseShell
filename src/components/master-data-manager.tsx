"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, PlusCircle, Trash2, Check, ChevronsUpDown, Info, ExternalLink } from "lucide-react";
import type { MasterDataItem, ResponsibilityRole, ImprovementActionType, PermissionRule, ImprovementActionStatus } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
} from "@/components/ui/alert-dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/shell/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

const allStatuses: ImprovementActionStatus[] = ['Borrador', 'Pendiente Análisis', 'Pendiente Comprobación', 'Pendiente de Cierre', 'Finalizada'];

interface MasterDataFormDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  item: MasterDataItem | null;
  collectionName: string;
  title: string;
  onSave: (collection: string, item: MasterDataItem) => Promise<void>;
  extraData: {
    categories?: MasterDataItem[];
    actionTypes?: ImprovementActionType[];
    responsibilityRoles?: ResponsibilityRole[];
  };
}

function MasterDataFormDialog({ isOpen, setIsOpen, item, collectionName, title, onSave, extraData }: MasterDataFormDialogProps) {
  const [formData, setFormData] = useState<MasterDataItem>({ name: "" });
  const { toast } = useToast();

  useEffect(() => {
    let defaultData: MasterDataItem = { name: "" };
    if (collectionName === 'responsibilityRoles') {
      defaultData = { ...defaultData, type: "Fixed" };
    }
    if (collectionName === 'actionTypes') {
      defaultData = { ...defaultData, possibleCreationRoles: [], possibleAnalysisRoles: [], possibleClosureRoles: [] };
    }
    if (collectionName === 'permissionMatrix') {
      defaultData = { actionTypeId: '', status: 'Borrador', readerRoleIds: [], authorRoleIds: [] };
    }
    setFormData(item || defaultData);
  }, [item, collectionName]);

  const handleSave = async () => {
    if (collectionName !== 'permissionMatrix' && !formData.name) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "El campo 'Nombre' es obligatorio.",
      });
      return;
    }
    await onSave(collectionName, formData);
    setIsOpen(false);
  };

  const renderSpecificFields = () => {
    const actionTypeData = formData as any;

    if (collectionName === 'subcategories' && extraData?.categories) {
      return (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={'categoryId'} className="text-right">Categoría</Label>
          <Select
            value={formData['categoryId']}
            onValueChange={(value) => setFormData({ ...formData, ['categoryId']: value })}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Selecciona categoría" />
            </SelectTrigger>
            <SelectContent>
              {extraData.categories.map(option => (
                <SelectItem key={option.id} value={option.id!}>{option.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (collectionName === 'actionTypes' && extraData?.responsibilityRoles) {
      const handleRoleSelection = (roleId: string, fieldName: 'possibleCreationRoles' | 'possibleAnalysisRoles' | 'possibleClosureRoles') => {
        const currentRoles = actionTypeData[fieldName] || [];
        const newRoles = currentRoles.includes(roleId)
          ? currentRoles.filter((id: string) => id !== roleId)
          : [...currentRoles, roleId];
        setFormData({ ...formData, [fieldName]: newRoles });
      };

      const renderDropdown = (fieldName: 'possibleCreationRoles' | 'possibleAnalysisRoles' | 'possibleClosureRoles', label: string) => {
        const selectedRoles = (actionTypeData[fieldName] || []) as string[];

        return (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={fieldName} className="text-right">{label}</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="col-span-3 justify-between">
                  <span className="truncate">
                    {selectedRoles.length > 0
                      ? extraData.responsibilityRoles!
                          .filter(r => selectedRoles.includes(r.id!))
                          .map(r => r.name)
                          .join(', ')
                      : "Selecciona roles"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[300px]">
                <DropdownMenuLabel>{label}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {extraData.responsibilityRoles!.map((role) => (
                  <DropdownMenuCheckboxItem
                    key={role.id}
                    checked={selectedRoles.includes(role.id!)}
                    onCheckedChange={() => handleRoleSelection(role.id!, fieldName)}
                  >
                    {role.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      };

      return (
        <>
          {renderDropdown('possibleCreationRoles', 'Roles para Creación')}
          {renderDropdown('possibleAnalysisRoles', 'Roles para Análisis')}
          {renderDropdown('possibleClosureRoles', 'Roles para Cierre')}
        </>
      );
    }

    if (collectionName === 'responsibilityRoles') {
      const roleData = formData as ResponsibilityRole;
      return (
        <>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Tipo</Label>
            <Select
              value={roleData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as ResponsibilityRole['type'] })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fixed">Fijo</SelectItem>
                <SelectItem value="Pattern">Patrón</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {roleData.type === 'Fixed' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                value={roleData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
                placeholder="ej., calidad@ejemplo.com"
              />
            </div>
          )}
          {roleData.type === 'Pattern' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="emailPattern" className="text-right">Patrón de Email</Label>
              <Input
                id="emailPattern"
                value={roleData.emailPattern || ''}
                onChange={(e) => setFormData({ ...formData, emailPattern: e.target.value })}
                className="col-span-3"
                placeholder="ej., direccion-{{center.id}}@ejemplo.com"
              />
            </div>
          )}
        </>
      );
    }

    if (collectionName === 'permissionMatrix') {
      const ruleData = formData as PermissionRule;

      const handleMultiSelect = (roleId: string, field: 'readerRoleIds' | 'authorRoleIds') => {
        const currentIds = (ruleData[field] as string[] || []);
        const newIds = currentIds.includes(roleId)
          ? currentIds.filter(id => id !== roleId)
          : [...currentIds, roleId];
        setFormData({ ...formData, [field]: newIds });
      };

      return (
        <>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="actionTypeId" className="text-right">Tipo de Acción</Label>
            <Select value={ruleData.actionTypeId} onValueChange={(value) => setFormData({ ...formData, actionTypeId: value })}>
              <SelectTrigger className="col-span-3"><SelectValue placeholder="Selecciona un tipo de acción" /></SelectTrigger>
              <SelectContent>{extraData?.actionTypes?.map(at => <SelectItem key={at.id} value={at.id!}>{at.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">Estado</Label>
            <Select value={ruleData.status} onValueChange={(value) => setFormData({ ...formData, status: value as ImprovementActionStatus })}>
              <SelectTrigger className="col-span-3"><SelectValue placeholder="Selecciona un estado" /></SelectTrigger>
              <SelectContent>{allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="readerRoleIds" className="text-right">Roles Lectores</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="col-span-3 justify-between">
                  {(ruleData.readerRoleIds?.length || 0) > 0 ? `${ruleData.readerRoleIds.length} seleccionados` : "Selecciona roles lectores"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[300px]">
                {extraData?.responsibilityRoles?.map((role) => (
                  <DropdownMenuCheckboxItem key={role.id} checked={ruleData.readerRoleIds?.includes(role.id!)} onCheckedChange={() => handleMultiSelect(role.id!, 'readerRoleIds')}>{role.name}</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="authorRoleIds" className="text-right">Roles Autores</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="col-span-3 justify-between">
                  {(ruleData.authorRoleIds?.length || 0) > 0 ? `${ruleData.authorRoleIds.length} seleccionados` : "Selecciona roles autores"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[300px]">
                {extraData?.responsibilityRoles?.map((role) => (
                  <DropdownMenuCheckboxItem key={role.id} checked={ruleData.authorRoleIds?.includes(role.id!)} onCheckedChange={() => handleMultiSelect(role.id!, 'authorRoleIds')}>{role.name}</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Editar" : "Añadir Nuevo"} {title}</DialogTitle>
          <DialogDescription>Rellena los detalles a continuación.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nombre</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="col-span-3"
            />
          </div>
          {renderSpecificFields()}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface MasterDataTableProps {
  data: MasterDataItem[];
  columns: { key: string; label: string }[];
  onEdit: (item: MasterDataItem) => void;
  onDelete: (item: MasterDataItem) => void;
  isLoading: boolean;
}

function MasterDataTable({ data, columns, onEdit, onDelete, isLoading }: MasterDataTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => <TableHead key={col.key}>{col.label}</TableHead>)}
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              </TableCell>
            </TableRow>
          ) : data.length > 0 ? (
            data.map((item) => (
              <TableRow key={item.id}>
                {columns.map(col => (
                  <TableCell key={`${item.id}-${col.key}`} className="py-2 align-top">
                    {item[col.key]}
                  </TableCell>
                ))}
                <TableCell className="text-right py-2 align-top">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
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
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el elemento.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(item)}>Continuar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="h-24 text-center">No hay datos para mostrar.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

interface MasterDataManagerProps {
  data: {
    [key: string]: {
      title: string;
      data: MasterDataItem[];
      columns: { key: string; label: string; type?: 'select', options?: any[] }[];
    };
  };
  onSave: (collectionName: string, item: MasterDataItem | PermissionRule) => Promise<void>;
  onDelete: (collectionName: string, itemId: string) => Promise<void>;
  activeTab: string;
  setActiveTab: (value: string) => void;
  isLoading: boolean;
}

export function MasterDataManager({ data, onSave, onDelete, activeTab, setActiveTab, isLoading }: MasterDataManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<MasterDataItem | null>(null);

  const handleAddNew = () => {
    setCurrentItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: MasterDataItem) => {
    setCurrentItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (item: MasterDataItem) => {
    if (item.id) {
      await onDelete(activeTab, item.id);
    }
  };

  const handleSave = async (collectionName: string, item: MasterDataItem) => {
    await onSave(collectionName, item);
  };

  const getExtraDataForTab = (tabKey: string) => {
    if (tabKey === 'subcategories' && data.categories) {
      return { categories: data.categories.data };
    }
    if (tabKey === 'actionTypes' && data.responsibilityRoles) {
      return { responsibilityRoles: data.responsibilityRoles.data };
    }
    if (tabKey === 'permissionMatrix' && data.actionTypes && data.responsibilityRoles) {
      return {
        actionTypes: data.actionTypes.data,
        responsibilityRoles: data.responsibilityRoles.data
      };
    }
    return {};
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          {Object.keys(data).map(key => (
            <TabsTrigger key={key} value={key}>{data[key].title}</TabsTrigger>
          ))}
        </TabsList>
        {Object.keys(data).map(key => (
          <TabsContent key={key} value={key}>
            <div className="flex justify-end mb-4">
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nuevo
              </Button>
            </div>
            {key === 'permissionMatrix' && (
              <Alert className="mb-4 bg-blue-50 border-blue-200 text-blue-800">
                <Info className="h-4 w-4 !text-blue-800" />
                <AlertTitle>Representación Visual</AlertTitle>
                <AlertDescription>
                  <p>Esta matriz de permisos es una guía visual de cómo se comportará el sistema, pero no aplica las reglas directamente. La lógica de autorización real se define en las <strong>Reglas de Seguridad de Firestore.</strong></p>
                  <Link href="/firestore-rules" className="mt-2 inline-flex items-center gap-1 font-semibold text-blue-900 hover:underline">
                    Configurar Reglas de Firestore <ExternalLink className="h-4 w-4" />
                  </Link>
                </AlertDescription>
              </Alert>
            )}
            <MasterDataTable
              data={data[key].data}
              columns={data[key].columns}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          </TabsContent>
        ))}
      </Tabs>
      {isFormOpen && (
        <MasterDataFormDialog
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
          item={currentItem}
          collectionName={activeTab}
          title={data[activeTab].title.endsWith('s') ? data[activeTab].title.slice(0, -1) : data[activeTab].title}
          onSave={handleSave}
          extraData={getExtraDataForTab(activeTab)}
        />
      )}
    </>
  );
}
