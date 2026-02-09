import React from 'react';
import { motion } from 'framer-motion';
import { SearchX, Sparkles } from 'lucide-react';

interface EmptyStateProps {
    message?: string;
    onClear?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, onClear }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center relative overflow-hidden rounded-3xl border border-dashed border-border/50 bg-secondary/5">

            {/* Ambient Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-primary/20 rounded-full blur-xl"
                        initial={{
                            x: Math.random() * 100 - 50 + "%",
                            y: Math.random() * 100 - 50 + "%",
                            scale: 0
                        }}
                        animate={{
                            x: Math.random() * 100 - 50 + "%",
                            y: Math.random() * 100 - 50 + "%",
                            scale: [0, 1.5, 0],
                            opacity: [0, 0.5, 0]
                        }}
                        transition={{
                            duration: 10 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        style={{
                            width: Math.random() * 200 + 50 + "px",
                            height: Math.random() * 200 + 50 + "px",
                        }}
                    />
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="relative z-10"
            >
                <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mb-6 shadow-xl ring-1 ring-border/50 mx-auto relative">
                    <motion.div
                        className="absolute inset-0 border border-dashed border-primary/30 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />
                    <SearchX className="w-10 h-10 text-muted-foreground" />
                    <motion.div
                        className="absolute -top-1 -right-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-1.5 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Sparkles className="w-4 h-4" />
                    </motion.div>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-2 font-quran">
                    {message || "لا توجد نتائج"}
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6 text-sm leading-relaxed">
                    لم نتمكن من العثور على ما تبحث عنه في الوقت الحالي. جرب كلمات مفتاحية مختلفة أو تحقق من الإملاء.
                </p>

                {onClear && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClear}
                        className="text-primary hover:text-primary/80 font-bold text-sm border-b border-primary/20 hover:border-primary transition-all pb-0.5"
                    >
                        مسح جميع الفلاتر
                    </motion.button>
                )}
            </motion.div>
        </div>
    );
};
