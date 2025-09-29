

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

const pageComponentMapping: { [key: string]: React.ComponentType<any> | undefined } = {
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
  let cleanPath = path.split('?')[0];

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
    content: ReactNode;
    isLoading: boolean;
}

type TabInput = Omit<Tab, 'id' | 'content' | 'isLoading'> & { 
    content?: ReactNode;
    loader?: () => Promise<ReactNode>;
};

interface TabsContextType {
    tabs: Tab[];
    activeTab: string | null;
    openTab: (tabData: TabInput) => void;
    closeTab: (tabId: string) => void;
    closeCurrentTab: () => void;
    setActiveTab: (tabId: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function TabsProvider({ children, initialTabs }: { children: ReactNode, initialTabs: TabInput[] }) {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const { user } = useAuth();
    const [lastUser, setLastUser] = useState(user?.id);
    const router = useRouter();

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

            let newTab: Tab;
            if (tabData.loader) {
                newTab = { 
                    ...tabData, 
                    id: tabId, 
                    content: <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>, 
                    isLoading: true 
                };

                setTimeout(() => {
                    tabData.loader!().then(loadedContent => {
                        setTabs(currentTabs => currentTabs.map(t => 
                            t.id === tabId ? { ...t, content: loadedContent, isLoading: false } : t
                        ));
                    }).catch(error => {
                        console.error("Error loading tab content:", error);
                        setTabs(currentTabs => currentTabs.map(t => 
                            t.id === tabId ? { ...t, content: <div>Error loading content.</div>, isLoading: false } : t
                        ));
                    });
                }, 500);

            } else {
                const PageComponent = getPageComponent(tabData.path);
                if (!PageComponent) {
                    console.error(`No page component found for path: ${tabData.path}`);
                    newTab = { ...tabData, id: tabId, content: <div>Not Found</div>, isLoading: false };
                } else {
                     newTab = { ...tabData, id: tabId, content: <PageComponent />, isLoading: false };
                }
            }
            
            setActiveTab(newTab.id);
            return [...prevTabs, newTab];
        });
    }, [activeTab, setActiveTab]);
    
     useEffect(() => {
        if (user && tabs.length === 0 && initialTabs) {
            initialTabs.forEach(tab => openTab(tab));
            if(initialTabs.length > 0) {
                setActiveTab(initialTabs[0].path);
            }
        }
    }, [user, tabs.length, openTab, initialTabs]);


    useEffect(() => {
        if (user?.id !== lastUser) {
            setTabs([]);
            setActiveTab(null);
            setLastUser(user?.id);
        }
    }, [user, lastUser]);
    
    const closeTab = (tabId: string) => {
        let nextActiveTabId: string | null = null;
        
        const index = tabs.findIndex(tab => tab.id === tabId);
        if (index === -1) return;
        
        const newTabs = tabs.filter(t => t.id !== tabId);

        if (activeTab === tabId) {
            if (newTabs.length > 0) {
                const newIndex = index === 0 ? 0 : index - 1;
                nextActiveTabId = newTabs[newIndex].id;
            } else {
                nextActiveTabId = null; // No more tabs
            }
        }
        
        setTabs(newTabs);

        if (nextActiveTabId) {
            setActiveTab(nextActiveTabId);
        } else if (newTabs.length === 0 && initialTabs.length > 0) {
            // Re-open default tab if all are closed
            openTab(initialTabs[0]);
        }
    };

    const closeCurrentTab = () => {
        if (activeTab) {
            closeTab(activeTab);
        }
    }

    const value = {
        tabs,
        activeTab,
        openTab,
        closeTab,
        closeCurrentTab,
        setActiveTab,
    };
    
    const activeTabData = tabs.find(tab => tab.id === activeTab);

    return (
        <TabsContext.Provider value={value}>
             {tabs.map(tab => (
                <div key={tab.id} style={{ display: tab.id === activeTab ? 'block' : 'none' }} className="h-full">
                    {tab.content}
                </div>
            ))}
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
