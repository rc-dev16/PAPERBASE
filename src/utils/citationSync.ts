/**
 * Citation Sync to Supabase Backend
 * 
 * Mirrors citations to Supabase for durability & recovery.
 * Citations are file-scoped (not document-scoped) for reuse across projects.
 * IndexedDB/localStorage is the source of truth - backend is backup only.
 * 
 * Non-blocking: failures are logged but don't stop the app.
 * 
 * 🔐 Authentication: Pass an authenticated Supabase client (from useSupabaseClient hook)
 * for RLS-protected operations. If not provided, uses default client (no RLS).
 */

import { supabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Citation format type
 */
export type CitationFormat = "APA" | "IEEE" | "MLA" | "BibTeX";

/**
 * Frontend citation (simplified - citations are stored as strings per format)
 */
export interface Citation {
  format: CitationFormat;
  content: string;
  source?: "ai" | "manual";
}

/**
 * Backend citation row (matches Supabase schema)
 */
interface BackendCitation {
  id: string;
  file_hash: string;
  format: string;
  content: string;
  source: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Generate a deterministic ID for a citation (file_hash + format)
 */
function generateCitationId(fileHash: string, format: CitationFormat): string {
  // Use a simple hash-like approach: fileHash + format
  // This ensures one citation per format per file
  return `${fileHash}_${format.toLowerCase()}`;
}

/**
 * Convert frontend Citation to backend format
 */
function toBackendCitation(
  citation: Citation,
  fileHash: string
): BackendCitation | null {
  // Validate required fields
  if (!fileHash || !citation.format || !citation.content) {return null;
  }

  const id = generateCitationId(fileHash, citation.format);

  return {
    id,
    file_hash: fileHash,
    format: citation.format,
    content: citation.content,
    source: citation.source || "ai",
    created_at: undefined, // Will be set by Supabase
    updated_at: undefined, // Will be set by Supabase
  };
}

/**
 * Sync a single citation to Supabase (upsert)
 * Non-blocking: logs errors but doesn't throw
 * 
 * @param citation - Frontend citation to sync
 * @param fileHash - File hash (required for backend)
 * @param supabaseClient - Optional authenticated Supabase client. If provided, uses RLS.
 *                        If not provided, uses default client (no RLS protection).
 * @returns true if successful, false otherwise
 */
export async function syncCitationToBackend(
  citation: Citation,
  fileHash: string,
  supabaseClient?: SupabaseClient
): Promise<boolean> {
  try {
    const backendCitation = toBackendCitation(citation, fileHash);
    if (!backendCitation) {
      return false;
    }

    // Use provided authenticated client, or fall back to default
    const client = supabaseClient || supabase;

    // Upsert: insert if new, update if exists
    // If authenticated client is used, RLS will enforce ownership
    const { error } = await client
      .from("citations")
      .upsert(backendCitation, {
        onConflict: "id",
      });

    if (error) {return false;
    }return true;
  } catch (error) {return false;
  }
}

/**
 * Sync multiple citations to Supabase (batch upsert)
 * Non-blocking: logs errors but doesn't throw
 * 
 * @param citations - Array of frontend citations to sync
 * @param fileHash - File hash (required for backend)
 * @param supabaseClient - Optional authenticated Supabase client. If provided, uses RLS.
 *                        If not provided, uses default client (no RLS protection).
 * @returns Number of successfully synced citations
 */
export async function syncCitationsToBackend(
  citations: Citation[],
  fileHash: string,
  supabaseClient?: SupabaseClient
): Promise<number> {
  try {
    const backendCitations = citations
      .map((c) => toBackendCitation(c, fileHash))
      .filter((c): c is BackendCitation => c !== null);

    if (backendCitations.length === 0) {
      return 0;
    }

    // Use provided authenticated client, or fall back to default
    const client = supabaseClient || supabase;

    // Batch upsert
    // If authenticated client is used, RLS will enforce ownership
    const { error } = await client
      .from("citations")
      .upsert(backendCitations, {
        onConflict: "id",
      });

    if (error) {return 0;
    }return backendCitations.length;
  } catch (error) {return 0;
  }
}

/**
 * Load citations from Supabase (for recovery)
 * Used only when IndexedDB is empty or user explicitly restores
 * 
 * @param fileHash - File hash to load citations for
 * @returns Array of frontend citations or empty array on error
 */
export async function loadCitationsFromBackend(fileHash: string): Promise<Citation[]> {
  try {
    const { data, error } = await supabase
      .from("citations")
      .select("*")
      .eq("file_hash", fileHash)
      .order("created_at", { ascending: true });

    if (error) {return [];
    }

    if (!data) {
      return [];
    }

    // Convert backend format to frontend format
    const frontendCitations: Citation[] = data.map((row) => ({
      format: row.format as CitationFormat,
      content: row.content,
      source: (row.source as "ai" | "manual") || "ai",
    }));return frontendCitations;
  } catch (error) {return [];
  }
}

