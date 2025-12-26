import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import { ArrowLeft } from 'lucide-react';

export const SignInPage = () => {
  return (
    <div className="min-h-screen bg-[#F2F0E9] flex flex-col">
      {/* Header */}
      <div className="border-b-2 border-black sticky top-0 bg-[#F2F0E9] z-10">
        <div className="w-full px-6 md:px-12 lg:px-16 py-4 md:py-6">
          <div className="relative flex items-center w-full">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-black hover:text-[#FF3B30] transition-colors font-sans font-bold uppercase tracking-widest text-xs md:text-sm z-10"
            >
              <ArrowLeft className="w-4 h-4" /> BACK
            </Link>
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
              <img src="/PB.png" alt="PB Logo" className="h-6 md:h-8 w-auto"/>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter leading-[0.9] text-black font-sans">
                LOGIN
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 lg:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg py-4"
        >
          {/* Welcome Text */}
          <div className="mb-4 md:mb-6 text-center">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-[#111111] font-sans mb-2">
              WELCOME BACK
            </h2>
            <p className="font-mono text-xs md:text-sm text-[#111111] uppercase">
              Access your research workspace
            </p>
          </div>

          {/* Clerk Sign In Component */}
          <div className="relative mb-2 mr-2">
            {/* Black Shadow */}
            <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1 rounded-sm"></div>
            
            {/* White Container */}
            <div className="relative bg-white border-2 border-black p-4 md:p-6 lg:p-8">
              <style>{`
                [data-clerk-element] {
                  max-width: 100% !important;
                  width: 100% !important;
                }
                [data-clerk-element] * {
                  box-sizing: border-box !important;
                }
                .cl-rootBox {
                  max-width: 100% !important;
                  width: 100% !important;
                }
                .cl-card {
                  max-width: 100% !important;
                  width: 100% !important;
                }
                /* Button shadow effect */
                .cl-formButtonPrimary {
                  box-shadow: 4px 4px 0 0 #111111 !important;
                  position: relative !important;
                }
                .cl-formButtonPrimary:hover {
                  box-shadow: 4px 4px 0 0 #111111 !important;
                  transform: translate(0, 0) !important;
                }
                /* Clerk branding red gradient */
                .cl-footerText,
                .cl-footerText *,
                [class*="cl-footer"] [class*="text"],
                .cl-footerActionLink {
                  background: linear-gradient(135deg, #FF3B30 0%, #E6342A 50%, #CC2E24 100%) !important;
                  -webkit-background-clip: text !important;
                  -webkit-text-fill-color: transparent !important;
                  background-clip: text !important;
                  color: transparent !important;
                }
                .cl-footerText svg,
                [class*="cl-footer"] svg {
                  fill: url(#redGradient) !important;
                }
                /* Ensure LAST USED badge is visible on social buttons */
                [class*="socialButtonsBlockButton"],
                .cl-socialButtonsBlockButton {
                  overflow: visible !important;
                  position: relative !important;
                }
                [class*="socialButtonsBlock"] {
                  overflow: visible !important;
                }
                [class*="socialButtonsBlockButton"] [class*="badge"],
                [class*="socialButtonsBlockButton"] [data-badge],
                [class*="socialButtonsBlockButton"] > [class*="badge"],
                .cl-socialButtonsBlockButton [class*="badge"],
                .cl-socialButtonsBlockButton [data-badge],
                [class*="cl-badge"],
                [class*="socialButtonBadge"] {
                  position: absolute !important;
                  top: -6px !important;
                  right: -6px !important;
                  z-index: 10 !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                  display: block !important;
                  pointer-events: none !important;
                }
              `}</style>
              <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                  <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF3B30" />
                    <stop offset="50%" stopColor="#E6342A" />
                    <stop offset="100%" stopColor="#CC2E24" />
                  </linearGradient>
                </defs>
              </svg>
              <SignIn
                routing="path"
                path="/signin"
                signUpUrl="/signup"
                afterSignInUrl="/dashboard"
                appearance={{
                  elements: {
                    // Root containers
                    rootBox: "w-full max-w-full",
                    card: "shadow-none bg-transparent border-0 p-4 md:p-6 w-full max-w-full",
                    
                    // Headers (hidden)
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    
                    // Social buttons
                    socialButtonsBlock: "flex gap-3 w-full mb-4",
                    socialButtonsBlockButton: 
                      "flex-1 min-w-0 border-2 border-black bg-white text-[#111111] hover:bg-[#F2F0E9] font-sans font-bold uppercase tracking-widest text-[10px] md:text-xs transition-colors duration-200 h-10 px-2 md:px-3 flex items-center justify-center gap-1.5 md:gap-2 overflow-visible relative",
                    socialButtonsBlockButtonText: "font-sans font-bold uppercase text-[10px] md:text-xs truncate",
                    socialButtonsBlockButtonIcon: "w-4 h-4 flex-shrink-0",
                    
                    // Divider
                    dividerLine: "bg-black h-[1px] my-4",
                    dividerText: "font-mono text-[10px] uppercase text-[#111111] font-bold px-2",
                    
                    // Form container
                    formFields: "space-y-3 w-full max-w-full",
                    formFieldRow: "w-full max-w-full",
                    formField: "w-full max-w-full",
                    
                    // Label row
                    formFieldLabelRow: "flex items-center justify-between mb-1.5 w-full max-w-full gap-2",
                    formFieldLabel: "font-mono text-[11px] uppercase text-[#111111] font-bold flex-shrink-0",
                    formFieldLabelText: "font-mono text-[11px] uppercase text-[#111111] font-bold",
                    formFieldOptional: "font-mono text-[9px] md:text-[10px] text-[#111111] opacity-60 font-normal normal-case flex-shrink-0 whitespace-nowrap",
                    
                    // Input fields
                    formFieldInput: 
                      "w-full max-w-full border-2 border-black bg-white text-[#111111] font-sans text-sm focus:border-[#FF3B30] focus:ring-0 focus:outline-none h-10 px-3 md:px-4 box-border",
                    formFieldInputShowPasswordButton: 
                      "text-[#111111] hover:text-[#FF3B30] transition-colors absolute right-3 top-1/2 -translate-y-1/2 z-10",
                    formFieldInputWrapper: "relative w-full max-w-full",
                    
                    // Password field specific
                    formFieldInput__password: 
                      "w-full max-w-full border-2 border-black bg-white text-[#111111] font-sans text-sm focus:border-[#FF3B30] focus:ring-0 focus:outline-none h-10 px-3 md:px-4 pr-10 md:pr-12 box-border",
                    
                    // Buttons
                    formButtonPrimary: 
                      "relative w-full max-w-full bg-[#FF3B30] text-white border-2 border-black font-sans font-black uppercase tracking-tight text-sm md:text-base hover:bg-[#E6342A] transition-colors duration-200 h-12 md:h-14 mt-4 box-border shadow-[4px_4px_0_0_#111111]",
                    formButtonReset: 
                      "text-[#111111] font-sans font-bold uppercase tracking-widest text-[10px] hover:text-[#FF3B30] transition-colors",
                    
                    // Other elements
                    identityPreviewText: "font-sans text-sm text-[#111111]",
                    identityPreviewEditButton: "text-[#FF3B30] hover:text-[#E6342A] text-xs",
                    formResendCodeLink: "text-[#FF3B30] hover:text-[#E6342A] font-sans font-bold text-xs",
                    otpCodeFieldInput: 
                      "border-2 border-black bg-white text-[#111111] font-mono text-sm focus:border-[#FF3B30] focus:ring-0 h-11",
                    alertText: "font-sans text-sm text-[#111111]",
                    formFieldErrorText: "font-sans text-[#FF3B30] text-[10px] mt-1",
                    
                    // Footer with Clerk branding
                    footer: "mt-4 pt-4 border-t-2 border-black",
                    footerAction: "text-center",
                    footerActionLink: 
                      "text-[#111111] font-sans font-bold uppercase tracking-widest text-[10px] hover:text-[#FF3B30] transition-colors",
                    footerPages: "hidden",
                    footerText: "font-mono text-[9px] text-[#111111] opacity-70 text-center",
                  },
                  variables: {
                    colorPrimary: "#FF3B30",
                    colorText: "#111111",
                    colorBackground: "#F2F0E9",
                    colorInputBackground: "#FFFFFF",
                    colorInputText: "#111111",
                    colorSuccess: "#22c55e",
                    colorDanger: "#FF3B30",
                    borderRadius: "0",
                    fontFamily: "Inter, sans-serif",
                    fontFamilyButtons: "Inter, sans-serif",
                    fontSize: "14px",
                  },
                }}
              />
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
};
