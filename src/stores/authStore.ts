/**
 * Authentication state management store using the official Supabase client.
 * - Primary behavior: isAuthenticated reflects Supabase Auth session presence.
 * - Account enrichment from public.accounts is optional and never blocks authentication.
 * - Exposes actions for login, logout, account updates, and session hydration.
 *
 * Rationale:
 * - Supabase Auth (auth.users) is the source of truth for authentication.
 * - Domain tables (e.g., public.accounts) may or may not link directly to auth.users.
 * - We treat an active session as authenticated, and we enrich UI with account details when available.
 */

import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import type { Account } from '@/types';

// --- State and Actions Interface ---
interface AuthState {
  session: Session | null;
  user: User | null;
  account: Account | null;
  /**
   * True when a Supabase Auth session exists.
   * Does not depend on presence of an accounts row.
   */
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateAccount: (changes: Partial<Account>) => Promise<Account | null>;
  checkSession: () => Promise<void>;
}

/**
 * mapRowToAccount
 * Maps a database row (snake_case) to the Account UI type (camelCase).
 */
function mapRowToAccount(row: any): Account {
  return {
    id: row.id,
    email: row.email,
    pharmacyName: row.pharmacy_name,
    pharmacyPhone: row.pharmacy_phone ?? null,
    subscriptionStatus: (row.subscription_status || 'inactive') as 'active' | 'inactive',
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
    address1: row.address1 ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    zipcode: row.zipcode ?? null,
  };
}

/**
 * findAccountRow
 * Best-effort strategy to locate the account row for a given auth user.
 * - Order:
 *   1) accounts.id === auth.user.id (common schema)
 *   2) accounts.user_id === auth.user.id (alt schema)
 *   3) accounts.email === auth.user.email (email-linked schema)
 * Returns: row object or null if not visible (e.g., due to RLS) or not found.
 *
 * Note: This is used for enrichment only and never blocks authentication.
 */
async function findAccountRow(user: User): Promise<any | null> {
  try {
    // Try by accounts.id == auth.user.id
    const { data: byId, error: byIdErr } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', user.id)
      .limit(1);

    if (!byIdErr && byId && byId.length > 0) {
      return byId[0];
    }

    // Try by accounts.user_id == auth.user.id (safe even if column doesn't exist)
    const { data: byUserId, error: byUserIdErr } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    if (!byUserIdErr && byUserId && byUserId.length > 0) {
      return byUserId[0];
    }

    // Try by accounts.email == auth.user.email
    if (user.email) {
      const { data: byEmail, error: byEmailErr } = await supabase
        .from('accounts')
        .select('*')
        .eq('email', user.email)
        .limit(1);

      if (!byEmailErr && byEmail && byEmail.length > 0) {
        return byEmail[0];
      }
    }
  } catch {
    // Swallow to avoid blocking auth or noisy logs on RLS/columns mismatch
  }
  return null;
}

// --- Zustand Store Definition ---
export const useAuthStore = create<AuthState>((set, get) => ({
  // --- Initial State ---
  session: null,
  user: null,
  account: null,
  isAuthenticated: false,

  /**
   * checkSession
   * Hydrates store from current Supabase session.
   * - Sets isAuthenticated true if a session exists (independent of accounts).
   * - Enriches 'account' best-effort if visible under RLS.
   */
  checkSession: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      set({
        session: null,
        user: null,
        account: null,
        isAuthenticated: false,
      });
      return;
    }

    let accountRow: any | null = null;
    accountRow = await findAccountRow(session.user);

    set({
      session,
      user: session.user,
      account: accountRow ? mapRowToAccount(accountRow) : null,
      isAuthenticated: true, // Auth is based on Supabase session
    });
  },

  /**
   * login
   * Signs in the user with email and password using Supabase Auth.
   * Returns:
   * - true if a Supabase session is established, regardless of accounts row presence.
   * - false only if there is no session (unexpected success case) after calling signInWithPassword.
   */
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (!data.session) {
      set({ session: null, user: null, account: null, isAuthenticated: false });
      return false;
    }

    let accountRow: any | null = null;
    accountRow = await findAccountRow(data.user);

    set({
      session: data.session,
      user: data.user,
      account: accountRow ? mapRowToAccount(accountRow) : null,
      isAuthenticated: true, // Auth is based on Supabase session
    });

    return true;
  },

  /**
   * logout
   * Signs out the current user and clears auth-related state.
   */
  logout: async () => {
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      account: null,
      isAuthenticated: false,
    });
  },

  /**
   * updateAccount
   * Updates the current user's account data in the 'accounts' table.
   * Note: Requires that an account row is currently loaded; not tied to auth.
   */
  updateAccount: async (changes) => {
    const { user, account } = get();
    if (!user) throw new Error('Not authenticated');
    if (!account) throw new Error('Account not loaded');

    // Map camelCase from UI to snake_case for the database
    const patch = {
      pharmacy_name: changes.pharmacyName,
      pharmacy_phone: changes.pharmacyPhone,
      subscription_status: changes.subscriptionStatus,
      address1: changes.address1,
      city: changes.city,
      state: changes.state,
      zipcode: changes.zipcode,
      email: changes.email, // allow email updates if your schema permits
    };

    // Build update query with best-available identifier
    let query = supabase.from('accounts').update(patch as any);

    if (account?.id) {
      query = query.eq('id', account.id);
    } else if (user?.id) {
      query = query.eq('id', user.id);
    } else if (user?.email) {
      query = query.eq('email', user.email);
    }

    const { data, error } = await query.select().single();
    if (error) throw error;

    const mappedAccount = mapRowToAccount(data);
    set({ account: mappedAccount });
    return mappedAccount;
  },
}));
