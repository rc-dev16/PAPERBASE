/**
 * Note Sync to Supabase Backend
 * 
 * Mirrors localStorage notes to Supabase for durability & recovery.
 * IndexedDB/localStorage is the source of truth - backend is backup only.
 * 
 * Non-blocking: failures are logged but don't stop the app.
 */

import { supabase } from "@/lib/supabase";
import type { Note } from "@/types/note";

/**
 * Backend note row (matches Supabase schema)
 */
interface BackendNote {
  id: string;
  document_id: string;
  highlight_id: string | null;
  content: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Convert frontend Note to backend format
 */
function toBackendNote(note: Note): BackendNote | null {
  // Validate required fields
  if (!note.id || !note.pdfId || !note.content) {return null;
  }

  return {
    id: note.id,
    document_id: note.pdfId,
    highlight_id: note.highlightId || null,
    content: note.content,
    created_at: note.createdAt || undefined,
    updated_at: note.updatedAt || undefined,
  };
}

/**
 * Sync a single note to Supabase (upsert)
 * Non-blocking: logs errors but doesn't throw
 * 
 * @param note - Frontend note to sync
 * @returns true if successful, false otherwise
 */
export async function syncNoteToBackend(note: Note): Promise<boolean> {
  try {
    const backendNote = toBackendNote(note);
    if (!backendNote) {
      return false;
    }

    // Upsert: insert if new, update if exists
    const { error } = await supabase
      .from("notes")
      .upsert(backendNote, {
        onConflict: "id",
      });

    if (error) {return false;
    }return true;
  } catch (error) {return false;
  }
}

/**
 * Sync multiple notes to Supabase (batch upsert)
 * Non-blocking: logs errors but doesn't throw
 * 
 * @param notes - Array of frontend notes to sync
 * @returns Number of successfully synced notes
 */
export async function syncNotesToBackend(notes: Note[]): Promise<number> {
  try {
    const backendNotes = notes
      .map(toBackendNote)
      .filter((n): n is BackendNote => n !== null);

    if (backendNotes.length === 0) {
      return 0;
    }

    // Batch upsert
    const { error } = await supabase
      .from("notes")
      .upsert(backendNotes, {
        onConflict: "id",
      });

    if (error) {return 0;
    }return backendNotes.length;
  } catch (error) {return 0;
  }
}

/**
 * Load notes from Supabase (for recovery)
 * Used only when IndexedDB is empty or user explicitly restores
 * 
 * @param documentId - Document ID to load notes for
 * @returns Array of frontend notes or empty array on error
 */
export async function loadNotesFromBackend(documentId: string): Promise<Note[]> {
  try {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: true });

    if (error) {return [];
    }

    if (!data) {
      return [];
    }

    // Convert backend format to frontend format
    // Note: We need userId, projectId, pageNumber, anchorType, and position from context
    // Full recovery would need to fetch document to get these
    const frontendNotes: Note[] = data.map((row) => ({
      id: row.id,
      userId: "", // Will be set by caller
      projectId: "", // Will be set by caller
      pdfId: row.document_id,
      pageNumber: 0, // Will be set by caller or from document
      anchorType: row.highlight_id ? "highlight" : "page",
      highlightId: row.highlight_id || null,
      position: { x: 0, y: 0 }, // Will be set by caller or from highlight
      content: row.content,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    }));return frontendNotes;
  } catch (error) {return [];
  }
}
