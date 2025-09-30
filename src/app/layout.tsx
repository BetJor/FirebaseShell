
"use client";

import "./globals.css"
import { Inter } from 'next/font/google'
import { AuthProvider, useAuth } from "@/hooks/use-auth"
import { UserProvider } from "@/hooks/use-user";
import { Toaster } from "@/components/shell/ui/toaster"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { AppShell } from "@/components/shell/app-shell"
import { TabsProvider, useTabs } from "@/components/shell/hooks/use-tabs";
import { Home } from "lucide-react";

const inter = Inter({ subsets: ['latin'] })

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { activeTab, getTabContent } = useTabs();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (!loading && !user && !pathname.includes('/login')) {
      router.push(`/login`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><span>Cargando...</span></div>;
  }
  
  const isLoginPage = pathname.includes('/login');

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
            <UserProvider>
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
              <Toaster />
            </UserProvider>
          </AuthProvider>
      </body>
    </html>
  )
}
