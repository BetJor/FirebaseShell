"use client"

import { Home, Settings, Package, Users } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/shell/ui/sidebar"
import { useTabs, getPageComponentInfo } from "@/components/shell/hooks/use-tabs"
import { useTranslations } from "@/hooks/use-translations";
import Link from "next/link"
import { usePathname } from "next/navigation"

function SidebarNavLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <SidebarMenuItem>
      <Link href={href}>
        <SidebarMenuButton asChild isActive={isActive}>
            <span>
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </span>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { user, isAdmin } = useUser();
  const t = useTranslations("Common");

  if (!user) return null;
  
  const mainNavItems = [
    { href: `/dashboard`, icon: Home, label: t('AppSidebar.dashboard') },
    { href: `/option1`, icon: Package, label: 'Opció 1' },
    { href: `/option2`, icon: Package, label: 'Opció 2' },
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
