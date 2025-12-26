import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const ManifestoPage = () => {
  return (
    <div className="h-screen bg-[#F2F0E9] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b-2 border-black bg-[#F2F0E9] z-10 flex-shrink-0">
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
            
            {/* PB Logo + MANIFESTO - Centered */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
              <img 
                src="/PB.png" 
                alt="PB Logo" 
                className="h-6 md:h-8 w-auto"
              />
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter leading-[0.9] text-black font-sans">
                MANIFESTO
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-4 md:py-6 lg:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-3 md:space-y-4 lg:space-y-6"
          >
          {/* The Knowledge Reactor */}
          <section>
            <h2 className="text-lg md:text-xl lg:text-2xl font-black text-black font-sans mb-2 md:mb-3 uppercase tracking-tight">
              The Knowledge Reactor
            </h2>
            <div className="space-y-1.5 md:space-y-2 text-sm md:text-base text-black/80 font-sans leading-relaxed">
              <p>Research is chaos. Papers accumulate. Ideas scatter. Context gets lost.</p>
              <p>We believe knowledge should flow, not fragment.</p>
              <p>Paperbase transforms research chaos into structured understanding — not by adding noise, but by restoring order.</p>
            </div>
          </section>

          {/* Our Principles */}
          <section>
            <h2 className="text-lg md:text-xl lg:text-2xl font-black text-black font-sans mb-2 md:mb-3 uppercase tracking-tight">
              Our Principles
            </h2>
            <div className="space-y-2.5 md:space-y-3">
              <div className="border-l-4 border-[#FF3B30] pl-3 md:pl-4">
                <h3 className="text-base md:text-lg lg:text-xl font-black text-black font-sans mb-1 md:mb-1.5 uppercase">Clarity Over Complexity</h3>
                <p className="text-sm md:text-base text-black/80 font-sans leading-relaxed">
                  Every feature exists to make research clearer. No bloat. Only tools that amplify understanding.
                </p>
              </div>
              
              <div className="border-l-4 border-[#FF3B30] pl-3 md:pl-4">
                <h3 className="text-base md:text-lg lg:text-xl font-black text-black font-sans mb-1 md:mb-1.5 uppercase">Context Is Everything</h3>
                <p className="text-sm md:text-base text-black/80 font-sans leading-relaxed">
                  Knowledge only has value when its context is preserved. Every insight remembers where it came from.
                </p>
              </div>
              
              <div className="border-l-4 border-[#FF3B30] pl-3 md:pl-4">
                <h3 className="text-base md:text-lg lg:text-xl font-black text-black font-sans mb-1 md:mb-1.5 uppercase">Your Work, Your Way</h3>
                <p className="text-sm md:text-base text-black/80 font-sans leading-relaxed">
                  Paperbase adapts to how you think, organize, and explore. Structure supports curiosity, not limits it.
                </p>
              </div>
            </div>
          </section>

          {/* The Vision */}
          <section>
            <h2 className="text-lg md:text-xl lg:text-2xl font-black text-black font-sans mb-2 md:mb-3 uppercase tracking-tight">
              The Vision
            </h2>
            <div className="space-y-1.5 md:space-y-2 text-sm md:text-base text-black/80 font-sans leading-relaxed">
              <p>We imagine a research experience where less time is spent managing files, more time making connections, and insights surface naturally.</p>
              <p>A world where research feels intentional, not overwhelming.</p>
            </div>
          </section>

          {/* One quiet promise */}
          <section className="pt-2 md:pt-3 border-t-2 border-black">
            <p className="text-base md:text-lg lg:text-xl font-black text-black font-sans uppercase tracking-tight mb-1 md:mb-1.5">
              One quiet promise
            </p>
            <p className="text-sm md:text-base text-black/80 font-sans leading-relaxed">
              We will never try to replace human insight. Only to protect it from chaos.
            </p>
          </section>

          {/* CTA */}
          <section className="pt-2 md:pt-3 pb-3 md:pb-4">
            <Link to="/signup">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
                <motion.button
                  className="relative bg-[#FF3B30] text-white px-5 md:px-6 lg:px-8 py-2.5 md:py-3 lg:py-4 font-black text-sm md:text-base lg:text-lg uppercase tracking-tight cursor-pointer font-sans border-2 border-black"
                  whileHover={{ 
                    backgroundColor: "#E6342A",
                    scale: 1.02
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  START REACTOR →
                </motion.button>
              </div>
            </Link>
          </section>
          </motion.div>
        </div>
      </div>
    </div>
  );
};


