
"use client";

import "./globals.css"
import { Inter } from 'next/font/google'
import { AuthProvider, useAuth } from "@/hooks/use-auth"
import { Toaster } from "@/components/ui/toaster"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { AppShell } from "@/components/shell/app-shell"

const inter = Inter({ subsets: ['latin'] })

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user && !pathname.includes('/login')) {
      router.push(`/login`);
    }
  }, [user, loading, pathname, router]);

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
  
  return (
    <AppShell initialPath={pathname}>
        {children}
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
            <AppContent>
              {children}
            </AppContent>
            <Toaster />
          </AuthProvider>
      </body>
    </html>
  )
}
