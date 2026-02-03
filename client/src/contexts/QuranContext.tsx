import React, { createContext, useContext, useState, useCallback } from 'react';

interface Token {
  pos: number;
  token: string;
  token_uthmani?: string;
  root: string;
}

interface Ayah {
  id: string;
  surahNo: number;
  ayahNo: number;
  surahName: string;
  text: string;
  rootCount: number;
  tokens: Token[];
  otherRoots: string[];
  page: number;
  juz: number;
  highlightedText?: string;
}

interface SearchResult {
  root: string;
  ayahs: Ayah[];
  totalOccurrences: number;
}

interface Statistics {
  totalOccurrences: number;
  totalAyahs: number;
  uniqueSurahs: number;
  surahDistribution: Record<string, number>;
  topAccompanyingRoots: [string, number][];
  juzDistribution: Record<string, number>;
  pageDistribution: Record<string, number>;
  averageOccurrencesPerAyah: string;
  // New Enhanced Fields
  forms: { form: string; count: number }[];
  timeline: { order: number; surahNo?: number; surah: string; count: number }[];
  era: { meccan: number; medinan: number };
  network: {
    nodes: { id: string; group: number; radius: number }[];
    links: { source: string; target: string; value: number }[];
  };
  matrix: { x: string; y: string; value: number }[];
}

interface QuranContextType {
  searchResults: SearchResult | null;
  statistics: Statistics | null;
  loading: boolean;
  error: string | null;
  recentSearches: string[];
  searchByRoot: (root: string) => Promise<void>;
  suggestRoots: (query: string) => Promise<string[]>;
  removeRecentSearch: (root: string) => void;
  clearResults: () => void;
  clearError: () => void;
}

const QuranContext = createContext<QuranContextType | undefined>(undefined);

export const QuranProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });

  const suggestRoots = useCallback(async (query: string): Promise<string[]> => {
    if (!query || query.trim().length < 2) return [];
    try {
      const res = await fetch(`http://localhost:3002/api/search/suggest?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (e) {
      console.error('Suggestion fetch error', e);
      return [];
    }
  }, []);

  const searchByRoot = useCallback(async (root: string) => {
    if (!root.trim()) {
      setError('الرجاء إدخال جذر صحيح');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch results from backend
      const resultsResponse = await fetch(`http://localhost:3002/api/search/root/${encodeURIComponent(root.trim())}`);

      if (!resultsResponse.ok) {
        if (resultsResponse.status === 404) {
          setSearchResults({ root: root.trim(), ayahs: [], totalOccurrences: 0 });
          setStatistics(null);
          return;
        }
        throw new Error('فشل الاتصال بالخادم');
      }

      const resultsData = await resultsResponse.json();
      setSearchResults(resultsData);

      // Fetch statistics
      try {
        const statsResponse = await fetch(`http://localhost:3002/api/search/statistics/${encodeURIComponent(root.trim())}`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStatistics(statsData.statistics);
        }
      } catch (statsErr) {
        console.error('Failed to fetch statistics:', statsErr);
        // Don't fail the whole search if stats fail
      }

      // Update recent searches
      const updated = [root, ...recentSearches.filter(s => s !== root)].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (err) {
      console.error('Search error:', err);
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في البحث';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [recentSearches]);

  const removeRecentSearch = useCallback((rootToRemove: string) => {
    const updated = recentSearches.filter(s => s !== rootToRemove);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }, [recentSearches]);

  const clearResults = useCallback(() => {
    setSearchResults(null);
    setStatistics(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <QuranContext.Provider
      value={{
        searchResults,
        statistics,
        loading,
        error,
        recentSearches,
        searchByRoot,
        suggestRoots,
        removeRecentSearch,
        clearResults,
        clearError,
      }}
    >
      {children}
    </QuranContext.Provider>
  );
};

export const useQuran = (): QuranContextType => {
  const context = useContext(QuranContext);
  if (context === undefined) {
    throw new Error('useQuran must be used within a QuranProvider');
  }
  return context;
};
