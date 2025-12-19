import { TimeEntry, OdooSyncResult, User } from '../types';

/**
 * Simulates checking if a user exists in Odoo and creating one if not.
 * In a real app, this would hit the Odoo XML-RPC or JSON-RPC API.
 */
export const syncUserWithOdoo = async (user: User): Promise<OdooSyncResult> => {
  console.log(`[Odoo Service] Checking existence of user: ${user.email}`);
  
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 800));

  console.log(`[Odoo Service] User ${user.email} not found. Creating new Partner/User record...`);
  console.log(`[Odoo Service] User created in Odoo with ID: 5542`);

  return {
    success: true,
    message: 'User provisioned in Odoo successfully',
    odooId: 5542
  };
};

/**
 * Simulates uploading an approved timesheet to Odoo.
 */
export const uploadTimesheetToOdoo = async (entry: TimeEntry): Promise<OdooSyncResult> => {
  console.log(`[Odoo Service] Uploading timesheet entry ${entry.id} for project ${entry.projectName}...`);
  
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 1200));

  // 90% chance of success for simulation
  const isSuccess = Math.random() > 0.1;

  if (isSuccess) {
    console.log(`[Odoo Service] Entry ${entry.id} synced. Odoo Timesheet ID: 9981`);
    return {
      success: true,
      message: 'Timesheet synced to Odoo',
      odooId: 9981
    };
  } else {
    console.error(`[Odoo Service] Failed to sync entry ${entry.id}. API Error 500.`);
    return {
      success: false,
      message: 'Odoo API Connection Failed'
    };
  }
};