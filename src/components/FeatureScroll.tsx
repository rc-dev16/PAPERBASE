import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView, animate, useMotionValue } from 'framer-motion';
import { Upload, Search, PenTool, Check, FileText, Tag, Quote, ArrowDown } from 'lucide-react';

const features = [
  {
    id: 'capture',
    icon: Upload,
    title: 'Capture',
    description: 'Drop your research into the void.',
    color: 'orange',
  },
  {
    id: 'analyze',
    icon: Search,
    title: 'Analyze',
    description: 'AI extracts the insights.',
    color: 'blue',
  },
  {
    id: 'synthesize',
    icon: PenTool,
    title: 'Synthesize',
    description: 'Write with context.',
    color: 'void',
  },
]; 

function DropzoneDemo({ progress }: { progress: number }) {
  const isActive = progress > 0 && progress < 0.33;
  const isDone = progress >= 0.33;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive || isDone ? 1 : 0.3 }}
      className="relative w-full h-64 border-2 border-dashed border-black flex items-center justify-center bg-[#F2F0E9]"
    >
      {/* Dropzone */}
      <div className="text-center">
        <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${isDone ? 'text-[#FF3B30]' : 'text-black/40'}`} />
        <p className="text-sm font-mono uppercase text-black/60">Drop PDF Here</p>
      </div>

      {/* File Card Animation */}
      <motion.div
        initial={{ x: -200, y: -50, opacity: 0, rotate: -15 }}
        animate={isActive || isDone ? { x: 0, y: 0, opacity: 1, rotate: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-4 bg-white border-2 border-black shadow-lg"
      >
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-8 h-8 text-[#FF3B30]" />
            <div>
              <p className="font-bold text-sm font-sans uppercase text-black">entropy_reduction.pdf</p>
              <p className="text-xs font-mono text-black/60">2.4 MB</p>
            </div>
          </div>
          <div className="h-1 bg-black/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={isDone ? { width: '100%' } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-full bg-[#FF3B30]"
            />
          </div>
        </div>

        {/* Success Checkmark */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={isDone ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.8, type: 'spring' }}
          className="absolute top-4 right-4 w-8 h-8 bg-[#FF3B30] flex items-center justify-center"
        >
          <Check className="w-5 h-5 text-white" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function AnalyzeDemo({ progress }: { progress: number }) {
  const isActive = progress > 0.33 && progress < 0.66;
  const isDone = progress >= 0.66;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive || isDone ? 1 : 0.3 }}
      className="relative w-full bg-white border-2 border-black shadow-lg p-6"
    >
      {/* Paper Preview */}
      <div className="flex gap-6">
        {/* Content Side */}
        <div className="flex-1 space-y-3 relative overflow-hidden">
          {/* Skeleton Lines */}
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={isActive || isDone ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.1 }}
              className="h-3 bg-black/10"
              style={{ width: `${100 - i * 10}%` }}
            />
          ))}

          {/* Scanner Line */}
          {isActive && (
            <motion.div
              initial={{ top: 0 }}
              animate={{ top: '100%' }}
              transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
              className="absolute left-0 right-0 h-0.5 bg-[#FF3B30]"
            />
          )}
        </div>

        {/* Metadata Side */}
        <div className="w-32 space-y-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isDone ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 px-2 py-1 bg-black/5"
          >
            <Tag className="w-3 h-3 text-black" />
            <span className="text-xs font-mono text-black">systems</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isDone ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-2 px-2 py-1 bg-black/5"
          >
            <Tag className="w-3 h-3 text-black" />
            <span className="text-xs font-mono text-black">entropy</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isDone ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.7 }}
            className="text-xs font-mono text-black/60 mt-4"
          >
            <p>Vostok, 2023</p>
            <p>Nature Complexity</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function SynthesizeDemo({ progress }: { progress: number }) {
  const isActive = progress > 0.66;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0.3 }}
      className="relative w-full bg-white border-2 border-black shadow-lg"
    >
      {/* Editor Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b-2 border-black bg-black/5">
        <div className="w-2 h-2 bg-[#FF3B30]" />
        <div className="w-2 h-2 bg-[#FF3B30]" />
        <div className="w-2 h-2 bg-black" />
        <span className="text-xs font-mono ml-2 text-black">thesis_draft.md</span>
      </div>

      {/* Editor Content */}
      <div className="p-6 space-y-4">
        <p className="text-sm font-sans text-black">
          Complex adaptive systems demonstrate remarkable capacity for 
          spontaneous order creation.
        </p>

        {/* Citation Bubble */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={isActive ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          className="flex items-start gap-3 p-3 border-l-4 border-[#FF3B30] bg-[#F2F0E9]"
        >
          <Quote className="w-4 h-4 text-[#FF3B30] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm italic font-sans text-black">
              "Entropy reduction occurs through hierarchical self-organization..."
            </p>
            <p className="text-xs font-mono text-black/60 mt-2">
              — Vostok & Wei, 2023, p.12
            </p>
          </div>
        </motion.div>

        <p className="text-sm font-sans text-black/60">
          This phenomenon challenges traditional thermodynamic assumptions...
        </p>
      </div>
    </motion.div>
  );
}

function FeatureItem({
  feature,
  index,
  progress,
}: {
  feature: typeof features[0];
  index: number;
  progress: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: '-40% 0px -40% 0px' });
  const Icon = feature.icon;

  const activeRange = [index / 3, (index + 1) / 3];
  const opacity = progress >= activeRange[0] && progress <= activeRange[1] 
    ? 0.3 + (progress - activeRange[0]) / (activeRange[1] - activeRange[0]) * 0.7 
    : 0.3;
  const x = progress >= activeRange[0] && progress <= activeRange[1]
    ? ((progress - activeRange[0]) / (activeRange[1] - activeRange[0])) * 8
    : 0;

  return (
    <motion.div
      ref={ref}
      style={{ 
        opacity: progress >= activeRange[0] && progress <= activeRange[1] 
          ? 0.3 + (progress - activeRange[0]) / (activeRange[1] - activeRange[0]) * 0.7 
          : 0.3,
        x: progress >= activeRange[0] && progress <= activeRange[1]
          ? ((progress - activeRange[0]) / (activeRange[1] - activeRange[0])) * 8
          : 0
      }}
      className="flex items-start gap-6"
    >
      <div
        className={`w-12 h-12 flex items-center justify-center border-2 border-black transition-colors duration-300 ${
          isInView ? 'bg-[#FF3B30]' : 'bg-white'
        }`}
      >
        <Icon className={`w-5 h-5 ${isInView ? 'text-white' : 'text-black'}`} />
      </div>
      <div>
        <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-black font-sans mb-2">{feature.title}</h3>
        <p className="text-sm font-mono text-black/70 uppercase">{feature.description}</p>
      </div>
    </motion.div>
  );
}

function InteractiveDemo({ progress }: { progress: number }) {
  return (
    <div className="relative">
      {/* Demo Container */}
      <div className="bg-[#F2F0E9] p-8 border-2 border-black shadow-lg">
        <motion.div className="space-y-6">
          <DropzoneDemo progress={progress} />
          <AnalyzeDemo progress={progress} />
          <SynthesizeDemo progress={progress} />
        </motion.div>
      </div>

      {/* Decorative Corner */}
      <div className="absolute -bottom-4 -right-4 w-full h-full border-2 border-black -z-10" />
    </div>
  );
}

export default function FeatureScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressValue = useMotionValue(0);
  const [progress, setProgress] = useState(0);

  // Create looping animation
  useEffect(() => {
    const animation = animate(0, 1, {
      duration: 8, // Total cycle duration in seconds (reduced from 12 for faster speed)
      repeat: Infinity,
      ease: "linear",
      onUpdate: (latest) => {
        progressValue.set(latest);
        setProgress(latest);
      },
    });

    return () => animation.stop();
  }, [progressValue]);

  return (
    <section ref={containerRef} className="relative h-screen bg-[#F2F0E9] overflow-hidden">
      {/* Section Header */}
      <div className="h-screen flex items-center relative">
        {/* Scroll Button */}
        <motion.button
          onClick={() => {
            const element = document.querySelector('#features');
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
        
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            {/* Left: Feature List */}
            <div className="space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-8"
              >
                <span className="text-xs font-mono uppercase tracking-widest text-black/60 block mb-4 font-bold">How It Works</span>
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9] text-black font-sans">
                  From Chaos<br />to Clarity
                </h2>
              </motion.div>

              {features.map((feature, index) => (
                <FeatureItem
                  key={feature.id}
                  feature={feature}
                  index={index}
                  progress={progress}
                />
              ))}
            </div>

            {/* Right: Interactive Demo */}
            <div className="hidden lg:block">
              <InteractiveDemo progress={progress} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


