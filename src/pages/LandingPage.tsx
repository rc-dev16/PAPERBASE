import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { HeroAnimation } from '@/components/HeroAnimation';
import FeatureScroll from '@/components/FeatureScroll';
import FeaturesCards from '@/components/FeaturesCards';
import PricingSection from '@/components/PricingSection';
import Footer from '@/components/Footer';
import { TextScramble } from '@/components/ui/text-scramble';

export const LandingPage = () => {
  const { isSignedIn } = useUser();
  const containerRef = useRef<HTMLDivElement>(null);
  const [paperComplete, setPaperComplete] = useState(false);
  const [baseComplete, setBaseComplete] = useState(false);
  const [showContent, setShowContent] = useState(false);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // 3D transforms for hero section
  const heroRotateX = useTransform(scrollYProgress, [0, 1], [0, -15]);
  const heroRotateY = useTransform(scrollYProgress, [0, 1], [0, 5]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  // Show content after both scrambles complete
  useEffect(() => {
    if (paperComplete && baseComplete) {
      setTimeout(() => {
        setShowContent(true);
      }, 200);
    }
  }, [paperComplete, baseComplete]);
  
  return (
    <div className="bg-[#F2F0E9]" ref={containerRef}>
      {/* Landing Hero Section */}
      <motion.section 
        className="min-h-screen h-screen snap-start snap-always bg-[#F2F0E9] relative overflow-hidden"
        style={{
          rotateX: heroRotateX,
          rotateY: heroRotateY,
          scale: heroScale,
        }}
      >
        {/* Hero Animation Background */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="absolute top-1/2 right-0 transform translate-x-16 md:translate-x-24 lg:translate-x-32 -translate-y-1/2 w-[60%] md:w-[65%] lg:w-[70%] h-[450px] md:h-[550px] lg:h-[650px] opacity-20">
            <HeroAnimation />
            {/* Scene Labels - Aligned with animation elements */}
            <div className="absolute bottom-[8%] left-[20%] font-bold text-xs md:text-sm uppercase tracking-widest text-black pointer-events-none font-sans">
              Raw Input
            </div>
            <div className="absolute bottom-[8%] right-[20%] font-bold text-xs md:text-sm uppercase tracking-widest text-black pointer-events-none font-sans">
              Organized
            </div>
          </div>
        </div>

        {/* Hero Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 md:p-12 z-30">
        {/* Top Section */}
        <div className="flex justify-between items-start w-full">
          {/* Left: Logo and Tagline */}
          <div>
            {/* PB Logo */}
            <AnimatePresence>
              {showContent && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mb-4"
                >
                  <img 
                    src="/PB.png" 
                    alt="PB Logo" 
                    className="h-6 md:h-8 lg:h-10 w-auto"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] text-[#111111] font-sans">
              <div>
                <TextScramble 
                  as="span"
                  duration={1.2}
                  speed={0.03}
                  onScrambleComplete={() => setPaperComplete(true)}
                >
                  PAPER
                </TextScramble>
              </div>
              <div>
                <TextScramble 
                  as="span"
                  duration={1.4}
                  speed={0.03}
                  onScrambleComplete={() => setBaseComplete(true)}
                >
                  BASE
                </TextScramble>
                <span className="text-[#FF3B30]">.</span>
              </div>
            </h1>
            
            <AnimatePresence>
              {showContent && (
                <>
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mt-4 font-mono text-base md:text-lg lg:text-xl text-[#111111] max-w-md uppercase"
                  >
                    The Knowledge Reactor.<br/>
                    Synthesize chaos into order.
                  </motion.p>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Navigation and System Info */}
          <AnimatePresence>
            {showContent && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col items-end gap-4"
              >
                {/* Navigation Links */}
                <div className="flex items-center gap-4 md:gap-6 pointer-events-auto">
                  <Link 
                    to="/manifesto" 
                    className="text-sm md:text-base lg:text-lg font-bold uppercase tracking-widest text-[#111111] hover:opacity-70 transition-opacity font-sans"
                  >
                    MANIFESTO
                  </Link>
                  {isSignedIn ? (
                    <Link 
                      to="/dashboard" 
                      className="text-sm md:text-base lg:text-lg font-bold uppercase tracking-widest text-[#111111] hover:opacity-70 transition-opacity flex items-center gap-1 font-sans"
                    >
                      DASHBOARD
                      <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                    </Link>
                  ) : (
                    <Link 
                      to="/signin" 
                      className="text-sm md:text-base lg:text-lg font-bold uppercase tracking-widest text-[#111111] hover:opacity-70 transition-opacity flex items-center gap-1 font-sans"
                    >
                      LOGIN
                      <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                    </Link>
                  )}
                </div>
                
                {/* System Info */}
                <div className="font-mono text-sm md:text-base text-right hidden md:block">
                  <p>SYS.VER.1.0.0</p>
                  <p>NEO-BAUHAUS PROTOCOL</p>
                  <p className="flex items-center justify-end gap-2">
                    <motion.span 
                      className="w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full"
                      animate={{ 
                        opacity: [1, 0.3, 1],
                        scale: [1, 0.8, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    ></motion.span>
                    <span className="text-green-500">STATUS: ONLINE</span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Section */}
        <AnimatePresence>
          {showContent && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex justify-between items-end w-full"
            >
              {/* Left: CTA Button */}
              <div className="pointer-events-auto -mt-8">
            {isSignedIn ? (
              <Link to="/dashboard">
                <motion.div 
                  className="relative inline-block"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {/* Black Shadow - follows whole box */}
                  <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
                  {/* Red Button */}
                  <motion.button 
                    className="relative bg-[#FF3B30] text-white px-8 py-4 font-black text-lg uppercase tracking-tight cursor-pointer font-sans border-2 border-black"
                    whileHover={{ 
                      backgroundColor: "#E6342A",
                      scale: 1.02
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    ENTER WORKSPACE →
                  </motion.button>
                </motion.div>
              </Link>
            ) : (
              <Link to="/signup">
                <motion.div 
                  className="relative inline-block"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {/* Black Shadow - follows whole box */}
                  <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
                  {/* Red Button */}
                  <motion.button 
                    className="relative bg-[#FF3B30] text-white px-8 py-4 font-black text-lg uppercase tracking-tight cursor-pointer font-sans border-2 border-black"
                    whileHover={{ 
                      backgroundColor: "#E6342A",
                      scale: 1.02
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    START REACTOR →
                  </motion.button>
                </motion.div>
              </Link>
            )}
              </div>
              
              {/* Right: Scroll Indicator */}
              <motion.button
                onClick={() => {
                  const element = document.querySelector('#how-it-works');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="pointer-events-auto cursor-pointer hover:opacity-70 transition-opacity"
                aria-label="Scroll to next section"
              >
                <ArrowDown className="w-8 h-8 text-[#111111]" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </motion.section>

      {/* How It Works Section */}
      <section id="how-it-works" className="snap-start snap-always">
        <FeatureScroll />
      </section>

      {/* Features Cards Section */}
      <section id="features" className="snap-start snap-always">
        <FeaturesCards />
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="snap-start snap-always">
        <PricingSection />
      </section>

      {/* Footer */}
      <section id="contact" className="snap-start snap-always">
        <Footer />
      </section>
    </div>
  );
};
