// Global File Knowledge Store - Stores Gemini-extracted metadata by file hash
// This prevents duplicate API calls for the same document across projects

import type { ExtractedPDFData } from './pdfExtraction';

const STORAGE_KEY = 'paperbase-global-knowledge';

export interface GlobalFileKnowledge {
  fileHash: string;
  metadata: ExtractedPDFData;
  extractedAt: string;
}

/**
 * Check if knowledge exists for a file hash
 */
export const hasGlobalKnowledge = (fileHash: string): boolean => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    
    const knowledge = JSON.parse(stored) as Record<string, GlobalFileKnowledge>;
    return !!knowledge[fileHash];
  } catch (error) {return false;
  }
};

/**
 * Get knowledge for a file hash
 */
export const getGlobalKnowledge = (fileHash: string): GlobalFileKnowledge | null => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const knowledge = JSON.parse(stored) as Record<string, GlobalFileKnowledge>;
    return knowledge[fileHash] || null;
  } catch (error) {return null;
  }
};

/**
 * Save knowledge for a file hash
 */
export const saveGlobalKnowledge = (fileHash: string, metadata: ExtractedPDFData): void => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const knowledge = stored ? (JSON.parse(stored) as Record<string, GlobalFileKnowledge>) : {};
    
    knowledge[fileHash] = {
      fileHash,
      metadata,
      extractedAt: new Date().toISOString(),
    };
    
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(knowledge));} catch (error) {throw error;
  }
};

/**
 * Delete knowledge for a file hash
 */
export const deleteGlobalKnowledge = (fileHash: string): void => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const knowledge = JSON.parse(stored) as Record<string, GlobalFileKnowledge>;
    delete knowledge[fileHash];
    
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(knowledge));} catch (error) {}
};

