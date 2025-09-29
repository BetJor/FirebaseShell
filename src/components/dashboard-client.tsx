

"use client"

import React, { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '@/hooks/use-auth';
import type { ImprovementAction } from "@/lib/types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FilePlus, GanttChartSquare, GripVertical, Plus, Star } from "lucide-react"
import { Button } from "./ui/button"
import { useTabs } from "@/components/shell/use-tabs"
import { getActionById, getActionTypes, getCategories, getCenters, getResponsibilityRoles, getSubcategories, getAffectedAreas } from "@/lib/data"
import { ActionDetailsTab } from "./action-details-tab"
import { cn } from '@/lib/utils';
import { useFollowAction } from '@/hooks/use-follow-action';
import { ActionStatusBadge } from './action-status-badge';
import { FloatingActionButton } from '@/components/shell/floating-action-button';

interface DashboardClientProps {
    actions: ImprovementAction[];
    assignedActions: ImprovementAction[];
}

const defaultLayout = ["pendingActions", "followedActions"];

function SortableItem({ id, children }: { id: string, children: React.ReactNode }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({id});
    
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    
    return (
      <div ref={setNodeRef} style={style} className="relative">
        <Button variant="ghost" size="icon" {...attributes} {...listeners} className="absolute top-2 right-2 cursor-grab h-8 w-8 text-muted-foreground z-10">
           <GripVertical className="h-5 w-5" />
        </Button>
        {children}
      </div>
    );
}

export function DashboardClient({ actions, assignedActions }: DashboardClientProps) {
  const { openTab } = useTabs();
  const { user, updateDashboardLayout } = useAuth();
  const [items, setItems] = useState<string[]>(user?.dashboardLayout || defaultLayout);
  
  const { handleToggleFollow, isFollowing } = useFollowAction();

  const followedActions = useMemo(() => {
    if (!user || !actions) return [];
    return actions.filter(action => action.followers?.includes(user.id));
  }, [actions, user]);


  useEffect(() => {
    setItems(user?.dashboardLayout || defaultLayout);
  }, [user?.dashboardLayout]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    
    if (over && active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.indexOf(active.id as string);
        const newIndex = currentItems.indexOf(over.id as string);
        const newOrder = arrayMove(currentItems, oldIndex, newIndex);
        
        if(user) updateDashboardLayout(newOrder);

        return newOrder;
      });
    }
  }

  const handleOpenAction = (e: React.MouseEvent, action: ImprovementAction) => {
    e.preventDefault();
    const actionLoader = async () => {
      const actionData = await getActionById(action.id);
      if (!actionData) throw new Error("Action not found");
      const [types, cats, subcats, areas, centers, roles] = await Promise.all([
          getActionTypes(), getCategories(), getSubcategories(), getAffectedAreas(), getCenters(), getResponsibilityRoles(),
      ]);
      const masterData = { actionTypes: types, categories: cats, subcategories: subcats, affectedAreas: areas, centers: centers, responsibilityRoles: roles };
      return <ActionDetailsTab initialAction={actionData} masterData={masterData} />;
    };
    openTab({ path: `/actions/${action.id}`, title: `Acción ${action.actionId}`, icon: GanttChartSquare, isClosable: true, loader: actionLoader });
  }

  const widgets: { [key: string]: React.ReactNode } = {
    pendingActions: (
      <Card>
        <CardHeader>
          <CardTitle>Mis Acciones Pendientes</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[120px]">
            {assignedActions.length > 0 ? (
                <div className="space-y-4">
                    {assignedActions.map(action => (
                        <div key={action.id} className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleToggleFollow(action.id, e)}
                              title={isFollowing(action.id) ? "Dejar de seguir" : "Seguir acción"}
                            >
                              <Star className={cn("h-5 w-5", isFollowing(action.id) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                            </Button>
                            <div className="grid gap-1 flex-1">
                                <a href={`/actions/${action.id}`} onClick={(e) => handleOpenAction(e, action)} className="font-semibold hover:underline">{action.title}</a>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{action.actionId}</span>
                                    <ActionStatusBadge status={action.status} isCompliant={action.closure?.isCompliant}/>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (<p className="text-sm text-muted-foreground text-center py-10">No tienes ninguna acción pendiente. ¡Buen trabajo!</p>)}
        </CardContent>
      </Card>
    ),
    followedActions: (
      <Card>
        <CardHeader>
          <CardTitle>Acciones en Seguimiento</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[120px]">
            {followedActions.length > 0 ? (
                <div className="space-y-4">
                    {followedActions.map(action => (
                        <div key={action.id} className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleToggleFollow(action.id, e)}
                              title={"Dejar de seguir"}
                            >
                              <Star className={cn("h-5 w-5 text-yellow-400 fill-yellow-400")} />
                            </Button>
                            <div className="grid gap-1 flex-1">
                               <a href={`/actions/${action.id}`} onClick={(e) => handleOpenAction(e, action)} className="font-semibold hover:underline">{action.title}</a>
                               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{action.actionId}</span>
                                    <ActionStatusBadge status={action.status} isCompliant={action.closure?.isCompliant}/>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (<p className="text-sm text-muted-foreground text-center py-10">No estás siguiendo ninguna acción. Haz clic en el icono de estrella para empezar.</p>)}
        </CardContent>
      </Card>
    ),
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
        <div className="flex flex-col gap-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.filter(id => widgets[id])} strategy={verticalListSortingStrategy}>
                    {items.map(id => (
                        widgets[id] ? (
                            <SortableItem key={id} id={id}>
                                {widgets[id]}
                            </SortableItem>
                        ) : null
                    ))}
                </SortableContext>
            </DndContext>
        </div>
        <FloatingActionButton />
    </div>
  )
}
