
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

import { Home } from 'lucide-react';

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

export function TabsProvider({ children }: { children: ReactNode }) {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTab, setActiveTabState] = useState<string | null>(null);
    const { user } = useAuth();
    const [lastUser, setLastUser] = useState(user?.id);
    const router = useRouter();
    const pathname = usePathname();

    const setActiveTab = useCallback((tabId: string) => {
        setActiveTabState(tabId);
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
            router.push(tab.path, { scroll: false });
        }
    }, [tabs, router]);

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
                 newTab = { ...tabData, id: tabId, content: children, isLoading: false };
            }
            
            setActiveTab(newTab.id);
            return [...prevTabs, newTab];
        });
    }, [activeTab, setActiveTab, children]);
    
     useEffect(() => {
        if (user && tabs.length === 0) {
            openTab({
                path: `/dashboard`,
                title: 'Panel de Control',
                icon: Home,
                isClosable: false,
                content: children
            });
        }
    }, [user, tabs.length, openTab, children]);


    useEffect(() => {
        if (user?.id !== lastUser) {
            setTabs([]);
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
                nextActiveTabId = null; // No more tabs
            }
        }
        
        setTabs(newTabs);

        if (nextActiveTabId) {
            setActiveTab(nextActiveTabId);
        } else if (newTabs.length === 0) {
            setActiveTabState(null);
            router.push('/dashboard');
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
    const displayedContent = activeTabData ? activeTabData.content : children;

    return (
        <TabsContext.Provider value={value}>
             {displayedContent}
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
