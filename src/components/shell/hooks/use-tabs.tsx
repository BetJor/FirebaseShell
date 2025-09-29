"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import DashboardPage from '@/app/dashboard/page';
import ActionsPage from '@/app/actions/page';
import NewActionPage from '@/app/actions/new/page';
import SettingsPage from '@/app/settings/page';
import AiSettingsPage from '@/app/ai-settings/page';
import MyGroupsPage from '@/app/my-groups/page';
import ActionDetailPage from '@/app/actions/[id]/page';
import UserManagementPage from '@/app/user-management/page';
import ReportsPage from '@/app/reports/page';
import FirestoreRulesPage from '@/app/firestore-rules/page';
import WorkflowPage from '@/app/workflow/page';

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
        const tab = tabs.find(t => t.id === tabId);
        if (tab && tab.path !== pathname) {
            console.log(`[TabsProvider] Navigating to ${tab.path}`);
            router.push(tab.path);
        }
        setActiveTabState(tabId);
    }, [tabs, router, pathname]);

    const loadContent = useCallback((tabId: string, tabData: TabInput) => {
        setTabContents(prev => ({
            ...prev,
            [tabId]: <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>
        }));

        if (tabData.loader) {
            tabData.loader().then(content => {
                setTabContents(prev => ({ ...prev, [tabId]: content }));
            }).catch(error => {
                console.error(`Error loading content for tab ${tabId}:`, error);
                setTabContents(prev => ({ ...prev, [tabId]: <div>Error al cargar el contenido.</div> }));
            });
        } else {
            const PageComponent = getPageComponent(tabData.path);
            if (PageComponent) {
                setTabContents(prev => ({...prev, [tabId]: <PageComponent /> }));
            } else {
                setTabContents(prev => ({...prev, [tabId]: <div>Página no encontrada</div> }));
            }
        }
    }, []);

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
            loadContent(tabId, tabData);
            
            setActiveTab(newTab.id);
            return [...prevTabs, newTab];
        });
    }, [activeTab, setActiveTab, loadContent]);

    useEffect(() => {
        if (user && tabs.length === 0 && initialTabs) {
             console.log("[TabsProvider] Initializing tabs for new user session.");
            initialTabs.forEach(tab => openTab(tab));
            if(initialTabs.length > 0) {
                setActiveTabState(initialTabs[0].path);
            }
        }
    }, [user, tabs.length, openTab, initialTabs]);


    useEffect(() => {
        if (user?.id !== lastUser) {
            console.log("[TabsProvider] User changed. Resetting tabs.");
            setTabs([]);
            setTabContents({});
            setActiveTabState(null);
            setLastUser(user?.id);
        }
    }, [user, lastUser]);
    
    const closeTab = (tabId: string) => {
        console.log(`[TabsProvider] closeTab called for: ${tabId}`);
        let nextActiveTabId: string | null = null;
        
        const index = tabs.findIndex(tab => tab.id === tabId);
        if (index === -1) return;
        
        const newTabs = tabs.filter(t => t.id !== tabId);

        if (activeTab === tabId) {
            if (newTabs.length > 0) {
                const newIndex = index === 0 ? 0 : index - 1;
                nextActiveTabId = newTabs[newIndex].id;
            }
        }
        
        setTabs(newTabs);
        setTabContents(prev => {
            const newContents = { ...prev };
            delete newContents[tabId];
            return newContents;
        });

        if (nextActiveTabId) {
            setActiveTab(nextActiveTabId);
        } else if (newTabs.length === 0 && initialTabs.length > 0) {
            openTab(initialTabs[0]);
        }
    };

    const closeCurrentTab = () => {
        if (activeTab) {
            closeTab(activeTab);
        }
    }

    const getTabContent = (tabId: string) => {
        console.log(`[TabsProvider] getTabContent called for: ${tabId}. Content found: ${!!tabContents[tabId]}`);
        return tabContents[tabId] || children;
    }

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
