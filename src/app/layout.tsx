"use client";

import "./globals.css"
import { Inter } from 'next/font/google'
import { AuthProvider, useAuth } from "@/hooks/use-auth"
import { Toaster } from "@/components/shell/ui/toaster"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { AppShell } from "@/components/shell/app-shell"
import { ActionStateProvider } from "@/hooks/use-action-state"
import { TabsProvider, useTabs } from "@/components/shell/hooks/use-tabs";
import { Home } from "lucide-react";

const inter = Inter({ subsets: ['latin'] })

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { activeTab, getTabContent } = useTabs();
  const router = useRouter();
  
  useEffect(() => {
    // We get the pathname from window.location because usePathname causes re-renders
    const currentPathname = window.location.pathname;
    if (!loading && !user && !currentPathname.includes('/login')) {
      router.push(`/login`);
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><span>Cargando...</span></div>;
  }
  
  const isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/login');

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }
  
  const contentToRender = activeTab ? getTabContent(activeTab) : children;
  
  return (
    <AppShell>
      {contentToRender}
    </AppShell>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
          <AuthProvider>
            <ActionStateProvider>
               <TabsProvider
                 initialTabs={[
                    {
                      path: '/dashboard',
                      title: 'Panel de Control',
                      icon: Home,
                      isClosable: false,
                    },
                ]}
               >
                <AppContent>
                    {children}
                </AppContent>
              </TabsProvider>
            </ActionStateProvider>
            <Toaster />
          </AuthProvider>
      </body>
    </html>
  )
}
