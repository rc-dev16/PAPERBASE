// Trash Management Utilities
// Implements 10-day trash retention with opportunistic cleanup

import { deleteGlobalFile } from './globalFileStore';
import { deleteGlobalKnowledge } from './globalKnowledgeStore';
import { getNotesStorageKey, getProjectNotesStorageKey } from './noteStorage';
import { getHighlightsStorageKey, getProjectHighlightsStorageKey } from './highlightStorage';

// Trash retention period: 10 days in milliseconds
const TRASH_RETENTION_MS = 10 * 24 * 60 * 60 * 1000;

/**
 * Document interface with trash fields
 */
export interface TrashableDocument {
  id: string;
  fileHash?: string;
  deletedAt?: string;
  trashUntil?: string;
  [key: string]: any;
}

/**
 * Get trashUntil timestamp (now + 10 days)
 */
export const getTrashUntilDate = (): string => {
  const now = Date.now();
  const trashUntil = new Date(now + TRASH_RETENTION_MS);
  return trashUntil.toISOString();
};

/**
 * Check if document is active (not deleted)
 */
export const isActiveDocument = (doc: TrashableDocument): boolean => {
  return !doc.deletedAt;
};

/**
 * Check if document is in trash (deleted but not expired)
 */
export const isInTrash = (doc: TrashableDocument): boolean => {
  if (!doc.deletedAt) return false;
  if (!doc.trashUntil) return false; // Legacy: no trashUntil means expired
  
  const now = Date.now();
  const trashUntil = new Date(doc.trashUntil).getTime();
  return now < trashUntil;
};

/**
 * Check if document is expired (deleted and past trashUntil)
 */
export const isExpired = (doc: TrashableDocument): boolean => {
  if (!doc.deletedAt) return false;
  if (!doc.trashUntil) return true; // Legacy: no trashUntil means expired
  
  const now = Date.now();
  const trashUntil = new Date(doc.trashUntil).getTime();
  return now >= trashUntil;
};

/**
 * Filter active documents (for display)
 */
export const filterActiveDocuments = <T extends TrashableDocument>(docs: T[]): T[] => {
  return docs.filter(doc => isActiveDocument(doc));
};

/**
 * Filter documents in trash (for trash view)
 */
export const filterTrashDocuments = <T extends TrashableDocument>(docs: T[]): T[] => {
  return docs.filter(doc => isInTrash(doc));
};

/**
 * Filter expired documents (for cleanup)
 */
export const filterExpiredDocuments = <T extends TrashableDocument>(docs: T[]): T[] => {
  return docs.filter(doc => isExpired(doc));
};

/**
 * Check if fileHash is safe to hard delete (no active documents reference it)
 */
export const isFileHashSafeToDelete = (
  fileHash: string,
  allDocuments: TrashableDocument[]
): boolean => {
  if (!fileHash) return false;
  
  // Check if any ACTIVE document references this fileHash
  const activeDocsWithSameHash = allDocuments.filter(
    doc => doc.fileHash === fileHash && isActiveDocument(doc)
  );
  
  return activeDocsWithSameHash.length === 0;
};

/**
 * Delete document-related data (notes, highlights, citations)
 */
export const deleteDocumentRelatedData = (
  userId: string | undefined,
  projectId: string,
  documentId: string
): void => {
  if (!userId) return;
  
  try {
    // Delete notes for this document
    const notesKey = getNotesStorageKey(userId, projectId, documentId);
    window.localStorage.removeItem(notesKey);
    
    // Delete highlights for this document
    const highlightsKey = getHighlightsStorageKey(userId, projectId, documentId);
    window.localStorage.removeItem(highlightsKey);
    
    // Update project-wide notes/highlights to remove this document's data
    const projectNotesKey = getProjectNotesStorageKey(userId, projectId);
    const projectHighlightsKey = getProjectHighlightsStorageKey(userId, projectId);
    
    try {
      const projectNotes = window.localStorage.getItem(projectNotesKey);
      if (projectNotes) {
        const notes = JSON.parse(projectNotes);
        const filteredNotes = notes.filter((note: any) => note.pdfId !== documentId);
        window.localStorage.setItem(projectNotesKey, JSON.stringify(filteredNotes));
      }
      
      const projectHighlights = window.localStorage.getItem(projectHighlightsKey);
      if (projectHighlights) {
        const highlights = JSON.parse(projectHighlights);
        const filteredHighlights = highlights.filter((h: any) => h.pdfId !== documentId);
        window.localStorage.setItem(projectHighlightsKey, JSON.stringify(filteredHighlights));
      }
    } catch (error) {
      // Error updating project-wide notes/highlights
    }
    
    // Delete citations (stored per-project, not per-document in current implementation)
    // Citations are generated on-demand, so no cleanup needed
  } catch (error) {
    // Error deleting document related data
  }
};

/**
 * Hard delete a document (permanently remove it and related data)
 * Only safe if no active documents reference the fileHash
 */
export const hardDeleteDocument = async (
  doc: TrashableDocument,
  allDocuments: TrashableDocument[],
  userId: string | undefined,
  projectId: string
): Promise<boolean> => {
  try {
    // Safety check: only delete file if no active documents reference it
    if (doc.fileHash && isFileHashSafeToDelete(doc.fileHash, allDocuments)) {
      try {
        // Delete from global file store
        await deleteGlobalFile(doc.fileHash);
        // Delete from global knowledge store
        deleteGlobalKnowledge(doc.fileHash);
      } catch (error) {
        // Continue even if file deletion fails
      }
    } else if (doc.fileHash) {}
    
    // Always delete document-related data (notes, highlights, etc.)
    deleteDocumentRelatedData(userId, projectId, doc.id);
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Cleanup expired trash documents (opportunistic cleanup with backend)
 * Updates localStorage and returns number of documents cleaned up
 * 
 * This function now includes backend cleanup:
 * - Deletes files from Supabase Storage (if unreferenced)
 * - Deletes file rows from backend
 * - Deletes document rows from backend
 */
export const cleanupExpiredTrash = async (
  allDocuments: TrashableDocument[],
  userId: string | undefined,
  projectId: string
): Promise<number> => {
  // Import the enhanced cleanup function
  const { cleanupExpiredTrashWithBackend } = await import("./trashCleanup");
  return cleanupExpiredTrashWithBackend(allDocuments, userId, projectId);
};

/**
 * Restore document from trash (remove delete markers)
 */
export const restoreDocument = (doc: TrashableDocument): TrashableDocument => {
  const { deletedAt, trashUntil, ...rest } = doc;
  return rest as TrashableDocument;
};

/**
 * Restore multiple documents from trash
 */
export const restoreDocuments = (
  documents: TrashableDocument[],
  documentIds: string[]
): TrashableDocument[] => {
  return documents.map(doc => {
    if (documentIds.includes(doc.id)) {
      return restoreDocument(doc);
    }
    return doc;
  });
};


