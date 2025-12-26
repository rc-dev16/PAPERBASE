// Highlight data model with normalized coordinates
export interface HighlightPosition {
  x: number;      // 0-1, left position relative to page width
  y: number;      // 0-1, top position relative to page height
  width: number; // 0-1, width relative to page width
  height: number; // 0-1, height relative to page height
}

export interface Highlight {
  id: string;
  userId: string;
  projectId: string;
  pdfId: string; // documentId
  pageNumber: number;
  text: string;
  position: HighlightPosition; // Normalized coordinates (0-1)
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'orange';
  note?: string;
  createdAt: string;
  // Legacy fields for backward compatibility
  documentId?: string;
  documentTitle?: string;
  page?: number;
  date?: string;
}
