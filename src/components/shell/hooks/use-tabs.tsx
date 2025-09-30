"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, lazy, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, Home, Settings, Package, Users } from 'lucide-react';
import { useUser } from '@/hooks/use-user';

// Lazy load page components
const DashboardPage = lazy(() => import('@/app/dashboard/page'));
const SettingsPage = lazy(() => import('@/app/settings/page'));
const UserManagementPage = lazy(() => import('@/app/user-management/page'));
const Option1Page = lazy(() => import('@/app/option1/page'));
const Option2Page = lazy(() => import('@/app/option2/page'));
const MyGroupsPage = lazy(() => import('@/app/my-groups/page'));

// Map paths to their components and metadata
const pageComponentMapping: Record<string, { component: React.ComponentType<any>, title: string, icon: React.ElementType, isClosable: boolean }> = {
  '/dashboard': { component: DashboardPage, title: 'Panel de Control', icon: Home, isClosable: false },
  '/settings': { component: SettingsPage, title: 'Configuración', icon: Settings, isClosable: true },
  '/user-management': { component: UserManagementPage, title: 'Gestión de Usuarios', icon: Users, isClosable: true },
  '/option1': { component: Option1Page, title: 'Opción 1', icon: Package, isClosable: true },
  '/option2': { component: Option2Page, title: 'Opción 2', icon: Package, isClosable: true },
  '/my-groups': { component: MyGroupsPage, title: 'Mis Grupos', icon: Users, isClosable: true },
};

export const getPageComponentInfo = (path: string) => {
  const cleanPath = path.split('?')[0];
  return pageComponentMapping[cleanPath];
};

export interface Tab {
    id: string; 
    title: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    isClosable: boolean;
}

export type TabInput = Omit<Tab, 'id'>;

interface TabsContextType {
    tabs: Tab[];
    activeTab: string | null;
    openTab: (tabData: TabInput) => void;
    closeTab: (tabId: string) => void;
    closeCurrentTab: () => void;
    setActiveTab: (tabId: string) => void;
    getTabContent: (tabId: string) => ReactNode;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function TabsProvider({ children, initialTabs: initialTabInputs }: { children: ReactNode, initialTabs: TabInput[] }) {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTab, setActiveTabState] = useState<string | null>(null);
    const [tabContents, setTabContents] = useState<Record<string, ReactNode>>({});
    const { user, loading: userLoading } = useUser();
    const [lastUserId, setLastUserId] = useState<string | null | undefined>(null);
    const router = useRouter();
    const pathname = usePathname();

    const setActiveTab = useCallback((tabId: string) => {
        const tab = tabs.find(t => t.id === tabId);
        if (tab && tab.id !== activeTab) {
             setActiveTabState(tabId);
        }
    }, [tabs, activeTab]);

    const openTab = useCallback((tabData: TabInput) => {
        const tabId = tabData.path;
        
        setTabs(prevTabs => {
            if (prevTabs.find(t => t.id === tabId)) {
                setActiveTab(tabId);
                return prevTabs; // Tab already exists
            }
            const newTab: Tab = { ...tabData, id: tabId };
            
            setTabContents(prevContents => {
                if (prevContents[tabId]) return prevContents;
                const PageComponent = getPageComponentInfo(newTab.path)?.component;
                return {
                    ...prevContents,
                    [tabId]: PageComponent ? <PageComponent /> : <div>Component not found</div>
                };
            });
            setActiveTab(newTab.id);
            return [...prevTabs, newTab];
        });
    }, [setActiveTab]);

    const closeTab = useCallback((tabId: string) => {
        let nextActiveTabPath: string | null = null;
        
        setTabs(prevTabs => {
            const index = prevTabs.findIndex(tab => tab.id === tabId);
            if (index === -1) return prevTabs;

            const newTabs = prevTabs.filter(t => t.id !== tabId);

            if (activeTab === tabId && newTabs.length > 0) {
                const newIndex = Math.max(0, index - 1);
                nextActiveTabPath = newTabs[newIndex].path;
            } else if (newTabs.length === 0) {
                nextActiveTabPath = '/dashboard';
            }
            return newTabs;
        });

        setTabContents(prev => {
            const newContents = { ...prev };
            delete newContents[tabId];
            return newContents;
        });
    }, [activeTab]);

    const closeCurrentTab = useCallback(() => {
        if (activeTab) {
            closeTab(activeTab);
        }
    }, [activeTab, closeTab]);

    // Effect to sync URL with tabs state
    useEffect(() => {
        const pageInfo = getPageComponentInfo(pathname);
        if (pageInfo) {
            const existingTab = tabs.find(t => t.path === pathname);
            if (!existingTab) {
                openTab({
                    path: pathname,
                    title: pageInfo.title,
                    icon: pageInfo.icon,
                    isClosable: pageInfo.isClosable,
                });
            }
            if (activeTab !== pathname) {
                setActiveTabState(pathname);
            }
        }
    }, [pathname, tabs, openTab, activeTab]);

    // Effect for user session changes and initial load
    useEffect(() => {
        if (userLoading) return; // Wait until user loading is complete

        if (user?.id !== lastUserId) {
            setLastUserId(user?.id);
            // Don't reset here, let the path dictate the state
        }
    }, [user, lastUserId, userLoading]);

    useEffect(() => {
        if (activeTab && pathname !== activeTab) {
            router.push(activeTab);
        }
    }, [activeTab, pathname, router]);
    
    const getTabContent = useCallback((tabId: string) => {
        return (
            <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
                {tabContents[tabId] || null}
            </Suspense>
        );
    }, [tabContents]);

    const value = {
        tabs,
        activeTab,
        openTab,
        closeTab,
        closeCurrentTab,
        setActiveTab,
        getTabContent,
    };

    return (
        <TabsContext.Provider value={value}>
            {children}
        </TabsContext.Provider>
    );
}

export function useTabs() {
    const context = useContext(TabsContext);
    if (context === undefined) {
        throw new Error('useTabs must be used within a TabsProvider');
    }
    return context;
}
