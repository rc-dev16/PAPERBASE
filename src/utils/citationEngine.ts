// Citation Engine - Generates citations from metadata (no AI needed)
// Citations are deterministic based on metadata

import type { PaperMetadata } from '@/types/paperMetadata';
import {
  normalizeAuthors,
  buildAPAAuthors,
  buildIEEEAuthors,
  buildMLAAuthors,
  buildBibTeXAuthors,
  normalizePageRanges,
  normalizeURLs,
  normalizeTextField,
  type NormalizedAuthor,
} from '@/utils/citationNormalizer';

export type CitationFormat = 'APA' | 'IEEE' | 'MLA' | 'BibTeX';

/**
 * Normalize metadata BEFORE formatting (CRITICAL - must happen first)
 * This is the correct pipeline: Raw → Normalize → Format
 * 
 * All fixing, cleaning, and normalization happens here.
 * Formatters receive clean, structured data and ONLY format.
 */
interface NormalizedMetadata {
  authors: NormalizedAuthor[];
  title: string;
  venue: string;
  pages: string; // Already normalized to en-dash for APA/IEEE/MLA
  url: string;
  doi: string;
  volume: string;
  issue: string;
  publisher: string;
  year: number | null;
  place: string;
}

const normalizeMetadata = (meta: PaperMetadata): NormalizedMetadata => {
  // Normalize authors to structured format (from raw string array)
  const authors = normalizeAuthors(meta.authors);
  
  // Normalize ALL text fields (remove titles, clean garbage)
  const title = normalizeTextField(meta.title || '');
  const venue = normalizeTextField(
    meta.venue || meta.conferenceName || meta.proceedingsTitle || ''
  );
  // Pages normalized to en-dash (APA/IEEE/MLA format)
  // BibTeX formatter will convert to double dash
  const pages = meta.pages ? normalizePageRanges(meta.pages, 'other') : '';
  const url = meta.url ? normalizeURLs(meta.url) : '';
  const doi = meta.doi ? normalizeTextField(meta.doi) : '';
  const volume = meta.volume ? normalizeTextField(meta.volume) : '';
  const issue = meta.issue ? normalizeTextField(meta.issue) : '';
  const publisher = meta.publisher ? normalizeTextField(meta.publisher) : '';
  const place = meta.place ? normalizeTextField(meta.place) : '';
  
  return {
    authors,
    title,
    venue,
    pages,
    url,
    doi,
    volume,
    issue,
    publisher,
    year: meta.year || null,
    place,
  };
};

/**
 * APA Formatter - ONLY formats, no fixing
 * Rules: Last, F. & Last, F. | Year in parentheses | Sentence-case title | URL at end
 */
const formatAPA = (m: NormalizedMetadata): string => {
  const parts: string[] = [];

  // Authors: Last, F. & Last, F.
  const authors = buildAPAAuthors(m.authors);
  parts.push(authors);

  // Year in parentheses
  if (m.year) {
    parts.push(`(${m.year})`);
  } else {
    parts.push('(n.d.)');
  }

  // Title: sentence-case (convert to lowercase, capitalize first letter)
  if (m.title) {
    const sentenceCase = m.title.charAt(0).toUpperCase() + m.title.slice(1).toLowerCase();
    parts.push(sentenceCase + '.');
  }

  // Venue
  if (m.venue) {
    parts.push(m.venue + '.');
  }

  // Volume
  if (m.volume) {
    parts.push(m.volume + ',');
  }

  // Pages (en-dash already applied)
  if (m.pages) {
    parts.push(m.pages + '.');
  }

  // URL at end
  if (m.doi) {
    parts.push(`https://doi.org/${m.doi}`);
  } else if (m.url) {
    parts.push(m.url);
  }

  return parts.join(' ');
};

/**
 * Generate APA citation
 */
export const generateAPACitation = (meta: PaperMetadata): string => {
  const normalized = normalizeMetadata(meta);
  return formatAPA(normalized);
};

/**
 * IEEE Formatter - ONLY formats, no fixing
 * Rules: F. Last and F. Last | Quoted title | Year at end
 */
const formatIEEE = (m: NormalizedMetadata): string => {
  const parts: string[] = [];

  // Authors: F. Last and F. Last
  const authors = buildIEEEAuthors(m.authors);
  if (authors) {
    parts.push(authors + ',');
  }

  // Title: quoted
  if (m.title) {
    parts.push(`"${m.title},"`);
  }

  // Venue
  if (m.venue) {
    parts.push(m.venue + ',');
  }

  // Volume
  if (m.volume) {
    parts.push(`vol. ${m.volume},`);
  }

  // Issue
  if (m.issue) {
    parts.push(`no. ${m.issue},`);
  }

  // Pages (en-dash already applied)
  if (m.pages) {
    parts.push(`pp. ${m.pages},`);
  }

  // Year at end
  if (m.year) {
    parts.push(`${m.year}.`);
  }

  // DOI
  if (m.doi) {
    parts.push(`doi: ${m.doi}.`);
  }

  return parts.join(' ');
};

/**
 * Generate IEEE citation
 */
export const generateIEEECitation = (meta: PaperMetadata): string => {
  const normalized = normalizeMetadata(meta);
  return formatIEEE(normalized);
};

/**
 * MLA Formatter - ONLY formats, no fixing
 * Rules: Last, First, and First Last | Title in quotes | URL at end
 */
const formatMLA = (m: NormalizedMetadata): string => {
  const parts: string[] = [];

  // Authors: Last, First, and First Last
  const authors = buildMLAAuthors(m.authors);
  if (authors) {
    parts.push(authors + '.');
  }

  // Title: in quotes
  if (m.title) {
    parts.push(`"${m.title}."`);
  }

  // Venue
  if (m.venue) {
    parts.push(m.venue + ',');
  }

  // Volume
  if (m.volume) {
    parts.push(`vol. ${m.volume},`);
  }

  // Issue
  if (m.issue) {
    parts.push(`no. ${m.issue},`);
  }

  // Year
  if (m.year) {
    parts.push(`${m.year},`);
  }

  // Pages (en-dash already applied)
  if (m.pages) {
    parts.push(`pp. ${m.pages}.`);
  }

  // URL at end
  if (m.doi) {
    parts.push(`doi:${m.doi}.`);
  } else if (m.url) {
    parts.push(m.url + '.');
  }

  return parts.join(' ');
};

/**
 * Generate MLA citation
 */
export const generateMLACitation = (meta: PaperMetadata): string => {
  const normalized = normalizeMetadata(meta);
  return formatMLA(normalized);
};

/**
 * BibTeX Formatter - ONLY formats, no fixing
 * Rules: Double hyphen in pages | Last, First with and
 */
const formatBibTeX = (m: NormalizedMetadata, entryType: string, citationKey: string): string => {
  const lines: string[] = [`@${entryType}{${citationKey},`];

  // Title
  if (m.title) {
    lines.push(`  title   = {${m.title}},`);
  }

  // Authors: Last, First with and (built from structured data)
  if (m.authors.length > 0) {
    const authors = buildBibTeXAuthors(m.authors);
    lines.push(`  author  = {${authors}},`);
  }

  // Journal/Booktitle
  if (m.venue) {
    if (entryType === 'inproceedings') {
      lines.push(`  booktitle = {${m.venue}},`);
    } else {
      lines.push(`  journal = {${m.venue}},`);
    }
  }

  // Volume
  if (m.volume) {
    lines.push(`  volume  = {${m.volume}},`);
  }

  // Pages: Convert en-dash to double dash (BibTeX requirement)
  if (m.pages) {
    const bibtexPages = m.pages.replace(/–/g, '--'); // Convert en-dash to double dash
    lines.push(`  pages   = {${bibtexPages}},`);
  }

  // Year
  if (m.year) {
    lines.push(`  year    = {${m.year}},`);
  }

  // Publisher
  if (m.publisher) {
    lines.push(`  publisher = {${m.publisher}},`);
  }

  // URL
  if (m.url) {
    lines.push(`  url     = {${m.url}}`);
  }

  // DOI
  if (m.doi) {
    lines.push(`  doi     = {${m.doi}}`);
  }

  lines.push('}');

  return lines.join('\n');
};

/**
 * Generate BibTeX citation
 */
export const generateBibTeXCitation = (meta: PaperMetadata): string => {
  const normalized = normalizeMetadata(meta);
  
  // Determine entry type
  let entryType = 'article';
  if (meta.itemType) {
    if (meta.itemType.includes('conference') || meta.itemType.includes('proceeding')) {
      entryType = 'inproceedings';
    } else if (meta.itemType.includes('book')) {
      entryType = 'book';
    }
  } else if (meta.conferenceName || meta.proceedingsTitle) {
    entryType = 'inproceedings';
  }

  // Generate citation key from first author and year
  let citationKey = 'citation';
  if (normalized.authors.length > 0 && normalized.year) {
    citationKey = `${normalized.authors[0].last.toLowerCase()}${normalized.year}`;
  } else if (normalized.authors.length > 0) {
    citationKey = normalized.authors[0].last.toLowerCase();
  }

  return formatBibTeX(normalized, entryType, citationKey);
};

/**
 * Generate citation in specified format
 */
export const generateCitation = (meta: PaperMetadata, format: CitationFormat): string => {
  switch (format) {
    case 'APA':
      return generateAPACitation(meta);
    case 'IEEE':
      return generateIEEECitation(meta);
    case 'MLA':
      return generateMLACitation(meta);
    case 'BibTeX':
      return generateBibTeXCitation(meta);
    default:
      return generateAPACitation(meta);
  }
};

/**
 * Convert Document metadata to PaperMetadata format
 */
export const documentToPaperMetadata = (doc: {
  id: string;
  title?: string | null;
  authors?: string[] | null;
  abstract?: string | null;
  year?: number | null;
  journal?: string | null;
  conferenceName?: string | null;
  proceedingsTitle?: string | null;
  doi?: string | null;
  url?: string | null;
  publisher?: string | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
  place?: string | null;
  itemType?: string | null;
}): PaperMetadata => {
  return {
    pdfId: doc.id,
    title: doc.title,
    authors: doc.authors,
    abstract: doc.abstract,
    year: doc.year,
    venue: doc.journal || doc.conferenceName || doc.proceedingsTitle || null,
    doi: doc.doi,
    url: doc.url,
    publisher: doc.publisher,
    volume: doc.volume,
    issue: doc.issue,
    pages: doc.pages,
    place: doc.place,
    itemType: doc.itemType,
    conferenceName: doc.conferenceName,
    proceedingsTitle: doc.proceedingsTitle,
  };
};

