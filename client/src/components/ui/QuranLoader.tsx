import React from 'react';
import { motion, useTime, useTransform, useReducedMotion } from 'framer-motion';

interface QuranLoaderProps {
    message?: string;
}

export const QuranLoader: React.FC<QuranLoaderProps> = ({ message }) => {
    const prefersReducedMotion = useReducedMotion();

    // Dynamic background effect
    const time = useTime();
    // Reduce rotation speed or stop it based on preference
    const rotate = useTransform(time, [0, 40000], [0, prefersReducedMotion ? 0 : 360]);
    const counterRotate = useTransform(time, [0, 30000], [0, prefersReducedMotion ? 0 : -360]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full relative overflow-hidden bg-background">

            {/* 1. ATMOSPHERIC BACKGROUND */}
            <div className="absolute inset-0 z-0">
                {/* Orbital Rings - Enhanced Visibility for Dark Mode */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-10 dark:opacity-20 pointer-events-none">
                    <motion.div
                        style={{ rotate }}
                        className="w-full h-full border border-primary/20 dark:border-primary/30 rounded-full border-dashed"
                    />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-20 dark:opacity-30 pointer-events-none">
                    <motion.div
                        style={{ rotate: counterRotate }}
                        className="w-full h-full border border-primary/30 dark:border-primary/40 rounded-full"
                    />
                </div>

                {/* Floating Noor (Light) Particles - Reduced Motion Safe */}
                {!prefersReducedMotion && (
                    <div className="absolute inset-0 overflow-hidden">
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute bg-primary/20 dark:bg-primary/10 rounded-full blur-xl"
                                style={{
                                    width: Math.random() * 100 + 50,
                                    height: Math.random() * 100 + 50,
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                }}
                                animate={{
                                    y: [0, -100, 0],
                                    scale: [1, 1.2, 1],
                                    opacity: [0.1, 0.3, 0.1],
                                }}
                                transition={{
                                    duration: 10 + Math.random() * 10,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: Math.random() * 5,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* 2. THE CORE EXPERIENCE */}
            <div className="relative z-10 flex flex-col items-center">

                {/* Animated Quranic Icon */}
                <motion.div
                    initial={{ scale: prefersReducedMotion ? 1 : 0, rotate: prefersReducedMotion ? 0 : -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="mb-12 relative"
                >
                    <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse dark:bg-primary/20" />
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-primary relative z-10 drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]">
                        <motion.path
                            d="M12 4V2M12 22v-2M4 12H2m20 0h-2m-2.5 7.5L18 21m-12 1.5L7.5 19.5M19.5 4.5 18 6m-12-1.5L7.5 4.5"
                            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                            initial={prefersReducedMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                        />
                        <motion.circle
                            cx="12"
                            cy="12"
                            r="9"
                            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                            initial={prefersReducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        />
                        <motion.path
                            d="M12 7v5l3 3"
                            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                            initial={prefersReducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1, delay: 1 }}
                        />
                    </svg>
                </motion.div>

                {/* THE VERSE - Tarteel Animation */}
                <div className="text-center relative px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                        className="relative"
                    >
                        {/* Glow Effect behind text */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent blur-xl h-full w-full opacity-50 dark:opacity-30" />

                        <h2 className="text-4xl md:text-6xl font-bold font-quran text-foreground leading-[1.8] md:leading-[2] drop-shadow-lg relative z-10">
                            <span className="inline-block bg-clip-text text-transparent bg-gradient-to-b from-foreground via-foreground to-primary/80 dark:to-primary">
                                "أَوۡ زِدۡ عَلَيۡهِ وَرَتِّلِ ٱلۡقُرۡءَانَ تَرۡتِيلًا"
                            </span>
                        </h2>

                        {/* Shimmer Effect overlay - Disabled on reduced motion */}
                        {!prefersReducedMotion && (
                            <motion.div
                                className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent skew-x-12"
                                style={{ x: useTransform(time, [0, 3000], ["-150%", "150%"]) }}
                            />
                        )}
                    </motion.div>

                    {/* Elegant Divider */}
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "200px", opacity: 0.5 }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                        className="h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto my-8 opacity-40 dark:opacity-60"
                    />

                    {/* Animated Message */}
                    <motion.p
                        className="text-lg md:text-xl text-primary/80 font-amiri tracking-wide"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        {message || "جاري استحضار البيانات..."}
                    </motion.p>
                </div>
            </div>

            {/* 3. Mystical Footer Decoration */}
            <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-background to-transparent pointer-events-none z-20" />
        </div>
    );
};
