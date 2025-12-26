// Settings Storage - Manages user preferences
// Uses localStorage for instant load, with backend sync capability

export interface UserSettings {
  // Citation preferences
  defaultCitationFormat: 'APA' | 'IEEE' | 'MLA' | 'BibTeX';
  citationExportFormat: 'txt' | 'bib' | 'rtf';
  
  // Highlight preferences
  defaultHighlightColor: string;
  
  // PDF viewer preferences
  defaultZoomLevel: number;
  
  // Auto-save preferences
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // in seconds
  
  // Export preferences
  exportFormat: 'txt' | 'json' | 'csv';
  includeMetadata: boolean;
  
  // Data sync preferences
  syncToCloud: boolean;
  syncInterval: number; // in seconds
  
  // UI preferences
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'auto';
  
  // Notification preferences
  showNotifications: boolean;
  highlightNotifications: boolean;
  noteNotifications: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  defaultCitationFormat: 'APA',
  citationExportFormat: 'txt',
  defaultHighlightColor: '#FFEB3B',
  defaultZoomLevel: 1.0,
  autoSaveEnabled: true,
  autoSaveInterval: 5,
  exportFormat: 'txt',
  includeMetadata: true,
  syncToCloud: true,
  syncInterval: 30,
  sidebarCollapsed: false,
  theme: 'light',
  showNotifications: true,
  highlightNotifications: true,
  noteNotifications: true,
};

const SETTINGS_STORAGE_KEY = 'paperbase-user-settings';

/**
 * Get settings storage key for a user
 */
export const getSettingsStorageKey = (userId: string): string => {
  return `${SETTINGS_STORAGE_KEY}-${userId}`;
};

/**
 * Load settings from localStorage
 */
export const loadSettingsFromStorage = (userId: string): UserSettings => {
  try {
    const key = getSettingsStorageKey(userId);
    const stored = localStorage.getItem(key);
    
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle new settings fields
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    // Error loading settings
  }
  
  return { ...DEFAULT_SETTINGS };
};

/**
 * Save settings to localStorage
 */
export const saveSettingsToStorage = (userId: string, settings: UserSettings): void => {
  try {
    const key = getSettingsStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (error) {
    // Error saving settings
  }
};

/**
 * Update a specific setting
 */
export const updateSetting = <K extends keyof UserSettings>(
  userId: string,
  key: K,
  value: UserSettings[K]
): void => {
  const current = loadSettingsFromStorage(userId);
  const updated = { ...current, [key]: value };
  saveSettingsToStorage(userId, updated);
};

/**
 * Reset settings to defaults
 */
export const resetSettingsToDefaults = (userId: string): void => {
  saveSettingsToStorage(userId, { ...DEFAULT_SETTINGS });
};

/**
 * Sync settings to backend
 */
export const syncSettingsToBackend = async (userId: string, settings: UserSettings): Promise<void> => {
  try {
    // Sync settings to backend
  } catch (error) {
    // Error syncing settings
  }
};
