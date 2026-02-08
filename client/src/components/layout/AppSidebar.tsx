import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, BookOpen, ChevronLeft, LayoutGrid, X, Home, Book, Settings, Info, Github } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { ThemeToggle } from '../ThemeToggle';
import { Link, useLocation } from 'wouter';

interface AppSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    currentLab: string | null;
    onSelectLab: (labId: string) => void;
}

const sidebarVariants = {
    closed: {
        // RTL: 100% means right (start) side off-screen? No, x is transform. 
        // In RTL, positive X usually moves Right.
        // If sidebar is on the Right (Start), we want it to slide OUT to the Right.
        // So closed = x: '100%'. Open = x: 0.
        // Wait, previously I set it to '-100%' for 'left' side? 
        // The user wants it "professional" and "responsive". 
        // Usually sidebar is on the Start side (Right in RTL).
        // Let's stick to Right side.
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
    }
];

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, onClose, currentLab, onSelectLab }) => {
    const [location] = useLocation();

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
                        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[150]"
                    />

                    {/* Sidebar Container */}
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={sidebarVariants}
                        className="fixed top-0 right-0 h-full w-[85vw] md:w-[400px] bg-background/95 backdrop-blur-xl border-l border-border/50 shadow-2xl z-[200] overflow-hidden flex flex-col"
                    >
                        {/* 1. Header Area with Close Button */}
                        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-secondary/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <LayoutGrid className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold font-quran">القائمة الرئيسية</h2>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                                <X className="w-5 h-5" />
                                <span className="sr-only">Close</span>
                            </Button>
                        </div>

                        {/* 2. Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* Section: Labs */}
                            <section>
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 px-2">
                                    المختبرات والأدوات
                                </h3>
                                <div className="space-y-3">
                                    {labs.map((lab) => (
                                        <motion.div
                                            key={lab.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => onSelectLab(lab.id)}
                                            className={cn(
                                                "group flex items-center gap-4 p-4 rounded-xl cursor-pointer border transition-all duration-300",
                                                currentLab === lab.id
                                                    ? "bg-primary/5 border-primary shadow-sm"
                                                    : "bg-card border-transparent hover:bg-secondary/50 hover:border-border"
                                            )}
                                        >
                                            <div className={cn("p-3 rounded-xl transition-all shadow-sm", lab.bg, lab.color)}>
                                                <lab.icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={cn(
                                                    "font-bold text-base mb-1 transition-colors",
                                                    currentLab === lab.id ? "text-primary" : "text-foreground group-hover:text-primary"
                                                )}>
                                                    {lab.title}
                                                </h4>
                                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                                    {lab.description}
                                                </p>
                                            </div>
                                            <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:-translate-x-1 transition-transform" />
                                        </motion.div>
                                    ))}
                                </div>
                            </section>

                            {/* Section: Quick Links (Placeholder for Future) */}
                            <section>
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 px-2">
                                    روابط سريعة
                                </h3>
                                <nav className="grid grid-cols-2 gap-2">
                                    <Link href="/" onClick={onClose} className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-colors gap-2 text-center group">
                                        <Home className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-bold">الرئيسية</span>
                                    </Link>
                                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-colors gap-2 text-center group cursor-pointer" title="قريباً">
                                        <Book className="w-6 h-6 text-muted-foreground group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-bold text-muted-foreground">المصحف</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-colors gap-2 text-center group cursor-pointer" title="قريباً">
                                        <Info className="w-6 h-6 text-muted-foreground group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-bold text-muted-foreground">عن المشروع</span>
                                    </div>
                                    <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-colors gap-2 text-center group">
                                        <Github className="w-6 h-6 text-foreground group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-bold">GitHub</span>
                                    </a>
                                </nav>
                            </section>
                        </div>

                        {/* 3. Footer Area with Settings */}
                        <div className="p-6 border-t border-border/50 bg-secondary/5 mt-auto">
                            <div className="flex items-center justify-between gap-4 bg-background p-4 rounded-xl border border-border/50 shadow-sm">
                                <span className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                    <Settings className="w-4 h-4" />
                                    مظهر التطبيق
                                </span>
                                <ThemeToggle />
                            </div>
                            <p className="text-[10px] text-center text-muted-foreground mt-4 opacity-50 font-mono">
                                v2.0.0 • Quran Roots
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
