// Utilities for persisting PDF notes with normalized coordinates

import type { Note } from '@/types/note';

/**
 * Get the storage key for notes
 */
export const getNotesStorageKey = (userId: string, projectId: string, pdfId: string): string => {
  return `notes_${userId}_${projectId}_${pdfId}`;
};

/**
 * Get the storage key for all notes in a project
 */
export const getProjectNotesStorageKey = (userId: string, projectId: string): string => {
  return `notes_${userId}_${projectId}_all`;
};

/**
 * Load notes from localStorage (instant, no delay)
 */
export const loadNotesFromStorage = (
  userId: string | undefined,
  projectId: string | undefined,
  pdfId?: string | undefined
): Note[] => {
  if (!userId || !projectId || typeof window === 'undefined') {
    return [];
  }

  try {
    if (pdfId) {
      // Load notes for specific PDF
      const key = getNotesStorageKey(userId, projectId, pdfId);
      const stored = window.localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as Note[];
      }
    } else {
      // Load all notes for project
      const key = getProjectNotesStorageKey(userId, projectId);
      const stored = window.localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as Note[];
      }
    }
  } catch (error) {}
  return [];
};

/**
 * Save notes to localStorage (instant save)
 */
export const saveNotesToStorage = (
  userId: string | undefined,
  projectId: string | undefined,
  notes: Note[]
): void => {
  if (!userId || !projectId || typeof window === 'undefined') {
    return;
  }

  try {
    // Save all notes for project
    const projectKey = getProjectNotesStorageKey(userId, projectId);
    window.localStorage.setItem(projectKey, JSON.stringify(notes));

    // Also save per-PDF for faster lookup
    const notesByPdf = notes.reduce((acc, note) => {
      if (!acc[note.pdfId]) {
        acc[note.pdfId] = [];
      }
      acc[note.pdfId].push(note);
      return acc;
    }, {} as Record<string, Note[]>);

    Object.entries(notesByPdf).forEach(([pdfId, pdfNotes]) => {
      const pdfKey = getNotesStorageKey(userId, projectId, pdfId);
      window.localStorage.setItem(pdfKey, JSON.stringify(pdfNotes));
    });} catch (error) {}
};

/**
 * Add a single note to storage
 */
export const addNoteToStorage = (
  userId: string | undefined,
  projectId: string | undefined,
  note: Note
): Note[] => {
  const existing = loadNotesFromStorage(userId, projectId);
  const updated = [...existing, note];
  saveNotesToStorage(userId, projectId, updated);
  return updated;
};

/**
 * Update a note in storage
 */
export const updateNoteInStorage = (
  userId: string | undefined,
  projectId: string | undefined,
  noteId: string,
  updates: Partial<Note>
): Note[] => {
  const existing = loadNotesFromStorage(userId, projectId);
  const updated = existing.map((note) =>
    note.id === noteId
      ? { ...note, ...updates, updatedAt: new Date().toISOString() }
      : note
  );
  saveNotesToStorage(userId, projectId, updated);
  return updated;
};

/**
 * Delete a note from storage
 */
export const deleteNoteFromStorage = (
  userId: string | undefined,
  projectId: string | undefined,
  noteId: string
): Note[] => {
  const existing = loadNotesFromStorage(userId, projectId);
  const updated = existing.filter((n) => n.id !== noteId);
  saveNotesToStorage(userId, projectId, updated);
  return updated;
};
