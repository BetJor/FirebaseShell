
"use client"

import { usePathname } from "next/navigation"
import { Home, Settings, Package, Sparkles } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/components/shell/ui/sidebar"
import { useTabs } from "@/components/shell/hooks/use-tabs"

// Definició de les entrades del menú principal
const mainNavItems = [
  { href: `/dashboard`, icon: Home, label: "Dashboard" },
  { href: `/option1`, icon: Package, label: "Opció 1" },
  { href: `/option2`, icon: Package, label: "Opció 2" },
];

// Definició de les entrades del menú de configuració per a administradors
const adminSettingsNavItems = [
  { href: `/settings`, icon: Settings, label: "Configuració" },
  { href: `/ai-settings`, icon: Sparkles, label: "Configuració IA" },
];


function SidebarNavLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const { openTab } = useTabs();
  const pathname = usePathname();
  const isActive = pathname === href;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    openTab({
      path: href,
      title: label,
      icon: Icon,
      isClosable: true,
    });
  };

  return (
    <SidebarMenuItem>
      <a href={href} onClick={handleClick}>
        <SidebarMenuButton asChild isActive={isActive}>
          <div>
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </div>
        </SidebarMenuButton>
      </a>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { user, isAdmin } = useUser();
  const { state } = useSidebar();

  if (!user) return null;

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
