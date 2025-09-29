

"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { Home, ListChecks, Settings, Sparkles, Library, GanttChartSquare, Users, BarChart3, TestTubeDiagonal, FileLock2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/components/shell/ui/sidebar"
import { useTabs } from "@/components/shell/hooks/use-tabs"


function SidebarNavLink({ href, icon: Icon, label, isTab }: { href: string; icon: React.ElementType; label: string, isTab: boolean }) {
  const { openTab, setActiveTab, tabs, activeTab } = useTabs();
  const isActive = tabs.some(t => t.path === href && t.id === activeTab);

  const handleClick = (e: React.MouseEvent) => {
    if (isTab) {
      e.preventDefault();
      openTab({
        path: href,
        title: label,
        icon: Icon,
        isClosable: true,
      });
    }
  };

  return (
    <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive} onClick={handleClick}>
            <Link href={href}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
            </Link>
        </SidebarMenuButton>
    </SidebarMenuItem>
  );
}


export function AppSidebar() {
  const { user, isAdmin } = useAuth(); 
  const { state } = useSidebar();
  
  if (!user) return null;

  const mainNavItems = [
    { href: `/dashboard`, icon: Home, label: "Panel de Control", isTab: true },
    { href: `/actions`, icon: ListChecks, label: "Acciones", isTab: true },
    { href: `/reports`, icon: BarChart3, label: "Informes", isTab: true },
  ]
  
  const adminSettingsNavItems = [
    { href: `/settings`, icon: Settings, label: "Configuración", isTab: true },
    { href: `/workflow`, icon: GanttChartSquare, label: "Workflow", isTab: true },
    { href: `/firestore-rules`, icon: FileLock2, label: "Reglas de Firestore", isTab: true },
    { href: `/ai-settings`, icon: Sparkles, label: "Configuración IA", isTab: true },    
    { href: `/user-management`, icon: Users, label: "Gestión de Usuarios", isTab: true },
  ]


  return (
    <Sidebar>
        <SidebarContent className="pt-7">
            <SidebarMenu>
                {mainNavItems.map((item) => (
                    <SidebarNavLink key={item.href} {...item} />
                ))}
            </SidebarMenu>
            
            {isAdmin && (
                <>
                    <div className="my-4 border-t border-border -mx-2"></div>
                    <SidebarMenu>
                        {adminSettingsNavItems.map((item) => (
                            <SidebarNavLink key={item.href} {...item} />
                        ))}
                    </SidebarMenu>
                </>
            )}

        </SidebarContent>
    </Sidebar>
  )
}
