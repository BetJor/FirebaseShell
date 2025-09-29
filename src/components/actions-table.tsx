

"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ActionStatusBadge } from "./action-status-badge"
import type { ImprovementAction, ImprovementActionStatus, ImprovementActionType, User } from "@/lib/types"
import { ArrowUpDown, ChevronDown, GanttChartSquare, Star, X } from "lucide-react"
import { useTabs } from "@/components/shell/hooks/use-tabs"
import { getActionById, getActionTypes, getCategories, getSubcategories, getAffectedAreas, getCenters, getResponsibilityRoles, getUsers } from "@/lib/data"
import { ActionDetailsTab } from "@/components/action-details-tab"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { useFollowAction } from "@/hooks/use-follow-action"
import { Badge } from "./ui/badge"
import { format, parseISO } from "date-fns"
import { ActionStatusIndicator } from "./action-status-indicator"

interface ActionsTableProps {
  actions: ImprovementAction[];
}

type SortKey = keyof ImprovementAction | 'responsible'

const safeFormatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
        return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch {
        return dateString; // Return original string if it's not a valid ISO date
    }
}

export function ActionsTable({ actions }: ActionsTableProps) {
  const { openTab } = useTabs();
  
  const { handleToggleFollow, isFollowing } = useFollowAction();
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<Set<ImprovementActionStatus>>(new Set())
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set())
  const [centerFilter, setCenterFilter] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null)
  

  const allStatuses = useMemo(() => Array.from(new Set(actions.map(a => a.status))), [actions])
  const allTypes = useMemo(() => Array.from(new Set(actions.map(a => a.type))), [actions])
  const allCenters = useMemo(() => Array.from(new Set(actions.map(a => a.center).filter(Boolean))) as string[], [actions]);

  const removeFilter = (filterSetState: React.Dispatch<React.SetStateAction<Set<any>>>, value: any) => {
    filterSetState(prev => {
        const newSet = new Set(prev);
        newSet.delete(value);
        return newSet;
    });
  };

  const clearAllFilters = () => {
    setStatusFilter(new Set());
    setTypeFilter(new Set());
    setCenterFilter(new Set());
    setSearchTerm("");
  }

  const activeFiltersCount = statusFilter.size + typeFilter.size + centerFilter.size + (searchTerm ? 1 : 0);


  const filteredAndSortedActions = useMemo(() => {
    let filtered = actions.filter(action => {
      const searchMatch =
        searchTerm === "" ||
        action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.actionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (action.responsibleUser && action.responsibleUser.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        action.responsibleGroupId.toLowerCase().includes(searchTerm.toLowerCase())

      const statusMatch = statusFilter.size === 0 || statusFilter.has(action.status)
      const typeMatch = typeFilter.size === 0 || typeFilter.has(action.type)
      const centerMatch = centerFilter.size === 0 || (action.center && centerFilter.has(action.center));

      return searchMatch && statusMatch && typeMatch && centerMatch
    })

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        if (sortConfig.key === 'responsible') {
            aValue = a.responsibleUser?.name || a.responsibleGroupId;
            bValue = b.responsibleUser?.name || b.responsibleGroupId;
        } else if (sortConfig.key === 'actionId') { 
            aValue = a['actionId'];
            bValue = b['actionId'];
        } else {
            aValue = a[sortConfig.key as keyof ImprovementAction];
            bValue = b[sortConfig.key as keyof ImprovementAction];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    return filtered
  }, [actions, searchTerm, statusFilter, typeFilter, centerFilter, sortConfig])

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
        return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' ? 
        <ArrowUpDown className="ml-2 h-4 w-4" /> : 
        <ArrowUpDown className="ml-2 h-4 w-4" />; 
  };

  const handleOpenAction = (e: React.MouseEvent, action: ImprovementAction) => {
      e.preventDefault();
      
      const actionLoader = async () => {
        const actionData = await getActionById(action.id);
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
          path: `/actions/${action.id}`,
          title: `Acción ${action.actionId}`,
          icon: GanttChartSquare,
          isClosable: true,
          loader: actionLoader
      });
  }


  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filtrar por título, ID o responsable..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Estado <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {allStatuses.map(status => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilter.has(status)}
                onCheckedChange={checked => {
                  setStatusFilter(prev => {
                    const newSet = new Set(prev)
                    if (checked) newSet.add(status)
                    else newSet.delete(status)
                    return newSet
                  })
                }}
              >
                {status}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Tipo <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {allTypes.map(type => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={typeFilter.has(type)}
                onCheckedChange={checked => {
                  setTypeFilter(prev => {
                    const newSet = new Set(prev)
                    if (checked) newSet.add(type)
                    else newSet.delete(type)
                    return newSet
                  })
                }}
              >
                {type}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Centro <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {allCenters.map(center => (
              <DropdownMenuCheckboxItem
                key={center}
                checked={centerFilter.has(center)}
                onCheckedChange={checked => {
                  setCenterFilter(prev => {
                    const newSet = new Set(prev)
                    if (checked) newSet.add(center)
                    else newSet.delete(center)
                    return newSet
                  })
                }}
              >
                {center}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

       {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium">Filtros activos:</span>
              <div className="flex flex-wrap gap-1">
                  {searchTerm && (
                     <Badge variant="secondary" className="pl-2 pr-1">
                        Texto: "{searchTerm}"
                        <button onClick={() => setSearchTerm('')} className="ml-1 rounded-full hover:bg-background/80 p-0.5"><X className="h-3 w-3"/></button>
                    </Badge>
                  )}
                  {[...statusFilter].map(value => (
                      <Badge key={value} variant="secondary" className="pl-2 pr-1">
                          Estado: {value}
                          <button onClick={() => removeFilter(setStatusFilter, value)} className="ml-1 rounded-full hover:bg-background/80 p-0.5"><X className="h-3 w-3"/></button>
                      </Badge>
                  ))}
                  {[...typeFilter].map(value => (
                      <Badge key={value} variant="secondary" className="pl-2 pr-1">
                          Tipo: {value}
                          <button onClick={() => removeFilter(setTypeFilter, value)} className="ml-1 rounded-full hover:bg-background/80 p-0.5"><X className="h-3 w-3"/></button>
                      </Badge>
                  ))}
                  {[...centerFilter].map(value => (
                      <Badge key={value} variant="secondary" className="pl-2 pr-1">
                          Centro: {value}
                          <button onClick={() => removeFilter(setCenterFilter, value)} className="ml-1 rounded-full hover:bg-background/80 p-0.5"><X className="h-3 w-3"/></button>
                      </Badge>
                  ))}
              </div>
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="ml-auto text-sm h-auto px-2 py-1">
                  <X className="mr-1 h-4 w-4" />
                  Limpiar filtros
              </Button>
          </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead><Button variant="ghost" onClick={() => requestSort('actionId')}>ID {getSortIcon('actionId')}</Button></TableHead>
              <TableHead><Button variant="ghost" onClick={() => requestSort('title')}>Título {getSortIcon('title')}</Button></TableHead>
              <TableHead><Button variant="ghost" onClick={() => requestSort('status')}>Estado {getSortIcon('status')}</Button></TableHead>
              <TableHead><Button variant="ghost" onClick={() => requestSort('type')}>Tipo {getSortIcon('type')}</Button></TableHead>
              <TableHead><Button variant="ghost" onClick={() => requestSort('responsible')}>Responsable {getSortIcon('responsible')}</Button></TableHead>
              <TableHead><Button variant="ghost" onClick={() => requestSort('implementationDueDate')}>Fecha Vencimiento {getSortIcon('implementationDueDate')}</Button></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedActions.length > 0 ? (
              filteredAndSortedActions.map(action => (
                <TableRow key={action.id}>
                   <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleToggleFollow(action.id, e)}
                        title={isFollowing(action.id) ? "Dejar de seguir la acción" : "Seguir acción"}
                      >
                        <Star className={cn("h-4 w-4", isFollowing(action.id) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                      </Button>
                    </TableCell>
                  <TableCell className="font-medium">
                     <Button variant="link" asChild className="p-0 h-auto">
                        <a href={`/actions/${action.id}`} onClick={(e) => handleOpenAction(e, action)}>{action.actionId}</a>
                    </Button>
                  </TableCell>
                  <TableCell>{action.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <ActionStatusIndicator status={action.status} isCompliant={action.closure?.isCompliant} />
                        <ActionStatusBadge status={action.status} isCompliant={action.closure?.isCompliant} />
                    </div>
                  </TableCell>
                  <TableCell>{action.type}</TableCell>
                  <TableCell>{action.responsibleUser?.name || action.responsibleGroupId}</TableCell>
                  <TableCell>{safeFormatDate(action.implementationDueDate)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
