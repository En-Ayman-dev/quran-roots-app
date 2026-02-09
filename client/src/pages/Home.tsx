import React from 'react';
import SearchBar from '@/components/SearchBar';
import Results from '@/components/Results';
import { useQuran } from '@/contexts/QuranContext';
import { Activity, ArrowLeft, Search } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import ThreeParticleSearch from '@/components/ThreeParticleSearch';

/**
 * Home Page - Quran Roots Search Application
 */
export default function Home() {
  const { searchResults, loading } = useQuran();
  const [searchTerm, setSearchTerm] = React.useState('');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* 3D Search Experience - Only shown when no results and not loading (or initial load) */}
          {/* LOADING STATE - 3D Particle Search */}
          {loading && (
            <div className="w-full fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500">
              <div className="relative w-full max-w-5xl h-[600px]">
                <React.Suspense fallback={<div className="animate-pulse text-primary text-center">جاري التحميل...</div>}>
                  <ThreeParticleSearch text={searchTerm} />
                </React.Suspense>
                <div className="absolute bottom-20 left-0 right-0 text-center">
                  <p className="text-primary/80 text-xl font-medium animate-pulse">جاري البحث عن "{searchTerm}"...</p>
                </div>
              </div>
            </div>
          )}

          {/* Initial State - Hero & Search (Shown when not loading and no results) */}
          {!searchResults && !loading && (
            <>
              <div className="text-center space-y-4 py-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
                  بحث جذور القرآن الكريم
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  ابحث عن جذور الكلمات في القرآن الكريم واكتشف الآيات المرتبطة والإحصائيات الشاملة
                </p>
              </div>

              <div className="max-w-3xl mx-auto w-full space-y-6">
                <SearchBar size="large" onInputChanged={setSearchTerm} />

                {/* Dashboard Shortcut if available */}
                <div className="flex justify-center animate-in fade-in slide-in-from-top-2">
                  <Link href="/dashboard">
                    <Button variant="outline" size="lg" className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
                      <Activity className="w-5 h-5" />
                      <span>لوحة التحليلات</span>
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* Results State - Compact Search (Shown when results exist and not loading) */}
          {searchResults && !loading && (
            <div className="max-w-3xl mx-auto w-full space-y-6">
              <SearchBar size="medium" onInputChanged={setSearchTerm} />
            </div>
          )}

          {/* Results Section */}
          <div className="mt-8">
            {(searchResults || loading || useQuran().error) ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Results />
              </div>
            ) : null}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="container py-8">
          <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
            <p>تطبيق بحث جذور القرآن الكريم - جميع الحقوق محفوظة © 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
