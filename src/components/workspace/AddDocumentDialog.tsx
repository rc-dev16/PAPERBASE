import { useState, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Upload, X, FileText, Loader2 } from 'lucide-react';

interface AddDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentAdded?: (file: File) => void;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/markdown',
  'text/plain',
];

export const AddDocumentDialog = ({ open, onOpenChange, onDocumentAdded }: AddDocumentDialogProps) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 500 MB limit';
    }

    const isValidType =
      ALLOWED_FILE_TYPES.includes(file.type) ||
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.doc') ||
      file.name.toLowerCase().endsWith('.docx') ||
      file.name.toLowerCase().endsWith('.md');

    if (!isValidType) {
      return 'Only PDF, Word (.doc, .docx), and Markdown (.md) files are supported';
    }

    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    const error = validateFile(selectedFile);
    if (error) {
      toast({
        title: 'Invalid file',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleAdd = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to add.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      onDocumentAdded?.(file);
      setFile(null);
      onOpenChange(false);
    } catch (error) {} finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl bg-[#F2F0E9] border-2 border-black p-0 gap-0">
        {/* Black Shadow for the entire dialog */}
        <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1 -z-10"></div>

        <div className="relative bg-white border-2 border-black p-6 md:p-8">
          <DialogHeader>
            <DialogTitle className="font-sans text-2xl font-black uppercase tracking-tight text-[#111111]">
              ADD DOCUMENT
            </DialogTitle>
            <DialogDescription className="font-mono text-xs uppercase text-[#111111] opacity-70 mt-2">
              UPLOAD A PDF, WORD DOCUMENT, OR MARKDOWN FILE TO ADD TO THIS PROJECT.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-6">
            {/* File Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative border-2 border-dashed p-8 text-center transition-colors ${
                isDragging
                  ? 'border-[#FF3B30] bg-[#F2F0E9]'
                  : file
                  ? 'border-black bg-white'
                  : 'border-black hover:border-[#FF3B30] bg-white'
              }`}
            >
              {file ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                      <div className="relative bg-[#FF3B30] p-3 border-2 border-black">
                        <FileText className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="font-sans text-base font-black uppercase tracking-tight text-[#111111]">{file.name}</p>
                    <p className="font-mono text-xs uppercase text-[#111111] opacity-70 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ y: -1 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => {
                      setFile(null);
                      fileInputRef.current?.click();
                    }}
                    className="relative inline-block"
                  >
                    <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                    <div className="relative border-2 border-black px-4 py-2 bg-white text-[#111111] hover:bg-[#F2F0E9] transition-colors font-sans text-xs font-black uppercase tracking-tight">
                      CHANGE FILE
                    </div>
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                      <div className="relative bg-[#FF3B30] p-3 border-2 border-black">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="font-sans text-base font-black uppercase tracking-tight text-[#111111] mb-2">
                      DRAG AND DROP A FILE HERE
                    </p>
                    <p className="font-mono text-xs uppercase text-[#111111] opacity-70 mb-3">OR</p>
                    <motion.button
                      whileHover={{ y: -1 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="relative inline-block"
                    >
                      <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                      <div className="relative border-2 border-black px-4 py-2 bg-white text-[#111111] hover:bg-[#F2F0E9] transition-colors font-sans text-xs font-black uppercase tracking-tight">
                        BROWSE FILES
                      </div>
                    </motion.button>
                  </div>
                  <p className="font-mono text-[10px] uppercase text-[#111111] opacity-60 mt-4">
                    PDF, WORD (.DOC, .DOCX), MARKDOWN (.MD) UP TO 500 MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.md"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-3 mt-6">
            <motion.button
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
              onClick={handleCancel}
              disabled={isUploading}
              className="relative flex-1"
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
              <div className="relative border-2 border-black px-4 py-2 bg-white text-[#111111] hover:bg-[#F2F0E9] transition-colors font-sans text-sm font-black uppercase tracking-tight disabled:opacity-50">
                CANCEL
              </div>
            </motion.button>
            <motion.button
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
              onClick={handleAdd}
              disabled={!file || isUploading}
              className="relative flex-1"
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
              <div className="relative border-2 border-black px-4 py-2 bg-[#FF3B30] text-white hover:bg-[#E6342A] transition-colors font-sans text-sm font-black uppercase tracking-tight disabled:opacity-50 flex items-center justify-center gap-2">
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    ADDING...
                  </>
                ) : (
                  'ADD DOCUMENT'
                )}
              </div>
            </motion.button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

