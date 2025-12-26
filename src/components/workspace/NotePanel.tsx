import { useState, useRef, useEffect, useMemo } from 'react';
import { Pencil, Check, X, FileText, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Note } from '@/types/note';

interface NotePanelProps {
  projectId: string;
  notes?: Note[];
  onUpdateNote?: (noteId: string, content: string) => void;
  onDeleteNote?: (noteId: string) => void;
  onNoteClick?: (note: Note) => void; // Navigate to note
  activeDocumentId?: string | null;
  highlightedNoteId?: string | null; // Note to highlight in the list
  documents?: Array<{ id: string; title: string }>; // Documents with titles for display
}

export const NotePanel = ({ 
  projectId, 
  notes = [], 
  onUpdateNote, 
  onDeleteNote,
  onNoteClick,
  activeDocumentId,
  highlightedNoteId,
  documents = [],
}: NotePanelProps) => {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<string>>(new Set());
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const noteRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Track if user manually changed the filter (to prevent auto-switching)
  const [userChangedFilter, setUserChangedFilter] = useState(false);
  
  // Default to active document, but allow user to change filter
  const [selectedDocument, setSelectedDocument] = useState<string | null>(activeDocumentId || null);
  
  // Update selected document when activeDocumentId changes (only if user hasn't manually changed it)
  useEffect(() => {
    if (activeDocumentId && !userChangedFilter) {
      // Auto-update to active document if user hasn't manually changed the filter
      setSelectedDocument(activeDocumentId);
    }
  }, [activeDocumentId, userChangedFilter]);

  // Get unique documents from notes, using provided document titles if available
  const documentList = useMemo(() => {
    const noteDocumentIds = new Set(notes.map((n) => n.pdfId));
    
    // If documents prop is provided, use those titles
    if (documents.length > 0) {
      return documents.filter((doc) => noteDocumentIds.has(doc.id));
    }
    
    // Fallback: create list from notes with truncated IDs as titles
    return Array.from(
      new Map(
        notes.map((n) => [
          n.pdfId,
          { id: n.pdfId, title: n.pdfId.substring(0, 30) + '...' },
        ])
      ).values()
    );
  }, [notes, documents]);

  // Filter notes by selected document
  const filteredNotes = useMemo(() => {
    if (selectedDocument === null) {
      // Show all notes
      return notes;
    }
    // Show notes for selected document
    return notes.filter((n) => n.pdfId === selectedDocument);
  }, [notes, selectedDocument]);
  
  // Handle document filter change (user manually changed)
  const handleDocumentFilterChange = (docId: string | null) => {
    setSelectedDocument(docId);
    setUserChangedFilter(true);
  };

  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setEditedContent(note.content);
    setTimeout(() => {
      editTextareaRef.current?.focus();
      editTextareaRef.current?.select();
    }, 0);
  };

  const handleSaveEdit = () => {
    if (editingNoteId && editedContent.trim() && onUpdateNote) {
      onUpdateNote(editingNoteId, editedContent.trim());
      setEditingNoteId(null);
      setEditedContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditedContent('');
  };

  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNoteIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const isNoteExpanded = (noteId: string) => expandedNoteIds.has(noteId);

  // Scroll to highlighted note
  useEffect(() => {
    if (highlightedNoteId) {
      const noteElement = noteRefs.current.get(highlightedNoteId);
      if (noteElement) {
        setTimeout(() => {
          noteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [highlightedNoteId]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 md:p-6 border-b-2 border-black">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-5 w-5 text-[#FF3B30]" />
          <h4 className="font-sans text-sm font-black uppercase tracking-tight text-[#111111]">
            NOTES <span className="font-mono text-[10px] opacity-70">({filteredNotes.length})</span>
          </h4>
        </div>

        {/* Document Filter */}
        {documents.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <motion.button
              whileHover={{ y: -1 }}
              onClick={() => handleDocumentFilterChange(null)}
              className="relative"
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
              <div className={`relative border-2 border-black px-3 py-1 font-sans text-xs font-black uppercase tracking-tight transition-colors ${
                !selectedDocument
                  ? 'bg-[#FF3B30] text-white'
                  : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
              }`}>
                ALL DOCUMENTS
              </div>
            </motion.button>
            {documentList.map((doc) => (
              <motion.button
                key={doc.id}
                whileHover={{ y: -1 }}
                onClick={() => handleDocumentFilterChange(doc.id)}
                className="relative"
              >
                <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                <div className={`relative border-2 border-black px-3 py-1 font-sans text-xs font-black uppercase tracking-tight transition-colors truncate max-w-[120px] ${
                  selectedDocument === doc.id
                    ? 'bg-[#FF3B30] text-white'
                    : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
                }`}>
                  {doc.title}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => {
            const isHighlighted = highlightedNoteId === note.id;
            return (
              <motion.div
                key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: isHighlighted ? 1.02 : 1,
              }}
              transition={{ duration: 0.2 }}
              className={`relative group ${onNoteClick ? 'cursor-pointer' : ''}`}
              onClick={() => onNoteClick?.(note)}
              ref={(el) => {
                if (el) {
                  noteRefs.current.set(note.id, el);
                } else {
                  noteRefs.current.delete(note.id);
                }
              }}
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
              <motion.div 
                className="relative bg-white border-2"
                animate={{
                  borderColor: isHighlighted ? '#FF3B30' : '#111111',
                  backgroundColor: isHighlighted ? '#FFF5F5' : '#FFFFFF',
                }}
                transition={{ 
                  duration: 0.3,
                  ease: 'easeInOut'
                }}
              >
                {/* Colored vertical bar (red for notes) */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF3B30]" />
                
                {/* Note content */}
                {editingNoteId === note.id ? (
                  <div className="pl-4 pr-3 py-3">
                    {/* Edit textarea */}
                    <textarea
                      ref={editTextareaRef}
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full min-h-[80px] resize-none mb-2 text-sm border-2 border-black bg-white text-[#111111] font-sans px-3 py-2 focus:border-[#FF3B30] focus:outline-none focus:ring-0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleSaveEdit();
                        }
                        if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                    />
                    
                    {/* Edit actions */}
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ y: -1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveEdit();
                        }}
                        disabled={!editedContent.trim()}
                        className="relative"
                      >
                        <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                        <div className="relative bg-[#FF3B30] text-white border-2 border-black font-sans font-black uppercase tracking-tight text-xs px-3 py-1.5 hover:bg-[#E6342A] transition-colors flex items-center gap-1.5 disabled:opacity-50">
                          <Check className="h-3.5 w-3.5" />
                          SAVE
                        </div>
                      </motion.button>
                      <motion.button
                        whileHover={{ y: -1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                        className="relative"
                      >
                        <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                        <div className="relative bg-white text-[#111111] border-2 border-black font-sans font-black uppercase tracking-tight text-xs px-3 py-1.5 hover:bg-[#F2F0E9] transition-colors flex items-center gap-1.5">
                          <X className="h-3.5 w-3.5" />
                          CANCEL
                        </div>
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="pl-4 pr-3 py-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-[#111111] flex-shrink-0" />
                        <span className="font-mono text-[10px] uppercase text-[#111111] bg-[#F2F0E9] px-2 py-0.5 border border-black">
                          PAGE {note.pageNumber}
                        </span>
                        {note.anchorType === 'highlight' && (
                          <span className="font-mono text-[10px] uppercase text-[#111111] opacity-70">
                            • HIGHLIGHT NOTE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(note);
                          }}
                          className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity border-2 border-black bg-white hover:bg-[#F2F0E9] flex items-center justify-center"
                        >
                          <Pencil className="h-3.5 w-3.5 text-[#111111]" />
                        </button>
                        {onDeleteNote && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteNote(note.id);
                            }}
                            className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity border-2 border-black bg-white hover:bg-[#F2F0E9] hover:border-[#FF3B30] flex items-center justify-center"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-[#111111]" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p
                      className={`font-sans text-sm text-[#111111] mb-2 leading-relaxed ${
                        isNoteExpanded(note.id) ? '' : 'line-clamp-2'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNoteExpansion(note.id);
                      }}
                      title={isNoteExpanded(note.id) ? 'Click to collapse' : 'Click to expand'}
                    >
                      {note.content}
                    </p>
                    <p className="font-mono text-[10px] text-[#111111] uppercase opacity-70">
                      {new Date(note.createdAt).toLocaleDateString()}
                      {note.updatedAt !== note.createdAt && ' • UPDATED'}
                    </p>
                  </div>
                )}
              </motion.div>
            </motion.div>
            );
          })
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md px-4">
              <FileText className="h-12 w-12 text-[#111111] mx-auto mb-4 opacity-30" />
              <p className="font-sans text-sm font-black uppercase tracking-tight text-[#111111] mb-4">
                {selectedDocument
                  ? 'NOTES CREATE AS YOU ANNOTATE'
                  : 'NOTES ATTACH TO HIGHLIGHTS AND PAGES'}
              </p>
              <div className="space-y-2 text-left">
                {selectedDocument ? (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="text-[#FF3B30] font-bold">1.</span>
                      <p className="font-mono text-xs text-[#111111] uppercase">Click on notes button in viewer</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#FF3B30] font-bold">2.</span>
                      <p className="font-mono text-xs text-[#111111] uppercase">Highlight text or select a page</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#FF3B30] font-bold">3.</span>
                      <p className="font-mono text-xs text-[#111111] uppercase">Notes save automatically</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="text-[#FF3B30] font-bold">1.</span>
                      <p className="font-mono text-xs text-[#111111] uppercase">Open a document</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#FF3B30] font-bold">2.</span>
                      <p className="font-mono text-xs text-[#111111] uppercase">Create highlights or select pages</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#FF3B30] font-bold">3.</span>
                      <p className="font-mono text-xs text-[#111111] uppercase">Attach notes as you work</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
