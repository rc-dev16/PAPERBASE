/**
 * Project Sync to Supabase Backend
 * 
 * Mirrors localStorage projects to Supabase for cross-device recovery.
 * IndexedDB/localStorage is the source of truth - backend is backup only.
 * 
 * Non-blocking: failures are logged but don't stop the app.
 * 
 * 🔐 Authentication: Pass an authenticated Supabase client (from useSupabaseClient hook)
 * for RLS-protected operations. If not provided, uses default client (no RLS).
 */

import { supabase } from "@/lib/supabase";
import type { Project } from "@/lib/mockData";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Backend project row (matches Supabase schema)
 */
interface BackendProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at?: string;
  last_accessed?: string;
}

/**
 * Convert frontend Project to backend format
 */
function toBackendProject(project: Project, userId: string): BackendProject | null {
  // Validate required fields
  if (!project.id || !project.name || !userId) {return null;
  }

  return {
    id: project.id,
    user_id: userId,
    name: project.name,
    description: project.description || null,
    created_at: project.createdAt instanceof Date 
      ? project.createdAt.toISOString() 
      : typeof project.createdAt === 'string' 
        ? project.createdAt 
        : undefined,
    last_accessed: project.lastAccessed instanceof Date
      ? project.lastAccessed.toISOString()
      : typeof project.lastAccessed === 'string'
        ? project.lastAccessed
        : undefined,
  };
}

/**
 * Sync a single project to Supabase (upsert)
 * Non-blocking: logs errors but doesn't throw
 * 
 * @param project - Frontend project to sync
 * @param userId - User ID (required for backend)
 * @param supabaseClient - Optional authenticated Supabase client. If provided, uses RLS.
 *                        If not provided, uses default client (no RLS protection).
 * @returns true if successful, false otherwise
 */
export async function syncProjectToBackend(
  project: Project,
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<boolean> {
  try {
    if (!userId) {return false;
    }

    const backendProject = toBackendProject(project, userId);
    if (!backendProject) {
      return false;
    }

    // Use provided authenticated client, or fall back to default
    const client = supabaseClient || supabase;

    // Debug: Log if we're using authenticated client
    if (supabaseClient) {} else {}

    // Upsert: insert if new, update if exists
    // If authenticated client is used, RLS will enforce user_id = auth.jwt()->>'sub'
    const { error } = await client
      .from("projects")
      .upsert(backendProject, {
        onConflict: "id",
      });

    if (error) {// If 401 error, provide helpful message
      if (error.code === "PGRST301" || error.message?.includes("401")) {}
      
      return false;
    }return true;
  } catch (error) {return false;
  }
}

/**
 * Sync multiple projects to Supabase (batch upsert)
 * Non-blocking: logs errors but doesn't throw
 * 
 * @param projects - Array of frontend projects to sync
 * @param userId - User ID (required for backend)
 * @param supabaseClient - Optional authenticated Supabase client. If provided, uses RLS.
 *                        If not provided, uses default client (no RLS protection).
 * @returns Number of successfully synced projects
 */
export async function syncProjectsToBackend(
  projects: Project[],
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<number> {
  try {
    if (!userId) {return 0;
    }

    const backendProjects = projects
      .map((p) => toBackendProject(p, userId))
      .filter((p): p is BackendProject => p !== null);

    if (backendProjects.length === 0) {
      return 0;
    }

    // Use provided authenticated client, or fall back to default
    const client = supabaseClient || supabase;

    // Batch upsert
    // If authenticated client is used, RLS will enforce user_id = auth.jwt()->>'sub'
    const { error } = await client
      .from("projects")
      .upsert(backendProjects, {
        onConflict: "id",
      });

    if (error) {return 0;
    }return backendProjects.length;
  } catch (error) {return 0;
  }
}

/**
 * Update project's last_accessed timestamp
 * Non-blocking: logs errors but doesn't throw
 * 
 * @param projectId - Project ID
 * @param userId - User ID
 * @param supabaseClient - Optional authenticated Supabase client. If provided, uses RLS.
 *                        If not provided, uses default client (no RLS protection).
 * @returns true if successful, false otherwise
 */
export async function updateProjectLastAccessed(
  projectId: string,
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<boolean> {
  try {
    if (!userId) {
      return false;
    }

    // Use provided authenticated client, or fall back to default
    const client = supabaseClient || supabase;

    // Update last_accessed
    // If authenticated client is used, RLS will enforce user_id = auth.jwt()->>'sub'
    // The .eq("user_id", userId) is still needed for the default client path
    const { error } = await client
      .from("projects")
      .update({
        last_accessed: new Date().toISOString(),
      })
      .eq("id", projectId)
      .eq("user_id", userId);

    if (error) {return false;
    }

    return true;
  } catch (error) {return false;
  }
}

/**
 * Load projects from Supabase (for recovery)
 * Used only when IndexedDB is empty or user explicitly restores
 * 
 * @param userId - User ID
 * @param supabaseClient - Optional authenticated Supabase client. If provided, uses RLS.
 *                        If not provided, uses default client (no RLS protection).
 * @returns Array of frontend projects or empty array on error
 */
export async function loadProjectsFromBackend(
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<Project[]> {
  try {
    if (!userId) {return [];
    }

    // Use provided authenticated client, or fall back to default
    const client = supabaseClient || supabase;

    // Load projects
    // If authenticated client is used, RLS will automatically filter by user_id
    // The .eq("user_id", userId) is still needed for the default client path
    const { data, error } = await client
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("last_accessed", { ascending: false });

    if (error) {return [];
    }

    if (!data) {
      return [];
    }

    // Convert backend format to frontend format
    const frontendProjects: Project[] = data.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || "",
      paperCount: 0, // Will be recalculated when documents are loaded
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      lastAccessed: row.last_accessed ? new Date(row.last_accessed) : new Date(),
    }));return frontendProjects;
  } catch (error) {return [];
  }
}

/**
 * Delete a project from Supabase backend
 * 
 * @param projectId - Project ID to delete
 * @param userId - User ID (for RLS verification)
 * @param supabaseClient - Optional authenticated Supabase client. If provided, uses RLS.
 *                        If not provided, uses default client (no RLS protection).
 * @returns true if successful, false otherwise
 */
export async function deleteProjectFromBackend(
  projectId: string,
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<boolean> {
  try {
    if (!projectId || !userId) {return false;
    }

    // Use provided authenticated client, or fall back to default
    const client = supabaseClient || supabase;

    // Delete project from backend
    // If authenticated client is used, RLS will ensure user can only delete their own projects
    const { error } = await client
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", userId);

    if (error) {return false;
    }return true;
  } catch (error) {return false;
  }
}

