
"use client"

import { Button } from "@/components/ui/button"
import { FilePlus, Plus } from "lucide-react"
import { useTabs } from "@/components/shell/use-tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function FloatingActionButton() {
    const { openTab } = useTabs();

    const handleNewAction = () => {
        openTab({
            path: '/actions/new',
            title: 'Nueva Acción',
            icon: FilePlus,
            isClosable: true,
        });
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                        onClick={handleNewAction}
                        className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg"
                        size="icon"
                        >
                        <Plus style={{ width: '30px', height: '30px' }} />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>Crear Acción</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
