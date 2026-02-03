import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, BookOpen, ChevronLeft, LayoutGrid, X } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils'; // Assuming utils exists, standard in UI libs

interface AppSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    currentLab: string | null;
    onSelectLab: (labId: string) => void;
}

const sidebarVariants = {
    closed: {
        x: '100%',
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30
        }
    },
    open: {
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30
        }
    }
} as const;

const labs = [
    {
        id: 'project-analytics',
        title: 'تحليلات المشروع العامة',
        description: 'إحصائيات شاملة عن البيانات القرآنية',
        icon: Activity,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10'
    },
    // Future labs can be added here
];

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, onClose, currentLab, onSelectLab }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={sidebarVariants}
                        className="fixed right-0 top-0 h-full w-full md:w-80 bg-card border-l border-border shadow-2xl z-50 overflow-y-auto"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <LayoutGrid className="w-6 h-6 text-primary" />
                                    المختبرات
                                </h2>
                                <Button variant="ghost" size="icon" onClick={onClose}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {labs.map((lab) => (
                                    <div
                                        key={lab.id}
                                        onClick={() => onSelectLab(lab.id)}
                                        className={cn(
                                            "group p-4 rounded-xl cursor-pointer border transition-all duration-200",
                                            currentLab === lab.id
                                                ? "bg-primary/5 border-primary shadow-sm"
                                                : "bg-card hover:bg-muted/50 border-border hover:border-primary/50"
                                        )}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={cn("p-2 rounded-lg transition-colors", lab.bg, lab.color)}>
                                                <lab.icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className={cn(
                                                    "font-bold mb-1 transition-colors",
                                                    currentLab === lab.id ? "text-primary" : "text-foreground group-hover:text-primary"
                                                )}>
                                                    {lab.title}
                                                </h3>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    {lab.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer / Context */}
                            <div className="mt-12 p-4 rounded-lg bg-secondary/20 border border-secondary border-dashed text-center">
                                <p className="text-xs text-muted-foreground">
                                    هذه المختبرات هي أدوات تجريبية لاستعراض البيانات بطرق جديدة.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
