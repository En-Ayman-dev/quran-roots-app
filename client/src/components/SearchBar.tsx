import React, { useState } from 'react';
import { useQuran } from '@/contexts/QuranContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps {
  size?: 'small' | 'medium' | 'large';
  showRecent?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ size = 'large', showRecent = true }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { searchByRoot, suggestRoots, recentSearches, removeRecentSearch, loading } = useQuran();

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    if (val.trim().length >= 2) {
      const found = await suggestRoots(val);
      setSuggestions(found);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setShowSuggestions(false);
      await searchByRoot(inputValue.trim());
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    await searchByRoot(suggestion);
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
              className={`${sizeClasses[size]} text-right dir-rtl shadow-sm focus:ring-2 focus:ring-primary/20 transition-all`}
              dir="rtl"
              disabled={loading}
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
                      className="w-full text-right px-4 py-2 hover:bg-muted/50 rounded-lg text-sm transition-colors flex items-center justify-between group"
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

        {showRecent && recentSearches.length > 0 && !showSuggestions && (
          <div className="space-y-2 animate-in fade-in">
            <p className="text-sm text-muted-foreground text-right">عمليات البحث الأخيرة:</p>
            <div className="flex flex-wrap gap-2 justify-end">
              {recentSearches.slice(0, 5).map((search, index) => (
                <div
                  key={index}
                  className="flex items-center bg-secondary/50 rounded-full pl-1 pr-3 py-1 border border-transparent hover:border-primary/20 transition-all group"
                >
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick(search)}
                    className="text-secondary-foreground hover:text-primary transition-colors text-sm"
                  >
                    {search}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeRecentSearch(search); }}
                    className="ml-2 p-0.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="حذف"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;
