// Utility for persisting PDF zoom levels per document

/**
 * Get the storage key for a document's zoom level
 */
export const getZoomStorageKey = (userId: string, projectId: string, documentId: string): string => {
  return `zoom_${userId}_${projectId}_${documentId}`;
};

/**
 * Load zoom level from localStorage
 */
export const loadZoomFromStorage = (
  userId: string | undefined,
  projectId: string | undefined,
  documentId: string | undefined
): number => {
  if (!userId || !projectId || !documentId || typeof window === 'undefined') {
    return 1.0;
  }

  try {
    const key = getZoomStorageKey(userId, projectId, documentId);
    const stored = window.localStorage.getItem(key);
    if (stored) {
      const zoom = parseFloat(stored);
      if (!isNaN(zoom) && zoom >= 0.25 && zoom <= 3.0) {
        return zoom;
      }
    }
  } catch (error) {}
  return 1.0;
};

/**
 * Save zoom level to localStorage
 */
export const saveZoomToStorage = (
  userId: string | undefined,
  projectId: string | undefined,
  documentId: string | undefined,
  zoom: number
): void => {
  if (!userId || !projectId || !documentId || typeof window === 'undefined') {
    return;
  }

  try {
    const key = getZoomStorageKey(userId, projectId, documentId);
    window.localStorage.setItem(key, zoom.toString());} catch (error) {}
};
