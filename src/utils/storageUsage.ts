/**
 * Storage Usage Calculation for Supabase Storage
 * 
 * Backend storage = Supabase Storage PDFs only (not IndexedDB, not localStorage)
 * Single source of truth: SUM(size) FROM files table
 */

import { supabase } from "@/lib/supabase";

// Storage limit constants (Free Tier)
export const MAX_STORAGE_BYTES = 900 * 1024 * 1024; // 900 MB (buffer below 1 GB)
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB per PDF

/**
 * Get current storage usage from Supabase files table
 * Single source of truth: SUM(size) FROM files
 * 
 * @returns Total storage usage in bytes
 * @throws Error if query fails
 */
export async function getCurrentStorageUsage(): Promise<number> {
  const { data, error } = await supabase
    .from("files")
    .select("size");

  if (error) {throw new Error(`Failed to get storage usage: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return 0;
  }

  const totalBytes = data.reduce((total, row) => total + Number(row.size || 0), 0);return totalBytes;
}

/**
 * Check if a file can be uploaded based on size and storage limits
 * 
 * IMPORTANT: This should be called AFTER deduplication check.
 * If file already exists (same hash), skip this check entirely.
 * 
 * @param file - The file to check
 * @returns true if upload is allowed, false if storage limit would be exceeded
 * @throws Error if file is too large or query fails
 */
export async function canUploadFile(file: File): Promise<boolean> {
  // Check individual file size limit
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File exceeds the 25 MB limit.");
  }

  // Get current storage usage
  const currentUsage = await getCurrentStorageUsage();

  // Check if adding this file would exceed the limit
  if (currentUsage + file.size > MAX_STORAGE_BYTES) {
    return false;
  }

  return true;
}

/**
 * Format bytes to human-readable string
 * 
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "125.5 MB")
 */
export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Get storage usage percentage
 * 
 * @param currentUsage - Current usage in bytes
 * @returns Percentage (0-100)
 */
export function getStorageUsagePercentage(currentUsage: number): number {
  return Math.min(100, Math.round((currentUsage / MAX_STORAGE_BYTES) * 100));
}
