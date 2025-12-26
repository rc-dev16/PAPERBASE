import { useState, useMemo, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Copy, Check, Download, FileText, Edit2, Save, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { generateCitation, documentToPaperMetadata, type CitationFormat } from '@/utils/citationEngine';
import { processBibTeX, parseBibTeX, buildBibTeX, autoFixBibTeX, type BibTeXEntry } from '@/utils/bibtexParser';
import { loadSettingsFromStorage } from '@/utils/settingsStorage';

interface CitationHelperProps {
  document?: {
    id: string;
    fileHash?: string;
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
  } | null;
  onCitationSave?: (format: CitationFormat, content: string) => void;
}

const FORMATS: CitationFormat[] = ['APA', 'IEEE', 'MLA', 'BibTeX'];

export const CitationHelper = ({ document, onCitationSave }: CitationHelperProps) => {
  const { user } = useUser();
  const { toast } = useToast();
  
  // Load default citation format from settings
  const defaultFormat = useMemo(() => {
    if (!user?.id) return 'APA';
    const settings = loadSettingsFromStorage(user.id);
    return settings.defaultCitationFormat || 'APA';
  }, [user?.id]);
  
  // Load citation export format from settings
  const exportFormat = useMemo(() => {
    if (!user?.id) return 'txt';
    const settings = loadSettingsFromStorage(user.id);
    return settings.citationExportFormat || 'txt';
  }, [user?.id]);
  
  const [activeFormat, setActiveFormat] = useState<CitationFormat>(defaultFormat);
  
  // Update active format when default changes
  useEffect(() => {
    setActiveFormat(defaultFormat);
  }, [defaultFormat]);
  const [copiedFormat, setCopiedFormat] = useState<CitationFormat | null>(null);
  const [isEditingBibTeX, setIsEditingBibTeX] = useState(false);
  const [editedBibTeX, setEditedBibTeX] = useState('');
  const [bibTeXValidation, setBibTeXValidation] = useState<{ missingFields: string[]; warnings: string[] } | null>(null);

  // Convert document to PaperMetadata and generate citations
  const paperMetadata = useMemo(() => {
    if (!document) return null;
    return documentToPaperMetadata(document);
  }, [document]);

  // Generate citation for active format
  const citation = useMemo(() => {
    if (!paperMetadata) {
      return 'No document metadata available. Please extract PDF information first.';
    }
    
    // For BibTeX, check if we're editing
    if (activeFormat === 'BibTeX' && isEditingBibTeX && editedBibTeX) {
      // Process the edited BibTeX (auto-fix happens here)
      const processed = processBibTeX(editedBibTeX);
      if (processed.validation) {
        // Update validation state (but don't trigger re-render in useMemo)
        setTimeout(() => {
          setBibTeXValidation(processed.validation);
        }, 0);
      }
      return processed.rebuilt;
    }
    
    return generateCitation(paperMetadata, activeFormat);
  }, [paperMetadata, activeFormat, isEditingBibTeX, editedBibTeX]);

  // Initialize edited BibTeX when entering edit mode
  const handleEditBibTeX = () => {
    if (!paperMetadata) return;
    const initialBibTeX = generateCitation(paperMetadata, 'BibTeX');
    setEditedBibTeX(initialBibTeX);
    setIsEditingBibTeX(true);
    
    // Validate initial BibTeX
    const processed = processBibTeX(initialBibTeX);
    setBibTeXValidation(processed.validation);
  };

  const handleSaveBibTeX = () => {
    if (!editedBibTeX.trim()) return;
    
    const processed = processBibTeX(editedBibTeX);
    
    // Use the auto-fixed version
    const finalBibTeX = processed.rebuilt;
    
    if (processed.validation && !processed.validation.isValid) {
      toast({
        title: 'Missing required fields',
        description: `Please fill: ${processed.validation.missingFields.join(', ')}`,
        variant: 'destructive',
      });
      // Still allow saving, but warn user
    }
    
    setEditedBibTeX(finalBibTeX);
    setIsEditingBibTeX(false);
    
    // Sync citation to backend if callback provided
    if (onCitationSave) {
      onCitationSave('BibTeX', finalBibTeX);
    }
    
    toast({
      title: 'BibTeX saved',
      description: processed.validation && !processed.validation.isValid
        ? 'Saved with warnings. Some required fields are missing.'
        : 'BibTeX has been auto-fixed and saved.',
    });
  };

  const handleCancelBibTeX = () => {
    setIsEditingBibTeX(false);
    setEditedBibTeX('');
    setBibTeXValidation(null);
  };

  // Auto-fix BibTeX on edit (validate as user types, apply fixes on blur)
  const handleBibTeXChange = (value: string) => {
    setEditedBibTeX(value);
    
    // Validate as user types
    if (value.trim()) {
      const processed = processBibTeX(value);
      if (processed.validation) {
        setBibTeXValidation(processed.validation);
      }
    } else {
      setBibTeXValidation(null);
    }
  };

  // Apply auto-fixes when user finishes editing (on blur)
  const handleBibTeXBlur = () => {
    if (!editedBibTeX.trim()) return;
    
    const processed = processBibTeX(editedBibTeX);
    
    // Only update if there were actual fixes
    if (processed.rebuilt !== editedBibTeX && processed.fixed) {
      setEditedBibTeX(processed.rebuilt);
      if (processed.validation) {
        setBibTeXValidation(processed.validation);
      }
    }
  };

  // Check if document has enough metadata for citations
  const hasMetadata = useMemo(() => {
    if (!document) return false;
    return !!(document.title || document.authors?.length || document.year);
  }, [document]);

  const handleCopy = (format?: CitationFormat) => {
    const formatToCopy = format || activeFormat;
    let citationToCopy = citation;
    
    // For BibTeX, use the current citation (which may be edited)
    if (formatToCopy === 'BibTeX' && isEditingBibTeX && editedBibTeX) {
      const processed = processBibTeX(editedBibTeX);
      citationToCopy = processed.rebuilt;
    } else if (paperMetadata) {
      citationToCopy = generateCitation(paperMetadata, formatToCopy);
    }
    
    navigator.clipboard.writeText(citationToCopy);
    setCopiedFormat(formatToCopy);
    toast({
      title: 'Citation copied',
      description: `${formatToCopy} citation copied to clipboard.`,
    });
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleExport = (format: CitationFormat) => {
    if (!paperMetadata) return;

    const citationText = generateCitation(paperMetadata, format);
    
    // Determine MIME type and file extension based on export format setting
    let mimeType: string;
    let fileExtension: string;
    
    switch (exportFormat) {
      case 'bib':
        mimeType = 'application/x-bibtex';
        fileExtension = 'bib';
        break;
      case 'rtf':
        mimeType = 'application/rtf';
        fileExtension = 'rtf';
        break;
      case 'txt':
      default:
        mimeType = 'text/plain';
        fileExtension = 'txt';
        break;
    }
    
    const blob = new Blob([citationText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `citation-${format.toLowerCase()}.${fileExtension}`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Citation exported',
      description: `${format} citation exported as ${fileExtension.toUpperCase()} file.`,
    });
  };

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <FileText className="h-12 w-12 text-[#111111] mx-auto mb-4 opacity-30" />
          <p className="font-sans text-sm font-black uppercase tracking-tight text-[#111111] mb-4">
            CITATIONS GENERATE FROM DOCUMENT METADATA
          </p>
          <div className="space-y-2 text-left">
            <div className="flex items-start gap-2">
              <span className="text-[#FF3B30] font-bold">1.</span>
              <p className="font-mono text-xs text-[#111111] uppercase">Select a document to view</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#FF3B30] font-bold">2.</span>
              <p className="font-mono text-xs text-[#111111] uppercase">Citations generate automatically</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#FF3B30] font-bold">3.</span>
              <p className="font-mono text-xs text-[#111111] uppercase">Copy or export in any format</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasMetadata) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <FileText className="h-12 w-12 text-[#111111] mx-auto mb-4 opacity-30" />
          <p className="font-sans text-sm font-black uppercase tracking-tight text-[#111111] mb-4">
            METADATA NEEDED FOR CITATIONS
          </p>
          <div className="space-y-2 text-left">
            <div className="flex items-start gap-2">
              <span className="text-[#FF3B30] font-bold">1.</span>
              <p className="font-mono text-xs text-[#111111] uppercase">Open document details panel</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#FF3B30] font-bold">2.</span>
              <p className="font-mono text-xs text-[#111111] uppercase">Extract PDF information</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#FF3B30] font-bold">3.</span>
              <p className="font-mono text-xs text-[#111111] uppercase">Citations generate automatically</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 md:p-6 border-b-2 border-black">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#FF3B30]" />
          <h4 className="font-sans text-sm font-black uppercase tracking-tight text-[#111111]">
            CITATIONS
          </h4>
        </div>
      </div>

      {/* Format Selector */}
      <div className="p-4 md:p-6 border-b-2 border-black">
        <div className="flex items-center gap-2 flex-wrap">
          {FORMATS.map((format) => (
            <motion.button
              key={format}
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveFormat(format)}
              className="relative"
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
              <div className={`relative border-2 border-black px-3 py-1.5 font-sans text-xs font-black uppercase tracking-tight transition-colors ${
                activeFormat === format
                  ? 'bg-[#FF3B30] text-white'
                  : 'bg-white text-[#111111] hover:bg-[#F2F0E9]'
              }`}>
                {format}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Citation Display - Show only active format */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFormat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative group"
          >
          <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
          <div className="relative bg-white border-2 border-black overflow-hidden">
            {/* Format Header */}
            <div className="px-4 py-2 border-b-2 border-black bg-[#F2F0E9] flex items-center justify-between">
              <span className="font-sans text-xs font-black uppercase tracking-tight text-[#111111]">
                {activeFormat}
              </span>
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ y: -1 }}
                  onClick={() => handleCopy(activeFormat)}
                  className="relative"
                  title="Copy citation"
                >
                  <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                  <div className="relative border-2 border-black w-6 h-6 bg-white hover:bg-[#F2F0E9] transition-colors flex items-center justify-center">
                    {copiedFormat === activeFormat ? (
                      <Check className="h-3 w-3 text-[#111111]" />
                    ) : (
                      <Copy className="h-3 w-3 text-[#111111]" />
                    )}
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ y: -1 }}
                  onClick={() => handleExport(activeFormat)}
                  className="relative"
                  title="Export citation"
                >
                  <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                  <div className="relative border-2 border-black w-6 h-6 bg-white hover:bg-[#F2F0E9] transition-colors flex items-center justify-center">
                    <Download className="h-3 w-3 text-[#111111]" />
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Citation Content */}
            <div className="p-4 overflow-x-hidden">
              {activeFormat === 'BibTeX' && isEditingBibTeX ? (
                <div className="space-y-3">
                  {/* Missing Fields Warnings */}
                  {bibTeXValidation && bibTeXValidation.missingFields.length > 0 && (
                    <div className="bg-[#FFF5F5] border-2 border-[#FF3B30] p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-[#FF3B30] flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-sans text-xs font-black uppercase tracking-tight text-[#FF3B30] mb-1">
                            MISSING REQUIRED FIELDS
                          </p>
                          <ul className="font-mono text-[10px] text-[#111111] space-y-1">
                            {bibTeXValidation.missingFields.map((field) => (
                              <li key={field}>⚠ {field}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {bibTeXValidation && bibTeXValidation.warnings.length > 0 && (
                    <div className="bg-[#FFFBF0] border-2 border-black p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-[#111111] flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <ul className="font-mono text-[10px] text-[#111111] space-y-1">
                            {bibTeXValidation.warnings.map((warning, idx) => (
                              <li key={idx}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BibTeX Editor */}
                  <textarea
                    value={editedBibTeX}
                    onChange={(e) => handleBibTeXChange(e.target.value)}
                    onBlur={handleBibTeXBlur}
                    className="w-full min-h-[200px] font-mono text-xs text-[#111111] border-2 border-black bg-white p-3 focus:border-[#FF3B30] focus:outline-none focus:ring-0 resize-none"
                    placeholder="Paste or edit BibTeX... (Auto-fixes applied on blur)"
                  />

                  {/* Edit Actions */}
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ y: -1 }}
                      onClick={handleSaveBibTeX}
                      className="relative flex-1"
                    >
                      <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                      <div className="relative bg-[#FF3B30] text-white border-2 border-black font-sans text-xs font-black uppercase tracking-tight px-4 py-2 hover:bg-[#E6342A] transition-colors flex items-center justify-center gap-2">
                        <Save className="h-3.5 w-3.5" />
                        SAVE
                      </div>
                    </motion.button>
                    <motion.button
                      whileHover={{ y: -1 }}
                      onClick={handleCancelBibTeX}
                      className="relative flex-1"
                    >
                      <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                      <div className="relative bg-white text-[#111111] border-2 border-black font-sans text-xs font-black uppercase tracking-tight px-4 py-2 hover:bg-[#F2F0E9] transition-colors flex items-center justify-center gap-2">
                        <X className="h-3.5 w-3.5" />
                        CANCEL
                      </div>
                    </motion.button>
                  </div>
                </div>
              ) : activeFormat === 'BibTeX' ? (
                <div className="space-y-3">
                  <pre className="font-mono text-xs text-[#111111] whitespace-pre-wrap break-words bg-[#F2F0E9] p-3 border-2 border-black">
                    {citation}
                  </pre>
                  <motion.button
                    whileHover={{ y: -1 }}
                    onClick={handleEditBibTeX}
                    className="relative w-full"
                  >
                    <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                    <div className="relative bg-white text-[#111111] border-2 border-black font-sans text-xs font-black uppercase tracking-tight px-4 py-2 hover:bg-[#F2F0E9] transition-colors flex items-center justify-center gap-2">
                      <Edit2 className="h-3.5 w-3.5" />
                      EDIT BIBTEX
                    </div>
                  </motion.button>
                </div>
              ) : (
                <p className="font-sans text-sm text-[#111111] leading-relaxed break-words max-w-full">
                  {citation}
                </p>
              )}
            </div>
          </div>
        </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
