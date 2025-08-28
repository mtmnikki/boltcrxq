/**
 * Supabase client (browser-safe)
 * - Purpose: Create and export a configured Supabase client for auth and PostgREST.
 * - Environment: Uses getSupabaseUrl/getSupabaseAnonKey (browser-safe) instead of process.env.
 * - Auth: Persists session in localStorage for SPA reload continuity.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabaseAnonKey } from '../config/supabaseConfig'

/**
 * Resolve configuration from browser-safe helpers.
 * - These helpers may read from import-time env (VITE_*) or localStorage fallbacks.
 */
const SUPABASE_URL = getSupabaseUrl()
const SUPABASE_ANON_KEY = getSupabaseAnonKey()

/**
 * Build-time guard: we allow empty strings so the bundle loads,
 * but we log a clear warning to surface misconfiguration early.
 */
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Supabase] Missing configuration. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set (or localStorage overrides SUPABASE_URL / SUPABASE_ANON_KEY).'
  )
}

/**
 * Create Supabase client
 * - Persist session in localStorage for SPA page reloads.
 * - Auto-refresh token is handled by supabase-js internally.
 */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: true,
      storage:
        typeof window !== 'undefined'
          ? window.localStorage
          // In non-browser contexts (shouldn’t occur here), supply a noop storage.
          : ({
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            } as unknown as Storage),
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)
