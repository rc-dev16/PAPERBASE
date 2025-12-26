// Note data model with normalized coordinates

export interface NotePosition {
  x: number;      // 0-1, left position relative to page width
  y: number;      // 0-1, top position relative to page height
}

export interface Note {
  id: string;
  userId: string;
  projectId: string;
  pdfId: string;
  pageNumber: number;
  anchorType: 'highlight' | 'page'; // Note attached to highlight or free page position
  highlightId?: string | null; // If anchorType is 'highlight', reference the highlight
  position: NotePosition; // Normalized coordinates (0-1) for anchor point
  content: string;
  createdAt: string;
  updatedAt: string;
}
