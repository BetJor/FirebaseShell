
"use client"

import type { ImprovementAction } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link as LinkIcon, ExternalLink, GanttChartSquare } from "lucide-react"
import { useTabs } from "@/components/shell/hooks/use-tabs"
import { getActionById, getActionTypes, getCategories, getSubcategories, getAffectedAreas, getCenters, getResponsibilityRoles } from "@/lib/data"
import { ActionDetailsTab } from "../action-details-tab"


interface LinkedActionSectionProps {
  action: ImprovementAction
}

export function LinkedActionSection({ action }: LinkedActionSectionProps) {
  const { openTab } = useTabs();

  if (!action.originalActionId) {
    return null
  }

  const handleOpenOriginalAction = () => {
    if (!action.originalActionId) return;

    const actionLoader = async () => {
      const actionData = await getActionById(action.originalActionId!);
      if (!actionData) {
          throw new Error("Action not found");
      }
      const [types, cats, subcats, areas, centers, roles] = await Promise.all([
          getActionTypes(),
          getCategories(),
          getSubcategories(),
          getAffectedAreas(),
          getCenters(),
          getResponsibilityRoles(),
      ]);
      const masterData = { actionTypes: types, categories: cats, subcategories: subcats, affectedAreas: areas, centers: centers, responsibilityRoles: roles };
      return <ActionDetailsTab initialAction={actionData} masterData={masterData} />;
    };

    openTab({
        path: `/actions/${action.originalActionId}`,
        title: `Acció ${action.originalActionTitle?.split(':')[0] || action.originalActionId}`,
        icon: GanttChartSquare,
        isClosable: true,
        loader: actionLoader
    });
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Acció Original (BIS)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Aquesta acció es va crear a partir del tancament no conforme de l'acció:</p>
        <p className="font-semibold">{action.originalActionTitle}</p>
        <Button onClick={handleOpenOriginalAction} variant="outline" size="sm" className="w-full">
            <ExternalLink className="mr-2 h-4 w-4" />
            Veure Acció Original
        </Button>
      </CardContent>
    </Card>
  )
}
