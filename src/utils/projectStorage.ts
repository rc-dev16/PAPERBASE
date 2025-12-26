/**
 * Project Storage Utilities
 * 
 * Provides user-specific storage key generation for projects.
 * This ensures each user's projects are stored separately in localStorage.
 */

/**
 * Generate a user-specific storage key for projects
 * @param userId - User ID (from Clerk)
 * @returns Storage key string
 */
export const getProjectsStorageKey = (userId: string): string => {
  return `paperbase-projects-${userId}`;
};

