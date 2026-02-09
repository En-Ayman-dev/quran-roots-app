import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import { AppError, NetworkError, ServerError, AuthenticationError, NotFoundError } from '../lib/errors';

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
  error: AppError | null; // Changed to typed Error
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
  const [error, setError] = useState<AppError | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });

  // Static Index State
  const [wordIndex, setWordIndex] = useState<{ roots: string[]; words: Record<string, string> } | null>(null);

  // Load Static Index on Mount from Secure Endpoint
  React.useEffect(() => {
    apiClient.get<{ roots: string[]; words: Record<string, string> }>('resources/word-index')
      .then(data => {
        setWordIndex(data);
        if (import.meta.env.DEV) {
          console.log("✅ Word Index Loaded Securely:", data.roots.length, "roots");
        }
      })
      .catch(err => console.error("❌ Failed to load word index:", err));
  }, []);

  const suggestRoots = useCallback(async (query: string): Promise<string[]> => {
    if (!query || query.trim().length < 2) return [];

    // Use Static Index if available
    if (wordIndex) {
      const term = query.trim().toLowerCase(); // Normalize input if needed, Arabic usually doesn't need toLowerCase but good practice
      // Remove diacritics from term for matching if user typed them
      const cleanTerm = term.replace(/[\u064B-\u065F\u0670\u0640]/g, "");

      const distinctRoots = new Set<string>();

      // 1. Direct Root Match (Startswith)
      wordIndex.roots.forEach(root => {
        if (root.startsWith(cleanTerm)) {
          distinctRoots.add(root);
        }
      });

      // 2. Word Match (Startswith) -> Map to Root
      // Iterate over words? That's big (15k+). 
      // Filter keys? 
      // Optimized: Loop through words, limit results.
      let matchCount = 0;
      for (const [word, root] of Object.entries(wordIndex.words)) {
        if (distinctRoots.size >= 10) break; // Limit suggestions

        if (word.startsWith(cleanTerm)) {
          distinctRoots.add(root);
          matchCount++;
        }
      }

      return Array.from(distinctRoots).slice(0, 10);
    }

    // Fallback to API if index not loaded yet
    try {
      return await apiClient.get<string[]>(`search/suggest?q=${encodeURIComponent(query.trim())}`);
    } catch (e) {
      console.error('Suggestion fetch error', e);
      return [];
    }
  }, [wordIndex]);

  const searchByRoot = useCallback(async (root: string) => {
    if (!root.trim()) {
      setError(new AppError('الرجاء إدخال جذر صحيح'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch results from backend
      const resultsData = await apiClient.get<SearchResult>(`search/root/${encodeURIComponent(root.trim())}`);
      setSearchResults(resultsData);

      // Fetch statistics
      try {
        const statsData = await apiClient.get<{ statistics: Statistics }>(`search/statistics/${encodeURIComponent(root.trim())}`);
        setStatistics(statsData.statistics);
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

      if (err instanceof NotFoundError) {
        setSearchResults({ root: root.trim(), ayahs: [], totalOccurrences: 0 });
        setStatistics(null);
        return;
      }

      if (err instanceof AppError) {
        setError(err);
      } else {
        setError(new AppError(err instanceof Error ? err.message : 'حدث خطأ في البحث'));
      }
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

