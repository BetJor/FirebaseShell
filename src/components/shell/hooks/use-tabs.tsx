
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, lazy, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Home } from 'lucide-react';

// Dynamic imports for page components
const DashboardPage = lazy(() => import('@/app/dashboard/page'));
const ActionsPage = lazy(() => import('@/app/actions/page'));
const NewActionPage = lazy(() => import('@/app/actions/new/page'));
const SettingsPage = lazy(() => import('@/app/settings/page'));
const AiSettingsPage = lazy(() => import('@/app/ai-settings/page'));
const MyGroupsPage = lazy(() => import('@/app/my-groups/page'));
const ActionDetailPage = lazy(() => import('@/app/actions/[id]/page'));
const UserManagementPage = lazy(() => import('@/app/user-management/page'));
const ReportsPage = lazy(() => import('@/app/reports/page'));
const FirestoreRulesPage = lazy(() => import('@/app/firestore-rules/page'));
const WorkflowPage = lazy(() => import('@/app/workflow/page'));


const pageComponentMapping: Record<string, React.ComponentType<any>> = {
  '/dashboard': DashboardPage,
  '/actions': ActionsPage,
  '/actions/new': NewActionPage,
  '/settings': SettingsPage,
  '/workflow': WorkflowPage,
  '/ai-settings': AiSettingsPage,
  '/reports': ReportsPage,
  '/my-groups': MyGroupsPage,
  '/user-management': UserManagementPage,
  '/firestore-rules': FirestoreRulesPage,
};

const getPageComponent = (path: string): React.ComponentType<any> | undefined => {
  const cleanPath = path.split('?')[0];
  if (pageComponentMapping[cleanPath]) {
    return pageComponentMapping[cleanPath];
  }
  if (cleanPath.startsWith('/actions/')) {
    return ActionDetailPage;
  }
  return undefined;
};


export interface Tab {
    id: string; 
    title: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    isClosable: boolean;
}

export type TabInput = Omit<Tab, 'id'> & { 
    loader?: () => Promise<ReactNode>;
};

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
    const { user } = useAuth();
    const [lastUser, setLastUser] = useState(user?.id);
    const router = useRouter();
    const pathname = usePathname();

    const setActiveTab = useCallback((tabId: string) => {
        console.log(`[TabsProvider] setActiveTab called for: ${tabId}`);
        setActiveTabState(tabId);
    }, []);

    useEffect(() => {
        if (activeTab) {
            const tab = tabs.find(t => t.id === activeTab);
            if (tab && tab.path !== pathname) {
                 // Do not navigate, let the link click handle it.
            }
        }
    }, [activeTab, tabs, pathname, router]);

    const openTab = useCallback((tabData: TabInput) => {
        const tabId = tabData.path;
        console.log(`[TabsProvider] openTab called for: ${tabId}`);

        setTabs(prevTabs => {
            const existingTab = prevTabs.find(t => t.id === tabId);
            if (existingTab) {
                console.log(`[TabsProvider] Tab ${tabId} already exists. Activating it.`);
                if (activeTab !== tabId) {
                    setActiveTab(tabId);
                }
                return prevTabs;
            }

            console.log(`[TabsProvider] Tab ${tabId} is new. Creating and loading content.`);
            const newTab: Tab = { ...tabData, id: tabId };
            
            setTabContents(prev => {
                if (tabData.loader) {
                    return { ...prev, [tabId]: <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>}>{React.createElement(lazy(tabData.loader as any))}</Suspense> };
                }
                const PageComponent = getPageComponent(tabData.path);
                if (PageComponent) {
                    return { ...prev, [tabId]: <PageComponent /> };
                }
                return { ...prev, [tabId]: <div>Página no encontrada</div> };
            });
            
            setActiveTab(newTab.id);
            return [...prevTabs, newTab];
        });
    }, [activeTab, setActiveTab]);

    const closeTab = useCallback((tabId: string) => {
        console.log(`[TabsProvider] closeTab called for: ${tabId}`);
        let nextActiveTabId: string | null = null;
        
        setTabs(prevTabs => {
            const index = prevTabs.findIndex(tab => tab.id === tabId);
            if (index === -1) return prevTabs;

            const newTabs = prevTabs.filter(t => t.id !== tabId);

            if (activeTab === tabId) {
                if (newTabs.length > 0) {
                    const newIndex = index === 0 ? 0 : index - 1;
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
        if (user && tabs.length === 0 && initialTabs) {
             console.log("[TabsProvider] Initializing tabs for new user session.");
            initialTabs.forEach(tab => openTab(tab));
            if(initialTabs.length > 0) {
                setActiveTabState(initialTabs[0].path);
            }
        }
    }, [user, initialTabs, openTab, tabs.length]);


    useEffect(() => {
        if (user?.id !== lastUser) {
            console.log("[TabsProvider] User changed. Resetting tabs.");
            setTabs([]);
            setTabContents({});
            setActiveTabState(null);
            setLastUser(user?.id);
        }
    }, [user, lastUser]);
    
    const getTabContent = useCallback((tabId: string) => {
        console.log(`[TabsProvider] getTabContent called for: ${tabId}. Content found: ${!!tabContents[tabId]}`);
        return (
            <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
                {tabContents[tabId] || children}
            </Suspense>
        );
    }, [tabContents, children]);

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
