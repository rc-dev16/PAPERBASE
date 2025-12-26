import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar';
import { PDFViewer } from '@/components/workspace/PDFViewer';
import { NotePanel } from '@/components/workspace/NotePanel';
import type { Note } from '@/types/note';
import {
  loadNotesFromStorage,
  saveNotesToStorage,
  addNoteToStorage,
  updateNoteInStorage,
  deleteNoteFromStorage,
} from '@/utils/noteStorage';
import { syncNoteToBackend, syncNotesToBackend } from '@/utils/noteSync';
import { CitationHelper } from '@/components/workspace/CitationHelper';
import { PaperDetails } from '@/components/workspace/PaperDetails';
import { HighlightsPanel } from '@/components/workspace/HighlightsPanel';
import type { Highlight } from '@/types/highlight';
import {
  loadHighlightsFromStorage,
  saveHighlightsToStorage,
  addHighlightToStorage,
  deleteHighlightFromStorage,
} from '@/utils/highlightStorage';
import { syncHighlightToBackend, syncHighlightsToBackend } from '@/utils/highlightSync';
import { AddDocumentDialog } from '@/components/workspace/AddDocumentDialog';
import { NoteEditorDialog } from '@/components/workspace/NoteEditorDialog';
import { MultiStepLoader } from '@/components/ui/multi-step-loader';
import { computeFileHash } from '@/utils/fileHash';
import { extractPDFInfo, type ExtractedPDFData } from '@/utils/pdfExtraction';
import { 
  hasGlobalFile, 
  saveGlobalFile, 
  getGlobalFile 
} from '@/utils/globalFileStore';
import { uploadPdfToSupabase } from '@/utils/uploadPdfToSupabase';
import { syncDocumentToBackend, syncDocumentsTrashState } from '@/utils/documentSync';
import { syncProjectToBackend, updateProjectLastAccessed } from '@/utils/projectSync';
import { syncCitationToBackend, syncCitationsToBackend } from '@/utils/citationSync';
import type { CitationFormat } from '@/utils/citationSync';
import { 
  hasGlobalKnowledge, 
  getGlobalKnowledge, 
  saveGlobalKnowledge 
} from '@/utils/globalKnowledgeStore';
import { loadingStates } from '@/utils/uploadStages';
import {
  getTrashUntilDate,
  filterActiveDocuments,
  filterTrashDocuments,
  cleanupExpiredTrash,
  restoreDocuments,
} from '@/utils/trashUtils';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, FolderOpen, FileText, Maximize2, Minimize2, X } from 'lucide-react';
import type { Project } from '@/lib/mockData';
import { getProjectsStorageKey } from '@/utils/projectStorage';

interface Document {
  id: string;
  projectId?: string; // Project this document belongs to (optional for backward compatibility)
  fileHash?: string; // SHA-256 hash - reference to global file store (optional for backward compatibility)
  title: string; // Project-specific label
  fileName: string; // Original filename
  fileType?: string; // MIME type (e.g., 'application/pdf')
  version?: number; // Version number for re-uploads and compatibility
  deletedAt?: string; // ISO timestamp for soft delete (undefined = not deleted)
  trashUntil?: string; // ISO timestamp when trash expires (now + 10 days when deleted)
  itemType?: string;
  authors?: string[];
  date?: string;
  proceedingsTitle?: string;
  conferenceName?: string;
  place?: string;
  publisher?: string;
  volume?: string;
  pages?: string;
  series?: string;
  language?: string;
  doi?: string;
  isbn?: string;
  shortTitle?: string;
  url?: string;
  accessed?: string;
  archive?: string;
  locInArchive?: string;
  libraryCatalog?: string;
  callNumber?: string;
  rights?: string;
  abstract?: string;
  journal?: string;
  year?: number;
  tags?: string[];
  pageCount?: number;
  addedDate?: string;
}


export const ProjectPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const state = (location.state || {}) as { projectName?: string; description?: string };
  const { toast } = useToast();
  const { user } = useUser();
  const supabase = useSupabaseClient(); // Get authenticated Supabase client for RLS

  const [activePdfId, setActivePdfId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  // Use ref to persist files across component remounts (tab switches)
  const documentFilesRef = useRef<Map<string, File>>(new Map());
  const [documentFiles, setDocumentFiles] = useState<Map<string, File>>(new Map());
  const [notes, setNotes] = useState<Note[]>([]);
  const [citations, setCitations] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [projectRefreshKey, setProjectRefreshKey] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullPageView, setIsFullPageView] = useState(false);
  const [activeTool, setActiveTool] = useState<'notes' | 'citations' | 'highlights' | null>(null);
  const [isAddDocumentDialogOpen, setIsAddDocumentDialogOpen] = useState(false);
  const [scrollToHighlight, setScrollToHighlight] = useState<Highlight | null>(null);
  const [scrollToNote, setScrollToNote] = useState<Note | null>(null);
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [pendingNote, setPendingNote] = useState<Omit<Note, 'id' | 'createdAt' | 'updatedAt'> | null>(null);
  const [highlightedNoteId, setHighlightedNoteId] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const summaryTextareaRef = useRef<HTMLTextAreaElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const project: Project | null = useMemo(() => {
    if (!id || !user?.id) return null;

    try {
      if (typeof window !== 'undefined') {
        const storageKey = getProjectsStorageKey(user.id);
        const stored = window.localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as Project[];
          const found = parsed.find((p) => p.id === id);
          if (found) {
            return {
              ...found,
              createdAt: found.createdAt ? new Date(found.createdAt as unknown as string) : new Date(),
              lastAccessed: found.lastAccessed
                ? new Date(found.lastAccessed as unknown as string)
                : new Date(),
            };
          }
        }
      }
    } catch {
      // ignore and fall through
    }

    if (state.projectName || state.description) {
      const now = new Date();
      return {
        id,
        name: state.projectName || 'Untitled project',
        description: state.description || '',
        paperCount: 0,
        lastAccessed: now,
        createdAt: now,
      };
    }

    return null;
  }, [id, user?.id, state.projectName, state.description, projectRefreshKey]);


  // Update project last_accessed when project is accessed
  useEffect(() => {
    if (!project || !user?.id) return;
    
    // Update last_accessed in backend (non-blocking)
    updateProjectLastAccessed(project.id, user.id).catch((error) => {});
  }, [project?.id, user?.id]);

  // Load documents and notes from localStorage for this project
  useEffect(() => {
    if (!project) return;

    const loadFiles = async () => {
      try {
        const storedDocs = window.localStorage.getItem(`project-${project.id}-documents`);
        if (storedDocs) {
          const parsed = JSON.parse(storedDocs) as Document[];
          
          // Opportunistic cleanup: clean expired trash on load
          await cleanupExpiredTrash(parsed, user?.id, project.id);
          // Reload after cleanup to get updated documents
          const afterCleanup = window.localStorage.getItem(`project-${project.id}-documents`);
          const cleanedDocs = afterCleanup ? (JSON.parse(afterCleanup) as Document[]) : parsed;
          
          // Filter active and trash documents separately
          const activeDocs = filterActiveDocuments(cleanedDocs);
          setDocuments(activeDocs);
          
          // Store all documents (including trash) for trash view access
          // We'll filter trash documents on demand in the render
          
          // LAZY LOADING: Only load the active document's file on mount
          // Other files will be loaded on demand when selected
          if (activeDocs.length > 0) {
            // Set active PDF to first document if not already set
            if (!activePdfId) {
              setActivePdfId(activeDocs[0].id);
            }
            
            // Load only the active document's file
            const activeDocId = activePdfId || activeDocs[0].id;
            const activeDoc = activeDocs.find(doc => doc.id === activeDocId);
            
            if (activeDoc && activeDoc.fileHash && activeDoc.fileName) {
              try {
                // Load from global file store using fileHash
                const file = await getGlobalFile(activeDoc.fileHash, activeDoc.fileName);
                if (file) {
                  const fileMap = new Map(documentFilesRef.current);
                  fileMap.set(activeDoc.id, file);
                  documentFilesRef.current = fileMap;
                  setDocumentFiles(new Map(fileMap));}
              } catch (error) {}
            }
          }
        }

        // Load notes from new storage system
        if (user?.id) {
          const loadedNotes = loadNotesFromStorage(user.id, project.id);
          if (loadedNotes.length > 0) {
            setNotes(loadedNotes);}
        }

        const storedCitations = window.localStorage.getItem(`project-${project.id}-citations`);
        if (storedCitations) {
          setCitations(JSON.parse(storedCitations) as string[]);
        }

        // Load highlights from new storage system
        if (user?.id) {
          const loadedHighlights = loadHighlightsFromStorage(user.id, project.id);
          if (loadedHighlights.length > 0) {
            setHighlights(loadedHighlights);} else {
            // Try legacy storage for backward compatibility
            const storedHighlights = window.localStorage.getItem(`project-${project.id}-highlights`);
            if (storedHighlights) {
              const legacyHighlights = JSON.parse(storedHighlights) as Highlight[];
              // Migrate to new format
              const migratedHighlights = legacyHighlights.map((h) => ({
                ...h,
                userId: user.id,
                projectId: project.id,
                pdfId: h.documentId || h.pdfId || '',
                pageNumber: h.page || h.pageNumber || 1,
                createdAt: h.date || h.createdAt || new Date().toISOString(),
                position: h.position || { x: 0, y: 0, width: 0.1, height: 0.05 }, // Default position if missing
              }));
              setHighlights(migratedHighlights);
              saveHighlightsToStorage(user.id, project.id, migratedHighlights);// Sync migrated highlights to backend (non-blocking)
              // Group highlights by document and sync each group
              const highlightsByDoc = migratedHighlights.reduce((acc, h) => {
                const docId = h.documentId || h.pdfId || '';
                if (!acc[docId]) {
                  acc[docId] = [];
                }
                acc[docId].push(h);
                return acc;
              }, {} as Record<string, Highlight[]>);
              
              Object.entries(highlightsByDoc).forEach(([docId, docHighlights]) => {
                const doc = documents.find(d => d.id === docId);
                if (doc?.fileHash) {
                  syncHighlightsToBackend(docHighlights, doc.fileHash).catch((error) => {});
                }
              });
            }
          }
        }
      } catch (error) {}
    };

    loadFiles();
  }, [project?.id, user?.id]);

  // Load file on demand when active document changes (lazy loading)
  useEffect(() => {
    if (!activePdfId || !project) return;

    const loadFileOnDemand = async () => {
      // Check if file is already loaded
      if (documentFilesRef.current.has(activePdfId) || documentFiles.has(activePdfId)) {
        return;
      }

      const activeDoc = documents.find(doc => doc.id === activePdfId);
      if (!activeDoc || !activeDoc.fileName) {return;
      }

      // Only load if fileHash exists (new documents)
      if (!activeDoc.fileHash) {return;
      }

      try {
        // Try loading from global file store first
        let file = await getGlobalFile(activeDoc.fileHash, activeDoc.fileName);
        
        if (file) {
          // File found in global store
          const fileMap = new Map(documentFilesRef.current);
          fileMap.set(activeDoc.id, file);
          documentFilesRef.current = fileMap;
          setDocumentFiles(new Map(fileMap));
        } else if (supabase && activeDoc.fileHash) {
          // File not in global store, try downloading from Supabase Storage
          try {
            const storagePath = `${activeDoc.fileHash}.pdf`;
            const { data, error } = await supabase.storage
              .from('files')
              .download(storagePath);

            if (error) {
              return;
            }

            if (data) {
              // Convert Blob to File
              file = new File([data], activeDoc.fileName, { 
                type: activeDoc.fileType || 'application/pdf' 
              });
              
              // Save to global store for future use
              try {
                await saveGlobalFile(activeDoc.fileHash, file);
              } catch (saveError) {
                // Error saving file
              }

              // Add to document files
              const fileMap = new Map(documentFilesRef.current);
              fileMap.set(activeDoc.id, file);
              documentFilesRef.current = fileMap;
              setDocumentFiles(new Map(fileMap));
            }
          } catch (downloadError) {
            // Error downloading file
          }
        }
      } catch (error) {
        // Error loading file
      }
    };

    loadFileOnDemand();
  }, [activePdfId, documents, documentFiles, supabase]);

  // Track which documents have been extracted to avoid re-extraction
  // Use file name + size as unique identifier (more reliable than just ID)
  const extractedDocumentsRef = useRef<Set<string>>(new Set());
  const extractingRef = useRef<Set<string>>(new Set()); // Track currently extracting documents

  // Initialize extracted documents from localStorage on mount
  useEffect(() => {
    if (!project) return;
    
    const stored = window.localStorage.getItem(`project-${project.id}-documents`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Document[];
        parsed.forEach((doc) => {
          // Mark as extracted if it has extracted data
          if (doc.abstract || (doc.authors && doc.authors.length > 0) || doc.doi) {
            extractedDocumentsRef.current.add(doc.id);
          }
        });
      } catch (error) {
        // Error parsing documents
      }
    }
  }, [project]);

  // Extract PDF info when document is selected and has a file
  useEffect(() => {
    const extractInfoForActiveDocument = async () => {
      if (!activePdfId || !project) return;

      const activeDoc = documents.find((d) => d.id === activePdfId);
      if (!activeDoc) return;

      // Skip if currently extracting (prevent concurrent extractions)
      if (extractingRef.current.has(activePdfId)) {return;
      }

      // Skip if already extracted
      if (extractedDocumentsRef.current.has(activePdfId)) {return;
      }

      // Skip extraction if document already has extracted data
      if (activeDoc.abstract || (activeDoc.authors && activeDoc.authors.length > 0) || activeDoc.doi) {extractedDocumentsRef.current.add(activePdfId);
        return;
      }

      // Check Global Knowledge Store first (by fileHash)
      if (activeDoc.fileHash && hasGlobalKnowledge(activeDoc.fileHash)) {const knowledge = getGlobalKnowledge(activeDoc.fileHash);
        if (knowledge) {
          // Update document with knowledge from global store
          const updated = documents.map((doc) => {
            if (doc.id === activePdfId) {
              return {
                ...doc,
                title: knowledge.metadata.title || doc.title,
                authors: knowledge.metadata.authors || doc.authors,
                abstract: knowledge.metadata.abstract || doc.abstract,
                journal: knowledge.metadata.journal || doc.journal,
                publisher: knowledge.metadata.publisher || doc.publisher,
                date: knowledge.metadata.publicationDate || doc.date,
                doi: knowledge.metadata.doi || doc.doi,
                isbn: knowledge.metadata.isbn || doc.isbn,
                volume: knowledge.metadata.volume || doc.volume,
                pages: knowledge.metadata.pages || doc.pages,
                language: knowledge.metadata.language || doc.language,
                itemType: knowledge.metadata.itemType || doc.itemType,
                proceedingsTitle: knowledge.metadata.proceedingsTitle || doc.proceedingsTitle,
                conferenceName: knowledge.metadata.conferenceName || doc.conferenceName,
                place: knowledge.metadata.place || doc.place,
                series: knowledge.metadata.series || doc.series,
                shortTitle: knowledge.metadata.shortTitle || doc.shortTitle,
                url: knowledge.metadata.url || doc.url,
                rights: knowledge.metadata.rights || doc.rights,
                year: knowledge.metadata.year || doc.year,
                pageCount: knowledge.metadata.pageCount || doc.pageCount,
                tags: knowledge.metadata.keywords || doc.tags,
              };
            }
            return doc;
          });
          setDocuments(updated);
          window.localStorage.setItem(`project-${project.id}-documents`, JSON.stringify(updated));
          extractedDocumentsRef.current.add(activePdfId);return;
        }
      }

      // Get the file
      const file = documentFiles.get(activePdfId) || documentFilesRef.current.get(activePdfId);
      if (!file) {return;
      }

      // Mark as extracting
      extractingRef.current.add(activePdfId);

      try {const extractedData = await extractPDFInfo(file);

        // Save to Global Knowledge Store (by fileHash)
        if (activeDoc.fileHash) {
          saveGlobalKnowledge(activeDoc.fileHash, extractedData);}

        // Mark as extracted
        extractedDocumentsRef.current.add(activePdfId);

        // Update document with extracted data
        const updated = documents.map((doc) => {
          if (doc.id === activePdfId) {
            return {
              ...doc,
              // Merge extracted data, preserving existing values
              title: extractedData.title || doc.title,
              authors: extractedData.authors || doc.authors,
              abstract: extractedData.abstract || doc.abstract,
              journal: extractedData.journal || doc.journal,
              publisher: extractedData.publisher || doc.publisher,
              date: extractedData.publicationDate || doc.date,
              doi: extractedData.doi || doc.doi,
              isbn: extractedData.isbn || doc.isbn,
              volume: extractedData.volume || doc.volume,
              pages: extractedData.pages || doc.pages,
              language: extractedData.language || doc.language,
              itemType: extractedData.itemType || doc.itemType,
              proceedingsTitle: extractedData.proceedingsTitle || doc.proceedingsTitle,
              conferenceName: extractedData.conferenceName || doc.conferenceName,
              place: extractedData.place || doc.place,
              series: extractedData.series || doc.series,
              shortTitle: extractedData.shortTitle || doc.shortTitle,
              url: extractedData.url || doc.url,
              rights: extractedData.rights || doc.rights,
              year: extractedData.year || doc.year,
              pageCount: extractedData.pageCount || doc.pageCount,
              tags: extractedData.keywords || doc.tags,
            };
          }
          return doc;
        });

        setDocuments(updated);

        // Save updated documents to localStorage
        try {
          window.localStorage.setItem(`project-${project.id}-documents`, JSON.stringify(updated));
        } catch (error) {
          // Error saving documents
        }

        toast({
          title: 'PDF information extracted',
          description: 'Document metadata has been extracted successfully.',
        });
      } catch (error) {
        toast({
          title: 'Extraction failed',
          description: error instanceof Error ? error.message : 'Failed to extract PDF information.',
          variant: 'destructive',
        });
      } finally {
        // Remove from extracting set
        extractingRef.current.delete(activePdfId);
      }
    };

    extractInfoForActiveDocument();
    // Remove 'documents' from dependencies to prevent re-triggering when documents update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePdfId, documentFiles, project]);

  // Log when files are loaded for debugging
  useEffect(() => {
    if (activePdfId && documentFiles.size > 0) {
      const file = documentFiles.get(activePdfId);
      if (file) {} else {}
    }
  }, [activePdfId, documentFiles]);

  const handleNoteCreate = useCallback((noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!project || !user?.id) return;

    // If content is empty, open editor first
    if (!noteData.content || noteData.content.trim() === '') {
      setPendingNote(noteData);
      setIsNoteEditorOpen(true);
      return;
    }

    // Content provided, create note immediately
    const newNote: Note = {
      ...noteData,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = addNoteToStorage(user.id, project.id, newNote);
    setNotes(updated);
    
    // Sync to backend (non-blocking, IndexedDB-first)
    syncNotesToBackend(updated).catch((error) => {});
  }, [project, user?.id]);

  const handleNoteUpdate = useCallback((noteId: string, content: string) => {
    if (!project || !user?.id) return;

    const updated = updateNoteInStorage(user.id, project.id, noteId, { content });
    setNotes(updated);
    
    // Sync to backend (non-blocking, IndexedDB-first)
    syncNotesToBackend(updated).catch((error) => {});
  }, [project, user?.id]);

  const handleNoteDelete = useCallback((noteId: string) => {
    if (!project || !user?.id) return;

    const updated = deleteNoteFromStorage(user.id, project.id, noteId);
    setNotes(updated);
    
    // Sync to backend (non-blocking, IndexedDB-first)
    syncNotesToBackend(updated).catch((error) => {});
  }, [project, user?.id]);

  const handleNoteClick = useCallback((note: Note) => {
    // Navigate to the note
    setActivePdfId(note.pdfId);
    setScrollToNote(note);
    
    // Open notes panel and highlight the note
    setActiveTool('notes');
    setHighlightedNoteId(note.id);
    
    // Clear scroll target and highlight after 5 seconds
    setTimeout(() => {
      setScrollToNote(null);
      setHighlightedNoteId(null);
    }, 5000);
  }, []);

  const handleNoteEditorSave = useCallback((content: string) => {
    if (!pendingNote) return;
    
    const noteWithContent: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
      ...pendingNote,
      content,
    };
    
    handleNoteCreate(noteWithContent);
    setPendingNote(null);
    setIsNoteEditorOpen(false);
  }, [pendingNote, handleNoteCreate]);

  const handleSummaryEdit = () => {
    if (!project) return;
    setEditedSummary(project.description || '');
    setIsEditingSummary(true);
    // Focus textarea after it renders
    setTimeout(() => {
      summaryTextareaRef.current?.focus();
      summaryTextareaRef.current?.select();
    }, 0);
  };

  const handleSummarySave = () => {
    if (!project || !user?.id) return;

    const storageKey = getProjectsStorageKey(user.id);
    const updatedProjects = JSON.parse(
      window.localStorage.getItem(storageKey) || '[]'
    ) as Project[];

    const projectIndex = updatedProjects.findIndex((p) => p.id === project.id);
    if (projectIndex !== -1) {
      updatedProjects[projectIndex] = {
        ...updatedProjects[projectIndex],
        description: editedSummary.trim(),
      };

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(updatedProjects));
        setProjectRefreshKey((prev) => prev + 1); // Trigger project re-computation
        
        // Sync updated project to backend (non-blocking, IndexedDB-first)
        if (user?.id) {
          syncProjectToBackend(updatedProjects[projectIndex], user.id).catch((error) => {});
        }
        
        toast({
          title: 'Summary updated',
          description: 'Project summary has been saved.',
        });
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to save summary.',
          variant: 'destructive',
        });
      }
    }

    setIsEditingSummary(false);
  };

  const handleSummaryCancel = () => {
    setEditedSummary('');
    setIsEditingSummary(false);
  };

  const handleNameEdit = () => {
    if (!project) return;
    setEditedName(project.name || '');
    setIsEditingName(true);
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 0);
  };

  const handleNameSave = () => {
    if (!project || !user?.id) return;

    const storageKey = getProjectsStorageKey(user.id);
    const updatedProjects = JSON.parse(
      window.localStorage.getItem(storageKey) || '[]'
    ) as Project[];

    const projectIndex = updatedProjects.findIndex((p) => p.id === project.id);
    if (projectIndex !== -1) {
      updatedProjects[projectIndex] = {
        ...updatedProjects[projectIndex],
        name: editedName.trim() || project.name,
      };

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(updatedProjects));
        setProjectRefreshKey((prev) => prev + 1);
        
        // Sync updated project to backend (non-blocking, IndexedDB-first)
        if (user?.id) {
          syncProjectToBackend(updatedProjects[projectIndex], user.id).catch((error) => {});
        }
        
        toast({
          title: 'Project name updated',
          description: 'Project name has been saved.',
        });
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to save project name.',
          variant: 'destructive',
        });
      }
    }

    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setEditedName('');
    setIsEditingName(false);
  };

  const handleAddDocument = () => {
    setIsAddDocumentDialogOpen(true);
  };

  const handleDocumentAdded = async (file: File) => {
    if (!project) return;

    // Run cleanup before upload (opportunistic cleanup)
    try {
      const storedDocs = window.localStorage.getItem(`project-${project.id}-documents`);
      if (storedDocs) {
        const parsed = JSON.parse(storedDocs) as Document[];
        await cleanupExpiredTrash(parsed, user?.id, project.id);
      }
    } catch (error) {// Continue with upload even if cleanup fails
    }

    // Start loading (loader will loop smoothly)
    setUploadLoading(true);

    // Extract title from filename (remove extension)
    const fileName = file.name;
    const title = fileName.replace(/\.[^/.]+$/, '');

    // Generate unique ID using nanoid
    const documentId = nanoid();
    
    try {
      // STEP 1: Compute file hash (REQUIRED for global storage)
      let fileHash: string;
      try {
        fileHash = await computeFileHash(file);
      } catch (error) {
        setUploadLoading(false);
        toast({
          title: 'Error',
          description: 'Failed to compute file hash. Cannot proceed with upload.',
          variant: 'destructive',
        });
        return;
      }

      // STEP 2: Check Global File Store
      const fileExists = await hasGlobalFile(fileHash);
      
      if (!fileExists) {
        // STEP 3: Save to Global File Store
        try {
          await saveGlobalFile(fileHash, file);
        } catch (error) {
          setUploadLoading(false);
          toast({
            title: 'Error',
            description: `Failed to save file: ${error instanceof Error ? error.message : String(error)}`,
            variant: 'destructive',
          });
          return;
        }
      }

      // STEP 3.5: Upload to Supabase Storage (durable backup)
      // This happens after IndexedDB save because IndexedDB is the working copy
      // Storage limit checks happen inside uploadPdfToSupabase (after dedup check)
      // Pass authenticated client for RLS protection
      try {
        if (supabase) {
          await uploadPdfToSupabase(file, fileHash, supabase);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check if it's a storage limit error
        if (errorMessage.includes('Storage limit reached') || errorMessage.includes('File exceeds')) {
          setUploadLoading(false);
          toast({
            title: errorMessage.includes('File exceeds') ? 'File too large' : 'Storage limit reached',
            description: errorMessage.includes('File exceeds') 
              ? 'File exceeds the 25 MB limit.'
              : 'Storage limit reached. Clear Trash to free up space.',
            variant: 'destructive',
          });
          return; // Stop upload if storage limit exceeded
        }
        
        // For other errors, continue without Supabase upload - IndexedDB is the working copy
        // User can retry upload later if needed
        toast({
          title: 'Backup upload failed',
          description: 'File saved locally but backup upload failed. You can retry later.',
          variant: 'destructive',
        });
      }

      // STEP 4: Check Global Knowledge Store - extract only if not exists
      let extractedData: ExtractedPDFData | null = null;
      if (hasGlobalKnowledge(fileHash)) {
        const knowledge = getGlobalKnowledge(fileHash);
        if (knowledge) {
          extractedData = knowledge.metadata;
        }
      } else {
        // STEP 5: Extract with Gemini
        try {
          extractedData = await extractPDFInfo(file);
          saveGlobalKnowledge(fileHash, extractedData);
        } catch (error) {
          // Continue without extracted data - not critical
          toast({
            title: 'Extraction failed',
            description: 'File uploaded but metadata extraction failed. You can extract it later.',
            variant: 'destructive',
          });
        }
      }

      // STEP 6: Generate and sync citations (if metadata extracted)
      // Citations are file-scoped and reusable across projects
      if (extractedData && fileHash) {
        try {
          const { generateCitation } = await import('@/utils/citationEngine');
          const paperMetadata = {
            pdfId: documentId,
            title: extractedData.title || null,
            authors: extractedData.authors || null,
            abstract: extractedData.abstract || null,
            year: extractedData.year || null,
            venue: extractedData.journal || extractedData.conferenceName || extractedData.proceedingsTitle || null,
            doi: extractedData.doi || null,
            url: extractedData.url || null,
            publisher: extractedData.publisher || null,
            volume: extractedData.volume || null,
            issue: extractedData.issue || null,
            pages: extractedData.pages || null,
            place: extractedData.place || null,
            itemType: extractedData.itemType || null,
            conferenceName: extractedData.conferenceName || null,
            proceedingsTitle: extractedData.proceedingsTitle || null,
          };
          
          // Generate citations for all formats and sync to backend
          const formats: CitationFormat[] = ['APA', 'IEEE', 'MLA', 'BibTeX'];
          const citations = formats.map(format => ({
            format,
            content: generateCitation(paperMetadata, format),
            source: 'ai' as const,
          }));
          
          if (supabase) {
            await syncCitationsToBackend(citations, fileHash, supabase);
          }
        } catch (error) {
          // Error syncing citations
        }
      }

      // STEP 7: Finalize - Create Project Document

      // Create Project Document (lightweight reference)
      const newDocument: Document = {
        id: documentId,
      projectId: project.id,
      fileHash: fileHash, // REQUIRED - reference to global file
      title: title,
      fileName: fileName,
      fileType: file.type,
      version: 1,
      addedDate: new Date().toISOString(),
      // Merge extracted data if available
      ...(extractedData && {
        title: extractedData.title || title,
        authors: extractedData.authors,
        abstract: extractedData.abstract,
        journal: extractedData.journal,
        publisher: extractedData.publisher,
        date: extractedData.publicationDate,
        doi: extractedData.doi,
        isbn: extractedData.isbn,
        volume: extractedData.volume,
        pages: extractedData.pages,
        language: extractedData.language,
        itemType: extractedData.itemType,
        proceedingsTitle: extractedData.proceedingsTitle,
        conferenceName: extractedData.conferenceName,
        place: extractedData.place,
        series: extractedData.series,
        shortTitle: extractedData.shortTitle,
        url: extractedData.url,
        rights: extractedData.rights,
        year: extractedData.year,
        pageCount: extractedData.pageCount,
        tags: extractedData.keywords,
      }),
      };

      const updated = [...documents, newDocument];
      setDocuments(updated);

    // Store the file object in memory (loaded from global store)
    const fileFromStore = await getGlobalFile(fileHash, fileName);
    if (fileFromStore) {
      const newMap = new Map(documentFilesRef.current);
      newMap.set(newDocument.id, fileFromStore);
      documentFilesRef.current = newMap;
      setDocumentFiles(newMap);
    }

      window.localStorage.setItem(`project-${project.id}-documents`, JSON.stringify(updated));
      
      // Sync document to Supabase backend (non-blocking, IndexedDB-first)
      // Pass authenticated client for RLS protection
      try {
        if (supabase) {
          await syncDocumentToBackend(newDocument, supabase);
        } else {}
      } catch (error) {// Continue - IndexedDB is the source of truth
      }
      
      // Update project paper count (excluding soft-deleted documents)
      if (user?.id) {
      const activeDocCount = filterActiveDocuments(updated).length;
        const storageKey = getProjectsStorageKey(user.id);
        const storedProjects = window.localStorage.getItem(storageKey);
      if (storedProjects) {
        const projects = JSON.parse(storedProjects) as Project[];
        const projectIndex = projects.findIndex((p) => p.id === project.id);
        if (projectIndex !== -1) {
          projects[projectIndex] = {
            ...projects[projectIndex],
            paperCount: activeDocCount,
          };
            window.localStorage.setItem(storageKey, JSON.stringify(projects));
          }
        }
      }

      // Set the new document as active
      setActivePdfId(newDocument.id);

      toast({
        title: 'Document added',
        description: `${fileName} has been added to the project.`,
      });
    } catch (error) {toast({
        title: 'Error',
        description: 'Failed to save document.',
        variant: 'destructive',
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleInfoClick = () => {
    setActiveTool(null);
  };

  const handleNotesClick = () => {
    setActiveTool(activeTool === 'notes' ? null : 'notes');
  };

  const handleCitationsClick = () => {
    setActiveTool(activeTool === 'citations' ? null : 'citations');
  };

  const handleHighlightsClick = () => {
    setActiveTool(activeTool === 'highlights' ? null : 'highlights');
  };

  const handleDocumentDelete = async (documentIds: string[]) => {
    if (!project || documentIds.length === 0) return;

    try {
      // MOVE TO TRASH: Set deletedAt and trashUntil (now + 10 days)
      const deletedAt = new Date().toISOString();
      const trashUntil = getTrashUntilDate();
      
      // Load all documents from localStorage (including soft-deleted ones)
      const storedDocs = window.localStorage.getItem(`project-${project.id}-documents`);
      const allStoredDocs = storedDocs ? (JSON.parse(storedDocs) as Document[]) : documents;
      
      // Update documents with deletedAt and trashUntil timestamps
      const updatedAllDocs = allStoredDocs.map((doc) => {
        if (documentIds.includes(doc.id)) {
          return { ...doc, deletedAt, trashUntil };
        }
        return doc;
      });
      
      // Filter out soft-deleted documents for display (active documents only)
      const activeDocs = filterActiveDocuments(updatedAllDocs);
      setDocuments(activeDocs);

      // Remove files from memory (but keep in IndexedDB for potential recovery)
      const newMap = new Map(documentFilesRef.current);
      documentIds.forEach((id) => {
        newMap.delete(id);
      });
      documentFilesRef.current = newMap;
      setDocumentFiles(newMap);

      // Note: Files remain in IndexedDB (trash retention period)
      // Cleanup runs opportunistically and only hard-deletes when safe

      // Update localStorage with all documents (including soft-deleted)
      window.localStorage.setItem(`project-${project.id}-documents`, JSON.stringify(updatedAllDocs));

      // Sync trash state to Supabase backend (non-blocking, IndexedDB-first)
      try {
        await syncDocumentsTrashState(documentIds, deletedAt, trashUntil);
      } catch (error) {// Continue - IndexedDB is the source of truth
      }

      // Update project paper count (excluding soft-deleted documents)
      if (user?.id) {
      const activeDocCount = filterActiveDocuments(updatedAllDocs).length;
        const storageKey = getProjectsStorageKey(user.id);
        const storedProjects = window.localStorage.getItem(storageKey);
      if (storedProjects) {
        const projects = JSON.parse(storedProjects) as Project[];
        const projectIndex = projects.findIndex((p) => p.id === project.id);
        if (projectIndex !== -1) {
          projects[projectIndex] = {
            ...projects[projectIndex],
            paperCount: activeDocCount,
          };
            window.localStorage.setItem(storageKey, JSON.stringify(projects));
          }
        }
      }

      // Clear active PDF if it was deleted
      if (activePdfId && documentIds.includes(activePdfId)) {
        const documentWithFile = activeDocs.find((doc) => documentFilesRef.current.has(doc.id));
        setActivePdfId(documentWithFile ? documentWithFile.id : (activeDocs.length > 0 ? activeDocs[0].id : null));
      }

      toast({
        title: 'Documents moved to trash',
        description: `${documentIds.length} document(s) moved to trash. They will be permanently deleted after 10 days.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move documents to trash.',
        variant: 'destructive',
      });
    }
  };

  const handleDocumentRestore = async (documentIds: string[]) => {
    if (!project || documentIds.length === 0) return;

    try {
      // Load all documents from localStorage (including soft-deleted ones)
      const storedDocs = window.localStorage.getItem(`project-${project.id}-documents`);
      const allStoredDocs = storedDocs ? (JSON.parse(storedDocs) as Document[]) : documents;
      
      // Restore documents (remove deletedAt and trashUntil)
      const restoredDocs = restoreDocuments(allStoredDocs, documentIds) as Document[];
      
      // Update localStorage
      window.localStorage.setItem(`project-${project.id}-documents`, JSON.stringify(restoredDocs));
      
      // Sync restore state to Supabase backend (non-blocking, IndexedDB-first)
      // Restore = set deletedAt and trashUntil to null
      try {
        await syncDocumentsTrashState(documentIds, null, null);
      } catch (error) {// Continue - IndexedDB is the source of truth
      }
      
      // Filter active documents for display
      const activeDocs = filterActiveDocuments(restoredDocs) as Document[];
      setDocuments(activeDocs);
      
      // Update project paper count
      if (user?.id) {
      const activeDocCount = activeDocs.length;
        const storageKey = getProjectsStorageKey(user.id);
        const storedProjects = window.localStorage.getItem(storageKey);
      if (storedProjects) {
        const projects = JSON.parse(storedProjects) as Project[];
        const projectIndex = projects.findIndex((p) => p.id === project.id);
        if (projectIndex !== -1) {
          projects[projectIndex] = {
            ...projects[projectIndex],
            paperCount: activeDocCount,
          };
            window.localStorage.setItem(storageKey, JSON.stringify(projects));
          }
        }
      }

      toast({
        title: 'Documents restored',
        description: `${documentIds.length} document(s) have been restored.`,
      });
    } catch (error) {toast({
        title: 'Error',
        description: 'Failed to restore documents.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteHighlight = (highlightId: string) => {
    if (!project || !user?.id) return;

    const updated = deleteHighlightFromStorage(user.id, project.id, highlightId);
    setHighlights(updated);
    
    // Sync to backend (non-blocking, IndexedDB-first)
    // Get fileHash from the highlight's document
    const deletedHighlight = highlights.find(h => h.id === highlightId);
    if (deletedHighlight) {
      const doc = documents.find(d => d.id === deletedHighlight.pdfId);
      if (doc?.fileHash) {
        syncHighlightsToBackend(updated, doc.fileHash).catch((error) => {});
      }
    }
  };

  const handleHighlightCreate = useCallback((highlightData: Omit<Highlight, 'id' | 'createdAt'>) => {
    if (!project || !user?.id) return;

    const newHighlight: Highlight = {
      ...highlightData,
      id: `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = addHighlightToStorage(user.id, project.id, newHighlight);
    setHighlights(updated);
    
    // Sync to backend (non-blocking, IndexedDB-first)
    // Get fileHash from the highlight's document
    const doc = documents.find(d => d.id === newHighlight.pdfId);
    if (doc?.fileHash) {
      syncHighlightsToBackend(updated, doc.fileHash).catch((error) => {});
    }
  }, [project, user?.id, documents]);

  const handleHighlightClick = useCallback((highlight: Highlight) => {
    // Navigate to the highlight
    setActivePdfId(highlight.pdfId || highlight.documentId || null);
    setScrollToHighlight(highlight);
    
    // Clear scroll target after a delay
    setTimeout(() => {
      setScrollToHighlight(null);
    }, 2000);
  }, []);

  const activePdf = documents.find((d) => d.id === activePdfId);
  const activeCitation = citations[0] || '';

  // Calculate filtered counts for sidebar (memoized for performance)
  const notesCount = useMemo(() => {
    return activePdfId
      ? notes.filter((n) => n.pdfId === activePdfId).length
      : notes.length;
  }, [notes, activePdfId]);

  const highlightsCount = useMemo(() => {
    return activePdfId
      ? highlights.filter((h) => (h.pdfId || h.documentId) === activePdfId).length
      : highlights.length;
  }, [highlights, activePdfId]);

  if (!project) {
    return (
      <div className="min-h-screen bg-[#F2F0E9] flex items-center justify-center">
        <p className="font-sans text-[#111111] font-bold uppercase">PROJECT NOT FOUND</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen bg-[#F2F0E9] flex overflow-hidden"
    >

      {/* Sidebar - Always visible (unless full page) */}
      {!isFullPageView && (() => {
        // Compute trash documents from localStorage
        let trashDocs: Document[] = [];
        if (project) {
          try {
            const storedDocs = window.localStorage.getItem(`project-${project.id}-documents`);
            if (storedDocs) {
              const allDocs = JSON.parse(storedDocs) as Document[];
              trashDocs = filterTrashDocuments(allDocs);
            }
          } catch (error) {}
        }
        
        return (
        <WorkspaceSidebar
          projectId={project.id}
          documents={documents}
            trashDocuments={trashDocs}
          activeDocumentId={activePdfId}
          onDocumentSelect={setActivePdfId}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onAddDocument={handleAddDocument}
          onDocumentDelete={handleDocumentDelete}
            onDocumentRestore={handleDocumentRestore}
          onInfoClick={handleInfoClick}
          onNotesClick={handleNotesClick}
          onCitationsClick={handleCitationsClick}
          onHighlightsClick={handleHighlightsClick}
          activeTool={activeTool}
          notesCount={notesCount}
          highlightsCount={highlightsCount}
        />
        );
      })()}

      {/* Vertical Divider */}
      {!isFullPageView && !isSidebarCollapsed && (
        <div className="w-[1px] bg-black flex-shrink-0"></div>
      )}

      {/* Main Content Area - PDF viewer (full height) + Right sidebar with header */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Multi-Step Upload Loader - Shows in PDF viewer + Right sidebar area */}
        <MultiStepLoader
          loading={uploadLoading}
          loadingStates={loadingStates}
          interval={1200}
          pause={400}
          variant="contained"
        />
        {/* PDF Viewer - Full height, takes remaining space */}
        {!isFullPageView && (
          <div className="flex-1 p-1 md:p-2 overflow-hidden min-w-0">
            {activePdf ? (
              <div className="h-full bg-white border-2 border-black overflow-hidden">
                <PDFViewer
                  title={activePdf.title}
                  fileName={activePdf.fileName}
                  fileUrl={(() => {
                    const fileFromState = documentFiles.get(activePdf.id);
                    const fileFromRef = documentFilesRef.current.get(activePdf.id);
                    const file = fileFromState || fileFromRef;
                    if (!file) {}
                    return file || null;
                  })()}
                  currentPage={1}
                  onFullPageToggle={() => setIsFullPageView(true)}
                  documentId={activePdf.id}
                  projectId={project.id}
                  highlights={highlights.filter((h) => (h.pdfId || h.documentId) === activePdf.id)}
                  onHighlightCreate={handleHighlightCreate}
                  scrollToHighlight={scrollToHighlight?.pdfId === activePdf.id || scrollToHighlight?.documentId === activePdf.id ? scrollToHighlight : null}
                  notes={notes.filter((n) => n.pdfId === activePdf.id)}
                  onNoteCreate={handleNoteCreate}
                  scrollToNote={scrollToNote?.pdfId === activePdf.id ? scrollToNote : null}
                  onNoteClick={handleNoteClick}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-white border-2 border-black p-6">
                <div className="text-center max-w-md">
                  <p className="font-sans text-sm font-black uppercase tracking-tight text-[#111111] mb-4">OPEN A DOCUMENT TO BEGIN READING</p>
                  <div className="space-y-2 text-left">
                    <div className="flex items-start gap-2">
                      <span className="text-[#FF3B30] font-bold">1.</span>
                      <p className="font-mono text-xs text-[#111111] uppercase">Choose a document from the sidebar</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#FF3B30] font-bold">2.</span>
                      <p className="font-mono text-xs text-[#111111] uppercase">Read, highlight, and annotate</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#FF3B30] font-bold">3.</span>
                      <p className="font-mono text-xs text-[#111111] uppercase">View notes and citations</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vertical Divider */}
        {!isFullPageView && (
          <div className="w-[1px] bg-black flex-shrink-0"></div>
        )}

        {/* Right Sidebar with Header - Same width */}
        {!isFullPageView && (
          <div className="w-[420px] flex-shrink-0 flex flex-col overflow-hidden">
            {/* Header - Same width as right sidebar */}
            <header className="px-6 md:px-8 py-4 md:py-6 border-b-2 border-black bg-[#F2F0E9] flex-shrink-0">
              <div className="space-y-3">
                {/* Project Name */}
                <div className="flex items-start gap-3 group min-w-0">
                  <FolderOpen className="h-5 w-5 text-[#FF3B30] flex-shrink-0 mt-1" />
                  <AnimatePresence mode="wait">
                    {isEditingName ? (
                      <motion.div
                        key="editing-name"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex-1 min-w-0"
                      >
                        <input
                          ref={nameInputRef}
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          onBlur={handleNameSave}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleNameSave();
                            }
                            if (e.key === 'Escape') {
                              handleNameCancel();
                            }
                          }}
                          className="w-full text-xl md:text-2xl font-black tracking-tighter uppercase border-2 border-black bg-white text-[#111111] font-sans px-4 py-2 focus:border-[#FF3B30] focus:outline-none focus:ring-0"
                          placeholder="PROJECT NAME..."
                        />
                      </motion.div>
                    ) : (
                      <motion.h1
                        key="display-name"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="font-sans text-xl md:text-2xl font-black tracking-tighter uppercase flex-1 truncate min-w-0 text-[#111111]"
                        title={project.name}
                      >
                        {project.name.toUpperCase()}
                      </motion.h1>
                    )}
                  </AnimatePresence>
                  {!isEditingName && (
                    <button
                      onClick={handleNameEdit}
                      className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity border-2 border-black bg-white hover:bg-[#F2F0E9] flex items-center justify-center"
                    >
                      <Pencil className="h-4 w-4 text-[#111111]" />
                    </button>
                  )}
                </div>

                {/* Project Summary */}
                <div className="flex items-start gap-3 group min-w-0">
                  <FileText className="h-4 w-4 text-[#111111] flex-shrink-0 mt-1" />
                  <AnimatePresence mode="wait">
                    {isEditingSummary ? (
                      <motion.div
                        key="editing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex-1 min-w-0"
                      >
                        <textarea
                          ref={summaryTextareaRef}
                          value={editedSummary}
                          onChange={(e) => setEditedSummary(e.target.value)}
                          onBlur={handleSummarySave}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              e.preventDefault();
                              handleSummarySave();
                            }
                            if (e.key === 'Escape') {
                              handleSummaryCancel();
                            }
                          }}
                          className="w-full text-xs md:text-sm font-mono leading-relaxed resize-none min-h-[60px] border-2 border-black bg-white text-[#111111] px-4 py-2 focus:border-[#FF3B30] focus:outline-none focus:ring-0 uppercase"
                          placeholder="ADD A PROJECT SUMMARY..."
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="display"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex-1 min-w-0"
                      >
                        <p
                          className={`font-mono text-xs md:text-sm leading-relaxed truncate uppercase ${
                            project.description ? 'text-[#111111]' : 'text-[#111111] opacity-60'
                          }`}
                          title={project.description || 'ADD A PROJECT SUMMARY...'}
                        >
                          {project.description ? project.description.toUpperCase() : 'ADD A PROJECT SUMMARY...'}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!isEditingSummary && (
                    <button
                      onClick={handleSummaryEdit}
                      className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity border-2 border-black bg-white hover:bg-[#F2F0E9] flex items-center justify-center"
                    >
                      <Pencil className="h-4 w-4 text-[#111111]" />
                    </button>
                  )}
                </div>
              </div>
            </header>

            {/* Tools Panel - Below header */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {activeTool ? (
                  <motion.div
                    key={activeTool}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full flex flex-col overflow-hidden"
                  >
                <div className="relative h-full">
                  <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
                  <div className="relative bg-white border-2 border-black h-full overflow-hidden">
                    {activeTool === 'citations' && (() => {
                      const activeDoc = activePdfId ? documents.find(d => d.id === activePdfId) : null;
                      return (
                        <div className="h-full overflow-hidden">
                          <CitationHelper 
                            document={activeDoc ? {
                              ...activeDoc,
                              fileHash: activeDoc.fileHash,
                            } : null}
                            onCitationSave={(format, content) => {
                              // Sync citation to backend when BibTeX is manually saved
                              if (activeDoc?.fileHash) {
                                syncCitationToBackend({
                                  format,
                                  content,
                                  source: 'manual',
                                }, activeDoc.fileHash).catch((error) => {});
                              }
                            }}
                          />
                        </div>
                      );
                    })()}
                    {activeTool === 'notes' && (
                      <div className="h-full overflow-hidden">
                        <NotePanel
                          projectId={project.id}
                          notes={notes}
                          onUpdateNote={handleNoteUpdate}
                          onDeleteNote={handleNoteDelete}
                          onNoteClick={handleNoteClick}
                          activeDocumentId={activePdfId}
                          highlightedNoteId={highlightedNoteId}
                          documents={documents.map((doc) => ({ id: doc.id, title: doc.title }))}
                        />
                      </div>
                    )}
                    {activeTool === 'highlights' && (
                      <div className="h-full overflow-hidden">
                        <HighlightsPanel
                          projectId={project.id}
                          highlights={highlights}
                          onDeleteHighlight={handleDeleteHighlight}
                          activeDocumentId={activePdfId}
                          onHighlightClick={handleHighlightClick}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
                  <motion.div
                    key="paper-details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full flex flex-col overflow-hidden"
                  >
                <div className="relative h-full">
                  <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
                  <div className="relative bg-white border-2 border-black h-full overflow-hidden">
                    {activePdf ? (
                      <PaperDetails
                        title={activePdf.title}
                        fileName={activePdf.fileName}
                        itemType={activePdf.itemType}
                        authors={activePdf.authors}
                        date={activePdf.date}
                        proceedingsTitle={activePdf.proceedingsTitle}
                        conferenceName={activePdf.conferenceName}
                        place={activePdf.place}
                        publisher={activePdf.publisher}
                        volume={activePdf.volume}
                        pages={activePdf.pages}
                        series={activePdf.series}
                        language={activePdf.language}
                        doi={activePdf.doi}
                        isbn={activePdf.isbn}
                        shortTitle={activePdf.shortTitle}
                        url={activePdf.url}
                        accessed={activePdf.accessed}
                        archive={activePdf.archive}
                        locInArchive={activePdf.locInArchive}
                        libraryCatalog={activePdf.libraryCatalog}
                        callNumber={activePdf.callNumber}
                        rights={activePdf.rights}
                        abstract={activePdf.abstract}
                        journal={activePdf.journal}
                        year={activePdf.year}
                        tags={activePdf.tags}
                        pageCount={activePdf.pageCount}
                        addedDate={activePdf.addedDate}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center p-6">
                        <div className="text-center max-w-md">
                          <p className="font-sans text-sm font-black uppercase tracking-tight text-[#111111] mb-4">DOCUMENT DETAILS APPEAR HERE</p>
                          <div className="space-y-2 text-left">
                            <div className="flex items-start gap-2">
                              <span className="text-[#FF3B30] font-bold">1.</span>
                              <p className="font-mono text-xs text-[#111111] uppercase">Select a document from sidebar</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-[#FF3B30] font-bold">2.</span>
                              <p className="font-mono text-xs text-[#111111] uppercase">View metadata and details</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Full Page View - Only PDF (outside main layout) */}
      {isFullPageView && activePdf && (
        <div className="fixed inset-0 z-50 bg-white">
          {/* Exit Full Page Button */}
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsFullPageView(false)}
            className="absolute top-4 right-4 z-10"
          >
            <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
            <div className="relative border-2 border-black bg-white hover:bg-[#F2F0E9] transition-colors flex items-center justify-center w-12 h-12">
              <X className="h-6 w-6 text-[#111111]" />
            </div>
          </motion.button>

          {/* Full Page PDF Viewer */}
          <div className="h-full w-full overflow-hidden relative">
            {/* Multi-Step Upload Loader - Shows in full page view */}
            <MultiStepLoader
              loading={uploadLoading}
              loadingStates={loadingStates}
              interval={1200}
              pause={400}
              variant="contained"
            />
              <PDFViewer
                title={activePdf.title}
                fileName={activePdf.fileName}
                fileUrl={(() => {
                  const fileFromState = documentFiles.get(activePdf.id);
                  const fileFromRef = documentFilesRef.current.get(activePdf.id);
                  const file = fileFromState || fileFromRef;
                  return file || null;
                })()}
                currentPage={1}
                isFullPage={true}
                documentId={activePdf.id}
                projectId={project.id}
                highlights={highlights.filter((h) => (h.pdfId || h.documentId) === activePdf.id)}
                onHighlightCreate={handleHighlightCreate}
                scrollToHighlight={scrollToHighlight?.pdfId === activePdf.id || scrollToHighlight?.documentId === activePdf.id ? scrollToHighlight : null}
                notes={notes.filter((n) => n.pdfId === activePdf.id)}
                onNoteCreate={(noteData) => {
                  setPendingNote(noteData);
                  setIsNoteEditorOpen(true);
                }}
                scrollToNote={scrollToNote?.pdfId === activePdf.id ? scrollToNote : null}
                onNoteClick={handleNoteClick}
              />
          </div>
        </div>
      )}

      {/* Add Document Dialog */}
      <AddDocumentDialog
        open={isAddDocumentDialogOpen}
        onOpenChange={setIsAddDocumentDialogOpen}
        onDocumentAdded={handleDocumentAdded}
      />

      {/* Note Editor Dialog */}
      {pendingNote && (
        <NoteEditorDialog
          open={isNoteEditorOpen}
          onOpenChange={(open) => {
            setIsNoteEditorOpen(open);
            if (!open) {
              setPendingNote(null);
            }
          }}
          note={null}
          highlightId={pendingNote.highlightId || null}
          pageNumber={pendingNote.pageNumber}
          position={pendingNote.position}
          onSave={handleNoteEditorSave}
        />
      )}
    </motion.div>
  );
};
