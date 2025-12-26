/**
 * Upload PDF to Supabase Storage with deduplication and storage limit checks
 * 
 * Flow (CRITICAL ORDER):
 * 1. Check if file exists in DB (by fileHash) - DEDUP FIRST
 * 2. If exists → reuse existing storage_url (skip storage check)
 * 3. If not → check storage limits → upload PDF to Storage → insert metadata to DB
 * 
 * Storage path convention: files/<fileHash>.pdf
 * 
 * @param file - The PDF file to upload
 * @param fileHash - SHA-256 hash of the file (for deduplication)
 * @param supabaseClient - Optional authenticated Supabase client. If provided, uses RLS.
 *                        If not provided, uses default client (no RLS protection).
 * @returns The storage URL path (e.g., "files/abc123.pdf")
 * @throws Error if upload, storage limit exceeded, or DB insert fails
 */
import { supabase } from "@/lib/supabase";
import { canUploadFile } from "./storageUsage";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadPdfToSupabase(
  file: File,
  fileHash: string,
  supabaseClient?: SupabaseClient
): Promise<string> {
  const storagePath = `${fileHash}.pdf`;

  // Use provided authenticated client, or fall back to default
  const client = supabaseClient || supabase;

  // Debug: Log if we're using authenticated client
  if (supabaseClient) {} else {}

  // 1️⃣ Check if file already exists in DB (dedup)
  const { data: existing, error: selectError } = await client
    .from("files")
    .select("storage_url")
    .eq("file_hash", fileHash)
    .maybeSingle();

  if (selectError) {throw new Error(`Failed to check for existing file: ${selectError.message}`);
  }

  if (existing) {
    // ✅ Reuse existing file (no storage impact - skip storage check)return existing.storage_url;
  }

  // 2️⃣ Check storage limits (only for NEW files)
  // This prevents false blocking when reusing existing files
  const allowed = await canUploadFile(file);
  if (!allowed) {
    throw new Error("Storage limit reached. Clear Trash to free up space.");
  }

  // 3️⃣ Upload PDF to Supabase Storage// Use authenticated client with accessToken callback (works with Storage RLS)
  const { error: uploadError } = await client.storage
    .from("files")
    .upload(storagePath, file, {
      contentType: "application/pdf",
      upsert: false, // Never overwrite - files are immutable
    });

  if (uploadError) {// If RLS error, provide helpful message
    if (uploadError.message?.includes("row-level security") || uploadError.message?.includes("RLS")) {}
    
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  const storageUrl = `files/${storagePath}`;// 4️⃣ Insert file metadata into DB// Use authenticated client for DB insert (required for RLS on files table)
  const { error: insertError } = await client.from("files").insert({
    file_hash: fileHash,
    file_type: file.type,
    size: file.size,
    storage_url: storageUrl,
  });

  if (insertError) {// Note: File is already uploaded but metadata insert failed
    // This creates an orphaned file, but it's acceptable for now
    // We can clean up orphaned files later with a job
    throw new Error(`Failed to insert file metadata: ${insertError.message}`);
  }return storageUrl;
}

