import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import type { Note } from '@/types/note';

interface NoteEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: Note | null; // If provided, edit mode; otherwise, create mode
  highlightId?: string | null; // If provided, note is attached to this highlight
  pageNumber: number;
  position?: { x: number; y: number }; // Normalized position for page notes
  onSave: (content: string) => void;
}

export const NoteEditorDialog = ({
  open,
  onOpenChange,
  note,
  highlightId,
  pageNumber,
  position,
  onSave,
}: NoteEditorDialogProps) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      if (note) {
        setContent(note.content);
      } else {
        setContent('');
      }
      // Focus textarea when dialog opens
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [open, note]);

  const handleSave = () => {
    if (content.trim()) {
      onSave(content.trim());
      setContent('');
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md mx-4"
        >
          <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
          <div className="relative bg-white border-2 border-black p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sans text-lg font-black uppercase tracking-tight text-[#111111]">
                {note ? 'EDIT NOTE' : 'ADD NOTE'}
              </h3>
              <button
                onClick={handleCancel}
                className="relative"
              >
                <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                <div className="relative border-2 border-black w-8 h-8 flex items-center justify-center bg-white hover:bg-[#F2F0E9] transition-colors">
                  <X className="h-4 w-4 text-[#111111]" />
                </div>
              </button>
            </div>

            {/* Info */}
            <div className="mb-4">
              <p className="font-mono text-xs uppercase text-[#111111] opacity-70">
                PAGE {pageNumber}
                {highlightId && ' • ATTACHED TO HIGHLIGHT'}
              </p>
            </div>

            {/* Content */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your note..."
              className="w-full min-h-[120px] resize-none border-2 border-black bg-white text-[#111111] font-sans text-sm px-3 py-2 focus:border-[#FF3B30] focus:outline-none focus:ring-0 mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSave();
                }
                if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
            />

            {/* Actions */}
            <div className="flex items-center gap-2 justify-end">
              <motion.button
                whileHover={{ y: -1 }}
                onClick={handleCancel}
                className="relative"
              >
                <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                <div className="relative border-2 border-black px-4 py-2 bg-white text-[#111111] hover:bg-[#F2F0E9] transition-colors font-sans text-xs font-black uppercase tracking-tight">
                  CANCEL
                </div>
              </motion.button>
              <motion.button
                whileHover={{ y: -1 }}
                onClick={handleSave}
                disabled={!content.trim()}
                className="relative"
              >
                <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                <div className={`relative border-2 border-black px-4 py-2 font-sans text-xs font-black uppercase tracking-tight flex items-center gap-2 ${
                  content.trim()
                    ? 'bg-[#FF3B30] text-white hover:bg-[#E6342A]'
                    : 'bg-[#F2F0E9] text-[#111111] opacity-50 cursor-not-allowed'
                } transition-colors`}>
                  <Check className="h-4 w-4" />
                  {note ? 'UPDATE' : 'CREATE'}
                </div>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
