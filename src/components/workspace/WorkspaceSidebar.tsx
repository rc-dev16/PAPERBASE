import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileText, StickyNote, Quote, Settings, ArrowLeft, ChevronLeft, Plus, Search, Highlighter, Wrench, Trash2, X, RotateCcw } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  fileName: string;
}

type DocumentView = 'active' | 'trash';

interface WorkspaceSidebarProps {
  projectId: string;
  projectName?: string;
  documents?: Document[];
  trashDocuments?: Document[];
  notesCount?: number;
  highlightsCount?: number;
  activeDocumentId?: string | null;
  onDocumentSelect?: (id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onAddDocument?: () => void;
  onInfoClick?: () => void;
  onNotesClick?: () => void;
  onCitationsClick?: () => void;
  onHighlightsClick?: () => void;
  activeTool?: 'notes' | 'citations' | 'highlights' | null;
  onDocumentDelete?: (ids: string[]) => void;
  onDocumentRestore?: (ids: string[]) => void;
}

export const WorkspaceSidebar = ({
  projectId,
  projectName = 'Project',
  documents = [],
  trashDocuments = [],
  notesCount = 0,
  highlightsCount = 0,
  activeDocumentId,
  onDocumentSelect,
  isCollapsed = false,
  onToggleCollapse,
  onAddDocument,
  onInfoClick,
  onNotesClick,
  onCitationsClick,
  onHighlightsClick,
  activeTool = null,
  onDocumentDelete,
  onDocumentRestore,
}: WorkspaceSidebarProps) => {
  const navigate = useNavigate();
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [documentView, setDocumentView] = useState<DocumentView>('active');

  // Auto-switch to active view if trash becomes empty while in trash view
  useEffect(() => {
    if (documentView === 'trash' && (!trashDocuments || trashDocuments.length === 0)) {
      setDocumentView('active');
    }
  }, [documentView, trashDocuments]);

  // Determine which documents to show based on current view
  const currentDocuments = documentView === 'active' ? documents : (trashDocuments || []);
  
  const filteredDocuments = currentDocuments.filter((doc) =>
    doc.title.toLowerCase().includes(documentSearchQuery.toLowerCase()) ||
    doc.fileName.toLowerCase().includes(documentSearchQuery.toLowerCase())
  );
  
  const isTrashView = documentView === 'trash';

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedDocuments.size === filteredDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(filteredDocuments.map(doc => doc.id)));
    }
  };

  const handleDelete = () => {
    if (selectedDocuments.size > 0 && onDocumentDelete) {
      onDocumentDelete(Array.from(selectedDocuments));
      setSelectedDocuments(new Set());
      setIsSelectionMode(false);
    }
  };

  const handleRestore = () => {
    if (selectedDocuments.size > 0 && onDocumentRestore) {
      onDocumentRestore(Array.from(selectedDocuments));
      setSelectedDocuments(new Set());
      setIsSelectionMode(false);
    }
  };

  const cancelSelection = () => {
    setSelectedDocuments(new Set());
    setIsSelectionMode(false);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? '64px' : '280px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="border-r-2 border-black bg-[#F2F0E9] flex-shrink-0 flex flex-col h-screen overflow-hidden"
    >
      {/* Header with Logo */}
      <div className="p-4 border-b-2 border-black">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-[#111111] hover:opacity-70 transition-opacity"
          >
            <img src="/PB.png" alt="PB Logo" className="h-6 w-auto" />
            {!isCollapsed && (
              <span className="font-sans text-2xl md:text-3xl font-black tracking-tighter text-[#111111] uppercase">
                PAPERBASE<span className="text-[#FF3B30]">.</span>
              </span>
            )}
          </Link>
          {isCollapsed && (
            <motion.button
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
              onClick={onToggleCollapse}
              className="relative flex-shrink-0"
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
              <div className="relative flex items-center justify-center w-8 h-8 border-2 border-black bg-white hover:bg-[#F2F0E9] transition-colors text-[#111111]">
                <ChevronLeft
                  className={`h-4 w-4 transition-transform duration-300 rotate-180`}
                />
              </div>
            </motion.button>
          )}
        </div>
      </div>

      {/* Collapsed State - Icon Only */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col py-4">
          {/* Info Icon */}
          <div className="px-2 mb-4">
            <motion.button
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
              onClick={onInfoClick}
              className="relative w-full"
              title="Info"
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
              <div className={`relative border-2 border-black p-2 flex items-center justify-center transition-colors ${
                activeTool === null
                  ? 'bg-[#FF3B30] text-white'
                  : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
              }`}>
                <FileText className="h-5 w-5" />
              </div>
            </motion.button>
          </div>
          {/* Tools Icon */}
          <div className="px-2 mb-4">
            <motion.button
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                if (onToggleCollapse) {
                  onToggleCollapse();
                }
              }}
              className="relative w-full"
              title="Tools"
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
              <div className={`relative border-2 border-black p-2 flex items-center justify-center transition-colors ${
                activeTool
                  ? 'bg-[#FF3B30] text-white'
                  : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
              }`}>
                <Wrench className="h-5 w-5" />
              </div>
            </motion.button>
          </div>

          {/* Documents Icon */}
          <div className="px-2 mb-4">
            <motion.button
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                if (onToggleCollapse) {
                  onToggleCollapse();
                }
              }}
              className="relative w-full"
              title="Documents"
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
              <div className={`relative border-2 border-black p-2 flex items-center justify-center transition-colors ${
                activeDocumentId
                  ? 'bg-[#FF3B30] text-white'
                  : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
              }`}>
                <FileText className="h-5 w-5" />
              </div>
            </motion.button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto flex flex-col"
          >
            {/* Tools Section */}
            <div className="p-4 border-b-2 border-black flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#111111]">
                  TOOLS
                </h2>
                <motion.button
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.2 }}
                  onClick={onToggleCollapse}
                  className="relative flex-shrink-0"
                >
                  <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                  <div className="relative flex items-center justify-center w-8 h-8 border-2 border-black bg-white hover:bg-[#F2F0E9] transition-colors text-[#111111]">
                    <ChevronLeft
                      className={`h-4 w-4 transition-transform duration-300`}
                    />
                  </div>
                </motion.button>
              </div>
              <div className="space-y-2">
                <button
                  onClick={onInfoClick}
                  className="w-full relative"
                >
                  <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                  <div className={`relative border-2 border-black px-3 py-2 flex items-center transition-colors ${
                    activeTool === null
                      ? 'bg-[#FF3B30] text-white'
                      : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-sans text-xs font-black uppercase tracking-tight">INFO</span>
                    </div>
                  </div>
                </button>
                <button
                  onClick={onNotesClick}
                  className={`w-full relative ${
                    activeTool === 'notes' ? '' : ''
                  }`}
                >
                  <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                  <div className={`relative border-2 border-black px-3 py-2 flex items-center justify-between transition-colors ${
                    activeTool === 'notes'
                      ? 'bg-[#FF3B30] text-white'
                      : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <StickyNote className="h-4 w-4" />
                      <span className="font-sans text-xs font-black uppercase tracking-tight">NOTES</span>
                    </div>
                    <span className="font-mono text-[10px] uppercase">{notesCount}</span>
                  </div>
                </button>
                <button
                  onClick={onCitationsClick}
                  className={`w-full relative`}
                >
                  <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                  <div className={`relative border-2 border-black px-3 py-2 flex items-center transition-colors ${
                    activeTool === 'citations'
                      ? 'bg-[#FF3B30] text-white'
                      : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Quote className="h-4 w-4" />
                      <span className="font-sans text-xs font-black uppercase tracking-tight">CITATIONS</span>
                    </div>
                  </div>
                </button>
                <button
                  onClick={onHighlightsClick}
                  className={`w-full relative`}
                >
                  <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                  <div className={`relative border-2 border-black px-3 py-2 flex items-center justify-between transition-colors ${
                    activeTool === 'highlights'
                      ? 'bg-[#FF3B30] text-white'
                      : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Highlighter className="h-4 w-4" />
                      <span className="font-sans text-xs font-black uppercase tracking-tight">HIGHLIGHTS</span>
                    </div>
                    <span className="font-mono text-[10px] uppercase">{highlightsCount}</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Documents Section */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b-2 border-black flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                  <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#111111]">
                    DOCUMENTS
                  </h2>
                    {/* View Toggle: Active / Trash - Always show if there are trash docs OR if currently in trash view */}
                    {((trashDocuments && trashDocuments.length > 0) || documentView === 'trash') && (
                      <div className="flex gap-1 border border-black">
                        <button
                          onClick={() => {
                            setDocumentView('active');
                            setSelectedDocuments(new Set());
                            setIsSelectionMode(false);
                          }}
                          className={`px-2 py-0.5 text-[9px] font-mono uppercase transition-colors ${
                            documentView === 'active'
                              ? 'bg-[#111111] text-white'
                              : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
                          }`}
                        >
                          Active
                        </button>
                        <button
                          onClick={() => {
                            setDocumentView('trash');
                            setSelectedDocuments(new Set());
                            setIsSelectionMode(false);
                          }}
                          className={`px-2 py-0.5 text-[9px] font-mono uppercase transition-colors ${
                            documentView === 'trash'
                              ? 'bg-[#111111] text-white'
                              : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
                          }`}
                        >
                          Trash {trashDocuments && trashDocuments.length > 0 ? `(${trashDocuments.length})` : ''}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isSelectionMode ? (
                      <>
                        {!isTrashView && onAddDocument && (
                          <motion.button
                            whileHover={{ y: -1 }}
                            transition={{ duration: 0.2 }}
                            onClick={onAddDocument}
                            className="relative"
                            title="Add document"
                          >
                            <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                            <div className="relative w-6 h-6 bg-[#FF3B30] border-2 border-black flex items-center justify-center hover:bg-[#E6342A] transition-colors">
                              <Plus className="h-3.5 w-3.5 text-white" />
                            </div>
                          </motion.button>
                        )}
                        {isTrashView && onDocumentRestore ? (
                          <motion.button
                            whileHover={{ y: -1 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsSelectionMode(true)}
                            className="relative"
                            title="Select documents to restore"
                          >
                            <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                            <div className="relative w-6 h-6 bg-white border-2 border-black flex items-center justify-center hover:bg-[#F2F0E9] transition-colors">
                              <RotateCcw className="h-3.5 w-3.5 text-[#111111]" />
                            </div>
                          </motion.button>
                        ) : !isTrashView && onDocumentDelete && (
                          <motion.button
                            whileHover={{ y: -1 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsSelectionMode(true)}
                            className="relative"
                            title="Select documents to delete"
                          >
                            <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                            <div className="relative w-6 h-6 bg-white border-2 border-black flex items-center justify-center hover:bg-[#F2F0E9] transition-colors">
                              <Trash2 className="h-3.5 w-3.5 text-[#111111]" />
                            </div>
                          </motion.button>
                        )}
                      </>
                    ) : (
                      <>
                        <motion.button
                          whileHover={{ y: -1 }}
                          transition={{ duration: 0.2 }}
                          onClick={toggleSelectAll}
                          className="relative"
                          title="Select all"
                        >
                          <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                          <div className="relative px-2 py-1 border-2 border-black bg-white text-[#111111] hover:bg-[#F2F0E9] transition-colors font-sans text-[10px] font-black uppercase">
                            {selectedDocuments.size === filteredDocuments.length ? 'DESELECT ALL' : 'SELECT ALL'}
                          </div>
                        </motion.button>
                        {selectedDocuments.size > 0 && (
                          <>
                            {isTrashView && onDocumentRestore ? (
                              <motion.button
                                whileHover={{ y: -1 }}
                                transition={{ duration: 0.2 }}
                                onClick={handleRestore}
                                className="relative"
                                title={`Restore ${selectedDocuments.size} document(s)`}
                              >
                                <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                                <div className="relative px-2 py-1 border-2 border-black bg-[#FF3B30] text-white hover:bg-[#E6342A] transition-colors font-sans text-[10px] font-black uppercase flex items-center gap-1">
                                  <RotateCcw className="h-3 w-3" />
                                  RESTORE ({selectedDocuments.size})
                                </div>
                              </motion.button>
                            ) : !isTrashView && onDocumentDelete && (
                          <motion.button
                            whileHover={{ y: -1 }}
                            transition={{ duration: 0.2 }}
                            onClick={handleDelete}
                            className="relative"
                            title={`Delete ${selectedDocuments.size} document(s)`}
                          >
                            <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                            <div className="relative px-2 py-1 border-2 border-black bg-[#FF3B30] text-white hover:bg-[#E6342A] transition-colors font-sans text-[10px] font-black uppercase flex items-center gap-1">
                              <Trash2 className="h-3 w-3" />
                              DELETE ({selectedDocuments.size})
                            </div>
                          </motion.button>
                            )}
                          </>
                        )}
                        <motion.button
                          whileHover={{ y: -1 }}
                          transition={{ duration: 0.2 }}
                          onClick={cancelSelection}
                          className="relative"
                          title="Cancel selection"
                        >
                          <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                          <div className="relative w-6 h-6 border-2 border-black bg-white hover:bg-[#F2F0E9] transition-colors flex items-center justify-center">
                            <X className="h-3.5 w-3.5 text-[#111111]" />
                          </div>
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
                {/* Search Bar */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#111111]" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={documentSearchQuery}
                    onChange={(e) => setDocumentSearchQuery(e.target.value)}
                    className="w-full border-2 border-black bg-white text-[#111111] font-sans text-sm focus:border-[#FF3B30] focus:ring-0 focus:outline-none h-9 px-3 pl-10"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
                <div className="space-y-2">
                  {filteredDocuments.length > 0 ? (
                    filteredDocuments.map((doc) => (
                      <motion.div
                        key={doc.id}
                        whileHover={isSelectionMode ? {} : { y: -1 }}
                        transition={{ duration: 0.2 }}
                        className="w-full relative"
                      >
                        <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                        {isSelectionMode ? (
                          <div
                            onClick={() => toggleDocumentSelection(doc.id)}
                            className={`relative border-2 border-black px-3 py-2 text-left transition-colors cursor-pointer ${
                              selectedDocuments.has(doc.id)
                                ? 'bg-[#F2F0E9] border-[#FF3B30]'
                                : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
                            }`}>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedDocuments.has(doc.id)}
                                onChange={() => toggleDocumentSelection(doc.id)}
                                className="w-4 h-4 border-2 border-black accent-[#FF3B30] cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <FileText className="h-4 w-4 flex-shrink-0" />
                              <span className="font-sans text-xs font-black uppercase tracking-tight truncate flex-1">{doc.title}</span>
                            </div>
                          </div>
                        ) : (
                          <motion.button
                            whileHover={{ y: -1 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => onDocumentSelect?.(doc.id)}
                            className="relative w-full"
                          >
                            <div className={`relative border-2 border-black px-3 py-2 text-left transition-colors ${
                              activeDocumentId === doc.id
                                ? 'bg-[#FF3B30] text-white'
                                : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
                            }`}>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                <span className="font-sans text-xs font-black uppercase tracking-tight truncate">{doc.title}</span>
                              </div>
                            </div>
                          </motion.button>
                        )}
                      </motion.div>
                    ))
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings */}
      <div className="p-4 border-t-2 border-black">
        <motion.button
          whileHover={{ y: -1 }}
          transition={{ duration: 0.2 }}
          onClick={() => navigate('/settings')}
          className={`w-full relative ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Settings' : ''}
        >
          <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
          <div className={`relative border-2 border-black flex items-center gap-2 bg-white text-[#111111] hover:bg-[#F2F0E9] transition-colors ${
            isCollapsed ? 'p-2 justify-center' : 'px-3 py-2'
          }`}>
            <Settings className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="font-sans text-xs font-black uppercase tracking-tight">SETTINGS</span>}
          </div>
        </motion.button>
      </div>
    </motion.aside>
  );
};


