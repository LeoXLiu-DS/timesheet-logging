import { User, Role, Tenant } from '../types';
import { MOCK_USERS, MOCK_TENANTS } from '../constants';

export const loginWithMicrosoft = async (tenantId: string, role: Role): Promise<User> => {
  // Simulate OIDC / Microsoft Entra ID Redirect & Token Exchange
  console.log(`[AuthService] Initiating OIDC flow for tenant: ${tenantId}`);
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const user = MOCK_USERS.find(u => u.tenantId === tenantId && u.role === role);
  
  if (!user) {
    throw new Error("User not found in this tenant. Please contact your administrator.");
  }

  console.log(`[AuthService] Identity verified. Mapped to tenant: ${user.tenantId}`);
  return user;
};

export const getCurrentTenant = (tenantId: string): Tenant | undefined => {
  return MOCK_TENANTS.find(t => t.id === tenantId);
};