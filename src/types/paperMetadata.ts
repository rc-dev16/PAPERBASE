// Canonical metadata structure for citations
// This is the single source of truth - extracted once, reused everywhere

export interface PaperMetadata {
  pdfId: string;
  title?: string | null;
  authors?: string[] | null;
  abstract?: string | null;
  year?: number | null;
  venue?: string | null; // journal, conference, etc.
  doi?: string | null;
  url?: string | null;
  publisher?: string | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
  place?: string | null;
  itemType?: string | null; // journalArticle, conferencePaper, book, etc.
  conferenceName?: string | null;
  proceedingsTitle?: string | null;
}
