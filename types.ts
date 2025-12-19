export enum Role {
  CONTRACTOR = 'CONTRACTOR',
  MANAGER = 'MANAGER'
}

export enum Status {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  code: string;
}

export interface Task {
  id: string;
  tenantId: string;
  name: string;
  projectId: string;
}

export interface TimeEntry {
  id: string;
  tenantId: string;
  contractorId: string;
  contractorName: string;
  projectId: string;
  projectName: string;
  taskId?: string;
  taskName?: string;
  date: string; // ISO Date string YYYY-MM-DD
  hours: number;
  description: string;
  status: Status;
  rejectionReason?: string;
  managerComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface OdooSyncResult {
  success: boolean;
  message: string;
  odooId?: number;
}