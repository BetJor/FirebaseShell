
"use client"

import type { ImprovementAction } from "@/lib/types"
import { AttachmentsSection } from "./action-details/attachments-section"
import { CommentsSection } from "./action-details/comments-section"
import { DetailsSection } from "./action-details/details-section"
import { LinkedActionSection } from "./action-details/linked-action-section"
import { useTabs } from "@/components/shell/use-tabs"


interface ActionDetailsPanelProps {
  action: ImprovementAction
  onActionUpdate: (updatedAction: ImprovementAction) => void;
}

export function ActionDetailsPanel({ action, onActionUpdate }: ActionDetailsPanelProps) {
  const { user, updateDashboardLayout } = useAuth();
  
  return (
    <div className="flex flex-col gap-6">
      <LinkedActionSection action={action} />
      <DetailsSection action={action} />
      <CommentsSection action={action} onActionUpdate={onActionUpdate} />
      <AttachmentsSection action={action} onActionUpdate={onActionUpdate} />
    </div>
  )
}
