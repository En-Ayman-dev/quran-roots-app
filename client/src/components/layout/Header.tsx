import React from 'react';
import { Link } from 'wouter';
import { Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

interface HeaderProps {
    onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onMenuClick} className="mr-2 md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-80 transition-opacity">
                        <Search className="h-6 w-6" />
                        <span>جذور القرآن</span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Button variant="ghost" size="icon" onClick={onMenuClick} className="hidden md:flex">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Open sidebar</span>
                    </Button>
                </div>
            </div>
        </header>
    );
};
