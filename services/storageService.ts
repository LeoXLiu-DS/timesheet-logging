import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { TimeEntry, User, Status } from '../types';

const client = generateClient<Schema>();

/**
 * StorageService using AWS Amplify Data (AppSync + DynamoDB).
 * Strict tenant isolation is enforced by requiring tenantId for all operations.
 */
export class StorageService {
  static async getEntries(tenantId: string): Promise<TimeEntry[]> {
    const { data, errors } = await client.models.TimeEntry.list({
      filter: { tenantId: { eq: tenantId } },
    });

    if (errors) {
      console.error('Error fetching entries:', errors);
      throw new Error('Failed to fetch time entries');
    }

    return (data || []).map(mapTimeEntryFromSchema);
  }

  static async upsertEntry(tenantId: string, entry: TimeEntry): Promise<void> {
    if (entry.tenantId !== tenantId) {
      throw new Error('Unauthorized: Tenant mismatch.');
    }

    const entryData = {
      id: entry.id,
      tenantId: entry.tenantId,
      contractorId: entry.contractorId,
      contractorName: entry.contractorName,
      projectId: entry.projectId,
      projectName: entry.projectName,
      taskId: entry.taskId || null,
      taskName: entry.taskName || null,
      date: entry.date,
      hours: entry.hours,
      description: entry.description || '',
      status: entry.status as 'Draft' | 'Submitted' | 'Approved' | 'Rejected',
      rejectionReason: entry.rejectionReason || null,
      managerComment: entry.managerComment || null,
      reviewedBy: entry.reviewedBy || null,
      reviewedAt: entry.reviewedAt || null,
    };

    // Try to get existing entry
    const { data: existing } = await client.models.TimeEntry.get({ id: entry.id });

    if (existing) {
      const { errors } = await client.models.TimeEntry.update(entryData);
      if (errors) {
        console.error('Error updating entry:', errors);
        throw new Error('Failed to update time entry');
      }
    } else {
      const { errors } = await client.models.TimeEntry.create(entryData);
      if (errors) {
        console.error('Error creating entry:', errors);
        throw new Error('Failed to create time entry');
      }
    }
  }

  static async deleteEntry(tenantId: string, id: string): Promise<void> {
    // Verify tenant ownership before deletion
    const { data: existing } = await client.models.TimeEntry.get({ id });

    if (existing && existing.tenantId !== tenantId) {
      throw new Error('Unauthorized: Tenant mismatch.');
    }

    const { errors } = await client.models.TimeEntry.delete({ id });
    if (errors) {
      console.error('Error deleting entry:', errors);
      throw new Error('Failed to delete time entry');
    }
  }

  static async getUsers(tenantId: string): Promise<User[]> {
    const { data, errors } = await client.models.User.list({
      filter: { tenantId: { eq: tenantId } },
    });

    if (errors) {
      console.error('Error fetching users:', errors);
      throw new Error('Failed to fetch users');
    }

    return (data || []).map(mapUserFromSchema);
  }

  static async saveUser(tenantId: string, user: User): Promise<void> {
    if (user.tenantId !== tenantId) {
      throw new Error('Unauthorized: Tenant mismatch.');
    }

    const userData = {
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      role: user.role as 'CONTRACTOR' | 'MANAGER',
      avatarUrl: user.avatarUrl || null,
    };

    const { data: existing } = await client.models.User.get({ id: user.id });

    if (existing) {
      const { errors } = await client.models.User.update(userData);
      if (errors) {
        console.error('Error updating user:', errors);
        throw new Error('Failed to update user');
      }
    } else {
      const { errors } = await client.models.User.create(userData);
      if (errors) {
        console.error('Error creating user:', errors);
        throw new Error('Failed to create user');
      }
    }
  }

  static async initialize(initialEntries: TimeEntry[], initialUsers: User[]): Promise<void> {
    // In production, seeding should be done via migrations or admin tools
    // This is kept for backwards compatibility during development
    console.log('[StorageService] Initialize called - seeding should be done via Amplify sandbox or migrations');
  }
}

// Helper functions to map Amplify schema types to app types
function mapTimeEntryFromSchema(entry: any): TimeEntry {
  return {
    id: entry.id,
    tenantId: entry.tenantId,
    contractorId: entry.contractorId,
    contractorName: entry.contractorName,
    projectId: entry.projectId,
    projectName: entry.projectName,
    taskId: entry.taskId || undefined,
    taskName: entry.taskName || undefined,
    date: entry.date,
    hours: entry.hours,
    description: entry.description || '',
    status: entry.status as Status,
    rejectionReason: entry.rejectionReason || undefined,
    managerComment: entry.managerComment || undefined,
    reviewedBy: entry.reviewedBy || undefined,
    reviewedAt: entry.reviewedAt || undefined,
  };
}

function mapUserFromSchema(user: any): User {
  return {
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl || undefined,
  };
}
