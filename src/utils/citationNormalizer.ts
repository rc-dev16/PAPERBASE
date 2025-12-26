// Citation Text Normalizer - Rule-based cleanup
// Applies to RAW metadata BEFORE formatting (not on formatted strings)

export interface NormalizedAuthor {
  first: string;
  last: string;
}

/**
 * Rule 1: Remove academic titles from text
 */
export const removeAcademicTitles = (text: string): string => {
  return text.replace(/\b(Dr\.?|Prof\.?|Mr\.?|Ms\.?|Mrs\.?|Miss\.?|Professor\.?)\b/gi, '').trim();
};

/**
 * Rule 2: Normalize page ranges
 * - For BibTeX: Use double dash (--)
 * - For other formats: Use en-dash (–)
 */
export const normalizePageRanges = (pages: string, format: 'bibtex' | 'other' = 'other'): string => {
  if (format === 'bibtex') {
    // BibTeX requires double dash
    return pages.replace(/(\d+)[–-](\d+)/g, '$1--$2');
  } else {
    // Other formats use en-dash
    return pages.replace(/(\d+)\s*-\s*(\d+)/g, '$1–$2');
  }
};

/**
 * Rule 3: Normalize URLs (IDEMPOTENT - safe to run multiple times)
 */
export const normalizeURLs = (url: string): string => {
  if (!url || !url.trim()) return url;
  
  const trimmed = url.trim();
  
  // If already has protocol, clean up duplicate protocols
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^(https?:\/\/)+/i, 'https://');
  }
  
  // Add https:// if missing
  return `https://${trimmed}`;
};

/**
 * Rule 4: Clean garbage characters (leading commas, spaces)
 */
export const cleanGarbageChars = (text: string): string => {
  return text
    .replace(/^[,\s]+/, '') // Remove leading commas and spaces
    .replace(/[,\s]+$/, '') // Remove trailing commas and spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim();
};

/**
 * FIX 1: Author Normalization (MOST IMPORTANT)
 * Normalize authors BEFORE formatting - creates structured data
 */
export const normalizeAuthors = (rawAuthors: string[] | string | null | undefined): NormalizedAuthor[] => {
  if (!rawAuthors) return [];
  
  // Convert to array if string
  let authorStrings: string[] = [];
  if (typeof rawAuthors === 'string') {
    // Split by comma or "and"
    authorStrings = rawAuthors.split(/,| and /i).map(s => s.trim()).filter(Boolean);
  } else {
    authorStrings = rawAuthors;
  }
  
  return authorStrings
    .map(author => {
      // Remove titles
      let cleaned = removeAcademicTitles(author);
      
      // Remove stray punctuation (but keep spaces and letters)
      cleaned = cleaned.replace(/[^\w\s]/g, ' ').trim();
      
      // Remove multiple spaces
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
      
      if (!cleaned) return null;
      
      const parts = cleaned.split(/\s+/).filter(p => p.length > 0);
      
      if (parts.length === 0) return null;
      
      if (parts.length === 1) {
        // Single name - assume it's last name
        return { first: '', last: parts[0] };
      }
      
      // Last part is last name, rest is first name
      return {
        first: parts.slice(0, -1).join(' '),
        last: parts[parts.length - 1],
      };
    })
    .filter((author): author is NormalizedAuthor => author !== null);
};

/**
 * Build author string for BibTeX format
 */
export const buildBibTeXAuthors = (authors: NormalizedAuthor[]): string => {
  return authors
    .map(a => {
      if (!a.first) return a.last;
      return `${a.last}, ${a.first}`;
    })
    .join(' and ');
};

/**
 * Build author string for APA format
 */
export const buildAPAAuthors = (authors: NormalizedAuthor[]): string => {
  if (authors.length === 0) return 'Unknown Author';
  if (authors.length === 1) {
    const a = authors[0];
    return a.first ? `${a.last}, ${a.first.charAt(0).toUpperCase()}.` : a.last;
  } else if (authors.length === 2) {
    const a1 = authors[0];
    const a2 = authors[1];
    const name1 = a1.first ? `${a1.last}, ${a1.first.charAt(0).toUpperCase()}.` : a1.last;
    const name2 = a2.first ? `${a2.last}, ${a2.first.charAt(0).toUpperCase()}.` : a2.last;
    return `${name1} & ${name2}`;
  } else {
    const formatted = authors.slice(0, -1).map(a => {
      return a.first ? `${a.last}, ${a.first.charAt(0).toUpperCase()}.` : a.last;
    });
    const last = authors[authors.length - 1];
    const lastFormatted = last.first ? `${last.last}, ${last.first.charAt(0).toUpperCase()}.` : last.last;
    return `${formatted.join(', ')}, & ${lastFormatted}`;
  }
};

/**
 * Build author string for IEEE format
 */
export const buildIEEEAuthors = (authors: NormalizedAuthor[]): string => {
  return authors
    .map(a => {
      if (!a.first) return a.last;
      const initials = a.first
        .split(/\s+/)
        .map(part => part.charAt(0).toUpperCase() + '.')
        .join(' ');
      return `${initials} ${a.last}`;
    })
    .join(', ');
};

/**
 * Build author string for MLA format
 */
export const buildMLAAuthors = (authors: NormalizedAuthor[]): string => {
  if (authors.length === 0) return 'Unknown Author';
  if (authors.length === 1) {
    const a = authors[0];
    return a.first ? `${a.last}, ${a.first}` : a.last;
  } else if (authors.length === 2) {
    const a1 = authors[0];
    const a2 = authors[1];
    const name1 = a1.first ? `${a1.last}, ${a1.first}` : a1.last;
    const name2 = a2.first ? `${a2.last}, ${a2.first}` : a2.last;
    return `${name1} and ${name2}`;
  } else {
    const formatted = authors.slice(0, -1).map(a => {
      return a.first ? `${a.last}, ${a.first}` : a.last;
    });
    const last = authors[authors.length - 1];
    const lastFormatted = last.first ? `${last.last}, ${last.first}` : last.last;
    return `${formatted.join(', ')}, and ${lastFormatted}`;
  }
};

/**
 * Apply text normalization to a single field
 */
export const normalizeTextField = (text: string): string => {
  if (!text) return text;
  let normalized = text;
  normalized = removeAcademicTitles(normalized);
  normalized = cleanGarbageChars(normalized);
  return normalized;
};
