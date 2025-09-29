
"use client"
import { CircleUser, Menu, Users, Bell, Home, ListChecks, GanttChartSquare, Settings, Route, Sparkles, Library, LogIn, LogOut, FileLock2 } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LanguageSwitcher } from "@/components/shell/language-switcher"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { usePathname } from "next/navigation"
import React from "react"
import { SidebarTrigger } from "@/components/shell/ui/sidebar"
import { useTabs } from "@/components/shell/use-tabs"


const pageConfig: { [key: string]: { icon: React.ElementType, titleKey: string } } = {
  '/dashboard': { icon: Home, titleKey: 'dashboard' },
  '/actions': { icon: ListChecks, titleKey: 'actions' },
  '/actions/new': { icon: ListChecks, titleKey: 'actions' },
  '/actions/[id]': { icon: ListChecks, titleKey: 'actions' },
  '/my-groups': { icon: Users, titleKey: 'myGroups' },
  '/settings': { icon: Settings, titleKey: 'settings' },
  '/ai-settings': { icon: Sparkles, titleKey: 'aiSettings' },
  '/prompt-gallery': { icon: Library, titleKey: 'promptGallery' },
  '/roadmap': { icon: Route, titleKey: 'roadmap' },
  '/firestore-rules': { icon: FileLock2, titleKey: 'firestoreRules' },
};


export function Header() {
  const { user, logout, isImpersonating, stopImpersonating } = useAuth();
  const { tabs, activeTab, openTab } = useTabs();
  const pathname = usePathname();
  
  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const Icon = activeTabData?.icon || GanttChartSquare;
  const title = activeTabData?.title || "Acciones de Mejora";


  return (
    <header className="sticky top-0 z-30 flex h-auto flex-col">
       {isImpersonating && (
        <div className="bg-yellow-500 text-black p-2 text-center text-sm flex items-center justify-center gap-4">
          <span>Estás suplantando a <strong>{user?.name}</strong>.</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={stopImpersonating}
            className="h-auto px-2 py-1 text-black hover:bg-yellow-600 hover:text-black"
          >
            <LogOut className="mr-1 h-4 w-4" />
            Detener la suplantación
          </Button>
        </div>
      )}
      <div className="flex h-14 items-center justify-between gap-4 border-b bg-primary px-4 text-primary-foreground sm:px-6">
        <div className="flex items-center gap-4">
            <SidebarTrigger className="text-primary-foreground hover:text-primary-foreground/90" />
            <div className="flex items-center gap-2">
                <GanttChartSquare className="h-7 w-7" />
                <span className="text-lg font-semibold">Acciones de Mejora</span>
            </div>
        </div>


        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full text-primary-foreground hover:text-primary-foreground/90">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Activar/desactivar notificaciones</span>
            </Button>
            
            <Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 relative h-8 rounded-full text-primary-foreground hover:text-primary-foreground/90">
                      <Avatar className="h-8 w-8">
                        {user?.avatar && <AvatarImage src={user.avatar} alt={user.name || 'User'} />}
                        <AvatarFallback>
                          {user?.name ? user.name.charAt(0).toUpperCase() : <CircleUser className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>
                      {user && <span className="text-sm font-medium hidden md:inline-block">{user.name}</span>}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{user ? user.name : "Mi Cuenta"}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => openTab({path: '/my-groups', title: 'Mis Grupos', icon: Users, isClosable: true})}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Mis Grupos</span>
                    </DropdownMenuItem>
                    <DialogTrigger asChild>
                      <DropdownMenuItem>Configuración</DropdownMenuItem>
                    </DialogTrigger>
                    <DropdownMenuItem>Soporte</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>Cerrar Sesión</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configuración</DialogTitle>
                    <DialogDescription>
                      Gestiona la configuración de tu cuenta y las preferencias de la aplicación.
                    </DialogDescription>
                  </DialogHeader>
                  <LanguageSwitcher />
                </DialogContent>
            </Dialog>
        </div>
      </div>
    </header>
  )
}
