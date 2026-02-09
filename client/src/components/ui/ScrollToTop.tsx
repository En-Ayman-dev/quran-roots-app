import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { ArrowUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming utils exists

export const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);
    const { scrollYProgress } = useScroll();

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);

        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ scale: 0, opacity: 0, rotate: 180 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0, rotate: -180 }}
                    whileHover={{
                        scale: 1.1,
                        boxShadow: "0px 0px 20px rgba(var(--primary), 0.5)",
                        y: -5
                    }}
                    whileTap={{ scale: 0.9 }}
                    onClick={scrollToTop}
                    className={cn(
                        "fixed bottom-8 left-8 z-50",
                        "rounded-full shadow-2xl transition-all duration-300",
                        "bg-background/80 backdrop-blur-xl border border-primary/20",
                        "text-primary hover:text-primary-foreground hover:bg-primary hover:border-primary",
                        "group flex items-center justify-center w-14 h-14"
                    )}
                    style={{
                        marginInlineStart: "2rem",
                        bottom: "2rem"
                    }}
                >
                    {/* Progress Circle SVG */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-1" viewBox="0 0 100 100">
                        {/* Background Track */}
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="text-muted-foreground/20"
                        />
                        {/* Progress Indicator */}
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                            className="text-primary drop-shadow-[0_0_2px_rgba(var(--primary),0.8)]"
                            style={{ pathLength: scrollYProgress }}
                        />
                    </svg>

                    <div className="relative z-10">
                        <ArrowUp className="w-6 h-6 group-hover:animate-bounce-slow" />
                        {/* Divine Glow Particles */}
                        <motion.div
                            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                            className="absolute -top-1 -right-1 pointer-events-none"
                        >
                            <Sparkles className="w-3 h-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                    </div>
                </motion.button>
            )}
        </AnimatePresence>
    );
};
