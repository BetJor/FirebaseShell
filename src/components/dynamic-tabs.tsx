
"use client"

import { useTabs } from "@/hooks/use-tabs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export function DynamicTabs() {
  const { tabs, activeTab, setActiveTab, closeTab } = useTabs()

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation() 
    closeTab(tabId)
  }

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="border-b">
      <nav className="-mb-px flex space-x-1" aria-label="Tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "group inline-flex items-center py-2 px-3 border-b-2 font-medium text-sm cursor-pointer",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {tab.icon && <tab.icon className="mr-2 h-4 w-4" />}
            <span>{tab.title}</span>
            {tab.isClosable && (
              <button
                onClick={(e) => handleCloseTab(e, tab.id)}
                className="ml-2 p-0.5 rounded-full opacity-50 hover:opacity-100 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Tancar pestanya</span>
              </button>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}
