import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { mockPapers, generateCitation, type Paper } from '@/lib/mockData';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  Check,
  FileText,
  StickyNote,
  Tag,
  Quote,
} from 'lucide-react';

type CitationFormat = 'ieee' | 'apa' | 'mla';
type NoteSection = 'abstract' | 'methodology' | 'results' | 'discussion' | 'general';

export const PaperViewerPage = () => {
  const { id } = useParams();
  const paper = mockPapers.find((p) => p.id === id) || mockPapers[0];

  const [currentPage, setCurrentPage] = useState(paper.lastReadPage || 1);
  const [zoom, setZoom] = useState(100);
  const [showCitationPanel, setShowCitationPanel] = useState(true);
  const [activeFormat, setActiveFormat] = useState<CitationFormat>('ieee');
  const [copied, setCopied] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [activeNoteSection, setActiveNoteSection] = useState<NoteSection>('general');
  const [noteContent, setNoteContent] = useState('');

  const handleCopy = () => {
    const citation = generateCitation(paper, activeFormat);
    navigator.clipboard.writeText(citation);
    setCopied(true);
    toast.success('Citation copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const citationFormats: { id: CitationFormat; label: string }[] = [
    { id: 'ieee', label: 'IEEE' },
    { id: 'apa', label: 'APA' },
    { id: 'mla', label: 'MLA' },
  ];

  const noteSections: { id: NoteSection; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'abstract', label: 'Abstract' },
    { id: 'methodology', label: 'Methodology' },
    { id: 'results', label: 'Results' },
    { id: 'discussion', label: 'Discussion' },
  ];

  const progress = Math.round((currentPage / paper.totalPages) * 100);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/project/1">
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="font-medium text-foreground text-sm line-clamp-1">{paper.title}</h1>
            <p className="text-xs text-muted-foreground">
              {paper.authors.slice(0, 2).join(', ')} • {paper.year}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showNotesPanel ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowNotesPanel(!showNotesPanel)}
            className="gap-2"
          >
            <StickyNote className="h-4 w-4" />
            <span className="hidden sm:inline">Notes</span>
          </Button>
          <Button
            variant={showCitationPanel ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowCitationPanel(!showCitationPanel)}
            className="gap-2"
          >
            <Quote className="h-4 w-4" />
            <span className="hidden sm:inline">Cite</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer */}
        <main className="flex-1 flex flex-col bg-muted/50">
          {/* Toolbar */}
          <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                disabled={zoom <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                {currentPage} / {paper.totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(Math.min(paper.totalPages, currentPage + 1))}
                disabled={currentPage >= paper.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{progress}% read</span>
              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* PDF Content (Simulated) */}
          <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card shadow-soft-lg rounded-lg max-w-3xl w-full"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            >
              {/* Simulated PDF page */}
              <div className="aspect-[8.5/11] p-8 md:p-12">
                {currentPage === 1 ? (
                  <div className="space-y-6">
                    <div className="text-center space-y-4">
                      <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                        {paper.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {paper.authors.join(', ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {paper.journal} • {paper.year}
                      </p>
                    </div>
                    <div className="border-t border-border pt-6">
                      <h3 className="font-semibold text-foreground mb-3">Abstract</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {paper.abstract ||
                          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-4">
                      {paper.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                      tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                      veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                      commodo consequat.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
                      dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
                      proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
                      doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore
                      veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                    </p>
                    <div className="text-xs text-muted-foreground text-right pt-8">
                      Page {currentPage}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </main>

        {/* Side Panels */}
        <AnimatePresence>
          {showCitationPanel && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-border bg-card overflow-hidden flex-shrink-0"
            >
              <div className="w-80 h-full flex flex-col">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <Quote className="h-4 w-4 text-primary" />
                    Citation Helper
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowCitationPanel(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-4 flex-1 overflow-auto">
                  {/* Format Tabs */}
                  <div className="flex gap-1 mb-4 p-1 bg-muted rounded-lg">
                    {citationFormats.map((format) => (
                      <button
                        key={format.id}
                        onClick={() => setActiveFormat(format.id)}
                        className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                          activeFormat === format.id
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {format.label}
                      </button>
                    ))}
                  </div>

                  {/* Citation Output */}
                  <div className="bg-muted p-4 rounded-lg mb-4">
                    <p className="text-sm text-foreground leading-relaxed">
                      {generateCitation(paper, activeFormat)}
                    </p>
                  </div>

                  <Button
                    variant="default"
                    className="w-full gap-2"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Citation
                      </>
                    )}
                  </Button>

                  {/* Paper Info */}
                  <div className="mt-6 pt-6 border-t border-border space-y-4">
                    <h4 className="text-sm font-medium text-foreground">Paper Details</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-muted-foreground block text-xs mb-1">Authors</span>
                        <span className="text-foreground">{paper.authors.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs mb-1">Year</span>
                        <span className="text-foreground">{paper.year}</span>
                      </div>
                      {paper.journal && (
                        <div>
                          <span className="text-muted-foreground block text-xs mb-1">Journal</span>
                          <span className="text-foreground">{paper.journal}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground block text-xs mb-1">Tags</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {paper.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}

          {showNotesPanel && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-border bg-card overflow-hidden flex-shrink-0"
            >
              <div className="w-80 h-full flex flex-col">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-primary" />
                    Notes
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowNotesPanel(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-4 flex-1 overflow-auto">
                  {/* Section Selector */}
                  <div className="mb-4">
                    <span className="text-xs text-muted-foreground mb-2 block">Section</span>
                    <div className="flex flex-wrap gap-1">
                      {noteSections.map((section) => (
                        <Badge
                          key={section.id}
                          variant={activeNoteSection === section.id ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => setActiveNoteSection(section.id)}
                        >
                          {section.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Note Input */}
                  <Textarea
                    placeholder={`Add notes about ${activeNoteSection}...`}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="min-h-[200px] mb-4"
                  />

                  <Button variant="default" className="w-full">
                    Save Note
                  </Button>

                  {/* Existing Notes */}
                  {paper.notes && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="text-sm font-medium text-foreground mb-3">Previous Notes</h4>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">{paper.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
