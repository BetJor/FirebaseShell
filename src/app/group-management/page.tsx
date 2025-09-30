"use client";

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
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import type { UserGroup } from "@/lib/types";
import { getGroups, deleteGroup } from "@/lib/data";
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
import { useTranslations } from "@/hooks/use-translations";

export default function GroupManagementPage() {
  const { toast } = useToast();
  const t = useTranslations("GroupManagement");
  
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedGroups = await getGroups();
      setGroups(fetchedGroups);
    } catch (error) {
      console.error("Failed to load groups:", error);
      toast({ variant: "destructive", title: t("errors.loadFailedTitle"), description: t("errors.loadFailedDescription") });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleDelete = async (groupId: string) => {
    try {
      await deleteGroup(groupId);
      toast({ title: t("toast.deleteSuccessTitle"), description: t("toast.deleteSuccessDescription") });
      await loadGroups();
    } catch (error) {
      console.error("Failed to delete group:", error);
      toast({ variant: "destructive", title: t("errors.deleteFailedTitle"), description: t("errors.deleteFailedDescription") });
    }
  };

  const handleImport = () => {
    // Aquesta funció s'implementarà en el següent pas
    toast({ title: "Funcionalidad no implementada", description: "La importación de grupos de Google se añadirá próximamente." });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={handleImport}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t("importGroups")}
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("col.name")}</TableHead>
                  <TableHead>{t("col.id")}</TableHead>
                  <TableHead>{t("col.description")}</TableHead>
                  <TableHead className="text-right">{t("col.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : groups.length > 0 ? (
                  groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell className="text-muted-foreground">{group.id}</TableCell>
                      <TableCell className="text-muted-foreground">{group.description}</TableCell>
                      <TableCell className="text-right">
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
                              <AlertDialogAction onClick={() => handleDelete(group.id!)}>
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
                    <TableCell colSpan={4} className="h-24 text-center">
                      {t("noGroups")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
