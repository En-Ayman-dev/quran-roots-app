import React from 'react';
import SearchBar from '@/components/SearchBar';
import Results from '@/components/Results';
import { useQuran } from '@/contexts/QuranContext';
import { Activity, ArrowLeft, Search } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

/**
 * Home Page - Quran Roots Search Application
 */
export default function Home() {
  const { searchResults, loading } = useQuran();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Hero Section */}
          <div className="text-center space-y-4 py-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
              بحث جذور القرآن الكريم
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              ابحث عن جذور الكلمات في القرآن الكريم واكتشف الآيات المرتبطة والإحصائيات الشاملة
            </p>
          </div>

          {/* Search Section */}
          <div className="max-w-3xl mx-auto w-full space-y-6">
            <SearchBar size="large" />

            {/* Dashboard Button - Placed below search bar as requested */}
            {searchResults && (
              <div className="flex justify-center animate-in fade-in slide-in-from-top-2">
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
                    <Activity className="w-5 h-5" />
                    <span>لوحة التحليلات</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="mt-12">
            {(searchResults || loading) ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Results />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground animate-in fade-in duration-1000 delay-300">
                <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Search className="w-10 h-10 text-primary/20" />
                </div>
                <p className="text-lg font-medium">ابدأ البحث لاكتشاف كنوز القرآن</p>
                <p className="text-sm opacity-60 mt-2">جرب البحث عن جذور مثل "علم"، "رحم"، "كتب"</p>
              </div>
            )}
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
