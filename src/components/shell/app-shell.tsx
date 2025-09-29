
"use client";

import { Header } from "@/components/shell/header"
import { AppSidebar } from "@/components/shell/app-sidebar"
import { DynamicTabs } from "@/components/shell/dynamic-tabs"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TabsProvider } from "@/components/shell/use-tabs"
import { ActionStateProvider } from "@/hooks/use-action-state"

function MainLayout({ children }: { children: React.ReactNode }) {
    
    return (
        <div className="relative flex h-screen w-full flex-col">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <AppSidebar />
                <main className="flex-1 flex flex-col bg-background/60 overflow-y-auto p-4 sm:p-6">
                    <div className="mb-6">
                        <DynamicTabs />
                    </div>
                    <div className="flex-grow">
                       {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

export function AppShell({ initialPath, children }: { initialPath: string, children: React.ReactNode }) {
    return (
        <ActionStateProvider>
            <SidebarProvider>
                <TabsProvider initialPath={initialPath}>
                    <MainLayout>
                        {children}
                    </MainLayout>
                </TabsProvider>
            </SidebarProvider>
        </ActionStateProvider>
    )
}
