import { useState } from 'react';
import { Highlighter, Trash2, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Highlight } from '@/types/highlight';

interface HighlightsPanelProps {
  projectId: string;
  highlights: Highlight[];
  onDeleteHighlight: (id: string) => void;
  activeDocumentId?: string | null;
  onHighlightClick?: (highlight: Highlight) => void; // Navigate to highlight
}

const colorBarColors = {
  yellow: 'bg-yellow-400',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  pink: 'bg-pink-400',
  orange: 'bg-[#FF3B30]',
};

export const HighlightsPanel = ({
  projectId,
  highlights,
  onDeleteHighlight,
  activeDocumentId,
  onHighlightClick,
}: HighlightsPanelProps) => {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(
    activeDocumentId || null
  );

  // Filter highlights by selected document, or show all if none selected
  const filteredHighlights = selectedDocument
    ? highlights.filter((h) => (h.documentId || h.pdfId) === selectedDocument)
    : highlights;

  // Get unique documents from highlights
  const documents = Array.from(
    new Map(
      highlights.map((h) => [
        h.documentId || h.pdfId,
        { id: h.documentId || h.pdfId, title: h.documentTitle || h.text.substring(0, 30) },
      ])
    ).values()
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 md:p-6 border-b-2 border-black">
        <div className="flex items-center gap-2 mb-3">
          <Highlighter className="h-5 w-5 text-[#FF3B30]" />
          <h3 className="font-sans text-sm font-black uppercase tracking-tight text-[#111111]">HIGHLIGHTS</h3>
        </div>

        {/* Document Filter */}
        {documents.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <motion.button
              whileHover={{ y: -1 }}
              onClick={() => setSelectedDocument(null)}
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
            {documents.map((doc) => (
              <motion.button
                key={doc.id}
                whileHover={{ y: -1 }}
                onClick={() => setSelectedDocument(doc.id)}
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

      {/* Highlights List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {filteredHighlights.length > 0 ? (
          <div className="space-y-3">
            {filteredHighlights.map((highlight) => (
              <motion.div
                key={highlight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                <div
                  className={`relative bg-white border-2 border-black p-3 ${
                    onHighlightClick ? 'cursor-pointer hover:bg-[#F2F0E9]' : ''
                  }`}
                  onClick={() => onHighlightClick?.(highlight)}
                >
                  {/* Colored vertical bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorBarColors[highlight.color]}`} />
                  
                  <div className="flex items-start justify-between gap-2 mb-2 pl-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-3.5 w-3.5 text-[#111111] flex-shrink-0" />
                      <span className="font-sans text-xs font-black uppercase tracking-tight text-[#111111] truncate">
                        {highlight.documentTitle || highlight.text.substring(0, 30)}
                      </span>
                      {(highlight.page || highlight.pageNumber) && (
                        <span className="font-mono text-[10px] uppercase text-[#111111] bg-[#F2F0E9] px-2 py-0.5 border border-black">
                          PAGE {highlight.page || highlight.pageNumber}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteHighlight(highlight.id);
                      }}
                      className="h-6 w-6 flex-shrink-0 border-2 border-black bg-white hover:bg-[#F2F0E9] hover:border-[#FF3B30] transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-[#111111]" />
                    </button>
                  </div>
                  <p className="font-sans text-sm text-[#111111] mb-2 leading-relaxed pl-3">{highlight.text}</p>
                  {highlight.note && (
                    <div className="mt-2 pt-2 border-t-2 border-black pl-3">
                      <p className="font-mono text-[10px] text-[#111111] uppercase italic">{highlight.note}</p>
                    </div>
                  )}
                  <p className="font-mono text-[10px] text-[#111111] uppercase opacity-70 mt-2 pl-3">
                    {new Date(highlight.createdAt || highlight.date || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md px-4">
              <Highlighter className="h-12 w-12 text-[#111111] mx-auto mb-4 opacity-30" />
              <p className="font-sans text-sm font-black uppercase tracking-tight text-[#111111] mb-4">
                {selectedDocument
                  ? 'HIGHLIGHTS SAVE WHEN YOU SELECT TEXT'
                  : 'TEXT SELECTION CREATES HIGHLIGHTS'}
              </p>
              <div className="space-y-2 text-left">
                {selectedDocument ? (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="text-[#FF3B30] font-bold">1.</span>
                      <p className="font-mono text-xs text-[#111111] uppercase">Click on highlight button in viewer</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#FF3B30] font-bold">2.</span>
                      <p className="font-mono text-xs text-[#111111] uppercase">Select text to highlight</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#FF3B30] font-bold">3.</span>
                      <p className="font-mono text-xs text-[#111111] uppercase">Highlights save automatically</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="text-[#FF3B30] font-bold">1.</span>
                      <p className="font-mono text-xs text-[#111111] uppercase">Open a document to read</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#FF3B30] font-bold">2.</span>
                      <p className="font-mono text-xs text-[#111111] uppercase">Select text to highlight</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#FF3B30] font-bold">3.</span>
                      <p className="font-mono text-xs text-[#111111] uppercase">All highlights appear here</p>
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

