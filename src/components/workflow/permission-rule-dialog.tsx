"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PermissionRule, ImprovementActionType, ResponsibilityRole } from "@/lib/types";
import { useTranslations } from "@/hooks/use-translations";
import { MultiSelect } from "@/components/ui/multi-select";

const formSchema = z.object({
  actionTypeId: z.string().min(1, "El tipus d'acció és requerit."),
  status: z.enum([
    "Borrador",
    "Pendiente Análisis",
    "En Análisis",
    "Pendiente Verificación",
    "En Verificación",
    "Pendiente Cierre",
    "Finalizada",
  ]),
  readerRoleIds: z.array(z.string()).min(1, "Cal almenys un rol lector."),
  authorRoleIds: z.array(z.string()).min(1, "Cal almenys un rol escriptor."),
});

type PermissionRuleFormValues = z.infer<typeof formSchema>;

interface PermissionRuleDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  rule: PermissionRule | null;
  onSave: (data: Omit<PermissionRule, "id">, id?: string) => Promise<void>;
  actionTypes: ImprovementActionType[];
  roles: ResponsibilityRole[];
}

export function PermissionRuleDialog({
  isOpen,
  setIsOpen,
  rule,
  onSave,
  actionTypes,
  roles,
}: PermissionRuleDialogProps) {
  const t = useTranslations("Workflow");
  
  const form = useForm<PermissionRuleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      actionTypeId: "",
      status: "Borrador",
      readerRoleIds: [],
      authorRoleIds: [],
    },
  });

  useEffect(() => {
    if (rule) {
      form.reset(rule);
    } else {
      form.reset({
        actionTypeId: "",
        status: "Borrador",
        readerRoleIds: [],
        authorRoleIds: [],
      });
    }
  }, [rule, form]);

  const handleSubmit = (values: PermissionRuleFormValues) => {
    onSave(values, rule?.id);
  };
  
  const roleOptions = roles.map(r => ({ value: r.id, label: r.name }));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rule ? t("dialog.editTitle") : t("dialog.addTitle")}</DialogTitle>
          <DialogDescription>
           {t("dialog.description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 py-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="actionTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.actionType.label")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("form.actionType.placeholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {actionTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.status.label")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("form.status.placeholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Borrador">Borrador</SelectItem>
                        <SelectItem value="Pendiente Análisis">Pendiente Análisis</SelectItem>
                        <SelectItem value="En Análisis">En Análisis</SelectItem>
                        <SelectItem value="Pendiente Verificación">Pendiente Verificación</SelectItem>
                        <SelectItem value="En Verificación">En Verificación</SelectItem>
                        <SelectItem value="Pendiente Cierre">Pendiente Cierre</SelectItem>
                        <SelectItem value="Finalizada">Finalizada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="readerRoleIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.readers.label")}</FormLabel>
                    <MultiSelect
                      options={roleOptions}
                      selected={field.value}
                      onChange={field.onChange}
                      placeholder={t("form.readers.placeholder")}
                    />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="authorRoleIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.writers.label")}</FormLabel>
                   <MultiSelect
                      options={roleOptions}
                      selected={field.value}
                      onChange={field.onChange}
                      placeholder={t("form.writers.placeholder")}
                    />
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("cancel")}
                </Button>
              </DialogClose>
              <Button type="submit">{t("save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
