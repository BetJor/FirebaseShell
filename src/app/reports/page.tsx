import { getActions, getActionTypes } from "@/lib/data";
import type { ImprovementAction, ImprovementActionType } from "@/lib/types";
import { ReportsClient } from "@/components/reports-client";

export default async function ReportsPage() {
  const actions: ImprovementAction[] = await getActions();
  const actionTypes: ImprovementActionType[] = await getActionTypes();

  const actionsByStatus = actions.reduce((acc, action) => {
    const status = action.status || 'Desconegut';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const actionsByType = actions.reduce((acc, action) => {
    const type = action.type || 'Desconegut';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });


  const statusChartData = Object.entries(actionsByStatus).map(([name, value]) => ({ name, value }));
  const typeChartData = Object.entries(actionsByType).map(([name, value]) => ({ name, value }));


  return (
    <ReportsClient 
        statusData={statusChartData} 
        typeData={typeChartData}
    />
  );
}
