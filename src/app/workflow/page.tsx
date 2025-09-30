"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/components/shell/hooks/use-toast";
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
import type { PermissionRule } from "@/lib/types";
import {
  getPermissionRules,
  addPermissionRule,
  updatePermissionRule,
  deletePermissionRule,
} from "@/services/permissions-service";
import { getActionTypes, getResponsibilityRoles } from "@/services/master-data-service";
import type { ImprovementActionType, ResponsibilityRole } from "@/lib/types";
import { PermissionRuleDialog } from "@/components/workflow/permission-rule-dialog";
import { useTranslations } from "@/hooks/use-translations";

export default function WorkflowPage() {
  const { toast } = useToast();
  const t = useTranslations("Workflow");

  const [rules, setRules] = useState<PermissionRule[]>([]);
  const [actionTypes, setActionTypes] = useState<ImprovementActionType[]>([]);
  const [roles, setRoles] = useState<ResponsibilityRole[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PermissionRule | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedRules, fetchedTypes, fetchedRoles] = await Promise.all([
        getPermissionRules(),
        getActionTypes(),
        getResponsibilityRoles(),
      ]);
      setRules(fetchedRules);
      setActionTypes(fetchedTypes);
      setRoles(fetchedRoles);
    } catch (error) {
      console.error("Failed to load workflow data:", error);
      toast({
        variant: "destructive",
        title: t("errors.loadFailedTitle"),
        description: t("errors.loadFailedDescription"),
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddNew = () => {
    setEditingRule(null);
    setIsFormOpen(true);
  };

  const handleEdit = (rule: PermissionRule) => {
    setEditingRule(rule);
    setIsFormOpen(true);
  };

  const handleDelete = async (ruleId: string) => {
    try {
      await deletePermissionRule(ruleId);
      toast({
        title: t("toast.deleteSuccessTitle"),
        description: t("toast.deleteSuccessDescription"),
      });
      await loadData();
    } catch (error) {
      console.error("Failed to delete rule:", error);
      toast({
        variant: "destructive",
        title: t("errors.deleteFailedTitle"),
        description: t("errors.deleteFailedDescription"),
      });
    }
  };

  const handleSave = async (data: Omit<PermissionRule, "id">, id?: string) => {
    try {
      if (id) {
        await updatePermissionRule(id, data);
        toast({
          title: t("toast.updateSuccessTitle"),
          description: t("toast.updateSuccessDescription"),
        });
      } else {
        await addPermissionRule(data);
        toast({
          title: t("toast.createSuccessTitle"),
          description: t("toast.createSuccessDescription"),
        });
      }
      await loadData();
      setIsFormOpen(false);
    } catch (error) {
      console.error("Failed to save rule:", error);
      toast({
        variant: "destructive",
        title: t("errors.saveFailedTitle"),
        description: t("errors.saveFailedDescription"),
      });
    }
  };
  
  const getTypeName = (typeId: string) => actionTypes.find(t => t.id === typeId)?.name || typeId;
  const getRoleNames = (roleIds: string[]) => roleIds.map(id => roles.find(r => r.id === id)?.name || id).join(', ');

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t("addNewRule")}
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("col.actionType")}</TableHead>
                  <TableHead>{t("col.status")}</TableHead>
                  <TableHead>{t("col.readers")}</TableHead>
                  <TableHead>{t("col.writers")}</TableHead>
                  <TableHead className="text-right">{t("col.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : rules.length > 0 ? (
                  rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">
                        {getTypeName(rule.actionTypeId)}
                      </TableCell>
                      <TableCell>{rule.status}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {getRoleNames(rule.readerRoleIds)}
                      </TableCell>
                       <TableCell className="text-muted-foreground text-xs">
                        {getRoleNames(rule.authorRoleIds)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(rule)}
                        >
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
                              <AlertDialogTitle>{t("deleteConfirmation")}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("deleteConfirmationMessage")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(rule.id!)}>
                                {t("delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                     {t("noRules")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isFormOpen && (
        <PermissionRuleDialog
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
          rule={editingRule}
          onSave={handleSave}
          actionTypes={actionTypes}
          roles={roles}
        />
      )}
    </>
  );
}
