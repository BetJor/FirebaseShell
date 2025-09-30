"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, lazy, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, Home, Settings, Package, Users, UsersRound } from 'lucide-react';
import { useUser } from '@/hooks/use-user';

// Lazy load page components
const DashboardPage = lazy(() => import('@/app/dashboard/page'));
const SettingsPage = lazy(() => import('@/app/settings/page'));
const UserManagementPage = lazy(() => import('@/app/user-management/page'));
const GroupManagementPage = lazy(() => import('@/app/group-management/page'));
const Option1Page = lazy(() => import('@/app/option1/page'));
const Option2Page = lazy(() => import('@/app/option2/page'));
const MyGroupsPage = lazy(() => import('@/app/my-groups/page'));

// Map paths to their components and metadata
const pageComponentMapping: Record<string, { component: React.ComponentType<any>, title: string, icon: React.ElementType, isClosable: boolean }> = {
  '/dashboard': { component: DashboardPage, title: 'Panel de Control', icon: Home, isClosable: false },
  '/settings': { component: SettingsPage, title: 'Configuración', icon: Settings, isClosable: true },
  '/user-management': { component: UserManagementPage, title: 'Gestión de Usuarios', icon: Users, isClosable: true },
  '/group-management': { component: GroupManagementPage, title: 'Gestión de Grupos', icon: UsersRound, isClosable: true },
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
    const router = useRouter();
    const pathname = usePathname();
    const [lastUserId, setLastUserId] = useState<string | undefined>(undefined);

    useEffect(() => {
        // Reset tabs when user changes
        if (user?.id !== lastUserId) {
            setLastUserId(user?.id);
            setTabs([]);
            setTabContents({});
            // Let the next effect handle the initial tab
        }
    }, [user, lastUserId]);

    useEffect(() => {
      if (userLoading) return;

      if (!pathname || pathname === '/') {
        router.replace('/dashboard');
        return;
      }
      
      const pageInfo = getPageComponentInfo(pathname);
      const existingTab = tabs.find(t => t.path === pathname);
      
      if (existingTab) {
          if (activeTab !== pathname) {
              setActiveTabState(pathname);
          }
      } else {
          if (pageInfo) {
              const newTab: Tab = {
                  id: pathname,
                  path: pathname,
                  title: pageInfo.title,
                  icon: pageInfo.icon,
                  isClosable: pageInfo.isClosable,
              };
              
              setTabs(prevTabs => [...prevTabs, newTab]);
              
              setTabContents(prevContents => {
                  const PageComponent = pageInfo.component;
                  return {
                      ...prevContents,
                      [pathname]: PageComponent ? <PageComponent /> : <div>Component not found</div>
                  };
              });

              setActiveTabState(pathname);
          }
      }
    }, [pathname, user, userLoading, tabs, activeTab, router]);
    
    
    const openTab = useCallback((tabData: TabInput) => {
        const tabId = tabData.path;
        if (pathname !== tabId) {
            router.push(tabId);
        }
    }, [pathname, router]);

    const setActiveTab = useCallback((tabId: string) => {
        const tab = tabs.find(t => t.id === tabId);
        if (tab && tab.path !== pathname) {
            router.push(tab.path);
        }
    }, [tabs, pathname, router]);

    const closeTab = useCallback((tabId: string) => {
        const index = tabs.findIndex(tab => tab.id === tabId);
        if (index === -1) return;

        // Remove the tab and its content
        setTabs(prevTabs => prevTabs.filter(t => t.id !== tabId));
        setTabContents(prev => {
            const newContents = { ...prev };
            delete newContents[tabId];
            return newContents;
        });

        // If the closed tab was the active one, decide which one to activate next
        if (activeTab === tabId) {
            const newTabs = tabs.filter(t => t.id !== tabId);
            if (newTabs.length > 0) {
                const nextActiveTab = newTabs[Math.max(0, index - 1)];
                router.push(nextActiveTab.path);
            } else {
                router.push('/dashboard');
            }
        }
    }, [tabs, activeTab, router]);

    const closeCurrentTab = useCallback(() => {
        if (activeTab) {
            closeTab(activeTab);
        }
    }, [activeTab, closeTab]);

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
