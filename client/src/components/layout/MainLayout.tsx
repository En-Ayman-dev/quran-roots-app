import React, { useState } from 'react';
import { Header } from './Header';
import { AppSidebar } from './AppSidebar';
import { Toaster } from '@/components/ui/sonner';
import { useLocation } from 'wouter';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [location] = useLocation(); // Hook to detect route changes
    // We need to manage lab interactions. 
    // Since labs are currently tight to the Home page logic (overlay), 
    // we might need to expose the lab state or let the Sidebar control it via a context.
    // For now, to keep it simple and working as per plan, we will lift the sidebar state here.
    // The 'currentLab' state is currently used to show a modal in Home.tsx. 
    // If we want the sidebar to be global, the lab selection needs to be handled globally or passed down.

    // STRATEGY: 
    // We'll keep the Lab Modal/Overlay logic where it is most relevant or move it to a global context later if needed.
    // But wait, the Sidebar IS the way to open the labs.
    // If the Sidebar is in MainLayout, the `onSelectLab` needs to do something.
    // If `Home.tsx` is the only place with labs, `Home` needs to know when a lab is selected.
    // Ideally, we'd use a Context. But for this refactor, let's try to keep the Lab logic global if possible.
    // The `ProjectAnalytics` is the only lab so far.

    const [currentLab, setCurrentLab] = useState<string | null>(null);

    const handleLabSelect = (labId: string) => {
        setCurrentLab(labId);
        setIsSidebarOpen(false);
    };

    const closeLab = () => setCurrentLab(null);

    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <div style={{ height: '80px' }} />
            <Header
                onMenuClick={() => setIsSidebarOpen(true)}
                isOpen={isSidebarOpen}
                className={currentLab ? "opacity-0 pointer-events-none" : ""}
            />
            <div className="flex-1">
                {children}
            </div>
            <AppSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                currentLab={currentLab}
                onSelectLab={handleLabSelect}
            />

            {/* Global Lab Overlay/Modal - Moved from Home.tsx so it works everywhere */}
            {currentLab === 'project-analytics' && (
                /* We need to dynamically import or render the lab component here. 
                   However, ProjectAnalytics was imported in Home.tsx. 
                   I should probably import it here to make it truly global.
                   But I need to check if ProjectAnalytics is exported correctly.
                */
                <LabModal labId={currentLab} onClose={closeLab} />
            )}
        </div>
    );
};

// Helper component to render the active lab
import { X, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectAnalytics } from '@/components/labs/ProjectAnalytics'; // Ensure this path is correct

const LabModal = ({ labId, onClose }: { labId: string; onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/60 backdrop-blur-[2px] animate-in fade-in duration-300">
            {/* Overlay click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Modal Container */}
            <div className="w-full max-w-5xl mx-4 my-8 md:my-12 h-[85vh] md:h-[90vh] bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl relative flex flex-col overflow-hidden ring-1 ring-black/5 dark:ring-white/10">

                {/* Decorative Pattern Background */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]" />

                {/* Header */}
                <div className="sticky top-0 bg-background/50 backdrop-blur-md border-b border-border/50 p-4 md:p-6 flex justify-between items-center z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold font-quran leading-none">مختبر التحليلات</h2>
                            <p className="text-xs text-muted-foreground mt-1">استعراض البيانات القرآنية المتقدمة</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors h-10 w-10"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-0 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
                    {labId === 'project-analytics' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-500">
                            <ProjectAnalytics onNavigate={onClose} />
                        </div>
                    )}
                    {/* Add other labs here */}
                </div>

                {/* Footer Gradient Fade */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background/80 to-transparent pointer-events-none z-10" />
            </div>
        </div>
    );
};
