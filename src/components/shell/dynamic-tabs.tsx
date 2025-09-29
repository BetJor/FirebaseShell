
"use client"

import { useTabs } from "@/components/shell/hooks/use-tabs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export function DynamicTabs() {
  const { tabs, activeTab, setActiveTab, closeTab } = useTabs()

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  }

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  if (tabs.length === 0) {
    return null
  }

  return (
    <div className="border-b">
      <nav className="-mb-px flex space-x-1" aria-label="Tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              "group inline-flex items-center border-b-2 font-medium text-sm cursor-pointer",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <div
              className="flex items-center py-2 px-3"
            >
              {tab.icon && <tab.icon className="mr-2 h-4 w-4" />}
              <span>{tab.title}</span>
            </div>
            
            {tab.isClosable && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleCloseTab(e, tab.id)}
                className="ml-0 mr-1 p-0.5 rounded-full opacity-50 hover:opacity-100 hover:bg-muted-foreground/20 h-4 w-4"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Tancar pestanya</span>
              </Button>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}
