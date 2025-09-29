"use client";

import { Header } from "@/components/shell/header"
import { AppSidebar } from "@/components/shell/app-sidebar"
import { DynamicTabs } from "@/components/shell/dynamic-tabs"
import { SidebarProvider } from "@/components/shell/ui/sidebar"
import { TabsProvider } from "@/components/shell/hooks/use-tabs"
import { Home } from "lucide-react"

function MainLayout() {
    return (
        <div className="relative flex h-screen w-full flex-col">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <AppSidebar />
                <main className="flex-1 flex flex-col bg-background/60 overflow-y-auto p-4 sm:p-6">
                    <div className="mb-6">
                        <DynamicTabs />
                    </div>
                    <div className="flex-grow h-full">
                        <TabsProvider />
                    </div>
                </main>
            </div>
        </div>
    );
}

export function AppShell() {
    return (
        <SidebarProvider>
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
                <MainLayout />
            </TabsProvider>
        </SidebarProvider>
    )
}
