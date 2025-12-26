"use client"
import React, { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils';

interface PricingPlan {
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
    isPopular?: boolean;
    accent: string;
    rotation?: number;
}

interface PricingProps {
    title?: string;
    plans: PricingPlan[];
    className?: string;
}

// Counter Component
const Counter = ({ from, to }: { from: number; to: number }) => {
    const nodeRef = useRef<HTMLSpanElement>(null);
    React.useEffect(() => {
        const node = nodeRef.current;
        if (!node) return;
        const controls = animate(from, to, {
            duration: 1,
            onUpdate(value) {
                node.textContent = value.toFixed(0);
            },
        });
        return () => controls.stop();
    }, [from, to]);
    return <span ref={nodeRef} />;
};

// Header Component
const PricingHeader = ({ title }: { title: string }) => (
    <div className="mb-8 sm:mb-10 relative z-10">
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
        >
            <span className="text-xs font-mono uppercase tracking-widest text-black/60 block mb-2 font-bold">
                Capability Tiers
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter leading-[0.9] text-black font-sans mb-2">
                {title}
            </h1>
        </motion.div>
    </div>
);

// Toggle Component
const PricingToggle = ({ isYearly, onToggle }: { isYearly: boolean; onToggle: () => void }) => (
    <div className="flex flex-col items-center gap-2 mb-8 md:mb-10 relative z-10">
        <div className="flex items-center gap-4">
            <span className={`text-xs font-mono uppercase tracking-widest ${!isYearly ? 'text-black font-bold' : 'text-black/60'}`}>Baseline</span>
            <motion.button
                className="w-14 h-7 flex items-center bg-white border-2 border-black p-1 relative"
                onClick={onToggle}
            >
                <motion.div
                    className="w-5 h-5 bg-[#FF3B30] border-2 border-black"
                    animate={{ x: isYearly ? 28 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            </motion.button>
            <span className={`text-xs font-mono uppercase tracking-widest ${isYearly ? 'text-black font-bold' : 'text-black/60'}`}>Sustained</span>
        </div>
        <p className="text-[10px] font-mono text-black/60 text-center max-w-md">
            Usage intensity modes: Baseline (short-term) • Sustained (high-throughput)
        </p>
    </div>
);

// Background Effects Component
const BackgroundEffects = () => (
    <>
        <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-black/5"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        x: [0, Math.random() * 20 - 10, 0],
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    </>
);

// Pricing Card Component
const PricingCard = ({
    plan,
    isYearly,
    index
}: {
    plan: PricingPlan;
    isYearly: boolean;
    index: number
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springConfig = { damping: 15, stiffness: 150 };
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);

    const currentPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    const previousPrice = !isYearly ? plan.yearlyPrice : plan.monthlyPrice;

    return (
        <motion.div
            className="relative"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
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
                ref={cardRef}
                whileHover={{
                    y: -4,
                    transition: { duration: 0.2, ease: "easeOut" },
                }}
                style={{
                    rotateX,
                    rotateY,
                    perspective: 1000,
                }}
                onMouseMove={(e) => {
                    if (!cardRef.current) return;
                    const rect = cardRef.current.getBoundingClientRect();
                    const centerX = rect.x + rect.width / 2;
                    const centerY = rect.y + rect.height / 2;
                    mouseX.set((e.clientX - centerX) / rect.width);
                    mouseY.set((e.clientY - centerY) / rect.height);
                }}
                onMouseLeave={() => {
                    mouseX.set(0);
                    mouseY.set(0);
                }}
                className="relative w-full bg-white border-2 border-black flex flex-col h-full cursor-pointer"
            >
                {/* Top-Left Color Indicator */}
                <div
                    className="absolute top-0 left-0 w-5 h-5 z-10"
                    style={{ backgroundColor: plan.accent === 'bg-[#FF3B30]' ? '#FF3B30' : '#111111' }}
                />

                {/* Price Badge */}
                <motion.div
                    className={cn(
                        `absolute -top-4 -right-4 w-20 h-20 md:w-24 md:h-24
                        flex items-center justify-center border-2 border-black`,
                        plan.accent === 'bg-[#FF3B30]' ? 'bg-[#FF3B30]' : 'bg-[#111111]'
                    )}
                    animate={{
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <div className="text-center text-white">
                        <div className="text-lg md:text-xl font-black font-sans">
                            CI <Counter from={previousPrice} to={currentPrice} />
                        </div>
                        <div className="text-[10px] md:text-xs font-bold font-mono">Capability Index</div>
                    </div>
                </motion.div>

                {/* Card Content */}
                <div className="p-5 md:p-6 lg:p-7 pt-10 md:pt-12 lg:pt-14 flex flex-col flex-grow min-h-0">
                    {/* Plan Name and Popular Badge */}
                    <div className="mb-5">
                        <h3 className="text-xl md:text-2xl lg:text-2xl font-black text-black font-sans mb-2">{plan.name}</h3>
                        {plan.isPopular && (
                            <motion.span
                                className="inline-block px-3 py-1.5 text-white bg-[#FF3B30] font-bold text-xs border-2 border-black uppercase font-sans"
                                animate={{
                                    y: [0, -2, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity
                                }}
                            >
                                POPULAR
                            </motion.span>
                        )}
                    </div>

                    {/* Features List */}
                    <div className="space-y-2.5 mb-5 flex-grow overflow-y-auto">
                        {plan.features.map((feature, i) => (
                            <motion.div
                                key={feature}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{
                                    x: 4,
                                    transition: { type: "spring", stiffness: 400 }
                                }}
                                className="flex items-center gap-2.5 p-2.5 md:p-3 bg-[#F2F0E9] border-2 border-black"
                            >
                                <motion.span
                                    whileHover={{ scale: 1.2, rotate: 90 }}
                                    className={cn(
                                        `w-5 h-5 md:w-6 md:h-6 flex items-center justify-center
                                        text-white font-bold text-xs border-2 border-black flex-shrink-0`,
                                        plan.accent === 'bg-[#FF3B30]' ? 'bg-[#FF3B30]' : 'bg-[#111111]'
                                    )}
                                >
                                    ✓
                                </motion.span>
                                <span className="text-black font-bold text-xs md:text-sm font-sans leading-tight">{feature}</span>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <Link to="/capabilities">
                        <motion.button
                            className={cn(
                                `w-full py-2.5 md:py-3 text-white font-black text-xs md:text-sm uppercase tracking-tight
                                border-2 border-black relative`,
                                plan.accent === 'bg-[#FF3B30]' ? 'bg-[#FF3B30]' : 'bg-[#111111]'
                            )}
                            whileHover={{
                                scale: 1.02,
                                transition: { duration: 0.2 }
                            }}
                            whileTap={{
                                scale: 0.98,
                            }}
                        >
                            <div className="relative">
                                VIEW CAPABILITIES →
                            </div>
                        </motion.button>
                    </Link>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Main Container Component
export const PricingContainer = ({ title = "Choose Your Plan", plans, className = "" }: PricingProps) => {
    const [isYearly, setIsYearly] = useState(false);

    return (
        <div className={cn(`min-h-screen bg-[#F2F0E9] flex flex-col overflow-hidden p-4 sm:p-6 lg:p-8 relative ${className}`)}>
            <BackgroundEffects />
            {/* Scroll Button */}
            <motion.button
                onClick={() => {
                    const element = document.querySelector('#contact');
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
            
            <div className="max-w-6xl mx-auto w-full h-full flex flex-col relative z-10">
                <PricingHeader title={title} />
                <PricingToggle isYearly={isYearly} onToggle={() => setIsYearly(!isYearly)} />

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10 flex-grow min-h-0 items-start">
                {plans.map((plan, index) => (
                    <PricingCard
                        key={plan.name}
                        plan={plan}
                        isYearly={isYearly}
                        index={index}
                    />
                ))}
                </div>
            </div>
        </div>
    );
};



