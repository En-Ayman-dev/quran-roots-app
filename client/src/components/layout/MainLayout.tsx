import React, { useState } from 'react';
import { Header } from './Header';
import { AppSidebar } from './AppSidebar';
import { Toaster } from '@/components/ui/sonner';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
            <Header onMenuClick={() => setIsSidebarOpen(true)} />
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
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectAnalytics } from '@/components/labs/ProjectAnalytics'; // Ensure this path is correct

const LabModal = ({ labId, onClose }: { labId: string; onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-4xl bg-card border border-border shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto relative flex flex-col">
                <div className="sticky top-0 bg-card/80 backdrop-blur border-b border-border p-4 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold">المختبرات</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>
                <div className="p-6">
                    {labId === 'project-analytics' && <ProjectAnalytics />}
                    {/* Add other labs here */}
                </div>
            </div>
        </div>
    );
};
