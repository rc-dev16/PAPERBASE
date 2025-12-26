// Utilities for persisting PDF highlights with normalized coordinates

import type { Highlight } from '@/types/highlight';

/**
 * Get the storage key for highlights
 */
export const getHighlightsStorageKey = (userId: string, projectId: string, pdfId: string): string => {
  return `highlights_${userId}_${projectId}_${pdfId}`;
};

/**
 * Get the storage key for all highlights in a project
 */
export const getProjectHighlightsStorageKey = (userId: string, projectId: string): string => {
  return `highlights_${userId}_${projectId}_all`;
};

/**
 * Load highlights from localStorage (instant, no delay)
 */
export const loadHighlightsFromStorage = (
  userId: string | undefined,
  projectId: string | undefined,
  pdfId?: string | undefined
): Highlight[] => {
  if (!userId || !projectId || typeof window === 'undefined') {
    return [];
  }

  try {
    if (pdfId) {
      // Load highlights for specific PDF
      const key = getHighlightsStorageKey(userId, projectId, pdfId);
      const stored = window.localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as Highlight[];
      }
    } else {
      // Load all highlights for project
      const key = getProjectHighlightsStorageKey(userId, projectId);
      const stored = window.localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as Highlight[];
      }
    }
  } catch (error) {}
  return [];
};

/**
 * Save highlights to localStorage (instant save)
 */
export const saveHighlightsToStorage = (
  userId: string | undefined,
  projectId: string | undefined,
  highlights: Highlight[]
): void => {
  if (!userId || !projectId || typeof window === 'undefined') {
    return;
  }

  try {
    // Save all highlights for project
    const projectKey = getProjectHighlightsStorageKey(userId, projectId);
    window.localStorage.setItem(projectKey, JSON.stringify(highlights));

    // Also save per-PDF for faster lookup
    const highlightsByPdf = highlights.reduce((acc, highlight) => {
      if (!acc[highlight.pdfId]) {
        acc[highlight.pdfId] = [];
      }
      acc[highlight.pdfId].push(highlight);
      return acc;
    }, {} as Record<string, Highlight[]>);

    Object.entries(highlightsByPdf).forEach(([pdfId, pdfHighlights]) => {
      const pdfKey = getHighlightsStorageKey(userId, projectId, pdfId);
      window.localStorage.setItem(pdfKey, JSON.stringify(pdfHighlights));
    });} catch (error) {}
};

/**
 * Add a single highlight to storage
 */
export const addHighlightToStorage = (
  userId: string | undefined,
  projectId: string | undefined,
  highlight: Highlight
): Highlight[] => {
  const existing = loadHighlightsFromStorage(userId, projectId);
  const updated = [...existing, highlight];
  saveHighlightsToStorage(userId, projectId, updated);
  return updated;
};

/**
 * Delete a highlight from storage
 */
export const deleteHighlightFromStorage = (
  userId: string | undefined,
  projectId: string | undefined,
  highlightId: string
): Highlight[] => {
  const existing = loadHighlightsFromStorage(userId, projectId);
  const updated = existing.filter((h) => h.id !== highlightId);
  saveHighlightsToStorage(userId, projectId, updated);
  return updated;
};
