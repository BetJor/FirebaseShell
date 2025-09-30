"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, lazy, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/use-user';

// Dynamic imports for page components
const DashboardPage = lazy(() => import('@/app/dashboard/page'));
const SettingsPage = lazy(() => import('@/app/settings/page'));
const UserManagementPage = lazy(() => import('@/app/user-management/page'));
const Option1Page = lazy(() => import('@/app/option1/page'));
const Option2Page = lazy(() => import('@/app/option2/page'));
const MyGroupsPage = lazy(() => import('@/app/my-groups/page'));


const pageComponentMapping: Record<string, React.ComponentType<any>> = {
  '/dashboard': DashboardPage,
  '/settings': SettingsPage,
  '/user-management': UserManagementPage,
  '/option1': Option1Page,
  '/option2': Option2Page,
  '/my-groups': MyGroupsPage,
};

const getPageComponent = (path: string): React.ComponentType<any> | undefined => {
  const cleanPath = path.split('?')[0];
  if (pageComponentMapping[cleanPath]) {
    return pageComponentMapping[cleanPath];
  }
  // Check for dynamic routes if any in the future
  return undefined;
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

export function TabsProvider({ children, initialTabs }: { children: ReactNode, initialTabs: TabInput[] }) {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTab, setActiveTabState] = useState<string | null>(null);
    const [tabContents, setTabContents] = useState<Record<string, ReactNode>>({});
    const { user, loading: userLoading } = useUser();
    const [lastUserId, setLastUserId] = useState<string | undefined | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    const setActiveTab = useCallback((tabId: string) => {
        const tab = tabs.find(t => t.id === tabId);
        if (tab && tab.path !== pathname) {
            router.push(tab.path, { scroll: false });
        }
        setActiveTabState(tabId);
    }, [tabs, pathname, router]);

    useEffect(() => {
        const tabForPath = tabs.find(t => t.path === pathname);
        if (tabForPath && activeTab !== tabForPath.id) {
            setActiveTabState(tabForPath.id);
        }
    }, [pathname, tabs, activeTab]);

    const openTab = useCallback((tabData: TabInput) => {
        const tabId = tabData.path;

        setTabs(prevTabs => {
            const existingTab = prevTabs.find(t => t.id === tabId);
            if (existingTab) {
                if (activeTab !== tabId) {
                    setActiveTab(tabId);
                }
                return prevTabs;
            }

            const newTab: Tab = { ...tabData, id: tabId };
            
            setTabContents(prev => {
                if (prev[tabId]) return prev;

                const PageComponent = getPageComponent(tabData.path);
                if (PageComponent) {
                    return { ...prev, [tabId]: <PageComponent /> };
                }
                console.error(`[TabsProvider] No page component found for path: ${tabData.path}`);
                return { ...prev, [tabId]: <div>Página no encontrada</div> };
            });
            
            setActiveTab(newTab.id);
            return [...prevTabs, newTab];
        });
    }, [activeTab, setActiveTab]);

    const closeTab = useCallback((tabId: string) => {
        let nextActiveTabId: string | null = null;
        
        setTabs(prevTabs => {
            const index = prevTabs.findIndex(tab => tab.id === tabId);
            if (index === -1) return prevTabs;

            const newTabs = prevTabs.filter(t => t.id !== tabId);

            if (activeTab === tabId) {
                if (newTabs.length > 0) {
                    const newIndex = Math.max(0, index - 1);
                    nextActiveTabId = newTabs[newIndex].id;
                }
            }
            return newTabs;
        });

        setTabContents(prev => {
            const newContents = { ...prev };
            delete newContents[tabId];
            return newContents;
        });

        if (nextActiveTabId) {
            setActiveTab(nextActiveTabId);
        } else if (tabs.length - 1 === 0 && initialTabs.length > 0) {
            openTab(initialTabs[0]);
        }
    }, [tabs, activeTab, initialTabs, setActiveTab, openTab]);


    const closeCurrentTab = useCallback(() => {
        if (activeTab) {
            closeTab(activeTab);
        }
    }, [activeTab, closeTab]);

    useEffect(() => {
        if (user?.id !== lastUserId) {
            setTabs([]);
            setTabContents({});
            setActiveTabState(null);
            setLastUserId(user?.id);
        } else if (tabs.length === 0 && user && !userLoading && lastUserId === user.id) {
             if (initialTabs.length > 0) {
                // Check if the current path is already a valid tab to avoid forcing a redirect
                const tabForPath = initialTabs.find(t => t.path === pathname) || initialTabs[0];
                openTab(tabForPath);
            }
        }
    }, [user?.id, lastUserId, initialTabs, openTab, tabs.length, user, userLoading, pathname]);
    
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
