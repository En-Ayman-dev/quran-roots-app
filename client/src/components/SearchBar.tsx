import React, { useState, useRef, useEffect } from 'react';
import { useQuran } from '@/contexts/QuranContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps {
  size?: 'small' | 'medium' | 'large';
  onInputChanged?: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ size = 'large', onInputChanged }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { searchByRoot, suggestRoots, recentSearches, removeRecentSearch, loading } = useQuran();

  const debounceRef = useRef<number | null>(null);
  const lastQueryRef = useRef('');

  // Client-side cache for suggestions
  const suggestionsCache = useRef<Map<string, string[]>>(new Map());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (onInputChanged) onInputChanged(val);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (val.trim().length >= 2) {
      // Check cache first
      if (suggestionsCache.current.has(val.trim())) {
        const cached = suggestionsCache.current.get(val.trim()) || [];
        setSuggestions(cached);
        setShowSuggestions(cached.length > 0);
        return;
      }

      // debounce network calls to improve responsiveness
      debounceRef.current = window.setTimeout(async () => {
        lastQueryRef.current = val;
        const found = await suggestRoots(val);

        // Update cache
        if (found && found.length > 0) {
          suggestionsCache.current.set(val.trim(), found);
        }

        // ignore if input changed since request started
        if (lastQueryRef.current === val) {
          setSuggestions(found);
          setShowSuggestions(found.length > 0);
        }
      }, 150); // Reduced debounce slightly for snappier feel
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      // Close suggestions immediately
      setShowSuggestions(false);
      // Invalidate any pending suggestion callbacks
      lastQueryRef.current = '__submitted__';

      if (debounceRef.current) clearTimeout(debounceRef.current);

      await searchByRoot(inputValue.trim());
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInputValue(suggestion);
    if (onInputChanged) onInputChanged(suggestion);
    setShowSuggestions(false);

    // Slight delay to allow UI to update to loading state with the new term
    setTimeout(async () => {
      lastQueryRef.current = '__submitted__';
      await searchByRoot(suggestion);
    }, 0);
  };

  const sizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  return (
    <div className="w-full relative z-50">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => inputValue.length >= 2 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
              placeholder="أدخل الكلمة أو الجذر (مثال: المسلمين، كتب)..."
              className={`${sizeClasses[size]} text-start shadow-sm focus:ring-2 focus:ring-primary/20 transition-all`}
              autoComplete="off"
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1">
                <div className="max-h-60 overflow-y-auto p-1">
                  <p className="text-xs text-muted-foreground px-3 py-2 text-right">الجذور المقترحة:</p>
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-start px-4 py-2 hover:bg-muted/50 rounded-lg text-sm transition-colors flex items-center justify-between group"
                    >
                      <span className="font-bold text-primary">{suggestion}</span>
                      <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">تطبيق بحث</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="gap-2 shadow-sm"
          >
            <Search className="w-4 h-4" />
            {loading ? '...' : 'بحث'}
          </Button>
        </div>

      </form>
    </div>
  );
};

export default SearchBar;
