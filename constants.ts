import { Project, TimeEntry, Status, Role, User, Task, Tenant } from './types';

export const MOCK_TENANTS: Tenant[] = [
  { id: 't-acme', name: 'Acme Global', domain: 'acme.com' },
  { id: 't-globex', name: 'Globex Corp', domain: 'globex.com' },
];

export const MOCK_USERS: User[] = [
  // Acme Tenant
  { id: 'u1', tenantId: 't-acme', name: 'Alice Smith', email: 'alice@acme.com', role: Role.CONTRACTOR, avatarUrl: 'https://i.pravatar.cc/150?u=u1' },
  { id: 'u2', tenantId: 't-acme', name: 'Bob Manager', email: 'bob@acme.com', role: Role.MANAGER, avatarUrl: 'https://i.pravatar.cc/150?u=u2' },
  // Globex Tenant
  { id: 'u3', tenantId: 't-globex', name: 'Charlie Contractor', email: 'charlie@globex.com', role: Role.CONTRACTOR, avatarUrl: 'https://i.pravatar.cc/150?u=u3' },
  { id: 'u4', tenantId: 't-globex', name: 'Dana Director', email: 'dana@globex.com', role: Role.MANAGER, avatarUrl: 'https://i.pravatar.cc/150?u=u4' },
];

export const MOCK_PROJECTS: Project[] = [
  // Acme Projects
  { id: 'p1', tenantId: 't-acme', name: 'Acme Web Portal', code: 'AWP' },
  { id: 'p2', tenantId: 't-acme', name: 'Acme Logistics', code: 'AL' },
  // Globex Projects
  { id: 'p3', tenantId: 't-globex', name: 'Globex Mobile App', code: 'GMA' },
  { id: 'p4', tenantId: 't-globex', name: 'Globex Cloud Mig', code: 'GCM' },
];

export const MOCK_TASKS: Task[] = [
  // Acme Tasks
  { id: 'tk1', tenantId: 't-acme', name: 'UI Development', projectId: 'p1' },
  { id: 'tk2', tenantId: 't-acme', name: 'API Integration', projectId: 'p1' },
  // Globex Tasks
  { id: 'tk3', tenantId: 't-globex', name: 'Backend Services', projectId: 'p3' },
  { id: 'tk4', tenantId: 't-globex', name: 'Security Audit', projectId: 'p4' },
];

export const INITIAL_ENTRIES: TimeEntry[] = [
  {
    id: 'e1',
    tenantId: 't-acme',
    contractorId: 'u1',
    contractorName: 'Alice Smith',
    projectId: 'p1',
    projectName: 'Acme Web Portal',
    taskId: 'tk1',
    taskName: 'UI Development',
    date: '2023-11-20',
    hours: 8,
    description: 'Developed the main dashboard layout.',
    status: Status.APPROVED,
  },
  {
    id: 'e2',
    tenantId: 't-globex',
    contractorId: 'u3',
    contractorName: 'Charlie Contractor',
    projectId: 'p3',
    projectName: 'Globex Mobile App',
    taskId: 'tk3',
    taskName: 'Backend Services',
    date: '2023-11-20',
    hours: 6,
    description: 'Optimized database queries for the user feed.',
    status: Status.SUBMITTED,
  }
];