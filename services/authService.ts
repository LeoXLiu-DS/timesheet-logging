import {
  signInWithRedirect,
  signOut,
  getCurrentUser,
  fetchUserAttributes,
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { User, Role, Tenant } from '../types';
import { MOCK_TENANTS } from '../constants';

const client = generateClient<Schema>();

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Initiates Microsoft Entra ID (Azure AD) sign-in flow.
 * Redirects user to Microsoft login page.
 */
export const signInWithAzure = async (): Promise<void> => {
  try {
    await signInWithRedirect({
      provider: {
        custom: 'MicrosoftEntraID',
      },
    });
  } catch (error) {
    console.error('[AuthService] Azure sign-in error:', error);
    throw error;
  }
};

/**
 * Signs out the current user from both Cognito and Azure AD.
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut({ global: true });
  } catch (error) {
    console.error('[AuthService] Sign out error:', error);
  }
};

/**
 * Gets the currently authenticated user and their profile from DynamoDB.
 * If user exists in Cognito but not in DynamoDB, creates a new profile.
 */
export const getAuthenticatedUser = async (): Promise<User | null> => {
  try {
    const cognitoUser = await getCurrentUser();
    const attributes = await fetchUserAttributes();

    const email = attributes.email || cognitoUser.username;
    const name = attributes.name || attributes.preferred_username || email.split('@')[0];

    // Look up user profile in DynamoDB
    const { data: users } = await client.models.User.list({
      filter: { email: { eq: email } },
    });

    if (users && users.length > 0) {
      const user = users[0];
      return {
        id: user.id,
        tenantId: user.tenantId,
        name: user.name,
        email: user.email,
        role: user.role as Role,
        avatarUrl: user.avatarUrl || undefined,
      };
    }

    // User authenticated via Azure but no profile exists - create one
    // Determine tenant from email domain
    const emailDomain = email.split('@')[1];
    const tenant = MOCK_TENANTS.find((t) => t.domain === emailDomain);

    if (!tenant) {
      console.error('[AuthService] No tenant found for domain:', emailDomain);
      // Sign out user if their domain is not registered
      await signOut();
      return null;
    }

    // Create new user profile
    const newUser = await createUserProfile(email, name, tenant.id, Role.CONTRACTOR);
    return newUser;
  } catch (error) {
    // User not signed in
    return null;
  }
};

/**
 * Creates a user profile in DynamoDB for a newly authenticated Azure user.
 */
async function createUserProfile(
  email: string,
  name: string,
  tenantId: string,
  role: Role
): Promise<User> {
  const userId = `u-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const { data, errors } = await client.models.User.create({
    id: userId,
    tenantId,
    name,
    email,
    role: role as 'CONTRACTOR' | 'MANAGER',
    avatarUrl: `https://i.pravatar.cc/150?u=${userId}`,
  });

  if (errors || !data) {
    console.error('[AuthService] Error creating user profile:', errors);
    throw new Error('Failed to create user profile');
  }

  return {
    id: data.id,
    tenantId: data.tenantId,
    name: data.name,
    email: data.email,
    role: data.role as Role,
    avatarUrl: data.avatarUrl || undefined,
  };
}

/**
 * Sets up auth event listener for handling redirect callbacks.
 */
export const setupAuthListener = (
  onSignIn: (user: User) => void,
  onSignOut: () => void
): (() => void) => {
  const unsubscribe = Hub.listen('auth', async ({ payload }) => {
    switch (payload.event) {
      case 'signInWithRedirect':
        const user = await getAuthenticatedUser();
        if (user) {
          onSignIn(user);
        }
        break;
      case 'signInWithRedirect_failure':
        console.error('[AuthService] Sign in redirect failed:', payload.data);
        break;
      case 'signedOut':
        onSignOut();
        break;
    }
  });

  return unsubscribe;
};

/**
 * Gets tenant information by ID.
 */
export const getCurrentTenant = (tenantId: string): Tenant | undefined => {
  return MOCK_TENANTS.find((t) => t.id === tenantId);
};

/**
 * Updates user role (admin function).
 */
export const updateUserRole = async (
  tenantId: string,
  userId: string,
  newRole: Role
): Promise<void> => {
  const { data: user } = await client.models.User.get({ id: userId });

  if (!user || user.tenantId !== tenantId) {
    throw new Error('Unauthorized: User not found in tenant');
  }

  const { errors } = await client.models.User.update({
    id: userId,
    role: newRole as 'CONTRACTOR' | 'MANAGER',
  });

  if (errors) {
    console.error('[AuthService] Error updating user role:', errors);
    throw new Error('Failed to update user role');
  }
};
