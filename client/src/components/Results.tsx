import React from 'react';
import { useQuran } from '@/contexts/QuranContext';
import { BookOpen, Copy, Download, Search, X, AlertOctagon, LayoutDashboard } from 'lucide-react';
import { Link } from 'wouter';
import { NetworkError } from './errors/NetworkError';
import { ServerError } from './errors/ServerError';
import { AccessDenied } from './errors/AccessDenied';
import { ErrorLayout } from './errors/ErrorLayout';
import { QuranLoader } from './ui/QuranLoader';
import { EmptyState } from './errors/EmptyState';
import { ScrollToTop } from './ui/ScrollToTop';
import { AyahCard } from './ui/AyahCard';

// --- Utility: Remove Arabic Diacritics (Tashkeel) ---
const normalizeArabic = (text: string) => {
  if (!text) return "";
  // Removes: Fathatan, Dammatan, Kasratan, Fatha, Damma, Kasra, Shadda, Sukun, Superscript Aleph, Tatweel
  return text.replace(/[\u064B-\u065F\u0670\u0640]/g, "");
};

export const Results: React.FC = () => {
  const { searchResults, loading, error, searchByRoot } = useQuran();

  // --- STATE ---
  const [visibleCount, setVisibleCount] = React.useState(10);
  const [selectedSurah, setSelectedSurah] = React.useState<string>('all');
  const [selectedJuz, setSelectedJuz] = React.useState<string>('all');
  const [subSearch, setSubSearch] = React.useState<string>('');
  const [selectedDerivative, setSelectedDerivative] = React.useState<string | null>(null);

  // --- DERIVED DATA (MEMOs) ---
  const uniqueJuzs = React.useMemo(() => {
    if (!searchResults) return [];
    return Array.from(new Set(searchResults.ayahs.map(a => a.juz))).sort((a, b) => a - b);
  }, [searchResults]);

  const availableSurahs = React.useMemo(() => {
    if (!searchResults) return [];
    let ayahsToConsider = searchResults.ayahs;
    if (selectedJuz !== 'all') {
      const juzNum = parseInt(selectedJuz);
      ayahsToConsider = ayahsToConsider.filter(a => a.juz === juzNum);
    }
    return Array.from(new Set(ayahsToConsider.map(a => a.surahName)));
  }, [searchResults, selectedJuz]);

  const derivatives = React.useMemo(() => {
    if (!searchResults) return [];
    const wordCounts = new Map<string, number>();
    searchResults.ayahs.forEach(ayah => {
      ayah.tokens.forEach((token: any) => {
        if (token.root === searchResults.root) {
          const word = token.token_uthmani || token.token;
          wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        }
      });
    });
    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [searchResults]);


  // --- EFFECTS ---
  React.useEffect(() => {
    setVisibleCount(10);
    setSelectedSurah('all');
    setSelectedJuz('all');
    setSubSearch('');
    setSelectedDerivative(null);
  }, [searchResults]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRootClick = (root: string) => {
    setSubSearch(root);
    setVisibleCount(10);
    scrollToTop();
  };

  // --- EARLY RETURNS ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <QuranLoader />
      </div>
    );
  }

  if (error) {
    if (error.name === 'NetworkError') {
      return <NetworkError onRetry={() => searchByRoot(searchResults?.root || '')} />;
    }
    if (error.name === 'ServerError') {
      return <ServerError error={error} onRetry={() => searchByRoot(searchResults?.root || '')} />;
    }
    if (error.name === 'AuthenticationError') {
      return <AccessDenied />;
    }
    return (
      <ErrorLayout
        title="حدث خطأ"
        description={error.message || "حدث خطأ غير متوقع أثناء البحث"}
        icon={<AlertOctagon className="w-10 h-10 text-destructive" />}
        action="retry"
        onRetry={() => searchByRoot(searchResults?.root || '')}
      />
    );
  }

  if (!searchResults) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4 animate-in fade-in duration-1000">
        <div className="bg-gradient-to-b from-primary/5 to-transparent p-12 rounded-[3rem] border border-primary/5 mb-8">
          <BookOpen className="w-20 h-20 text-primary/30" />
        </div>
        <h3 className="text-3xl font-bold text-foreground/80 mb-4 font-serif">مرحباً بك في باحث الجذور</h3>
        <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
          اكتب جذر الكلمة (مثلاً: <span className="text-primary font-bold">"رحم"</span>) لاكتشاف الكنوز في كتاب الله
        </p>
      </div>
    );
  }

  // --- Filtering Logic ---
  const filteredAyahs = searchResults.ayahs.filter(ayah => {
    const matchSurah = selectedSurah === 'all' || ayah.surahName === selectedSurah;
    const matchJuz = selectedJuz === 'all' || ayah.juz === parseInt(selectedJuz);

    // Derivative Filter
    let matchDerivative = true;
    if (selectedDerivative) {
      matchDerivative = ayah.tokens.some((t: any) => (t.token_uthmani === selectedDerivative || t.token === selectedDerivative));
    }

    // Smart Sub-search Logic
    let matchSub = true;
    if (subSearch.trim()) {
      const term = normalizeArabic(subSearch.trim());
      const normalizedText = normalizeArabic(ayah.text);
      const normalizedSurah = normalizeArabic(ayah.surahName);

      matchSub = normalizedText.includes(term) ||
        normalizedSurah.includes(term) ||
        ayah.tokens.some((t: any) => normalizeArabic(t.root).includes(term) || normalizeArabic(t.token).includes(term)) ||
        ayah.otherRoots.some((r: string) => normalizeArabic(r).includes(term));
    }

    return matchSurah && matchJuz && matchSub && matchDerivative;
  });

  const visibleAyahs = filteredAyahs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAyahs.length;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 min-h-[60vh]">

      {/* Filters Header - Same Layout, Added Dashboard Button to Action Group */}
      <div className="relative z-30 transition-all duration-300 space-y-4 mb-6">
        <div className="container mx-auto max-w-4xl pt-2">
          <div className="bg-background/60 backdrop-blur-xl border border-primary/5 shadow-xl shadow-primary/5 rounded-2xl p-3 md:p-4 transition-all hover:bg-background/80 flex flex-col gap-4">

            {/* Top Row: Title & Main Filters */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">

              {/* Title & Count */}
              <div className="flex-shrink-0 flex items-center gap-3 self-start md:self-center">
                <div className="flex flex-col items-start leading-none">
                  <span className="text-xs text-muted-foreground font-medium">نتائج الجذر</span>
                  <span className="text-lg font-bold text-primary font-serif">"{searchResults.root}"</span>
                </div>
                <div className="h-8 w-px bg-border/50 mx-1"></div>
                <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/10">
                  {Number(filteredAyahs.length).toLocaleString('ar-EG')} آية
                </span>
              </div>

              {/* Smart Filters & Sub-Search */}
              <div className="flex flex-1 w-full md:w-auto items-center gap-2 justify-end flex-wrap">

                {/* Action Buttons: Dashboard (New), Copy, Download */}
                <div className="flex items-center gap-1 border-l border-border/50 pl-2 ml-2">
                  <Link href="/dashboard">
                    <a 
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors flex items-center justify-center"
                      title="لوحة المعلومات والإحصائيات"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                    </a>
                  </Link>
                  <button
                    onClick={() => {
                      const text = filteredAyahs.map(a => `${a.text} \n[${a.surahName}: ${a.ayahNo}]`).join('\n\n');
                      navigator.clipboard.writeText(text);
                      alert('تم نسخ جميع النتائج المصفاة إلى الحافظة');
                    }}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                    title="نسخ النتائج"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const headers = "السورة,رقم الآية,النص,الجذور";
                      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + "\n" +
                        filteredAyahs.map(a => {
                          const safeText = `"${a.text.replace(/"/g, '""')}"`;
                          const safeRoots = `"${a.tokens.map((t: any) => t.root).join(' ')}"`;
                          return `${a.surahName},${a.ayahNo},${safeText},${safeRoots}`;
                        }).join("\n");

                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `quran_results_${searchResults.root}_${new Date().toISOString().slice(0, 10)}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                    title="تحميل ملف (CSV)"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                {/* SUB-SEARCH INPUT */}
                <div className="relative flex-1 min-w-[140px] max-w-[220px] group transition-all focus-within:max-w-[280px]">
                  <input
                    type="text"
                    placeholder="ابحث ضمن النتائج..."
                    value={subSearch}
                    onChange={(e) => { setSubSearch(e.target.value); setVisibleCount(10); }}
                    className="w-full bg-secondary/30 hover:bg-secondary/50 focus:bg-background border border-transparent hover:border-primary/20 focus:border-primary/50 text-start px-4 py-2.5 ps-10 rounded-xl outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm font-medium"
                  />
                  {subSearch && (
                    <button onClick={() => setSubSearch('')} className="absolute start-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  )}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50">
                    <Search className="w-4 h-4" />
                  </div>
                </div>

                {/* Surah Filter */}
                <div className="relative group">
                  <select
                    className="w-full md:w-40 appearance-none bg-secondary/50 hover:bg-secondary cursor-pointer border-transparent hover:border-primary/20 rounded-xl px-9 py-2.5 text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-primary/20 text-start"
                    value={selectedSurah}
                    onChange={(e) => { setSelectedSurah(e.target.value); setVisibleCount(10); }}
                  >
                    <option value="all">كل السور 🕌</option>
                    {availableSurahs.map(s => <option key={s} value={s}>سورة {s}</option>)}
                  </select>
                </div>

                {/* Juz Filter */}
                <div className="relative group">
                  <select
                    className={`w-full md:w-32 appearance-none bg-secondary/50 hover:bg-secondary cursor-pointer border-transparent hover:border-primary/20 rounded-xl px-8 py-2.5 text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-primary/20 text-right dir-rtl ${selectedSurah !== 'all' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={selectedJuz}
                    onChange={(e) => { setSelectedJuz(e.target.value); setVisibleCount(10); }}
                    disabled={selectedSurah !== 'all'}
                    dir="rtl"
                    title={selectedSurah !== 'all' ? 'لا يمكن اختيار الجزء عند تحديد سورة معينة' : ''}
                  >
                    <option value="all">الأجزاء 📖</option>
                    {uniqueJuzs.map(j => <option key={j} value={j}>الجزء {j}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Morphological Derivatives Strip */}
            {derivatives.length > 0 && (
              <div className="overflow-hidden relative group/strip border-t border-border/30 pt-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x mask-linear-fade dir-rtl pr-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <button
                    onClick={() => setSelectedDerivative(null)}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all snap-center border flex items-center gap-2 ${selectedDerivative === null ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105' : 'bg-background/50 text-muted-foreground border-border hover:bg-secondary hover:text-foreground'}`}
                  >
                    <span>الكل</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedDerivative === null ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                      {derivatives.length}
                    </span>
                  </button>
                  {derivatives.map(([word, count], idx) => (
                    <button key={idx} onClick={() => setSelectedDerivative(word === selectedDerivative ? null : word)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all snap-center border font-quran flex items-center gap-2 ${selectedDerivative === word ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105' : 'bg-background/50 text-foreground border-border hover:bg-secondary hover:border-primary/30'}`}>
                      <span>{word}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-sans font-bold ${selectedDerivative === word ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'}`}>
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="absolute left-0 top-3 bottom-2 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none" />
                <div className="absolute right-0 top-3 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
              </div>
            )}
            
            {/* Active Filters Tags */}
            {(selectedSurah !== 'all' || selectedJuz !== 'all' || subSearch || selectedDerivative) && (
               <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                 <button onClick={() => { setSelectedSurah('all'); setSelectedJuz('all'); setSubSearch(''); setSelectedDerivative(null); }} className="text-xs text-destructive hover:underline px-2">مسح الكل</button>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Results List - Using AyahCard */}
      <div className="grid gap-4">
        {visibleAyahs.length === 0 ? (
          <EmptyState
            message="لا توجد نتائج تطابق الفلاتر المختارة"
            onClear={() => { setSelectedSurah('all'); setSelectedJuz('all'); setSubSearch(''); setSelectedDerivative(null); }}
          />
        ) : (
          <>
            {visibleAyahs.map((ayah, index) => (
              <AyahCard
                key={ayah.id}
                ayah={ayah}
                index={index}
                mainRoot={searchResults.root}
                subSearch={subSearch}
                onRootClick={handleRootClick}
              />
            ))}
          </>
        )}
      </div>

      {/* Pagination Controls */}
      {(hasMore || visibleCount > 10) && (
        <div className="flex flex-col items-center gap-2 py-8 animate-in slide-in-from-bottom-4 fade-in">
          <div className="text-xs text-muted-foreground mb-2 font-medium">
            عرض {Math.min(visibleCount, filteredAyahs.length)} من أصل {filteredAyahs.length}
          </div>
          <div className="bg-background/80 backdrop-blur-md p-1.5 rounded-full shadow-2xl border border-border flex gap-2 ring-1 ring-border/50">
            {hasMore && (
              <button
                onClick={() => setVisibleCount(prev => prev + 10)}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-primary/25 flex items-center gap-2"
              >
                <span>عرض المزيد</span>
                <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs">+10</span>
              </button>
            )}
            {visibleCount > 10 && (
              <button
                onClick={() => { setVisibleCount(10); scrollToTop(); }}
                className="px-6 py-3 hover:bg-secondary text-foreground rounded-full font-medium transition-all flex items-center gap-2"
              >
                عرض أقل
              </button>
            )}
          </div>
        </div>
      )}

      <ScrollToTop />
    </div>
  );
};
export default Results;