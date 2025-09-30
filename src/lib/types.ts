import type { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: 'Creator' | 'Responsible' | 'Director' | 'Committee' | 'Admin' | 'User';
  createdAt?: Date;
  lastLogin?: Date;
  dashboardLayout?: string[];
}

export interface UserGroup {
  id: string;
  name: string;
  description?: string;
}

export type ActionUserInfo = {
  id: string;
  name: string;
  avatar?: string | null;
  email?: string;
};

export type ImprovementActionStatus =
  | 'Borrador'
  | 'Pendiente Análisis'
  | 'En Análisis'
  | 'Pendiente Verificación'
  | 'En Verificación'
  | 'Pendiente Cierre'
  | 'Finalizada';

export type ProposedActionStatus = 
    | 'Pendiente'
    | 'Implementada' 
    | 'Implementada Parcialmente'
    | 'No Implementada';

export interface ProposedAction {
  id: string;
  description: string;
  responsibleId: string;
  dueDate: string; // ISO 8601 string
  status: ProposedActionStatus;
}

export interface Comment {
  id: string;
  author: ActionUserInfo;
  date: string; // ISO 8601 string
  text: string;
}

export interface ActionAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: ActionUserInfo;
  uploadedAt: string; // ISO 8601 string
}

export interface WorkflowStep {
  stepName: string;
  responsibleParty: string;
  dueDate: string; // ISO 8601 string
  status: 'Pendiente' | 'En Proceso' | 'Completado' | 'Omitido';
  completedDate?: string;
}

export interface WorkflowPlan {
  workflowId: string;
  actionId: string;
  steps: WorkflowStep[];
}

export interface ImprovementAction {
  id: string;
  actionId: string; // e.g., AM-24001
  title: string;
  description: string;
  category: string;
  categoryId: string;
  subcategory: string;
  subcategoryId: string;
  type: string;
  typeId: string;
  status: ImprovementActionStatus;
  affectedAreas: string[];
  affectedAreasIds: string[];
  center?: string;
  centerId?: string;
  creator: ActionUserInfo;
  assignedTo?: string; // Group or User ID
  responsibleGroupId?: string;
  responsibleUser?: ActionUserInfo;
  followers?: string[]; // Array of user IDs
  creationDate: string; // ISO 8601 string
  analysisDueDate: string; // ISO 8601 string
  implementationDueDate: string; // ISO 8601 string
  closureDueDate: string; // ISO 8601 string
  originalActionId?: string;
  originalActionTitle?: string;
  analysis?: {
    causes: string;
    proposedActions: ProposedAction[];
    analysisResponsible: ActionUserInfo;
    verificationResponsibleId: string;
    analysisDate: string;
  };
  verification?: {
    notes: string;
    actionsStatus: { proposedActionId: string, status: ProposedActionStatus, notes: string }[];
    verificationResponsible: ActionUserInfo;
    verificationDate: string;
  };
  closure?: {
    notes: string;
    isCompliant: boolean;
    closureResponsible: ActionUserInfo;
    date: string;
  };
  attachments?: ActionAttachment[];
  comments?: Comment[];
  workflowPlan?: WorkflowPlan;
  readers?: string[]; // Array of user/group emails
  authors?: string[]; // Array of user/group emails
}


// --- Master Data Types ---
export interface MasterDataItem {
    id: string;
    name: string;
    [key: string]: any;
}

export interface ActionCategory extends MasterDataItem {
    // No specific fields yet
}

export interface ActionSubcategory extends MasterDataItem {
    categoryId: string;
}

export interface AffectedArea extends MasterDataItem {
    // No specific fields yet
}

export interface Center extends MasterDataItem {
    code: string;
}

export interface ImprovementActionType extends MasterDataItem {
    description: string;
    requiresAnalysis: boolean;
    requiresVerification: boolean;
    defaultAnalysisDurationDays: number;
    defaultImplementationDurationDays: number;
    defaultClosureDurationDays: number;
    creationRoles: string[]; // Role IDs
    analysisRoles: string[]; // Role IDs
    closureRoles: string[]; // Role IDs
}

export interface ResponsibilityRole extends MasterDataItem {
    type: 'Fixed' | 'Pattern';
    email?: string;
    emailPattern?: string;
}

export interface PermissionRule {
  id: string;
  actionTypeId: string;
  status: ImprovementActionStatus;
  readerRoleIds: string[]; // Array of ResponsibilityRole IDs
  authorRoleIds: string[]; // Array of ResponsibilityRole IDs
}

// --- AI Related Types ---
export interface GalleryPrompt {
    id: string;
    title: string;
    prompt: string;
    description?: string;
    category?: string;
}
