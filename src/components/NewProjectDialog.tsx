import { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (projectName: string, projectSummary: string) => void;
}

export const NewProjectDialog = ({ open, onOpenChange, onProjectCreated }: NewProjectDialogProps) => {
  const { toast } = useToast();
  const [projectName, setProjectName] = useState('');
  const [projectSummary, setProjectSummary] = useState('');

  const handleCreateProject = () => {
    const trimmedName = projectName.trim();
    const trimmedSummary = projectSummary.trim();

    if (!trimmedName) {
      toast({
        title: 'Project Name Required',
        description: 'Please enter a project name.',
        variant: 'destructive',
      });
      return;
    }

    if (!trimmedSummary) {
    toast({
        title: 'Project Summary Required',
        description: 'Please enter a project summary.',
        variant: 'destructive',
    });
      return;
    }

    if (onProjectCreated) {
      onProjectCreated(trimmedName, trimmedSummary);
    }

    setProjectName('');
    setProjectSummary('');
    onOpenChange(false);
  };

  const handleClose = () => {
      setProjectName('');
    setProjectSummary('');
      onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-[#F2F0E9] border-2 border-black p-0 gap-0">
        {/* Black Shadow */}
        <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1 -z-10"></div>
        
        <div className="relative bg-white border-2 border-black p-6 md:p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-sans text-2xl md:text-3xl font-black uppercase tracking-tighter text-[#111111]">
              CREATE NEW PROJECT
            </DialogTitle>
            <DialogDescription asChild>
              <p className="mt-4 font-mono text-xs md:text-sm text-[#111111] uppercase">
                Create a new research project. You can add documents later from the project view.
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Project Name Input */}
            <div className="space-y-2">
              <label htmlFor="project-name" className="font-mono text-xs uppercase text-[#111111] font-bold block">
                PROJECT NAME *
              </label>
              <input
                id="project-name"
                type="text"
                placeholder="e.g., Machine Learning Research"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full border-2 border-black bg-white text-[#111111] font-sans text-sm focus:border-[#FF3B30] focus:ring-0 focus:outline-none h-11 px-4"
              />
            </div>

            {/* Project Summary Input */}
            <div className="space-y-2">
              <label htmlFor="project-summary" className="font-mono text-xs uppercase text-[#111111] font-bold block">
                PROJECT SUMMARY *
              </label>
              <textarea
                id="project-summary"
                placeholder="Brief description of your research project..."
                value={projectSummary}
                onChange={(e) => setProjectSummary(e.target.value)}
                rows={4}
                className="w-full border-2 border-black bg-white text-[#111111] font-sans text-sm focus:border-[#FF3B30] focus:ring-0 focus:outline-none px-4 py-3 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="mt-8 flex gap-4 justify-end">
            <motion.button
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              onClick={handleClose}
              className="relative"
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
              <div className="relative bg-white text-[#111111] border-2 border-black font-sans font-black uppercase tracking-tight text-sm px-6 py-3 hover:bg-[#F2F0E9] transition-colors">
                CANCEL
              </div>
            </motion.button>
            <motion.button
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              onClick={handleCreateProject}
              className="relative"
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
              <div className="relative bg-[#FF3B30] text-white border-2 border-black font-sans font-black uppercase tracking-tight text-sm px-6 py-3 hover:bg-[#E6342A] transition-colors">
                CREATE PROJECT
              </div>
            </motion.button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
