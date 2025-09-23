import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ImprovementActionStatus } from "@/lib/types"

interface ActionStatusBadgeProps {
  status: ImprovementActionStatus
  isCompliant?: boolean | null;
}

export function ActionStatusBadge({ status, isCompliant = null }: ActionStatusBadgeProps) {
  const statusStyles = {
    Borrador: "bg-gray-200 text-gray-800",
    "Pendiente Análisis": "bg-green-100 text-green-800",
    "Pendiente Comprobación": "bg-green-200 text-green-800",
    "Pendiente de Cierre": "bg-green-300 text-green-800",
    Finalizada: "bg-green-500 text-white",
  }

  // Special case for non-compliant finalized actions
  const finalStyle = (status === 'Finalizada' && isCompliant === false)
    ? "bg-red-500 text-white"
    : statusStyles[status];

  return (
    <Badge
      className={cn(
        "border-transparent hover:opacity-90",
        finalStyle
      )}
    >
      {status}
    </Badge>
  )
}
