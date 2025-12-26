// Supabase Client - Single source of truth for backend storage
// Used for durable backend storage (IndexedDB-first architecture)

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Get environment variables
// Use the "Publishable key" from Supabase Dashboard → Settings → API
// This key is safe to use in browser when RLS is enabled
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabasePublishableKey) {}

/**
 * Creates a Supabase client with Clerk session token using the accessToken callback
 * 
 * This follows Supabase's official Clerk integration pattern:
 * https://supabase.com/docs/guides/auth/third-party/clerk
 * 
 * The accessToken callback ensures the token is refreshed automatically and
 * works with both database RLS and Storage RLS.
 * 
 * @param getTokenFn - Function that returns Clerk session token (async)
 * @returns Supabase client instance
 * 
 * @example
 * // Without auth (for public operations)
 * const client = createSupabaseClient();
 * 
 * @example
 * // With Clerk token (for RLS-protected operations)
 * const client = createSupabaseClient(async () => {
 *   const token = await getToken();
 *   return token;
 * });
 */
export function createSupabaseClient(
  getTokenFn?: (() => Promise<string | null>) | null
): SupabaseClient {
  const options: {
    auth?: {
      persistSession: boolean;
      autoRefreshToken: boolean;
    };
    global?: {
      headers?: {
        Authorization?: string;
      };
    };
    accessToken?: () => Promise<string | null>;
  } = {
    auth: {
      persistSession: false, // Don't persist Supabase sessions when using external auth
      autoRefreshToken: false, // Clerk handles token refresh
    },
  };

  // Use accessToken callback (recommended by Supabase for Clerk integration)
  // This works with both database RLS and Storage RLS
  if (getTokenFn) {
    options.accessToken = getTokenFn;
  }

  return createClient(supabaseUrl || "", supabasePublishableKey || "", options);
}

/**
 * Default Supabase client (without authentication)
 * 
 * ⚠️ WARNING: This client does NOT include Clerk JWT tokens.
 * Use `useSupabaseClient()` hook in React components for authenticated operations.
 * 
 * This export is kept for backward compatibility and non-authenticated operations
 * (e.g., public file lookups that don't require user context).
 */
export const supabase = createSupabaseClient();
