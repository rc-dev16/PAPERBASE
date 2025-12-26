import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Github } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#111111] border-t-2 border-white py-12 md:py-16">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img 
                src="/PB.png" 
                alt="PB Logo" 
                className="h-8 w-auto"
              />
              <span className="font-black text-xl md:text-2xl tracking-tighter text-white font-sans">
                PAPERBASE<span className="text-[#FF3B30]">.</span>
              </span>
            </div>
            <p className="text-sm md:text-base text-white/80 font-sans max-w-md mb-6 leading-relaxed">
              Transform your research workflow. Organize papers, extract insights, 
              and synthesize knowledge with precision.
            </p>
            <div className="flex gap-3">
                <a
                href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 border-2 border-white/30 flex items-center justify-center hover:border-[#FF3B30] hover:text-[#FF3B30] transition-colors"
                aria-label="GitHub"
                >
                <Github className="w-5 h-5 text-white" />
                </a>
            </div>
          </div>

          {/* Links Column */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-white/60 mb-6 font-bold">
              Links
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'Features', href: '#features', isRoute: false },
                { label: 'Capabilities', href: '/capabilities', isRoute: true },
                { label: 'How It Works', href: '#how-it-works', isRoute: false },
              ].map(({ label, href, isRoute }) => (
                <li key={label}>
                  {isRoute ? (
                    <Link
                      to={href}
                      className="text-sm md:text-base text-white font-sans hover:text-[#FF3B30] transition-colors flex items-center gap-2 group cursor-pointer"
                    >
                      {label}
                      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ) : (
                  <a
                    href={href}
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.querySelector(href);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="text-sm md:text-base text-white font-sans hover:text-[#FF3B30] transition-colors flex items-center gap-2 group cursor-pointer"
                  >
                    {label}
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t-2 border-white/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-mono text-white/60">
            © {currentYear} PAPERBASE. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}


