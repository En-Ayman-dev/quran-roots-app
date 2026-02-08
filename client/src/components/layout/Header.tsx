import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, Search, BookOpen, MoveLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
    onMenuClick: () => void;
    isOpen?: boolean;
    className?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, isOpen, className }) => {
    const [scrolled, setScrolled] = useState(false);
    const [location] = useLocation();

    // Handle scroll effect for glassmorphism intensity
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={cn(
                "sticky top-0 z-[100] w-full transition-all duration-500",
                scrolled
                    ? "bg-background/80 backdrop-blur-md border-b border-primary/10 shadow-sm supports-[backdrop-filter]:bg-background/60"
                    : "bg-transparent border-b border-transparent",
                className
            )}
        >
            <div className="container relative flex h-20 items-center justify-between">

                {/* Right Side (Start in RTL): Logo & Identity */}
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Trigger */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onMenuClick}
                        className="md:hidden text-muted-foreground hover:text-primary hover:bg-primary/5 -ms-2"
                    >
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>

                    <Link href="/" className="group flex items-center gap-3 transition-opacity">
                        <div className={cn(
                            "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-500",
                            scrolled ? "bg-primary/10 text-primary" : "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        )}>
                            <BookOpen className="h-5 w-5 absolute transition-all duration-300 group-hover:scale-0 group-hover:opacity-0" />
                            <Search className="h-5 w-5 absolute transition-all duration-300 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-quran text-2xl font-bold leading-none tracking-tight text-foreground">
                                جذور القرآن
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground opacity-80 tracking-widest">
                                QURAN ROOTS
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Left Side (End in RTL): Actions */}
                <div className="flex items-center gap-3">
                    {/* Navigation Links - Desktop Only (Optional, keeps it clean for now) */}

                    {/* Action Pill */}
                    <div className={cn(
                        "flex items-center gap-1 rounded-full p-1 transition-all duration-300",
                        scrolled ? "bg-secondary/50 border border-secondary" : "bg-background/50 backdrop-blur border border-border/50"
                    )}>
                        <ThemeToggle />

                        <div className="h-4 w-px bg-border mx-1 hidden md:block" />

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onMenuClick}
                            className="hidden md:flex gap-2 rounded-full px-4 hover:bg-primary/10 hover:text-primary transition-all font-medium text-muted-foreground"
                        >
                            <span>القائمة</span>
                            <Menu className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Decorative Bottom Gradient Line */}
                <div className={cn(
                    "absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent transition-opacity duration-500",
                    scrolled ? "opacity-100" : "opacity-0"
                )} />
            </div>
        </header>
    );
};
