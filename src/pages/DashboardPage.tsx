import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { NewProjectDialog } from '@/components/NewProjectDialog';
import type { Project } from '@/lib/mockData';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Search, FolderOpen, FileText, Upload, Layers, Clock, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { syncProjectToBackend, syncProjectsToBackend, loadProjectsFromBackend, deleteProjectFromBackend } from '@/utils/projectSync';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { getProjectsStorageKey } from '@/utils/projectStorage';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const DashboardPage = () => {
  const { user } = useUser();
  const supabase = useSupabaseClient(); // Get authenticated Supabase client for RLS
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Collapsible state - expanded on first visit (no projects), collapsed otherwise
  const [isCreateSectionExpanded, setIsCreateSectionExpanded] = useState(true);
  
  const userName = user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'USER';

  // Load user-specific projects when user changes
  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') {
      setIsLoadingProjects(false);
      return;
    }

    const loadProjects = async () => {
      setIsLoadingProjects(true);
      const storageKey = getProjectsStorageKey(user.id);

      try {
        // First, try to load from localStorage (fastest)
        const stored = window.localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as Project[];
          const revived = parsed.map((p) => ({
            ...p,
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
            lastAccessed: p.lastAccessed ? new Date(p.lastAccessed) : new Date(),
          }));
          setProjects(revived);
          setIsLoadingProjects(false);
          return;
        }

        // If localStorage is empty, try to load from backend
        if (supabase) {
          const backendProjects = await loadProjectsFromBackend(user.id, supabase);
          if (backendProjects.length > 0) {
            // Save to localStorage for next time
            window.localStorage.setItem(storageKey, JSON.stringify(backendProjects));
            setProjects(backendProjects);
          } else {
            setProjects([]);
          }
        } else {
          setProjects([]);
        }
      } catch (err) {
        setProjects([]);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    loadProjects();
  }, [user?.id, supabase]);

  // Persist projects to user-specific localStorage and sync to backend
  useEffect(() => {
    if (!user?.id || typeof window === 'undefined' || isLoadingProjects) {
      return;
    }

    try {
      const storageKey = getProjectsStorageKey(user.id);
      window.localStorage.setItem(storageKey, JSON.stringify(projects));// Sync projects to backend (non-blocking, IndexedDB-first)
      // Pass authenticated client for RLS protection
      if (supabase) {
        syncProjectsToBackend(projects, user.id, supabase).catch((error) => {});
      }
    } catch (err) {}
  }, [projects, user?.id, supabase, isLoadingProjects]);

  // Update collapsed state when projects change
  useEffect(() => {
    if (!isLoadingProjects) {
      setIsCreateSectionExpanded(projects.length === 0);
    }
  }, [projects.length, isLoadingProjects]);

  const toggleCreateSection = () => {
    setIsCreateSectionExpanded(!isCreateSectionExpanded);
  };

  const handleProjectCreated = (projectName: string, projectSummary: string) => {
    const trimmedName = projectName.trim();
    const trimmedSummary = projectSummary.trim();

    const nameExists = projects.some(
      (p) => p.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

    if (nameExists) {
      toast({
        title: 'Project name already exists',
        description: 'Please choose a different project name.',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date();
    const newProject: Project = {
      id: Date.now().toString(),
      name: trimmedName,
      description: trimmedSummary,
      paperCount: 0,
      lastAccessed: now,
      createdAt: now,
    };

    setProjects((prev) => {
      const updated = [newProject, ...prev];// Sync new project to backend (non-blocking, IndexedDB-first)
      // Pass authenticated client for RLS protection
      if (user?.id && supabase) {
        syncProjectToBackend(newProject, user.id, supabase).catch((error) => {});
      }
      
      return updated;
    });

    setSearchQuery('');

    toast({
      title: 'Project Created',
      description: `${projectName} has been created successfully.`,
    });
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete || !user?.id) return;

    setIsDeleting(true);
    try {
      const projectId = projectToDelete.id;
      const storageKey = getProjectsStorageKey(user.id);

      // 1. Delete all project-related data from localStorage
      // Documents
      window.localStorage.removeItem(`project-${projectId}-documents`);
      
      // Notes (project-wide and per-document)
      const projectNotesKey = `notes_${user.id}_${projectId}_all`;
      window.localStorage.removeItem(projectNotesKey);
      
      // Highlights (project-wide and per-document)
      const projectHighlightsKey = `highlights_${user.id}_${projectId}_all`;
      window.localStorage.removeItem(projectHighlightsKey);
      
      // Citations
      window.localStorage.removeItem(`project-${projectId}-citations`);

      // 2. Remove project from projects list
      const updatedProjects = projects.filter((p) => p.id !== projectId);
      setProjects(updatedProjects);
      
      // 3. Update localStorage
      window.localStorage.setItem(storageKey, JSON.stringify(updatedProjects));

      // 4. Delete from backend (non-blocking)
      if (supabase) {
        deleteProjectFromBackend(projectId, user.id, supabase).catch((error) => {});
      }

      toast({
        title: 'Project Deleted',
        description: `${projectToDelete.name} has been deleted.`,
      });

      setProjectToDelete(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F2F0E9]">
      {/* New Project Dialog */}
      <NewProjectDialog
        open={isNewProjectDialogOpen}
        onOpenChange={setIsNewProjectDialogOpen}
        onProjectCreated={handleProjectCreated}
      />

      {/* Delete Project Confirmation Dialog */}
      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent className="max-w-lg !bg-[#F2F0E9] !border-2 !border-black !p-0 !gap-0 !rounded-none !shadow-none">
          {/* Black Shadow */}
          <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1 -z-10"></div>
          
          {/* White Container */}
          <div className="relative bg-white border-2 border-black p-6 md:p-8">
            <AlertDialogHeader className="mb-6">
              <AlertDialogTitle className="font-sans text-xl md:text-2xl font-black uppercase tracking-tighter text-[#111111]">
                DELETE PROJECT
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="mt-4 font-mono text-xs md:text-sm text-[#111111] uppercase space-y-3">
                  <p>
                    Are you sure you want to delete <span className="text-[#FF3B30] font-bold">"{projectToDelete?.name}"</span>?
                  </p>
                  <p>
                    This will permanently delete:
                  </p>
                  <ul className="list-none pl-0 space-y-1.5 ml-2">
                    <li className="flex items-start gap-2">
                      <span className="text-[#FF3B30]">→</span>
                      <span>All documents in this project</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#FF3B30]">→</span>
                      <span>All notes and annotations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#FF3B30]">→</span>
                      <span>All highlights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#FF3B30]">→</span>
                      <span>All citations</span>
                    </li>
                  </ul>
                  <p className="font-black text-[#FF3B30] mt-4">
                    ⚠️ WARNING: THIS ACTION CANNOT BE REVERSED ⚠️
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-3 !flex-row !justify-end !mt-6">
              <motion.div
                className="relative inline-block"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* Black Shadow */}
                <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
                {/* White Button */}
                <motion.button
                  type="button"
                  onClick={() => setProjectToDelete(null)}
                  disabled={isDeleting}
                  className="relative bg-white text-[#111111] px-6 py-3 font-black text-sm uppercase tracking-tight cursor-pointer font-sans border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ 
                    backgroundColor: "#F2F0E9",
                    scale: 1.02
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  CANCEL
                </motion.button>
              </motion.div>
              <motion.div
                className="relative inline-block"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* Black Shadow */}
                <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
                {/* Red Button */}
                <motion.button
                  type="button"
                  onClick={handleDeleteProject}
                  disabled={isDeleting}
                  className="relative bg-[#FF3B30] text-white px-6 py-3 font-black text-sm uppercase tracking-tight cursor-pointer font-sans border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ 
                    backgroundColor: "#E6342A",
                    scale: 1.02
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  {isDeleting ? 'DELETING...' : 'DELETE'}
                </motion.button>
              </motion.div>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <DashboardHeader />

      {/* Main Content */}
      <main className="pt-24 md:pt-28 pb-8 max-w-[1920px] mx-auto px-4 md:px-6 lg:px-12 xl:px-16 flex gap-4 md:gap-6 lg:gap-8">
        {/* Sidebar: Projects + Search */}
        <aside
          className="flex flex-col w-full sm:w-64 md:w-72 lg:w-80 self-start flex-shrink-0"
        >
          <div className="relative mb-2 mr-2">
            {/* Black Shadow */}
            <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
            
            {/* White Container */}
            <div className="relative bg-white border-2 border-black p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-sans text-lg md:text-xl font-black uppercase tracking-tighter text-[#111111]">
                  YOUR PROJECTS
                </h2>
                <motion.button
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                  onClick={() => setIsNewProjectDialogOpen(true)}
                >
                  <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                  <div className="relative bg-[#FF3B30] text-white border-2 border-black font-sans font-black hover:bg-[#E6342A] transition-colors flex items-center justify-center w-8 h-8">
                    <Plus className="h-5 w-5" />
                  </div>
                </motion.button>
              </div>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#111111]" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-2 border-black bg-white text-[#111111] font-sans text-sm focus:border-[#FF3B30] focus:ring-0 focus:outline-none h-10 px-3 pl-10"
                />
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] pr-1">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="relative group">
                  <Link
                    to={`/project/${project.id}`}
                    className="block"
                  >
                    <motion.button
                      type="button"
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                      className="relative w-full"
                    >
                      <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                      <div className="relative bg-white border-2 border-black p-3 hover:bg-[#F2F0E9] transition-colors text-left">
                        <div className="flex items-start gap-3">
                          <FolderOpen className="h-5 w-5 text-[#FF3B30] flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <span className="block font-sans text-sm font-black uppercase tracking-tight text-[#111111] truncate">
                              {project.name}
                            </span>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className="font-mono text-[10px] text-[#111111] uppercase bg-[#F2F0E9] px-2 py-0.5 border border-black">
                                {project.createdAt.toLocaleDateString()}
                              </span>
                              <span className="font-mono text-[10px] text-[#111111] uppercase bg-[#F2F0E9] px-2 py-0.5 border border-black flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {project.paperCount} PAPERS
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  </Link>
                    <motion.button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setProjectToDelete(project);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                        <div className="relative bg-[#FF3B30] text-white border-2 border-black p-1.5 hover:bg-[#E6342A] transition-colors">
                          <Trash2 className="h-3 w-3" />
                        </div>
                      </div>
                    </motion.button>
                  </div>
                ))}

                {filteredProjects.length === 0 && (
                  <div className="py-6 text-center">
                    <p className="font-mono text-xs text-[#111111] uppercase">
                      NO PROJECTS FOUND.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Vertical Divider */}
        <div className="w-[1px] bg-black self-stretch flex-shrink-0"></div>

        {/* Main column: welcome, actions, content */}
        <section className="flex-1 flex flex-col min-w-0">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 md:mb-8"
          >
            <h1 className="font-sans text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-[#111111] mb-2">
              WELCOME BACK, {userName.toUpperCase()}
            </h1>
            <p className="font-mono text-sm md:text-base text-[#111111] uppercase">
              Pick up where you left off or start a new research project.
            </p>
          </motion.div>

          {/* Create Project Section - Collapsible */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="relative mb-2 mr-2">
              {/* Black Shadow */}
              <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
              
              {/* White Container */}
              <div className="relative bg-white border-2 border-black">
                {/* Collapsible Header */}
                <div className="w-full flex items-center justify-between p-6 md:p-8">
                  <button
                    onClick={toggleCreateSection}
                    className="flex-1 flex items-center justify-between hover:bg-[#F2F0E9] transition-colors text-left -m-2 p-2 rounded"
                  >
                    <h2 className="font-sans text-xl md:text-2xl font-black uppercase tracking-tighter text-[#111111]">
                      CREATE A NEW PROJECT
                    </h2>
                    <div className="flex items-center gap-2">
                      {isCreateSectionExpanded ? (
                        <ChevronUp className="h-6 w-6 text-[#111111]" />
                      ) : (
                        <ChevronDown className="h-6 w-6 text-[#111111]" />
                      )}
                    </div>
                  </button>
                  <motion.button
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="relative ml-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsNewProjectDialogOpen(true);
                    }}
                  >
                    <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
                    <div className="relative bg-[#FF3B30] text-white border-2 border-black font-sans font-black uppercase tracking-tight text-sm md:text-base px-6 md:px-8 py-3 md:py-4 hover:bg-[#E6342A] transition-colors flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      NEW PROJECT
                    </div>
                  </motion.button>
                </div>

                {/* Collapsible Content */}
                <motion.div
                  initial={false}
                  animate={{
                    height: isCreateSectionExpanded ? 'auto' : 0,
                    opacity: isCreateSectionExpanded ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-6 md:px-8 pb-6 md:pb-8">
                    <ul className="font-mono text-xs md:text-sm text-[#111111] uppercase space-y-2 list-none pl-0 mb-6">
                      <li className="flex items-start gap-2">
                        <span className="text-[#FF3B30]">→</span>
                        <span>Group all papers, notes, and citations for one research thread in a dedicated workspace.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#FF3B30]">→</span>
                        <span>Upload PDFs once, then read, annotate, and cite them from a single dashboard.</span>
                      </li>
                    </ul>

                    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                        <div className="relative bg-white border-2 border-black p-4">
                          <div className="mb-3">
                            <div className="w-10 h-10 bg-[#FF3B30] border-2 border-black flex items-center justify-center mb-2">
                              <Upload className="h-5 w-5 text-white" />
                            </div>
                            <p className="font-sans text-sm font-black uppercase tracking-tight text-[#111111] mb-1">
                              DRAG & DROP PDFS
                            </p>
                            <p className="font-mono text-[10px] text-[#111111] uppercase">
                              Attach multiple papers at once when you create a project.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                        <div className="relative bg-white border-2 border-black p-4">
                          <div className="mb-3">
                            <div className="w-10 h-10 bg-[#111111] border-2 border-black flex items-center justify-center mb-2">
                              <Layers className="h-5 w-5 text-white" />
                            </div>
                            <p className="font-sans text-sm font-black uppercase tracking-tight text-[#111111] mb-1">
                              KEEP PROJECTS ISOLATED
                            </p>
                            <p className="font-mono text-[10px] text-[#111111] uppercase">
                              Each project has its own reading list, notes, and citations.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <div className="absolute inset-0 bg-[#111111] translate-x-0.5 translate-y-0.5"></div>
                        <div className="relative bg-white border-2 border-black p-4">
                          <div className="mb-3">
                            <div className="w-10 h-10 bg-[#FF3B30] border-2 border-black flex items-center justify-center mb-2">
                              <Clock className="h-5 w-5 text-white" />
                            </div>
                            <p className="font-sans text-sm font-black uppercase tracking-tight text-[#111111] mb-1">
                              COME BACK ANYTIME
                            </p>
                            <p className="font-mono text-[10px] text-[#111111] uppercase">
                              We remember where you left off for every project you start.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.section>
        </section>
      </main>
    </div>
  );
};
