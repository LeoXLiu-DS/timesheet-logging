import { TimeEntry, User, Status } from '../types';

/**
 * This service simulates a backend interacting with Amazon DynamoDB.
 * Strict tenant isolation is enforced by requiring tenantId for all operations.
 */

export class StorageService {
  private static STORAGE_KEY = 'timelink_db_v1';

  private static getStore(): { entries: TimeEntry[], users: User[] } {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : { entries: [], users: [] };
  }

  private static saveStore(data: { entries: TimeEntry[], users: User[] }) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  static async getEntries(tenantId: string): Promise<TimeEntry[]> {
    const store = this.getStore();
    // Simulate DynamoDB Query with Partition Key (tenantId)
    return store.entries.filter(e => e.tenantId === tenantId);
  }

  static async upsertEntry(tenantId: string, entry: TimeEntry): Promise<void> {
    const store = this.getStore();
    if (entry.tenantId !== tenantId) throw new Error("Unauthorized: Tenant mismatch.");
    
    const index = store.entries.findIndex(e => e.id === entry.id);
    if (index >= 0) {
      store.entries[index] = entry;
    } else {
      store.entries.push(entry);
    }
    this.saveStore(store);
  }

  static async deleteEntry(tenantId: string, id: string): Promise<void> {
    const store = this.getStore();
    store.entries = store.entries.filter(e => !(e.id === id && e.tenantId === tenantId));
    this.saveStore(store);
  }

  static async getUsers(tenantId: string): Promise<User[]> {
    const store = this.getStore();
    return store.users.filter(u => u.tenantId === tenantId);
  }

  static async saveUser(tenantId: string, user: User): Promise<void> {
    const store = this.getStore();
    if (user.tenantId !== tenantId) throw new Error("Unauthorized: Tenant mismatch.");
    
    const index = store.users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      store.users[index] = user;
    } else {
      store.users.push(user);
    }
    this.saveStore(store);
  }

  static async initialize(initialEntries: TimeEntry[], initialUsers: User[]) {
    const store = this.getStore();
    if (store.entries.length === 0) {
      this.saveStore({ entries: initialEntries, users: initialUsers });
    }
  }
}