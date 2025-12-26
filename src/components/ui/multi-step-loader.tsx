"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type LoadingState = { text: string };

export const MultiStepLoader = ({
  loading,
  loadingStates,
  interval = 1200, // total time per step
  pause = 400,     // pause after each step
  variant = "fullscreen",
}: {
  loading: boolean;
  loadingStates: LoadingState[];
  interval?: number;
  pause?: number;
  variant?: "fullscreen" | "contained";
}) => {
  const [step, setStep] = useState(0);
  const wasLoading = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset step ONLY when loading starts
    if (loading && !wasLoading.current) {
      setStep(0);
    }

    wasLoading.current = loading;

    if (!loading) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // After pause, wait for interval, then advance to next step (loop continuously)
    const advanceStep = () => {
      timeoutRef.current = setTimeout(() => {
        setStep((prev) => {
          // Loop back to 0 when reaching the end
          return (prev + 1) % loadingStates.length;
        });
      }, interval);
    };

    // Start the cycle: pause first, then advance
    timeoutRef.current = setTimeout(advanceStep, pause);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [loading, step, loadingStates.length, interval, pause]);

  const containerClass = variant === "fullscreen" 
    ? "fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-xl bg-black/40"
    : "absolute inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-[#F2F0E9]/95";

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className={containerClass}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
        >
          <motion.div
            className="bg-white p-10 rounded-xl w-[480px] border-2 border-black shadow-xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col gap-4">
              {loadingStates.map((state, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-3"
                  animate={{
                    opacity: index === step ? 1 : index < step ? 0.6 : 0.3,
                  }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div
                    className={`h-3 w-3 rounded-full ${
                      index === step ? "bg-[#111111]" : index < step ? "bg-[#111111] opacity-60" : "bg-[#111111] opacity-20"
                    }`}
                    animate={{
                      scale: index === step ? 1.2 : 0.8,
                      opacity: index === step ? 1 : index < step ? 0.6 : 0.2,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  <span className={`font-sans font-black uppercase tracking-tight text-[#111111] ${
                    index === step ? "text-base" : "text-sm"
                  }`}>{state.text}</span>
                </motion.div>
              ))}
            </div>
            <motion.p
              className="mt-6 text-center font-sans font-black uppercase tracking-tight text-xs text-[#111111] opacity-60"
              animate={{ opacity: [0.6, 0.4, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Analyzing your document...
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

