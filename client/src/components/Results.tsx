import React from 'react';
import { useQuran } from '@/contexts/QuranContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, BookOpen, ChevronDown, ChevronUp, Search, X, Copy, Check, Download, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NetworkError } from './errors/NetworkError';
import { ServerError } from './errors/ServerError';
import { AccessDenied } from './errors/AccessDenied';
import { ErrorLayout } from './errors/ErrorLayout';
import { SearchX, AlertOctagon } from 'lucide-react';
import { QuranLoader } from './ui/QuranLoader';
import { EmptyState } from './errors/EmptyState';
import { ScrollToTop } from './ui/ScrollToTop';

// --- Utility: Remove Arabic Diacritics (Tashkeel) ---
const normalizeArabic = (text: string) => {
  if (!text) return "";
  // Removes: Fathatan, Dammatan, Kasratan, Fatha, Damma, Kasra, Shadda, Sukun, Superscript Aleph, Tatweel
  return text.replace(/[\u064B-\u065F\u0670\u0640]/g, "");
};

// --- Helper: Highlight Text Component (Robust Normalized Matching) ---
const HighlightableText: React.FC<{
  text: string;
  mainWords: string[];
  secondaryWords: string[];
  subSearch: string;
}> = ({ text, mainWords, secondaryWords, subSearch }) => {
  if (!text) return null;

  // COLOR PALETTE (High Contrast Text Only - No Backgrounds)
  // Main Root: Vivid Blue
  const STYLE_MAIN = "text-blue-600 dark:text-blue-400 font-extrabold";
  // Secondary Root (Filter): Vivid Fuchsia
  const STYLE_SECONDARY = "text-fuchsia-600 dark:text-fuchsia-400 font-extrabold";
  // Sub-search General: Vivid Emerald
  const STYLE_GENERAL = "text-emerald-600 dark:text-emerald-400 font-bold";

  // Normalize helper
  const normalize = (t: string) => t.replace(/[\u064B-\u065F\u0670\u0640]/g, "");

  // Prepare Sets for O(1) lookup of NORMALIZED target words
  const mainSet = new Set(mainWords.map(w => normalize(w)));
  const secondarySet = new Set(secondaryWords.map(w => normalize(w)));

  const cleanSub = subSearch ? normalize(subSearch.trim()) : "";
  const subIsRoot = mainSet.has(cleanSub) || secondarySet.has(cleanSub);

  // Split text by space to isolate visual words
  const words = text.split(' ');

  return (
    <>
      {words.map((word, i) => {
        const normWord = normalize(word);
        // Adds space between words, but not after the last one
        const suffix = i < words.length - 1 ? " " : "";

        // Priority 1: Main Root Match
        if (mainSet.has(normWord)) {
          return <span key={i} className={STYLE_MAIN}>{word}{suffix}</span>;
        }

        // Priority 2: Secondary Root Match
        if (secondarySet.has(normWord)) {
          return <span key={i} className={STYLE_SECONDARY}>{word}{suffix}</span>;
        }

        // Priority 3: SubSearch General Match
        // Match if the word contains the search term (e.g. "يعلمون" contains "علم")
        if (cleanSub && cleanSub.length > 1 && !subIsRoot && normWord.includes(cleanSub)) {
          return <span key={i} className={STYLE_GENERAL}>{word}{suffix}</span>;
        }

        // Default: Render word normally
        return <span key={i}>{word}{suffix}</span>;
      })}
    </>
  );
};

// --- Animated Verse Card Component ---
const VerseCard: React.FC<{
  ayah: any;
  index: number;
  onRootClick: (root: string) => void;
  mainRoot: string;
  subSearch: string;
}> = ({ ayah, index, onRootClick, mainRoot, subSearch }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Derive Highlight Lists
  const mainTokens = React.useMemo(() =>
    ayah.tokens
      .filter((t: any) => t.root === mainRoot)
      .map((t: any) => t.token_uthmani || t.token),
    [ayah.tokens, mainRoot]);

  const secondaryTokens = React.useMemo(() => {
    if (!subSearch) return [];
    // If subSearch is exactly a root in this ayah
    return ayah.tokens
      .filter((t: any) => t.root === subSearch && t.root !== mainRoot)
      .map((t: any) => t.token_uthmani || t.token);
  }, [ayah.tokens, subSearch, mainRoot]);

  // Combined keywords for logic (not used for display directly)
  const hasHighlights = mainTokens.length > 0 || secondaryTokens.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`group overflow-hidden rounded-2xl border transition-all duration-500 relative bg-card ${isExpanded
        ? 'shadow-2xl shadow-primary/10 border-primary/20 ring-1 ring-primary/5'
        : 'shadow-sm hover:shadow-md border-border/50 hover:border-primary/20'
        }`}
    >
      {/* Decorative side accent */}
      <div className={`absolute start-0 top-0 bottom-0 w-1 transition-all duration-500 ${isExpanded ? 'bg-primary' : 'bg-primary/0 group-hover:bg-primary/50'}`} />

      {/* CLICKABLE HEADER AREA */}
      <div
        role="button"
        aria-expanded={isExpanded}
        aria-label={`عرض تفاصيل الآية ${ayah.surahName} ${ayah.ayahNo}`}
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsExpanded(!isExpanded); } }}
        className="cursor-pointer p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 relative z-10 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-xl"
      >
        <div className="flex items-center gap-4 flex-1">
          {/* Number Badge */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors font-serif ${isExpanded ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-primary group-hover:bg-primary/10'
            }`}>
            {index + 1}
          </div>

          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <h3 className="text-lg font-bold text-foreground font-serif leading-tight">{ayah.surahName}</h3>
              <span className="text-xs text-muted-foreground font-medium px-1.5 py-0.5 bg-background rounded border border-border">آية {ayah.ayahNo}</span>
            </div>

            {/* Metadata Preview (Always visible) */}
            <div className="flex gap-2 text-[10px] text-muted-foreground mt-1">
              <span>الجزء {ayah.juz}</span>
              <span className="w-px h-2.5 bg-border self-center" />
              <span>صفحة {ayah.page}</span>
              {/* Token Indicators (Collapsed only) */}
              {!isExpanded && ayah.tokens.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mr-2 flex gap-1"
                >
                  <span className="bg-primary/10 text-primary px-1.5 rounded-[3px] font-bold text-[10px]">
                    {ayah.tokens.length} تطابق
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Toggle Icon & Copy Button */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(`${ayah.text} \n[${ayah.surahName}: ${ayah.ayahNo}]`);
              const btn = e.currentTarget;
              const originalContent = btn.innerHTML;
              btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><path d="M20 6 9 17l-5-5"/></svg>';
              setTimeout(() => { btn.innerHTML = originalContent; }, 2000);
            }}
            className="p-2 rounded-full hover:bg-secondary/80 text-muted-foreground transition-colors z-20"
            title="نسخ الآية"
            aria-label="نسخ الآية"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-primary/10 text-primary' : 'bg-transparent text-muted-foreground group-hover:bg-muted'}`}>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* NEW: VISIBLE QURAN TEXT AREA (Using Scrollbar for long verses) */}
      <div className="px-5 md:px-8 pb-4 pt-0 -mt-1">
        <div className="relative">
          <div className="max-h-[130px] overflow-y-auto custom-scrollbar pl-2 pr-2 py-1 hover:bg-muted/5 rounded-lg transition-colors">
            <p className="text-right text-lg md:text-xl leading-[2.4] dir-rtl text-foreground font-quran drop-shadow-sm select-text" dir="rtl">
              <HighlightableText
                text={ayah.text}
                mainWords={mainTokens}
                secondaryWords={secondaryTokens}
                subSearch={subSearch}
              />
            </p>
          </div>
        </div>
      </div>

      {/* EXPANDABLE CONTENT (Medium Compact Analysis) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-5 md:px-8 pb-6 pt-4 border-t border-border/40 bg-muted/5">
              <div className="flex flex-wrap gap-x-8 gap-y-4">

                {/* Root Matches */}
                {ayah.tokens.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-primary/90 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      الكلمات المطابقة
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ayah.tokens.map((token: any, idx: number) => {
                        const isMain = token.root === mainRoot;
                        const isSecondary = token.root === subSearch;
                        return (
                          <div key={idx} className={`flex flex-col items-center px-3 py-1.5 rounded-md border shadow-sm relative min-w-[40px] ${isMain ? 'bg-primary/10 border-primary/30' :
                            isSecondary ? 'bg-amber-100 border-amber-300 dark:bg-amber-900/30' :
                              'bg-background border-border/80'
                            }`}>
                            <span className={`text-sm font-bold font-quran leading-tight ${isMain ? 'text-primary' :
                              isSecondary ? 'text-amber-700 dark:text-amber-400' :
                                'text-foreground'
                              }`}>{token.token_uthmani || token.token}</span>
                            <span className="text-[9px] text-muted-foreground/90 uppercase tracking-wide">{token.root}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Related Roots */}
                {ayah.otherRoots.length > 0 && (
                  <div className="space-y-2 flex-1 min-w-[180px]">
                    <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                      جذور أخرى
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ayah.otherRoots.filter((r: string) => normalizeArabic(r).length >= 3).map((root: string, idx: number) => {
                        const isSelected = root === subSearch;
                        return (
                          <span
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); onRootClick(root); }}
                            className={`text-xs font-medium px-2 py-1 rounded-md border cursor-pointer transition-all hover:shadow-sm ${isSelected
                              ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-background text-muted-foreground border-border/50 hover:border-primary/50 hover:text-primary'
                              }`}
                          >
                            {root}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
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
  // Safely compute derived data, even if searchResults is null/loading
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


  // Reset pagination/filters when search results change
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

  // --- EARLY RETURNS (Render Logic) ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <QuranLoader />
      </div>
    );
  }

  // ... inside component ...

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

  // --- Filtering Logic (Using pre-calculated hooks) ---

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

      {/* Filters Header - Restored Transparency & Removed Sticky to prevent overlap */}
      <div className="relative z-30 transition-all duration-300 space-y-4 mb-6">
        {/* Container for centering */}
        <div className="container mx-auto max-w-4xl pt-2">
          {/* Unified Card with Transparency */}
          <div className="bg-background/60 backdrop-blur-xl border border-primary/5 shadow-xl shadow-primary/5 rounded-2xl p-3 md:p-4 transition-all hover:bg-background/80 flex flex-col gap-4">

            {/* Top Row: Title & Main Filters */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">

              {/* Title & Count (Compact) */}
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

              {/* Smart Filters & Sub-Search (Compact) */}
              <div className="flex flex-1 w-full md:w-auto items-center gap-2 justify-end flex-wrap">

                {/* Action Buttons: Copy & Download (Relocated) */}
                <div className="flex items-center gap-1 border-l border-border/50 pl-2 ml-2">
                  <button
                    onClick={() => {
                      const text = filteredAyahs.map(a => `${a.text} \n[${a.surahName}: ${a.ayahNo}]`).join('\n\n');
                      navigator.clipboard.writeText(text);
                      alert('تم نسخ جميع النتائج المصفاة إلى الحافظة');
                    }}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                    title="نسخ النتائج"
                    aria-label="نسخ جميع النتائج للحافظة"
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
                    aria-label="تحميل النتائج كملف CSV"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                {/* SUB-SEARCH INPUT */}
                <div className="relative flex-1 min-w-[140px] max-w-[220px] group transition-all focus-within:max-w-[280px]">
                  <input
                    type="text"
                    placeholder="ابحث ضمن النتائج (بدون تشكيل)..."
                    value={subSearch}
                    onChange={(e) => { setSubSearch(e.target.value); setVisibleCount(10); }}
                    className="w-full bg-secondary/30 hover:bg-secondary/50 focus:bg-background border border-transparent hover:border-primary/20 focus:border-primary/50 text-start px-4 py-2.5 ps-10 rounded-xl outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm font-medium"
                  />
                  <div className="absolute start-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {subSearch && (
                      <button
                        onClick={() => setSubSearch('')}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
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

            {/* Morphological Derivatives Filter Strip (Integrated) */}
            {derivatives.length > 0 && (
              <div className="overflow-hidden relative group/strip border-t border-border/30 pt-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x mask-linear-fade dir-rtl pr-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <button
                    onClick={() => setSelectedDerivative(null)}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all snap-center border flex items-center gap-2 ${selectedDerivative === null
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105'
                      : 'bg-background/50 text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                      }`}
                  >
                    <span>الكل</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedDerivative === null ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                      {derivatives.length}
                    </span>
                  </button>
                  {derivatives.map(([word, count], idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedDerivative(word === selectedDerivative ? null : word)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all snap-center border font-quran flex items-center gap-2 ${selectedDerivative === word
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105'
                        : 'bg-background/50 text-foreground border-border hover:bg-secondary hover:border-primary/30'
                        }`}
                    >
                      <span>{word}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-sans font-bold ${selectedDerivative === word ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'}`}>
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
                {/* Fade Indicators for Scroll */}
                <div className="absolute left-0 top-3 bottom-2 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none" />
                <div className="absolute right-0 top-3 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
              </div>
            )}

            {/* Active Filters Display */}
            {(selectedSurah !== 'all' || selectedJuz !== 'all' || subSearch || selectedDerivative) && (
              <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 border-t border-border/30 pt-2">
                {selectedSurah !== 'all' && (
                  <button onClick={() => setSelectedSurah('all')} className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground text-xs rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                    سورة {selectedSurah} <span className="opacity-70">✕</span>
                  </button>
                )}
                {selectedJuz !== 'all' && (
                  <button onClick={() => setSelectedJuz('all')} className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground text-xs rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                    الجزء {selectedJuz} <span className="opacity-70">✕</span>
                  </button>
                )}
                {selectedDerivative && (
                  <button onClick={() => setSelectedDerivative(null)} className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground text-xs rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 font-quran">
                    كلمة: {selectedDerivative} <span className="opacity-70">✕</span>
                  </button>
                )}
                {subSearch && (
                  <button onClick={() => setSubSearch('')} className="flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full hover:bg-secondary/80 transition-colors border border-primary/20">
                    بحث: "{subSearch}" <span className="opacity-70">✕</span>
                  </button>
                )}
                <button onClick={() => { setSelectedSurah('all'); setSelectedJuz('all'); setSubSearch(''); setSelectedDerivative(null); }} className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2">
                  مسح الكل
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="grid gap-4">
        {visibleAyahs.length === 0 ? (
          <EmptyState
            message="لا توجد نتائج تطابق الفلاتر المختارة"
            onClear={() => { setSelectedSurah('all'); setSelectedJuz('all'); setSubSearch(''); setSelectedDerivative(null); }}
          />
        ) : (
          <AnimatePresence>
            {visibleAyahs.map((ayah, index) => (
              <VerseCard
                key={ayah.id}
                ayah={ayah}
                index={index}
                onRootClick={handleRootClick}
                mainRoot={searchResults.root}
                subSearch={subSearch}
              />
            ))}
          </AnimatePresence>
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


          {/* Action Buttons: Relocated to Header */}
        </div>
      )}

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};
export default Results;
