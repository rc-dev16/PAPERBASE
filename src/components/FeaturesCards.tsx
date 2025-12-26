import { motion } from 'framer-motion';
import { FileText, Calendar, MoreVertical, Upload, Search, PenTool, Layers, BookOpen, ArrowDown } from 'lucide-react';

const features = [
  {
    id: 'pdf-viewer',
    title: 'In-Browser PDF Viewer',
    description: 'Read and annotate research papers directly in your browser with full text selection and zoom controls.',
    color: '#FF3B30', // Red
    icon: FileText,
    date: '2025-01-15',
  },
  {
    id: 'project-organization',
    title: 'Project-Centric Organization',
    description: 'Organize your research into dedicated projects with isolated reading lists, notes, and citations for each study.',
    color: '#111111', // Black
    icon: Layers,
    date: '2025-02-20',
  },
  {
    id: 'smart-notes',
    title: 'Smart Note Taking',
    description: 'Capture insights, thoughts, and references with contextual notes that stay linked to your documents.',
    color: '#FF3B30', // Red
    icon: PenTool,
    date: '2025-03-10',
  },
  {
    id: 'citation-generation',
    title: 'Automated Citation Generation',
    description: 'Generate accurate citations automatically from your research papers with proper formatting and metadata.',
    color: '#111111', // Black
    icon: BookOpen,
    date: '2025-04-05',
  },
  {
    id: 'document-management',
    title: 'Seamless Document Management',
    description: 'Upload, organize, and manage multiple PDFs per project with drag-and-drop functionality and persistent storage.',
    color: '#FF3B30', // Red
    icon: Upload,
    date: '2025-05-12',
  },
];

export default function FeaturesCards() {
  return (
    <section className="bg-[#F2F0E9] h-screen flex flex-col overflow-hidden px-6 md:px-12 lg:px-16 py-8 md:py-12 relative">
      {/* Scroll Button */}
      <motion.button
        onClick={() => {
          const element = document.querySelector('#pricing');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute bottom-8 right-8 md:right-12 pointer-events-auto cursor-pointer hover:opacity-70 transition-opacity z-50"
        aria-label="Scroll to next section"
      >
        <ArrowDown className="w-8 h-8 text-black" />
      </motion.button>
      
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col overflow-hidden">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-6 md:mb-8 flex-shrink-0"
        >
          <span className="text-xs font-mono uppercase tracking-widest text-black/60 block mb-2 md:mb-3 font-bold">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter leading-[0.9] text-black font-sans">
            Everything You Need
            <br />
            <span className="text-[#FF3B30]">To Research Better</span>
          </h2>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 flex-grow min-h-0 overflow-hidden">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                className="relative"
                initial={{ opacity: 0, y: 50, scale: 0.9, rotateX: -10 }}
                whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {/* Black Shadow */}
                <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
                {/* Card */}
                <motion.div
                  whileHover={{
                    y: -4,
                    transition: { duration: 0.2, ease: "easeOut" },
                  }}
                  className="relative bg-white border-2 border-black flex flex-col h-full cursor-pointer overflow-hidden"
                >
                  {/* Top-Left Color Indicator */}
                  <div
                    className="absolute top-0 left-0 w-5 h-5 z-10"
                    style={{ backgroundColor: feature.color }}
                  />

                  {/* Card Content */}
                  <div className="p-5 md:p-6 lg:p-7 pt-7 md:pt-8 lg:pt-9 flex flex-col h-full min-h-0 overflow-hidden">
                    {/* Title */}
                    <h3 className="text-lg md:text-xl lg:text-2xl font-black text-black font-sans mb-2 md:mb-3 leading-tight flex-shrink-0">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs md:text-sm lg:text-base text-black/80 font-sans mb-3 md:mb-4 leading-relaxed flex-grow min-h-0 overflow-hidden text-ellipsis line-clamp-4">
                      {feature.description}
                    </p>

                    {/* Separator Line */}
                    <div className="h-px bg-black/20 mb-3 flex-shrink-0"></div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 md:w-5 md:h-5 text-black/40" />
                          <span className="text-xs md:text-sm font-mono text-black font-medium">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 md:w-5 md:h-5 text-black/40" />
                          <span className="text-xs md:text-sm font-mono text-black font-medium">
                            {feature.date}
                          </span>
                        </div>
                      </div>
                      <MoreVertical className="w-4 h-4 md:w-5 md:h-5 text-black/40 cursor-pointer hover:text-black transition-colors" />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


