import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Highlighter, StickyNote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { loadZoomFromStorage, saveZoomToStorage } from '@/utils/zoomStorage';
import { loadSettingsFromStorage } from '@/utils/settingsStorage';
import type { Highlight, HighlightPosition } from '@/types/highlight';
import type { Note, NotePosition } from '@/types/note';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  // Use CDN for worker - more reliable than trying to bundle it
  const pdfjsVersion = pdfjs.version || '4.0.379';
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;}

interface PDFViewerProps {
  title?: string;
  fileName?: string;
  fileUrl?: string | File | null;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  isFullPage?: boolean;
  onFullPageToggle?: () => void;
  documentId?: string; // For per-document zoom persistence
  projectId?: string; // For per-document zoom persistence
  highlights?: Highlight[]; // Highlights to display
  onHighlightCreate?: (highlight: Omit<Highlight, 'id' | 'createdAt'>) => void; // Callback when user creates highlight
  scrollToHighlight?: Highlight | null; // Highlight to scroll to
  notes?: Note[]; // Notes to display
  onNoteCreate?: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void; // Callback when user creates note
  scrollToNote?: Note | null; // Note to scroll to
  onNoteClick?: (note: Note) => void; // Callback when user clicks a note icon
}

export const PDFViewer = ({
  title,
  fileName,
  fileUrl,
  currentPage = 1,
  totalPages,
  onPageChange,
  isFullPage = false,
  onFullPageToggle,
  documentId,
  projectId,
  highlights = [],
  onHighlightCreate,
  scrollToHighlight,
  notes = [],
  onNoteCreate,
  scrollToNote,
  onNoteClick,
}: PDFViewerProps) => {
  const { user } = useUser();
  const [page, setPage] = useState(currentPage);
  const [numPages, setNumPages] = useState<number | null>(totalPages || null);
  
  // Initialize scale from storage or default
  const [scale, setScale] = useState(() => {
    if (documentId && projectId && user?.id) {
      return loadZoomFromStorage(user.id, projectId, documentId);
    }
    return 1.0;
  });
  
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isHighlightMode, setIsHighlightMode] = useState(false); // Toggle highlight mode
  
  // Load default highlight color from settings
  const defaultHighlightColorHex = useMemo(() => {
    if (!user?.id) return '#FFEB3B';
    const settings = loadSettingsFromStorage(user.id);
    return settings.defaultHighlightColor || '#FFEB3B';
  }, [user?.id]);
  
  // Convert hex color to highlight color name
  const hexToColorName = (hex: string): 'yellow' | 'green' | 'blue' | 'pink' | 'orange' => {
    const colorMap: Record<string, 'yellow' | 'green' | 'blue' | 'pink' | 'orange'> = {
      '#FFEB3B': 'yellow',
      '#4CAF50': 'green',
      '#2196F3': 'blue',
      '#E91E63': 'pink',
      '#FF9800': 'orange',
    };
    return colorMap[hex.toUpperCase()] || 'yellow';
  };
  
  const [highlightColor, setHighlightColor] = useState<'yellow' | 'green' | 'blue' | 'pink' | 'orange'>(() => 
    hexToColorName(defaultHighlightColorHex)
  );
  
  // Update highlight color when default changes
  useEffect(() => {
    setHighlightColor(hexToColorName(defaultHighlightColorHex));
  }, [defaultHighlightColorHex]);
  const [showColorPicker, setShowColorPicker] = useState(false); // Show color picker dropdown
  const [noteCreationMode, setNoteCreationMode] = useState<'highlight' | 'page' | null>(null); // Note creation mode
  const [pendingNotePosition, setPendingNotePosition] = useState<{ x: number; y: number } | null>(null); // Position for page note
  const objectUrlRef = useRef<string | null>(null); // Persist object URL across re-renders
  const fileRef = useRef<File | string | null>(null); // Track current file to detect changes
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null); // Ref for the Page component container
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Reload zoom when documentId, projectId, or user changes
  useEffect(() => {
    if (documentId && projectId && user?.id) {
      const loadedZoom = loadZoomFromStorage(user.id, projectId, documentId);
      setScale(loadedZoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, projectId, user?.id]);

  useEffect(() => {
    setPage(currentPage);
  }, [currentPage]);

  // Handle File objects and URLs for react-pdf
  useEffect(() => {
    // Check if file actually changed
    const fileChanged = fileRef.current !== fileUrl;
    
    if (fileUrl instanceof File) {
      // react-pdf accepts File objects directly - no need for blob URLs
      // This avoids the "Failed to construct Headers" error with blob URLs
      if (fileChanged) {
        const previousUrl = objectUrlRef.current;
        fileRef.current = fileUrl;
        // Pass File object directly to react-pdf (it handles File objects natively)
        setObjectUrl(fileUrl as any);
        setLoading(true);
        setError(null);
        setPage(1);// Cleanup: revoke previous blob URL if it exists
        if (previousUrl && typeof previousUrl === 'string' && previousUrl.startsWith('blob:')) {URL.revokeObjectURL(previousUrl);
        }
        objectUrlRef.current = null; // Clear ref since we're not using blob URLs anymore
      } else {
        // File hasn't changed, restore if needed
        if (fileRef.current && !objectUrl) {
          setObjectUrl(fileRef.current as any);
        }
      }
    } else if (typeof fileUrl === 'string') {
      // For string URLs (HTTP/HTTPS), just set it directly if changed
      if (fileChanged) {objectUrlRef.current = fileUrl;
        fileRef.current = fileUrl;
        setObjectUrl(fileUrl);
        setLoading(true);
        setError(null);
        setPage(1);
      } else {
        // URL hasn't changed, restore if needed
        if (objectUrlRef.current && !objectUrl) {
          setObjectUrl(objectUrlRef.current);
        }
      }
    } else {objectUrlRef.current = null;
      fileRef.current = null;
      setObjectUrl(null);
      setLoading(false);
    }
  }, [fileUrl]);

  // Cleanup object URL on component unmount (only for blob URLs)
  useEffect(() => {
    return () => {
      if (objectUrlRef.current && typeof objectUrlRef.current === 'string' && objectUrlRef.current.startsWith('blob:')) {URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const handlePrevious = () => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);
      onPageChange?.(newPage);
    }
  };

  const handleNext = () => {
    if (numPages && page < numPages) {
      const newPage = page + 1;
      setPage(newPage);
      onPageChange?.(newPage);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => {
      const newScale = Math.min(prev + 0.25, 3.0);
      if (user?.id && projectId && documentId) {
        saveZoomToStorage(user.id, projectId, documentId, newScale);
      }
      return newScale;
    });
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.25, 0.25);
      if (user?.id && projectId && documentId) {
        saveZoomToStorage(user.id, projectId, documentId, newScale);
      }
      return newScale;
    });
  };


  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onPageLoadSuccess = (pageInfo: { width: number; height: number }) => {
    // Store page dimensions for highlight coordinate conversion
    setPageDimensions({ width: pageInfo.width, height: pageInfo.height });
  };

  // Update page dimensions when scale changes
  useEffect(() => {
    const pageElement = pageRef.current?.querySelector('.react-pdf__Page') as HTMLElement;
    if (pageElement && pageDimensions) {
      // Recalculate dimensions based on scale
      const rect = pageElement.getBoundingClientRect();
      setPageDimensions({ width: rect.width, height: rect.height });
    }
  }, [scale]);

  // Convert screen coordinates to normalized coordinates (0-1)
  const convertToNormalizedCoordinates = useCallback((
    rect: DOMRect,
    pageElement: HTMLElement
  ): HighlightPosition | null => {
    if (!pageDimensions || !pageElement) return null;

    const pageRect = pageElement.getBoundingClientRect();
    const pageWidth = pageRect.width;
    const pageHeight = pageRect.height;

    // Calculate normalized position relative to page
    const x = (rect.left - pageRect.left) / pageWidth;
    const y = (rect.top - pageRect.top) / pageHeight;
    const width = rect.width / pageWidth;
    const height = rect.height / pageHeight;

    // Clamp values to 0-1 range
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      width: Math.max(0, Math.min(1, width)),
      height: Math.max(0, Math.min(1, height)),
    };
  }, [pageDimensions]);

  // Handle click outside PDF to disable highlight mode (only on click, not during text selection)
  useEffect(() => {
    if (!isHighlightMode) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't disable if clicking on highlight button or color picker
      if (target.closest('[data-highlight-controls]')) {
        return;
      }
      
      // Check if there's an active text selection - if so, don't disable
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        return; // User is selecting text, don't disable highlight mode
      }
      
      // Check if click is outside the PDF content area
      if (containerRef.current && !containerRef.current.contains(target)) {
        // Use a small delay to avoid interfering with text selection
        setTimeout(() => {
          const currentSelection = window.getSelection();
          if (!currentSelection || currentSelection.toString().trim().length === 0) {
            setIsHighlightMode(false);
          }
        }, 150);
      }
    };

    // Use click event instead of mousedown to avoid interfering with text selection
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isHighlightMode]);

  // Handle text selection and create highlight (only when highlight mode is active)
  useEffect(() => {
    if (!onHighlightCreate || !documentId || !projectId || !user?.id || !isHighlightMode) return;

    const handleTextSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();

      if (!selectedText || selectedText.length === 0) return;

      // Find the page element - try multiple selectors to find the actual page container
      let pageElement = pageRef.current?.querySelector('.react-pdf__Page') as HTMLElement;
      if (!pageElement) {
        // Try finding it from the selection's common ancestor
        const commonAncestor = range.commonAncestorContainer;
        const textLayer = commonAncestor.nodeType === Node.TEXT_NODE
          ? (commonAncestor.parentElement?.closest('.react-pdf__Page__textContent') as HTMLElement)
          : (commonAncestor as Element)?.closest('.react-pdf__Page') as HTMLElement;
        
        if (textLayer) {
          pageElement = textLayer.closest('.react-pdf__Page') as HTMLElement;
        }
      }

      if (!pageElement) {selection.removeAllRanges();
        return;
      }

      // Get bounding box of selection
      const rect = range.getBoundingClientRect();
      const pageRect = pageElement.getBoundingClientRect();

      // Calculate position relative to page element
      // Make sure we're using the page's actual dimensions, not including any transforms
      const x = (rect.left - pageRect.left) / pageRect.width;
      const y = (rect.top - pageRect.top) / pageRect.height;
      const width = rect.width / pageRect.width;
      const height = rect.height / pageRect.height;

      // Clamp values to 0-1 range
      const normalizedPos: HighlightPosition = {
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
        width: Math.max(0, Math.min(1, width)),
        height: Math.max(0, Math.min(1, height)),
      };

      // Validate that the selection is reasonable (not covering most of the page)
      // A reasonable text selection should be less than 80% of page width/height
      if (normalizedPos.width > 0.8 || normalizedPos.height > 0.8) {selection.removeAllRanges();
        return;
      }

      // Also check if width/height are too small (likely invalid)
      if (normalizedPos.width < 0.001 || normalizedPos.height < 0.001) {selection.removeAllRanges();
        return;
      }

      // Create highlight with selected color
      const highlight: Omit<Highlight, 'id' | 'createdAt'> = {
        userId: user.id,
        projectId,
        pdfId: documentId,
        pageNumber: page,
        text: selectedText,
        position: normalizedPos,
        color: highlightColor, // Use selected color
      };

      onHighlightCreate(highlight);

      // Clear selection
      selection.removeAllRanges();
    };

    // Listen for mouseup to detect text selection
    const handleMouseUp = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
          handleTextSelection();
        }
      }, 100);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mouseup', handleMouseUp);
      return () => {
        container.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [onHighlightCreate, documentId, projectId, user?.id, page, isHighlightMode, highlightColor]);

  // Scroll to highlight when requested
  useEffect(() => {
    if (!scrollToHighlight || scrollToHighlight.pdfId !== documentId) return;

    // Switch to the highlight's page if needed
    if (scrollToHighlight.pageNumber !== page) {
      setPage(scrollToHighlight.pageNumber);
      onPageChange?.(scrollToHighlight.pageNumber);
    }

    // Scroll to highlight position after page loads
    setTimeout(() => {
      const pageElement = pageRef.current?.querySelector('.react-pdf__Page') as HTMLElement;
      if (!pageElement || !scrollToHighlight.position) return;

      const pageRect = pageElement.getBoundingClientRect();
      const x = scrollToHighlight.position.x * pageRect.width;
      const y = scrollToHighlight.position.y * pageRect.height;

      // Scroll container to show highlight
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const scrollX = pageRect.left - containerRect.left + x - containerRect.width / 2;
        const scrollY = pageRect.top - containerRect.top + y - containerRect.height / 2;

        containerRef.current.scrollTo({
          left: scrollX,
          top: scrollY,
          behavior: 'smooth',
        });
      }
    }, 300);
  }, [scrollToHighlight, documentId, page, onPageChange]);

  // Convert normalized coordinates to screen coordinates for rendering
  const getHighlightScreenPosition = useCallback((
    highlight: Highlight,
    pageElement: HTMLElement
  ): { left: number; top: number; width: number; height: number } | null => {
    if (!highlight.position || !pageElement) return null;

    const pageRect = pageElement.getBoundingClientRect();

    return {
      left: highlight.position.x * pageRect.width,
      top: highlight.position.y * pageRect.height,
      width: highlight.position.width * pageRect.width,
      height: highlight.position.height * pageRect.height,
    };
  }, []);

  // Convert normalized note position to screen coordinates
  const getNoteScreenPosition = useCallback((
    note: Note,
    pageElement: HTMLElement
  ): { left: number; top: number } | null => {
    if (!note.position || !pageElement) return null;

    const pageRect = pageElement.getBoundingClientRect();

    return {
      left: note.position.x * pageRect.width,
      top: note.position.y * pageRect.height,
    };
  }, []);

  // Handle note creation on highlight click
  const handleHighlightClickForNote = useCallback((highlightId: string, event: React.MouseEvent) => {
    if (!onNoteCreate || !documentId || !projectId || !user?.id) return;
    
    event.stopPropagation();
    
    // Check if note already exists for this highlight
    const existingNote = notes.find((n) => n.highlightId === highlightId);
    if (existingNote) {
      // Note exists - could trigger edit mode here if neededreturn;
    }

    // Get highlight position for note anchor
    const highlight = highlights.find((h) => h.id === highlightId);
    if (!highlight || !highlight.position) return;

    // Create note attached to highlight (content will be empty, filled by editor)
    const note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: user.id,
      projectId,
      pdfId: documentId,
      pageNumber: page,
      anchorType: 'highlight',
      highlightId: highlightId,
      position: {
        x: highlight.position.x + highlight.position.width / 2, // Center of highlight
        y: highlight.position.y,
      },
      content: '', // Will be filled by note editor
    };

    onNoteCreate(note);
  }, [onNoteCreate, documentId, projectId, user?.id, page, highlights, notes]);

  // Handle note creation on page click
  const handlePageClickForNote = useCallback((event: React.MouseEvent) => {
    if (!onNoteCreate || !documentId || !projectId || !user?.id || noteCreationMode !== 'page') return;
    if (isHighlightMode) return; // Don't create note if in highlight mode

    const pageElement = pageRef.current?.querySelector('.react-pdf__Page') as HTMLElement;
    if (!pageElement) return;

    const pageRect = pageElement.getBoundingClientRect();
    const clickX = event.clientX - pageRect.left;
    const clickY = event.clientY - pageRect.top;

    // Convert to normalized coordinates
    const normalizedPos: NotePosition = {
      x: Math.max(0, Math.min(1, clickX / pageRect.width)),
      y: Math.max(0, Math.min(1, clickY / pageRect.height)),
    };

    // Create note
    const note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: user.id,
      projectId,
      pdfId: documentId,
      pageNumber: page,
      anchorType: 'page',
      highlightId: null,
      position: normalizedPos,
      content: '', // Will be filled by note editor
    };

    onNoteCreate(note);
    setNoteCreationMode(null);
  }, [onNoteCreate, documentId, projectId, user?.id, page, noteCreationMode, isHighlightMode]);

  // Scroll to note when requested
  useEffect(() => {
    if (!scrollToNote || scrollToNote.pdfId !== documentId) return;

    // Switch to the note's page if needed
    if (scrollToNote.pageNumber !== page) {
      setPage(scrollToNote.pageNumber);
      onPageChange?.(scrollToNote.pageNumber);
    }

    // Scroll to note position after page loads
    setTimeout(() => {
      const pageElement = pageRef.current?.querySelector('.react-pdf__Page') as HTMLElement;
      if (!pageElement || !scrollToNote.position) return;

      const pageRect = pageElement.getBoundingClientRect();
      const x = scrollToNote.position.x * pageRect.width;
      const y = scrollToNote.position.y * pageRect.height;

      // Scroll container to show note
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const scrollX = pageRect.left - containerRect.left + x - containerRect.width / 2;
        const scrollY = pageRect.top - containerRect.top + y - containerRect.height / 2;

        containerRef.current.scrollTo({
          left: scrollX,
          top: scrollY,
          behavior: 'smooth',
        });
      }
    }, 300);
  }, [scrollToNote, documentId, page, onPageChange]);

  const onDocumentLoadError = (error: Error) => {
    const errorMessage = error.message || 'Failed to load PDF. Please make sure the file is a valid PDF.';
    setError(errorMessage);
    setLoading(false);};

  // If no file URL is provided, show placeholder
  if (!fileUrl || !objectUrl) {
    return (
      <div className="h-full flex flex-col bg-white border-2 border-black overflow-hidden">
        {fileName && (
          <div className="px-4 md:px-6 py-3 border-b-2 border-black bg-white">
            <p className="font-sans text-sm font-black uppercase tracking-tight text-[#111111] truncate">
              {fileName}
            </p>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center bg-[#F2F0E9]">
          <div className="text-center max-w-md">
            <FileText className="h-16 w-16 text-[#111111] mx-auto mb-4 opacity-30" />
            <p className="font-sans text-sm font-black uppercase tracking-tight text-[#111111] mb-4">NO PDF LOADED</p>
            <div className="space-y-2 text-left">
              <div className="flex items-start gap-2">
                <span className="text-[#FF3B30] font-bold">1.</span>
                <p className="font-mono text-xs text-[#111111] uppercase">Open a document from sidebar</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#FF3B30] font-bold">2.</span>
                <p className="font-mono text-xs text-[#111111] uppercase">PDF displays here for reading</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-white ${isFullPage ? '' : 'border-2 border-black'} overflow-hidden relative`}>
      {/* PDF Header - Hidden in full page mode */}
      {fileName && !isFullPage && (
        <div ref={headerRef} className="px-2 md:px-3 py-1.5 border-b-2 border-black flex items-center justify-between flex-shrink-0 bg-white">
          <p className="font-sans text-sm font-black uppercase tracking-tight text-[#111111] truncate flex-1">
            {fileName}
          </p>
          {/* Controls: Full Page + Highlight + Zoom */}
          <div className="flex items-center gap-2 ml-4">
            {/* Full Page Button */}
            {onFullPageToggle && (
              <motion.button
                whileHover={{ y: -1 }}
                transition={{ duration: 0.2 }}
                onClick={onFullPageToggle}
                className="relative"
              >
                <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                <div className="relative border-2 border-black w-8 h-8 flex items-center justify-center transition-colors bg-white text-[#111111] hover:bg-[#F2F0E9]">
                  <Maximize2 className="h-4 w-4" />
                </div>
              </motion.button>
            )}
            <motion.button
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
              onClick={handleZoomOut}
              disabled={scale <= 0.25}
              className="relative"
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
              <div className={`relative border-2 border-black w-8 h-8 flex items-center justify-center transition-colors ${
                scale <= 0.25
                  ? 'bg-[#F2F0E9] text-[#111111] opacity-50 cursor-not-allowed'
                  : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
              }`}>
                <ZoomOut className="h-4 w-4" />
              </div>
            </motion.button>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#111111] min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <motion.button
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
              onClick={handleZoomIn}
              disabled={scale >= 3.0}
              className="relative"
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
              <div className={`relative border-2 border-black w-8 h-8 flex items-center justify-center transition-colors ${
                scale >= 3.0
                  ? 'bg-[#F2F0E9] text-[#111111] opacity-50 cursor-not-allowed'
                  : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
              }`}>
                <ZoomIn className="h-4 w-4" />
              </div>
            </motion.button>
          </div>
        </div>
      )}

      {/* Full Page Controls - Floating overlay (Zoom only) */}
      {isFullPage && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            onClick={handleZoomOut}
            disabled={scale <= 0.25}
            className="relative"
          >
            <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
            <div className={`relative border-2 border-black w-12 h-12 flex items-center justify-center transition-colors ${
              scale <= 0.25
                ? 'bg-[#F2F0E9] text-[#111111] opacity-50 cursor-not-allowed'
                : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
            }`}>
              <ZoomOut className="h-5 w-5" />
            </div>
          </motion.button>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
            <div className="relative border-2 border-black bg-white px-4 py-2 min-w-[4rem] text-center">
              <span className="font-mono text-sm font-black uppercase tracking-widest text-[#111111]">
                {Math.round(scale * 100)}%
              </span>
            </div>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2, delay: 0.15 }}
            onClick={handleZoomIn}
            disabled={scale >= 3.0}
            className="relative"
          >
            <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
            <div className={`relative border-2 border-black w-12 h-12 flex items-center justify-center transition-colors ${
              scale >= 3.0
                ? 'bg-[#F2F0E9] text-[#111111] opacity-50 cursor-not-allowed'
                : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
            }`}>
              <ZoomIn className="h-5 w-5" />
            </div>
          </motion.button>
        </div>
      )}

      {/* Full Page Footer - Highlight controls and page navigation */}
      {isFullPage && (
        <div className="absolute bottom-0 left-0 right-0 z-10 px-2 md:px-3 py-2 border-t-2 border-black flex items-center justify-between gap-4 bg-white">
          {/* Left side: Highlight and Note controls */}
          <div className="flex items-center gap-2" data-highlight-controls>
            {/* Note Creation Mode Toggle Button */}
            <div className="relative">
              <motion.button
                whileHover={{ y: -1 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  setNoteCreationMode(noteCreationMode === 'page' ? null : 'page');
                  setIsHighlightMode(false); // Disable highlight mode when note mode is active
                }}
                className="relative"
                title={noteCreationMode === 'page' ? 'Disable note mode' : 'Enable note mode (click page to add note)'}
              >
                <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                <div className={`relative border-2 border-black w-8 h-8 flex items-center justify-center transition-colors ${
                  noteCreationMode === 'page'
                    ? 'bg-[#FF3B30] text-white'
                    : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
                }`}>
                  <StickyNote className="h-4 w-4" />
                </div>
              </motion.button>
            </div>
            
            {/* Highlight Mode Toggle Button */}
            <div className="relative">
              <motion.button
                whileHover={{ y: -1 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  setIsHighlightMode(!isHighlightMode);
                  setNoteCreationMode(null); // Disable note mode when highlight mode is active
                }}
                className="relative"
                title={isHighlightMode ? 'Disable highlight mode' : 'Enable highlight mode'}
              >
                <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                <div className={`relative border-2 border-black w-8 h-8 flex items-center justify-center transition-colors ${
                  isHighlightMode
                    ? 'bg-[#FF3B30] text-white'
                    : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
                }`}>
                  <Highlighter className="h-4 w-4" />
                </div>
              </motion.button>
              
              {/* Color Picker - Beside icon */}
              <AnimatePresence>
                {isHighlightMode && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute left-full top-0 ml-2 z-20"
                  >
                    <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                    <div className="relative bg-white border-2 border-black p-2 flex items-center gap-2">
                      {(['yellow', 'green', 'blue', 'pink', 'orange'] as const).map((color) => {
                        const colorClasses = {
                          yellow: 'bg-yellow-400',
                          green: 'bg-green-500',
                          blue: 'bg-blue-500',
                          pink: 'bg-pink-400',
                          orange: 'bg-[#FF3B30]',
                        };
                        return (
                          <motion.button
                            key={color}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setHighlightColor(color);
                              setShowColorPicker(false);
                            }}
                            className={`w-6 h-6 border-2 ${
                              highlightColor === color ? 'border-[#111111] border-[3px]' : 'border-black'
                            } ${colorClasses[color]} transition-all`}
                            title={color.charAt(0).toUpperCase() + color.slice(1)}
                          />
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Center: Page navigation */}
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
              onClick={handlePrevious}
              disabled={page <= 1}
              className="relative"
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
              <div className={`relative border-2 border-black px-4 py-2 flex items-center gap-2 transition-colors font-sans text-xs font-black uppercase tracking-tight ${
                page <= 1
                  ? 'bg-[#F2F0E9] text-[#111111] opacity-50 cursor-not-allowed'
                  : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
              }`}>
                <ChevronLeft className="h-4 w-4" />
                <span>PREV</span>
              </div>
            </motion.button>
            
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#111111] min-w-[120px] text-center">
              PAGE {page} {numPages ? `OF ${numPages}` : ''}
            </span>
            
            <motion.button
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
              onClick={handleNext}
              disabled={!numPages || page >= numPages}
              className="relative"
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
              <div className={`relative border-2 border-black px-4 py-2 flex items-center gap-2 transition-colors font-sans text-xs font-black uppercase tracking-tight ${
                !numPages || page >= numPages
                  ? 'bg-[#F2F0E9] text-[#111111] opacity-50 cursor-not-allowed'
                  : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
              }`}>
                <span>NEXT</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </motion.button>
          </div>

          {/* Right side: Empty for balance */}
          <div className="w-8"></div>
        </div>
      )}

      {/* PDF Content Area */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-auto bg-gray-100 p-1 md:p-2 flex items-start justify-center min-w-0 relative"
      >
        {error ? (
          <div className="text-center p-8">
            <FileText className="h-16 w-16 text-destructive mx-auto mb-4 opacity-50" />
            <p className="text-sm font-medium text-destructive mb-1">Error loading PDF</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        ) : !objectUrl ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-sm font-medium text-muted-foreground mb-1">Preparing PDF...</p>
              <p className="text-xs text-muted-foreground">Creating file URL...</p>
            </div>
          </div>
        ) : (
          <div 
            className="w-full flex justify-center py-2 relative"
            ref={pageRef}
            onClick={noteCreationMode === 'page' ? handlePageClickForNote : undefined}
          >
            <div className="bg-white shadow-lg inline-block relative">
              <Document
                file={objectUrl}
                key={objectUrl} // Force re-render when objectUrl changes
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading PDF...</p>
                    </div>
                  </div>
                }
                error={
                  <div className="text-center p-8">
                    <FileText className="h-16 w-16 text-destructive mx-auto mb-4 opacity-50" />
                    <p className="text-sm font-medium text-destructive mb-1">Error loading PDF</p>
                    <p className="text-xs text-muted-foreground">Please check the console for details</p>
                  </div>
                }
              >
                <div className="relative">
                  <Page
                    pageNumber={page}
                    scale={scale}
                    rotate={rotation}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="shadow-lg"
                    onLoadSuccess={onPageLoadSuccess}
                    loading={
                      <div className="flex items-center justify-center p-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    }
                  />
                  {/* Highlight Overlay */}
                  {highlights
                    .filter((h) => h.pdfId === documentId && h.pageNumber === page)
                    .map((highlight) => {
                      const pageElement = pageRef.current?.querySelector('.react-pdf__Page') as HTMLElement;
                      const screenPos = getHighlightScreenPosition(highlight, pageElement);
                      if (!screenPos) return null;

                      const colorMap: Record<string, string> = {
                        yellow: 'bg-yellow-400/60',
                        green: 'bg-green-500/60',
                        blue: 'bg-blue-500/60',
                        pink: 'bg-pink-400/60',
                        orange: 'bg-orange-500/60',
                      };

                      // Get color from highlight, with fallback
                      const highlightColorKey = (highlight.color || 'yellow') as keyof typeof colorMap;
                      const colorClass = colorMap[highlightColorKey] || colorMap.yellow;

                      // Check if this highlight has a note
                      const hasNote = notes.some((n) => n.highlightId === highlight.id);

                      return (
                        <div
                          key={highlight.id}
                          className={`absolute z-10 ${colorClass} ${onNoteCreate ? 'cursor-pointer' : 'pointer-events-none'}`}
                          style={{
                            left: `${screenPos.left}px`,
                            top: `${screenPos.top}px`,
                            width: `${screenPos.width}px`,
                            height: `${screenPos.height}px`,
                          }}
                          onClick={onNoteCreate ? (e) => handleHighlightClickForNote(highlight.id, e) : undefined}
                          title={hasNote ? 'Click to edit note' : 'Click to add note'}
                        >
                          {/* Note indicator icon on highlight */}
                          {hasNote && (
                            <div 
                              className="absolute -top-1 -right-1 z-20 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                const note = notes.find((n) => n.highlightId === highlight.id);
                                if (note) {
                                  onNoteClick?.(note);
                                }
                              }}
                              title="Click to view note"
                            >
                              <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                              <div className="relative bg-[#FF3B30] border-2 border-black w-5 h-5 flex items-center justify-center hover:bg-[#E6342A] transition-colors">
                                <StickyNote className="h-3 w-3 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  
                  {/* Note Icons Overlay */}
                  {notes
                    .filter((n) => n.pdfId === documentId && n.pageNumber === page)
                    .map((note) => {
                      const pageElement = pageRef.current?.querySelector('.react-pdf__Page') as HTMLElement;
                      const screenPos = getNoteScreenPosition(note, pageElement);
                      if (!screenPos) return null;

                      // If note is attached to a highlight, don't show separate icon (it's shown on highlight)
                      if (note.anchorType === 'highlight' && note.highlightId) {
                        return null;
                      }

                      return (
                        <motion.div
                          key={note.id}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          whileHover={{ scale: 1.1 }}
                          className="absolute z-20 cursor-pointer"
                          style={{
                            left: `${screenPos.left}px`,
                            top: `${screenPos.top}px`,
                          }}
                          title={note.content || 'Note - Click to view'}
                          onClick={(e) => {
                            e.stopPropagation();
                            onNoteClick?.(note);
                          }}
                        >
                          <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                          <div className="relative bg-[#FF3B30] border-2 border-black w-6 h-6 flex items-center justify-center hover:bg-[#E6342A] transition-colors">
                            <StickyNote className="h-4 w-4 text-white" />
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </Document>
            </div>
          </div>
        )}
      </div>

      {/* PDF Navigation Footer (Normal View) */}
      {!isFullPage && (
        <div ref={footerRef} className="px-2 md:px-3 py-2 border-t-2 border-black flex items-center justify-between gap-4 flex-shrink-0 bg-white">
        {/* Left side: Highlight and Note controls */}
        <div className="flex items-center gap-2" data-highlight-controls>
          {/* Note Creation Mode Toggle Button */}
          <div className="relative">
            <motion.button
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setNoteCreationMode(noteCreationMode === 'page' ? null : 'page');
                setIsHighlightMode(false); // Disable highlight mode when note mode is active
              }}
              className="relative"
              title={noteCreationMode === 'page' ? 'Disable note mode' : 'Enable note mode (click page to add note)'}
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
              <div className={`relative border-2 border-black w-8 h-8 flex items-center justify-center transition-colors ${
                noteCreationMode === 'page'
                  ? 'bg-[#FF3B30] text-white'
                  : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
              }`}>
                <StickyNote className="h-4 w-4" />
              </div>
            </motion.button>
          </div>
          
          {/* Highlight Mode Toggle Button */}
          <div className="relative">
            <motion.button
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsHighlightMode(!isHighlightMode)}
              className="relative"
              title={isHighlightMode ? 'Disable highlight mode' : 'Enable highlight mode'}
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
              <div className={`relative border-2 border-black w-8 h-8 flex items-center justify-center transition-colors ${
                isHighlightMode
                  ? 'bg-[#FF3B30] text-white'
                  : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
              }`}>
                <Highlighter className="h-4 w-4" />
              </div>
            </motion.button>
            
            {/* Color Picker - Beside icon */}
            <AnimatePresence>
              {isHighlightMode && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute left-full top-0 ml-2 z-20"
                >
                  <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                  <div className="relative bg-white border-2 border-black p-1.5 flex items-center gap-1.5">
                    {(['yellow', 'green', 'blue', 'pink', 'orange'] as const).map((color) => {
                      const colorClasses = {
                        yellow: 'bg-yellow-400',
                        green: 'bg-green-500',
                        blue: 'bg-blue-500',
                        pink: 'bg-pink-400',
                        orange: 'bg-[#FF3B30]',
                      };
                      return (
                        <motion.button
                          key={color}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setHighlightColor(color);
                            setShowColorPicker(false);
                          }}
                          className={`w-5 h-5 border ${
                            highlightColor === color ? 'border-[#111111] border-2' : 'border-black'
                          } ${colorClasses[color]} transition-all`}
                          title={color.charAt(0).toUpperCase() + color.slice(1)}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center: Page navigation */}
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ y: -1 }}
            transition={{ duration: 0.2 }}
            onClick={handlePrevious}
            disabled={page <= 1}
            className="relative"
          >
            <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
            <div className={`relative border-2 border-black px-4 py-2 flex items-center gap-2 transition-colors font-sans text-xs font-black uppercase tracking-tight ${
              page <= 1
                ? 'bg-[#F2F0E9] text-[#111111] opacity-50 cursor-not-allowed'
                : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
            }`}>
              <ChevronLeft className="h-4 w-4" />
              <span>PREV</span>
            </div>
          </motion.button>
          
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#111111] min-w-[120px] text-center">
            PAGE {page} {numPages ? `OF ${numPages}` : ''}
          </span>
          
          <motion.button
            whileHover={{ y: -1 }}
            transition={{ duration: 0.2 }}
            onClick={handleNext}
            disabled={!numPages || page >= numPages}
            className="relative"
          >
            <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
            <div className={`relative border-2 border-black px-4 py-2 flex items-center gap-2 transition-colors font-sans text-xs font-black uppercase tracking-tight ${
              !numPages || page >= numPages
                ? 'bg-[#F2F0E9] text-[#111111] opacity-50 cursor-not-allowed'
                : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
            }`}>
              <span>NEXT</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </motion.button>
        </div>

        {/* Right side: Empty for balance */}
        <div className="w-8"></div>
      </div>
      )}
    </div>
  );
};




