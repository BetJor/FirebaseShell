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
  userIds?: string[];
}
