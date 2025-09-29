"use client"

import { useActionState } from "@/hooks/use-action-state";
import { ActionsTable } from "@/components/actions-table"
import { Loader2 } from "lucide-react"
import { FloatingActionButton } from "@/components/shell/floating-action-button";

export default function ActionsPage() {
  const { actions, isLoading } = useActionState();

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Acciones de Mejora</h1>
      </div>
      <p className="text-muted-foreground">
        Aquí puedes encontrar todas las acciones de mejora. Usa los filtros para acotar tu búsqueda.
      </p>
      <ActionsTable actions={actions} />
      <FloatingActionButton />
    </div>
  )
}
