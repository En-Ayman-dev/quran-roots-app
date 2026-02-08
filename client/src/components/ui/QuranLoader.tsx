import React from 'react';
import { motion } from 'framer-motion';

interface QuranLoaderProps {
    message?: string;
}

export const QuranLoader: React.FC<QuranLoaderProps> = ({ message }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full relative overflow-hidden bg-background font-quran selection:bg-primary/20">

            {/* 1. Ambient Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(var(--primary-rgb),0.05),transparent_50%)]" />
            </div>

            {/* 2. Central Islamic Geometry (Rub el Hizb Construction) */}
            <div className="relative z-10 mb-12">
                {/* Outer Ring - Rotating Slow */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 -m-8 border border-primary/10 rounded-full border-dashed"
                />

                {/* Middle Ring - Rotating Counter */}
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 -m-4 border border-primary/20 rounded-full opacity-50"
                />

                {/* The Star (Rub el Hizb) Container */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: "backOut" }}
                    className="relative w-24 h-24 flex items-center justify-center"
                >
                    {/* Shadow/Glow */}
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />

                    {/* Square 1 */}
                    <motion.div
                        className="absolute w-16 h-16 border-2 border-primary/80 bg-background/50 backdrop-blur-sm"
                        animate={{ rotate: [0, 90, 180, 270, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />
                    {/* Square 2 (Rotated 45deg) */}
                    <motion.div
                        className="absolute w-16 h-16 border-2 border-primary/80 bg-background/50 backdrop-blur-sm"
                        style={{ rotate: 45 }}
                        animate={{ rotate: [45, 135, 225, 315, 405] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Center Dot / Core */}
                    <motion.div
                        className="z-10 w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.8)]"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                </motion.div>
            </div>

            {/* 3. Typography & Messaging */}
            <div className="relative z-10 text-center space-y-6 max-w-md px-4">

                {/* Main Verse */}
                <div className="overflow-hidden">
                    <motion.h2
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-3xl md:text-5xl font-bold text-foreground leading-normal"
                    >
                        وَرَتلِ القُرآنَ <span className="text-primary">تَرتِيلاً</span>
                    </motion.h2>
                </div>

                {/* Divider Line */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto opacity-50"
                />

                {/* Status Message */}
                <motion.p
                    key={message} // Animate when message changes
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-muted-foreground text-sm md:text-base font-sans tracking-wide"
                >
                    {message || "جاري تحميل البيانات..."}
                </motion.p>

                {/* Progress Indicators (Dots) */}
                <div className="flex justify-center gap-1.5 mt-2">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-1.5 h-1.5 bg-primary rounded-full"
                            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
