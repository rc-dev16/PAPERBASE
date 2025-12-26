import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const CapabilitiesPage = () => {
  return (
    <div className="h-screen bg-[#F2F0E9] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b-2 border-black sticky top-0 bg-[#F2F0E9] z-10 flex-shrink-0">
        <div className="w-full px-6 md:px-12 lg:px-16 py-4 md:py-6">
          <div className="relative flex items-center w-full">
            {/* Back Button - Extreme Left */}
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-black hover:text-[#FF3B30] transition-colors font-sans font-bold uppercase tracking-widest text-xs md:text-sm z-10"
            >
              <ArrowLeft className="w-4 h-4" />
              BACK
            </Link>
            
            {/* PB Logo + CAPABILITIES - Centered */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
              <img 
                src="/PB.png" 
                alt="PB Logo" 
                className="h-6 md:h-8 w-auto"
              />
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter leading-[0.9] text-black font-sans">
                CAPABILITIES
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-4 md:py-6 flex-1 overflow-visible">
        <div className="h-full flex flex-col">
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 flex-grow min-h-0 overflow-visible pr-2 pb-2">
            {/* System Purpose Card */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
              <div className="relative bg-white border-2 border-black flex flex-col h-full overflow-hidden">
                <div className="absolute top-0 left-0 w-5 h-5 z-10 bg-[#111111]"></div>
                <div className="p-4 md:p-5 pt-6 md:pt-7 flex flex-col h-full min-h-0">
                  <h3 className="text-lg md:text-xl font-black text-black font-sans mb-2 leading-tight flex-shrink-0">
                    System Purpose
                  </h3>
                  <div className="flex-grow min-h-0 overflow-hidden space-y-2">
                    <p className="text-sm md:text-base text-black/80 font-mono leading-relaxed">
                      This platform is a <strong className="text-black font-bold">scalable research document system</strong>.
                      The tiers shown here do not represent pricing or subscriptions.
                    </p>
                    <p className="text-sm md:text-base text-black/80 font-mono leading-relaxed">
                      They illustrate how the system scales under different workloads and how AI-powered document analysis is handled efficiently.
                    </p>
                  </div>
                  <div className="h-px bg-black/20 mt-auto mb-2 flex-shrink-0"></div>
                  <p className="text-xs font-bold text-black flex-shrink-0 font-mono uppercase">
                    Payments are intentionally not enabled.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Capability Index Card */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -4 }}
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
              <div className="relative bg-white border-2 border-black flex flex-col h-full overflow-hidden">
                <div className="absolute top-0 left-0 w-5 h-5 z-10 bg-[#FF3B30]"></div>
                <div className="p-4 md:p-5 pt-6 md:pt-7 flex flex-col h-full min-h-0">
                  <h3 className="text-lg md:text-xl font-black text-black font-sans mb-2 leading-tight flex-shrink-0">
                    Capability Index (CI)
                  </h3>
                  <p className="text-sm md:text-base text-black/80 font-mono mb-2 leading-relaxed flex-grow min-h-0 overflow-hidden">
                    The Capability Index is a <strong className="text-black font-bold">relative, non-monetary measure</strong> of system scale.
                    It reflects document volume, AI processing depth, collaboration, and throughput.
                  </p>
                  <div className="h-px bg-black/20 mt-auto mb-2 flex-shrink-0"></div>
                  <p className="text-sm md:text-base text-black/80 font-mono leading-relaxed flex-shrink-0">
                    Higher values indicate support for larger and more sustained research workflows.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Usage Modes Card */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -4 }}
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
              <div className="relative bg-white border-2 border-black flex flex-col h-full overflow-hidden">
                <div className="absolute top-0 left-0 w-5 h-5 z-10 bg-[#111111]"></div>
                <div className="p-4 md:p-5 pt-6 md:pt-7 flex flex-col h-full min-h-0">
                  <h3 className="text-lg md:text-xl font-black text-black font-sans mb-2 leading-tight flex-shrink-0">
                    Usage Modes
                  </h3>
                  <div className="space-y-1.5 flex-grow min-h-0 overflow-hidden">
                    <p className="text-sm md:text-base text-black/80 font-mono leading-relaxed">
                      <strong className="text-black font-bold">Baseline:</strong> Short-term or moderate usage with limited AI processing
                    </p>
                    <p className="text-sm md:text-base text-black/80 font-mono leading-relaxed">
                      <strong className="text-black font-bold">Sustained:</strong> Continuous, high-throughput workflows with repeated AI analysis
                    </p>
                  </div>
                  <div className="h-px bg-black/20 mt-auto mb-2 flex-shrink-0"></div>
                  <p className="text-sm md:text-base text-black/80 font-mono leading-relaxed flex-shrink-0">
                    Switching modes shows how the same architecture adapts to different load patterns.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Personal Research Card */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ y: -4 }}
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
              <div className="relative bg-white border-2 border-black flex flex-col h-full overflow-hidden">
                <div className="absolute top-0 left-0 w-5 h-5 z-10 bg-[#FF3B30]"></div>
                <div className="p-4 md:p-5 pt-6 md:pt-7 flex flex-col h-full min-h-0">
                  <h3 className="text-lg md:text-xl font-black text-black font-sans mb-2 leading-tight flex-shrink-0">
                    Personal Research
                  </h3>
                  <p className="text-sm md:text-base font-mono text-black mb-2 flex-shrink-0">
                    CI <strong className="font-bold">120</strong> → <strong className="font-bold">220</strong>
                  </p>
                  <p className="text-sm md:text-base text-black/80 font-mono leading-relaxed flex-grow min-h-0 overflow-hidden">
                    Individual, offline-first research
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Research Lab Card */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ y: -4 }}
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
              <div className="relative bg-white border-2 border-[#FF3B30] flex flex-col h-full overflow-hidden">
                <div className="absolute top-0 left-0 w-5 h-5 z-10 bg-[#111111]"></div>
                <div className="p-4 md:p-5 pt-6 md:pt-7 flex flex-col h-full min-h-0">
                  <h3 className="text-lg md:text-xl font-black text-black font-sans mb-2 leading-tight flex-shrink-0">
                    Research Lab (Core Tier)
                  </h3>
                  <p className="text-sm md:text-base font-mono text-black mb-2 flex-shrink-0">
                    CI <strong className="font-bold">420</strong> → <strong className="font-bold">720</strong>
                  </p>
                  <p className="text-sm md:text-base text-black/80 font-mono leading-relaxed flex-grow min-h-0 overflow-hidden">
                    Collaborative research with AI extraction and deduplication
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Institutional Card */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              whileHover={{ y: -4 }}
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
              <div className="relative bg-white border-2 border-black flex flex-col h-full overflow-hidden">
                <div className="absolute top-0 left-0 w-5 h-5 z-10 bg-[#FF3B30]"></div>
                <div className="p-4 md:p-5 pt-6 md:pt-7 flex flex-col h-full min-h-0">
                  <h3 className="text-lg md:text-xl font-black text-black font-sans mb-2 leading-tight flex-shrink-0">
                    Institutional (Vision Tier)
                  </h3>
                  <p className="text-sm md:text-base font-mono text-black mb-2 flex-shrink-0">
                    CI <strong className="font-bold">900</strong> → <strong className="font-bold">1600</strong>
                  </p>
                  <p className="text-sm md:text-base text-black/80 font-mono leading-relaxed flex-grow min-h-0 overflow-hidden">
                    Organization-scale systems and future governance features
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Row - Why This Design & Not a Pricing Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6 flex-shrink-0">
            {/* Why This Design Card */}
            <motion.div
              className="relative h-full"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              whileHover={{ y: -4 }}
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
              <div className="relative bg-white border-2 border-black flex flex-col h-full overflow-hidden">
                <div className="absolute top-0 left-0 w-5 h-5 z-10 bg-[#111111]"></div>
                <div className="p-4 md:p-5 pt-6 md:pt-7 flex flex-col h-full">
                  <h3 className="text-lg md:text-xl font-black text-black font-sans mb-2 leading-tight flex-shrink-0">
                    Why This Design
                  </h3>
                  <p className="text-sm md:text-base text-black/80 font-mono leading-relaxed flex-grow">
                    This model enables document reuse, avoids repeated AI processing, scales without redesign, and remains offline-first while being backend-ready.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Not a Pricing Model Card */}
            <motion.div
              className="relative h-full"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              whileHover={{ y: -4 }}
            >
              <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
              <div className="relative bg-white border-2 border-black flex flex-col h-full overflow-hidden">
                <div className="absolute top-0 left-0 w-5 h-5 z-10 bg-[#FF3B30]"></div>
                <div className="p-4 md:p-5 pt-6 md:pt-7 flex flex-col h-full">
                  <h3 className="text-lg md:text-xl font-black text-black font-sans mb-2 leading-tight flex-shrink-0">
                    Not a Pricing Model
                  </h3>
                  <p className="text-sm md:text-base text-black/80 font-mono leading-relaxed flex-grow">
                    This is not a billing or subscription system. It exists to explain architectural intent and scalability, not monetization.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

