import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Tenant: a
    .model({
      name: a.string().required(),
      domain: a.string().required(),
      users: a.hasMany('User', 'tenantId'),
      projects: a.hasMany('Project', 'tenantId'),
      tasks: a.hasMany('Task', 'tenantId'),
      timeEntries: a.hasMany('TimeEntry', 'tenantId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  User: a
    .model({
      tenantId: a.id().required(),
      tenant: a.belongsTo('Tenant', 'tenantId'),
      name: a.string().required(),
      email: a.email().required(),
      role: a.enum(['CONTRACTOR', 'MANAGER']),
      avatarUrl: a.string(),
      timeEntries: a.hasMany('TimeEntry', 'contractorId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  Project: a
    .model({
      tenantId: a.id().required(),
      tenant: a.belongsTo('Tenant', 'tenantId'),
      name: a.string().required(),
      code: a.string().required(),
      tasks: a.hasMany('Task', 'projectId'),
      timeEntries: a.hasMany('TimeEntry', 'projectId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  Task: a
    .model({
      tenantId: a.id().required(),
      tenant: a.belongsTo('Tenant', 'tenantId'),
      name: a.string().required(),
      projectId: a.id().required(),
      project: a.belongsTo('Project', 'projectId'),
      timeEntries: a.hasMany('TimeEntry', 'taskId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  TimeEntry: a
    .model({
      tenantId: a.id().required(),
      tenant: a.belongsTo('Tenant', 'tenantId'),
      contractorId: a.id().required(),
      contractor: a.belongsTo('User', 'contractorId'),
      contractorName: a.string().required(),
      projectId: a.id().required(),
      project: a.belongsTo('Project', 'projectId'),
      projectName: a.string().required(),
      taskId: a.id(),
      task: a.belongsTo('Task', 'taskId'),
      taskName: a.string(),
      date: a.date().required(),
      hours: a.float().required(),
      description: a.string(),
      status: a.enum(['Draft', 'Submitted', 'Approved', 'Rejected']),
      rejectionReason: a.string(),
      managerComment: a.string(),
      reviewedBy: a.string(),
      reviewedAt: a.datetime(),
    })
    .authorization((allow) => [allow.authenticated()])
    .secondaryIndexes((index) => [
      index('tenantId').sortKeys(['date']).name('byTenantDate'),
      index('contractorId').sortKeys(['date']).name('byContractorDate'),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
