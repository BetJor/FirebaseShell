"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

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

const pageLoaders: Record<string, () => Promise<ReactNode>> = {};

export function TabsProvider({ children, initialTabs }: { children: ReactNode, initialTabs: TabInput[] }) {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTab, setActiveTabState] = useState<string | null>(null);
    const [tabContents, setTabContents] = useState<Record<string, ReactNode>>({});
    const { user } = useAuth();
    const [lastUser, setLastUser] = useState(user?.id);
    const router = useRouter();
    const pathname = usePathname();

    const setActiveTab = useCallback((tabId: string) => {
        const tab = tabs.find(t => t.id === tabId);
        if (tab && tab.path !== pathname) {
            router.push(tab.path);
        }
        setActiveTabState(tabId);
    }, [tabs, router, pathname]);

    const loadContent = useCallback((tabId: string, loader: () => Promise<ReactNode>) => {
        setTabContents(prev => ({
            ...prev,
            [tabId]: <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>
        }));

        setTimeout(() => {
             loader().then(content => {
                setTabContents(prev => ({ ...prev, [tabId]: content }));
            }).catch(error => {
                console.error(`Error loading content for tab ${tabId}:`, error);
                setTabContents(prev => ({ ...prev, [tabId]: <div>Error al cargar el contenido.</div> }));
            });
        }, 300); // Small delay for UX
    }, []);

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
            
            if (tabData.loader) {
                pageLoaders[tabId] = tabData.loader;
                loadContent(tabId, tabData.loader);
            }
            
            setActiveTab(newTab.id);
            return [...prevTabs, newTab];
        });
    }, [activeTab, setActiveTab, loadContent]);

    useEffect(() => {
      const currentTab = tabs.find(t => t.path === pathname);
      if (currentTab) {
        if(activeTab !== currentTab.id) {
          setActiveTabState(currentTab.id);
        }
      } else {
        // This case can happen if the user navigates directly via URL
        // A more robust solution would be to match dynamic routes here
      }
    }, [pathname, tabs, activeTab]);
    
    useEffect(() => {
        if (user && tabs.length === 0 && initialTabs) {
            initialTabs.forEach(tab => openTab(tab));
            if(initialTabs.length > 0) {
                setActiveTab(initialTabs[0].path);
            }
        }
    }, [user, tabs.length, openTab, initialTabs, setActiveTab]);


    useEffect(() => {
        if (user?.id !== lastUser) {
            setTabs([]);
            setTabContents({});
            setActiveTabState(null);
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
                nextActiveTabId = null;
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
        return tabContents[tabId] || children; // Fallback to children for initial render
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
            {activeTab ? (
                <div style={{ display: 'block' }} className="h-full">
                    {getTabContent(activeTab)}
                </div>
            ) : children}
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
