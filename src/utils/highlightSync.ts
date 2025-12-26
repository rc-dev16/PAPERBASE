/**
 * Highlight Sync to Supabase Backend
 * 
 * Mirrors localStorage highlights to Supabase for durability & recovery.
 * IndexedDB/localStorage is the source of truth - backend is backup only.
 * 
 * Non-blocking: failures are logged but don't stop the app.
 */

import { supabase } from "@/lib/supabase";
import type { Highlight } from "@/types/highlight";

/**
 * Backend highlight row (matches Supabase schema)
 */
interface BackendHighlight {
  id: string;
  document_id: string;
  file_hash: string;
  page_number: number;
  text: string;
  rects: {
    x: number;
    y: number;
  }[];
  color: string | null;
  created_at?: string;
}

/**
 * Convert frontend Highlight to backend format
 */
function toBackendHighlight(
  highlight: Highlight,
  fileHash: string
): BackendHighlight | null {
  // Validate required fields
  if (!highlight.id || !highlight.pdfId || !fileHash || !highlight.text) {return null;
  }

  // Convert position to rects array (backend expects array of bounding boxes)
  const rects = [{
    x: highlight.position.x,
    y: highlight.position.y,
    width: highlight.position.width || 0,
    height: highlight.position.height || 0,
  }];

  return {
    id: highlight.id,
    document_id: highlight.pdfId,
    file_hash: fileHash,
    page_number: highlight.pageNumber || highlight.page || 0,
    text: highlight.text,
    rects: rects as any, // JSONB will handle the array
    color: highlight.color || null,
    created_at: highlight.createdAt || undefined,
  };
}

/**
 * Sync a single highlight to Supabase (upsert)
 * Non-blocking: logs errors but doesn't throw
 * 
 * @param highlight - Frontend highlight to sync
 * @param fileHash - File hash (required for backend)
 * @returns true if successful, false otherwise
 */
export async function syncHighlightToBackend(
  highlight: Highlight,
  fileHash: string
): Promise<boolean> {
  try {
    const backendHighlight = toBackendHighlight(highlight, fileHash);
    if (!backendHighlight) {
      return false;
    }

    // Upsert: insert if new, update if exists
    const { error } = await supabase
      .from("highlights")
      .upsert(backendHighlight, {
        onConflict: "id",
      });

    if (error) {return false;
    }return true;
  } catch (error) {return false;
  }
}

/**
 * Sync multiple highlights to Supabase (batch upsert)
 * Non-blocking: logs errors but doesn't throw
 * 
 * @param highlights - Array of frontend highlights to sync
 * @param fileHash - File hash (required for backend)
 * @returns Number of successfully synced highlights
 */
export async function syncHighlightsToBackend(
  highlights: Highlight[],
  fileHash: string
): Promise<number> {
  try {
    const backendHighlights = highlights
      .map((h) => toBackendHighlight(h, fileHash))
      .filter((h): h is BackendHighlight => h !== null);

    if (backendHighlights.length === 0) {
      return 0;
    }

    // Batch upsert
    const { error } = await supabase
      .from("highlights")
      .upsert(backendHighlights, {
        onConflict: "id",
      });

    if (error) {return 0;
    }return backendHighlights.length;
  } catch (error) {return 0;
  }
}

/**
 * Load highlights from Supabase (for recovery)
 * Used only when IndexedDB is empty or user explicitly restores
 * 
 * @param documentId - Document ID to load highlights for
 * @returns Array of frontend highlights or empty array on error
 */
export async function loadHighlightsFromBackend(documentId: string): Promise<Highlight[]> {
  try {
    const { data, error } = await supabase
      .from("highlights")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: true });

    if (error) {return [];
    }

    if (!data) {
      return [];
    }

    // Convert backend format to frontend format
    // Note: We need userId and projectId from context, so this is a simplified version
    // Full recovery would need to fetch document to get projectId
    const frontendHighlights: Highlight[] = data.map((row) => {
      const rect = row.rects?.[0] || { x: 0, y: 0, width: 0, height: 0 };
      return {
        id: row.id,
        userId: "", // Will be set by caller
        projectId: "", // Will be set by caller
        pdfId: row.document_id,
        pageNumber: row.page_number,
        text: row.text,
        position: {
          x: rect.x || 0,
          y: rect.y || 0,
          width: rect.width || 0,
          height: rect.height || 0,
        },
        color: (row.color as any) || "yellow",
        createdAt: row.created_at || new Date().toISOString(),
      };
    });return frontendHighlights;
  } catch (error) {return [];
  }
}
