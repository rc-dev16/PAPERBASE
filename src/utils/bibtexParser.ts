// BibTeX Parser and Auto-Fix Utility
// Rule-based normalization, no guessing

import {
  normalizeAuthors as normalizeAuthorsToStructured,
  buildBibTeXAuthors,
  normalizePageRanges,
  normalizeURLs,
  normalizeTextField,
  type NormalizedAuthor,
} from '@/utils/citationNormalizer';

export interface BibTeXEntry {
  type: string;
  key: string;
  fields: Record<string, string>;
}

export interface BibTeXValidation {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
}

/**
 * Required fields for each BibTeX entry type
 */
const REQUIRED_FIELDS: Record<string, string[]> = {
  article: ['title', 'author', 'journal', 'year'],
  inproceedings: ['title', 'author', 'booktitle', 'year'],
  book: ['title', 'author', 'publisher', 'year'],
  incollection: ['title', 'author', 'booktitle', 'year'],
  phdthesis: ['title', 'author', 'school', 'year'],
  mastersthesis: ['title', 'author', 'school', 'year'],
  techreport: ['title', 'author', 'institution', 'year'],
  misc: ['title'],
};

/**
 * Parse BibTeX string into structured object
 */
export const parseBibTeX = (bibtex: string): BibTeXEntry | null => {
  try {
    // Extract entry type and key
    const typeMatch = bibtex.match(/@(\w+)\{([^,]+),/);
    if (!typeMatch) return null;

    const type = typeMatch[1].toLowerCase();
    const key = typeMatch[2].trim();

    // Extract fields
    const fields: Record<string, string> = {};
    
    // Match field patterns: key = {value} or key = "value"
    const fieldRegex = /(\w+)\s*=\s*[{"]([^"}]+)[}"]/g;
    let match;
    
    while ((match = fieldRegex.exec(bibtex)) !== null) {
      const fieldKey = match[1].toLowerCase();
      const fieldValue = match[2].trim();
      fields[fieldKey] = fieldValue;
    }

    return { type, key, fields };
  } catch (error) {return null;
  }
};

/**
 * Normalize author names: Remove titles, format as Last, First
 * Uses the citation normalizer for consistency
 */
export const normalizeAuthors = (authorStr: string): string => {
  // Use the citation normalizer to get structured authors
  const normalizedAuthors = normalizeAuthorsToStructured(authorStr);
  
  // Build BibTeX format from structured data
  return buildBibTeXAuthors(normalizedAuthors);
};

/**
 * Fix page ranges: Convert to BibTeX format (double dash)
 */
export const normalizePages = (pages: string): string => {
  // BibTeX requires double dash
  return normalizePageRanges(pages, 'bibtex');
};

/**
 * Normalize URL: Ensure protocol exists
 */
export const normalizeURL = (url: string): string => {
  // Use the citation normalizer
  return normalizeURLs(url);
};

/**
 * Auto-fix BibTeX fields (rule-based only)
 * Normalizes RAW fields before formatting
 */
export const autoFixBibTeX = (entry: BibTeXEntry): BibTeXEntry => {
  const fixedFields: Record<string, string> = {};

  // Apply normalization to all fields
  Object.entries(entry.fields).forEach(([key, value]) => {
    if (!value) {
      fixedFields[key] = value;
      return;
    }

    let normalized = value;

    // Field-specific fixes (on RAW data)
    if (key === 'author') {
      // Normalize authors to structured format, then build BibTeX string
      normalized = normalizeAuthors(normalized);
    } else if (key === 'pages') {
      // BibTeX uses double dash
      normalized = normalizePages(normalized);
    } else if (key === 'url') {
      // Normalize URL (idempotent)
      normalized = normalizeURL(normalized);
    } else if (key === 'doi') {
      // Clean DOI text
      normalized = normalizeTextField(normalized);
    } else {
      // Apply general text normalization to other fields
      normalized = normalizeTextField(normalized);
    }

    fixedFields[key] = normalized;
  });

  return {
    ...entry,
    fields: fixedFields,
  };
};

/**
 * Validate BibTeX entry for required fields
 */
export const validateBibTeX = (entry: BibTeXEntry): BibTeXValidation => {
  const required = REQUIRED_FIELDS[entry.type] || [];
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  required.forEach((field) => {
    if (!entry.fields[field] || entry.fields[field].trim() === '') {
      missingFields.push(field);
    }
  });

  // Additional warnings
  if (entry.type === 'article' && !entry.fields.doi && !entry.fields.url) {
    warnings.push('Consider adding DOI or URL for better citation');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings,
  };
};

/**
 * Rebuild BibTeX string from entry
 */
export const buildBibTeX = (entry: BibTeXEntry): string => {
  const lines: string[] = [`@${entry.type}{${entry.key},`];

  // Sort fields: required first, then alphabetically
  const required = REQUIRED_FIELDS[entry.type] || [];
  const fieldKeys = Object.keys(entry.fields).sort((a, b) => {
    const aRequired = required.indexOf(a);
    const bRequired = required.indexOf(b);
    
    if (aRequired !== -1 && bRequired !== -1) {
      return aRequired - bRequired;
    }
    if (aRequired !== -1) return -1;
    if (bRequired !== -1) return 1;
    
    return a.localeCompare(b);
  });

  fieldKeys.forEach((key, index) => {
    const value = entry.fields[key];
    const comma = index < fieldKeys.length - 1 ? ',' : '';
    lines.push(`  ${key} = {${value}}${comma}`);
  });

  lines.push('}');

  return lines.join('\n');
};

/**
 * Parse, auto-fix, and rebuild BibTeX
 */
export const processBibTeX = (bibtex: string): {
  original: string;
  parsed: BibTeXEntry | null;
  fixed: BibTeXEntry | null;
  rebuilt: string;
  validation: BibTeXValidation | null;
} => {
  const parsed = parseBibTeX(bibtex);
  
  if (!parsed) {
    return {
      original: bibtex,
      parsed: null,
      fixed: null,
      rebuilt: bibtex,
      validation: null,
    };
  }

  const fixed = autoFixBibTeX(parsed);
  const rebuilt = buildBibTeX(fixed);
  const validation = validateBibTeX(fixed);

  return {
    original: bibtex,
    parsed,
    fixed,
    rebuilt,
    validation,
  };
};
