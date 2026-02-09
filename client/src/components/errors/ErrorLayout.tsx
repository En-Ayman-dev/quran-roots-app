import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Home, RotateCcw } from 'lucide-react';
import { useLocation } from 'wouter';

interface ErrorLayoutProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    action?: 'retry' | 'home' | 'none';
    onRetry?: () => void;
    verse?: {
        text: string;
        source: string;
    };
    className?: string;
    children?: React.ReactNode;
}

export const ErrorLayout: React.FC<ErrorLayoutProps> = ({
    title,
    description,
    icon,
    action = 'home',
    onRetry,
    verse,
    className,
    children
}) => {
    const [location, setLocation] = useLocation();

    return (
        <div className={cn(
            "min-h-[80vh] w-full flex items-center justify-center p-6 relative overflow-hidden",
            "bg-gradient-to-br from-background via-background to-secondary/20",
            className
        )}>
            {/* Ambient Background Animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [0, -90, 0],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-amber-500/5 rounded-full blur-3xl"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
                className="relative z-10 max-w-lg w-full text-center"
            >
                {/* Glass Card Container */}
                <div className="bg-card/30 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-primary/5">

                    {/* Icon Container with Divine Glow */}
                    <div className="relative mx-auto w-32 h-32 mb-8 flex items-center justify-center">
                        {/* Orbital Rings */}
                        {[1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                className="absolute inset-0 border border-primary/20 rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10 + i * 5, repeat: Infinity, ease: "linear", repeatType: i % 2 === 0 ? "reverse" : "loop" }}
                                style={{ margin: i * -4 }}
                            />
                        ))}
                        {/* Inner Glow */}
                        <motion.div
                            className="absolute inset-0 bg-primary/20 blur-xl rounded-full"
                            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />
                        {/* The Icon */}
                        <div className="relative z-10 p-6 bg-gradient-to-br from-background to-secondary rounded-2xl shadow-inner border border-white/20">
                            {icon}
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="space-y-4 mb-8">
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl md:text-5xl font-bold font-quran text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-600 dark:to-amber-400 drop-shadow-sm"
                        >
                            {title}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-muted-foreground text-lg leading-relaxed font-amiri"
                        >
                            {description}
                        </motion.p>
                        {children}
                    </div>

                    {/* Quranic Verse (The Wisdom) */}
                    {verse && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ delay: 0.6 }}
                            className="mb-8 relative"
                        >
                            <div className="absolute inset-0 bg-primary/5 rounded-xl blur-sm transform rotate-1" />
                            <div className="relative bg-background/50 border border-primary/10 rounded-xl p-6">
                                <p className="font-quran text-2xl text-primary/80 mb-3 leading-loose dir-rtl">
                                    {verse.text}
                                </p>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    {verse.source}
                                </span>
                            </div>
                        </motion.div>
                    )}

                    {/* Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex flex-wrap items-center justify-center gap-4"
                    >
                        {action === 'retry' && onRetry && (
                            <Button
                                onClick={onRetry}
                                size="lg"
                                className="group relative overflow-hidden rounded-full px-8 py-6 bg-primary text-primary-foreground shadow-lg hover:shadow-primary/40 transition-all duration-300"
                            >
                                <motion.div
                                    className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                                />
                                <span className="relative flex items-center gap-2 font-bold text-lg">
                                    <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                    إعادة المحاولة
                                </span>
                            </Button>
                        )}

                        {location === '/' && action !== 'retry' && (
                            <Button
                                onClick={() => window.location.reload()}
                                size="lg"
                                className="group relative overflow-hidden rounded-full px-8 py-6 bg-primary text-primary-foreground shadow-lg hover:shadow-primary/40 transition-all duration-300"
                            >
                                <motion.div
                                    className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                                />
                                <span className="relative flex items-center gap-2 font-bold text-lg">
                                    <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                    تحديث الصفحة
                                </span>
                            </Button>
                        )}

                        {location !== '/' && (
                            <Button
                                variant="outline"
                                onClick={() => setLocation('/')}
                                size="lg"
                                className="rounded-full px-8 py-6 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-300"
                            >
                                <span className="flex items-center gap-2 font-bold text-lg">
                                    <Home className="w-5 h-5" />
                                    الرئيـسيـة
                                </span>
                            </Button>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};
