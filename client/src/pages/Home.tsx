import React from 'react';
import SearchBar from '@/components/SearchBar';
import Results from '@/components/Results';
import Statistics from '@/components/Statistics';
import { useQuran } from '@/contexts/QuranContext';
import { Activity, ArrowLeft, Search, Menu, X } from 'lucide-react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ProjectAnalytics } from '@/components/labs/ProjectAnalytics';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

/**
 * Home Page - Quran Roots Search Application
 * 
 * Design Philosophy: Islamic Minimalism with Semantic Depth
 * - Content-first design with Quranic text as the hero
 * - Clean, uncluttered layout respecting sacred content
 * - Excellent readability for Arabic text
 * - Purposeful interactions with smooth transitions
 */
export default function Home() {
  const { searchResults } = useQuran();

  // Sidebar & Labs State
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [currentLab, setCurrentLab] = React.useState<string | null>(null);

  const handleLabSelect = (labId: string) => {
    setCurrentLab(labId);
    setIsSidebarOpen(false); // Close sidebar on selection (mobile friendly)
  };

  const closeLab = () => setCurrentLab(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container py-6">
          <div className="max-w-6xl mx-auto relative">
            {searchResults && (
              <div className="absolute top-1 left-0 hidden md:block">
                <Link href="/dashboard">
                  <Button variant="ghost" className="gap-2 text-primary hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all font-bold">
                    <Activity className="w-4 h-4" />
                    <span>لوحة التحليلات</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            )}
            {/* Sidebar Menu Button - Always Visible */}
            <div className="absolute top-6 right-0 z-10 animate-in fade-in duration-500 flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="hover:bg-primary/5">
                <Menu className="w-6 h-6 text-primary" />
              </Button>
            </div>

            <div className="mb-6 text-center">
              <h1 className="text-4xl font-bold text-primary mb-2">
                بحث جذور القرآن الكريم
              </h1>
              <p className="text-muted-foreground text-lg">
                ابحث عن جذور الكلمات في القرآن الكريم واكتشف الآيات المرتبطة والإحصائيات الشاملة
              </p>
            </div>
            <SearchBar size="large" showRecent={true} />

            {searchResults && (
              <div className="md:hidden mt-4 flex justify-center animate-in fade-in slide-in-from-top-2">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="gap-2 border-primary/20 bg-primary/5">
                    <Activity className="w-3 h-3" />
                    <span>لوحة التحليلات</span>
                    <ArrowLeft className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-5xl mx-auto">
          {searchResults ? (
            <div className="space-y-6">


              {/* Results Column - Full Width */}
              <Results />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground animate-in fade-in duration-1000 delay-300">
              <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Search className="w-10 h-10 text-primary/20" />
              </div>
              <p className="text-lg font-medium">ابدأ البحث لاكتشاف كنوز القرآن</p>
              <p className="text-sm opacity-60 mt-2">جرب البحث عن جذور مثل "علم"، "رحم"، "كتب"</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="container py-8">
          <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
            <p>تطبيق بحث جذور القرآن الكريم - جميع الحقوق محفوظة © 2026</p>
          </div>
        </div>
      </footer>

      {/* Interactive Sidebar */}
      <AppSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentLab={currentLab}
        onSelectLab={handleLabSelect}
      />

      {/* Lab Overlay / Modal */}
      {currentLab === 'project-analytics' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-card border border-border shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto relative flex flex-col">
            <div className="sticky top-0 bg-card/80 backdrop-blur border-b border-border p-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold">المختبرات</h2>
              <Button variant="ghost" size="icon" onClick={closeLab}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6">
              <ProjectAnalytics />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
