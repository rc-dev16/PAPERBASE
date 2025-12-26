/**
 * React hook that provides an authenticated Supabase client
 * 
 * This hook integrates Clerk authentication with Supabase using the official
 * Supabase-Clerk integration pattern with accessToken callback.
 * 
 * Follows: https://supabase.com/docs/guides/auth/third-party/clerk
 * 
 * The JWT's `sub` claim contains the Clerk user ID, which should match
 * the `user_id` column in your Supabase tables for RLS policies.
 * 
 * IMPORTANT: Your Clerk session tokens must include the `role` claim with
 * value "authenticated" for RLS to work. Configure this in Clerk Dashboard.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const supabase = useSupabaseClient();
 *   
 *   useEffect(() => {
 *     if (supabase) {
 *       // This query will be filtered by RLS based on the JWT
 *       supabase
 *         .from('projects')
 *         .select('*')
 *         .then(({ data }) =>*     }
 *   }, [supabase]);
 * }
 * ```
 * 
 * @returns Authenticated Supabase client, or null if not signed in
 */

import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export function useSupabaseClient(): SupabaseClient | null {
  const { getToken, isSignedIn } = useAuth();
  const [client, setClient] = useState<SupabaseClient | null>(null);

  // Create accessToken callback function
  // This is called by Supabase whenever it needs a fresh token
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!isSignedIn) {
      return null;
    }

    try {
      // Get Clerk session token
      // Try "supabase" template first, fall back to default
      let token: string | null = null;
      let usedTemplate = false;
      
      try {
        token = await getToken({
          template: "supabase", // Optional: Create a custom JWT template in Clerk Dashboard
        });
        usedTemplate = true;
      } catch (templateError) {
        // Template might not exist, fall back to default tokentoken = await getToken();
      }

      // Debug: Decode and log JWT claims (safely, without exposing full token)
      if (token) {
        try {
          // JWT format: header.payload.signature
          const parts = token.split('.');
          if (parts.length === 3) {
            // Decode payload (base64url)
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));// Check for required claims
            if (!payload.role) {} else if (payload.role !== "authenticated") {} else {}
          }
        } catch (decodeError) {}
      }

      return token;
    } catch (error) {return null;
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      setClient(null);
      return;
    }

    try {
      // Create Supabase client with accessToken callback
      // This follows Supabase's official Clerk integration pattern
      const authenticatedClient = createSupabaseClient(getAccessToken);setClient(authenticatedClient);
    } catch (error) {setClient(null);
    }
  }, [getAccessToken, isSignedIn]);

  return client;
}

