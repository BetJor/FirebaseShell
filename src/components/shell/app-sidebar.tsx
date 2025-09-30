
"use client"

import { usePathname } from "next/navigation"
import { Home, Settings, Package, Users } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/components/shell/ui/sidebar"
import { useTabs } from "@/components/shell/hooks/use-tabs"
import { useTranslations } from "@/hooks/use-translations";


function SidebarNavLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const { openTab, activeTab } = useTabs();
  const isActive = activeTab === href;

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
  const t = useTranslations("Common");

  if (!user) return null;
  
  const mainNavItems = [
    { href: `/dashboard`, icon: Home, label: t('AppSidebar.dashboard') },
    { href: `/option1`, icon: Package, label: t('AppSidebar.option1') },
    { href: `/option2`, icon: Package, label: t('AppSidebar.option2') },
  ];

  const adminSettingsNavItems = [
    { href: `/settings`, icon: Settings, label: t('AppSidebar.settings') },
    { href: `/user-management`, icon: Users, label: t('AppSidebar.userManagement') },
  ];


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
