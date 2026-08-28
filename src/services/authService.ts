import { supabase, safeStorage } from '@/utils/supabase';

export type UserRole = 'user' | 'manager' | 'sar';

export interface UserRegistrationData {
  aadhaarNumber: string;
  phoneNumber: string;
  fullName: string;
  password: string;
}

export interface ManagerRegistrationData {
  orgName: string;
  representativeName: string;
  stateOfOperations: string;
  hqAddress: string;
  officialEmail: string;
  contactPhone: string;
  orgType: string;
  registrationNumber: string;
  password: string;
}

export interface SARRegistrationData {
  fullName: string;
  aadhaarNumber: string;
  phoneNumber?: string;
  badgeId?: string;
  specialization?: string;
  password: string;
}

export interface CurrentUserSession {
  role: UserRole;
  identifier: string;
  name?: string;
  userId?: string;
  details?: any;
}

const STORAGE_KEY_SESSION = '@rescuenet_auth_session';

// Helper to convert phone or aadhaar to a deterministic auth email for GoTrue
function formatCitizenAuthEmail(identifier: string): string {
  const clean = identifier.replace(/\D/g, '');
  return `citizen_${clean}@citizens.rescuenet.ai`;
}

function formatSARAuthEmail(identifier: string): string {
  if (identifier.includes('@')) return identifier.toLowerCase().trim();
  const clean = identifier.replace(/\s+/g, '_').toLowerCase();
  return `sar_${clean}@sar.rescuenet.ai`;
}

export const AuthService = {
  // Save current active session in local storage cache
  async setSession(session: CurrentUserSession): Promise<void> {
    await safeStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
  },

  // Get active session from Supabase or cached storage
  async getSession(): Promise<CurrentUserSession | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const metadata = session.user.user_metadata || {};
        const role: UserRole = metadata.role || 'user';
        const currentSession: CurrentUserSession = {
          role,
          identifier: session.user.email || metadata.phone || metadata.aadhaar || session.user.id,
          name: metadata.full_name || metadata.org_name || 'User',
          userId: session.user.id,
          details: metadata,
        };
        await this.setSession(currentSession);
        return currentSession;
      }
    } catch {
      // Ignore and fallback to local cache
    }

    const raw = await safeStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // Clear session & sign out from Supabase
  async clearSession(): Promise<void> {
    await safeStorage.removeItem(STORAGE_KEY_SESSION);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signout failed', e);
    }
  },

  // Register Citizen / User with Supabase GoTrue Auth
  async registerUser(data: UserRegistrationData) {
    const authEmail = formatCitizenAuthEmail(data.phoneNumber || data.aadhaarNumber);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: authEmail,
      password: data.password,
      options: {
        data: {
          role: 'user',
          full_name: data.fullName,
          phone: data.phoneNumber,
          aadhaar: data.aadhaarNumber,
        },
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    const userId = authData.user?.id;

    // Sync into citizens database table if table exists
    if (userId) {
      try {
        await supabase.from('citizens').upsert({
          id: userId,
          aadhaar: data.aadhaarNumber,
          phone: data.phoneNumber,
          full_name: data.fullName,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Citizens table sync note:', err);
      }
    }

    const session: CurrentUserSession = {
      role: 'user',
      identifier: data.phoneNumber || data.aadhaarNumber,
      name: data.fullName,
      userId,
      details: { aadhaar: data.aadhaarNumber, phone: data.phoneNumber },
    };
    await this.setSession(session);
    return session;
  },

  // Login Citizen / User with Supabase GoTrue Auth
  async loginUser(identifier: string, password: string) {
    const authEmail = formatCitizenAuthEmail(identifier.trim());

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    });

    if (authError) {
      // If phone identifier failed and it looks like a 10-digit phone, also attempt with aadhaar format if needed
      throw new Error(authError.message);
    }

    const user = authData.user;
    const metadata = user?.user_metadata || {};

    const session: CurrentUserSession = {
      role: 'user',
      identifier,
      name: metadata.full_name || `Citizen (${identifier})`,
      userId: user?.id,
      details: metadata,
    };
    await this.setSession(session);
    return session;
  },

  // Register Relief Manager with Supabase GoTrue Auth
  async registerManager(data: ManagerRegistrationData) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.officialEmail.trim().toLowerCase(),
      password: data.password,
      options: {
        data: {
          role: 'manager',
          org_name: data.orgName,
          representative_name: data.representativeName,
          state_of_operations: data.stateOfOperations,
          hq_address: data.hqAddress,
          phone: data.contactPhone,
          org_type: data.orgType,
          registration_number: data.registrationNumber,
        },
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    const userId = authData.user?.id;

    if (userId) {
      try {
        await supabase.from('relief_managers').upsert({
          id: userId,
          org_name: data.orgName,
          representative_name: data.representativeName,
          state_of_operations: data.stateOfOperations,
          hq_address: data.hqAddress,
          email: data.officialEmail.trim().toLowerCase(),
          phone: data.contactPhone,
          org_type: data.orgType,
          registration_number: data.registrationNumber,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Relief managers table sync note:', err);
      }
    }

    const session: CurrentUserSession = {
      role: 'manager',
      identifier: data.officialEmail,
      name: data.orgName,
      userId,
      details: data,
    };
    await this.setSession(session);
    return session;
  },

  // Login Relief Manager with Supabase GoTrue Auth
  async loginManager(identifier: string, password: string) {
    const email = identifier.trim().toLowerCase();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    const user = authData.user;
    const metadata = user?.user_metadata || {};

    const session: CurrentUserSession = {
      role: 'manager',
      identifier: email,
      name: metadata.org_name || metadata.representative_name || email,
      userId: user?.id,
      details: metadata,
    };
    await this.setSession(session);
    return session;
  },

  // Register SAR Team Operative
  async registerSAR(data: SARRegistrationData) {
    const authEmail = formatSARAuthEmail(data.aadhaarNumber || data.badgeId || 'operative');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: authEmail,
      password: data.password,
      options: {
        data: {
          role: 'sar',
          full_name: data.fullName,
          aadhaar: data.aadhaarNumber,
          phone: data.phoneNumber,
          badge_id: data.badgeId,
          specialization: data.specialization,
        },
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    const userId = authData.user?.id;

    if (userId) {
      try {
        await supabase.from('sar_operatives').upsert({
          id: userId,
          full_name: data.fullName,
          badge_id: data.badgeId,
          aadhaar: data.aadhaarNumber,
          phone: data.phoneNumber,
          specialization: data.specialization,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('SAR table sync note:', err);
      }
    }

    const session: CurrentUserSession = {
      role: 'sar',
      identifier: data.aadhaarNumber || data.badgeId || 'operative',
      name: data.fullName,
      userId,
      details: data,
    };
    await this.setSession(session);
    return session;
  },

  // Login SAR Team Member with Supabase GoTrue Auth
  async loginSAR(identifier: string, password: string) {
    const authEmail = formatSARAuthEmail(identifier.trim());

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    const user = authData.user;
    const metadata = user?.user_metadata || {};

    const session: CurrentUserSession = {
      role: 'sar',
      identifier,
      name: metadata.full_name || `SAR Operative (${identifier})`,
      userId: user?.id,
      details: metadata,
    };
    await this.setSession(session);
    return session;
  },
};
