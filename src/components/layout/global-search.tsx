'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, FileCheck, User, Loader2, Command } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'invoice' | 'quote' | 'customer';
  title: string;
  subtitle: string;
  status?: string;
  href: string;
}

interface GlobalSearchProps {
  onNavigate?: () => void;
}

export function GlobalSearch({ onNavigate }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Cmd+K / Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Escape to close and blur
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.results || []);
        setIsOpen(true);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((result: SearchResult) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    router.push(result.href);
    onNavigate?.();
  }, [router, onNavigate]);

  // Navigate results with arrow keys
  const handleKeyNavigation = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  }, [isOpen, results, selectedIndex, handleSelect]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <FileText className="h-4 w-4 text-blue-400" />;
      case 'quote':
        return <FileCheck className="h-4 w-4 text-green-400" />;
      case 'customer':
        return <User className="h-4 w-4 text-purple-400" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'Rechnung';
      case 'quote':
        return 'Angebot';
      case 'customer':
        return 'Kunde';
      default:
        return '';
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyNavigation}
          placeholder="Suchen..."
          className="w-full rounded-xl bg-gray-800/50 border border-gray-700 py-2.5 pl-10 pr-16 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 animate-spin" />
        ) : (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-400 font-mono">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-gray-700 bg-gray-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                index === selectedIndex ? 'bg-gray-700' : 'hover:bg-gray-700/50'
              }`}
            >
              <div className="shrink-0">
                {getIcon(result.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {result.title}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getTypeLabel(result.type)}
                  </span>
                </div>
                {result.subtitle && (
                  <p className="text-xs text-gray-400 truncate">{result.subtitle}</p>
                )}
              </div>
              {index === selectedIndex && (
                <kbd className="hidden sm:inline-flex items-center rounded bg-gray-600 px-1.5 py-0.5 text-[10px] text-gray-300 font-mono">
                  Enter
                </kbd>
              )}
            </button>
          ))}
          {/* Keyboard hints */}
          <div className="hidden sm:flex items-center justify-center gap-4 px-4 py-2 border-t border-gray-700 bg-gray-800/50">
            <span className="flex items-center gap-1 text-[10px] text-gray-500">
              <kbd className="rounded bg-gray-700 px-1 py-0.5 font-mono">↑</kbd>
              <kbd className="rounded bg-gray-700 px-1 py-0.5 font-mono">↓</kbd>
              navigieren
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-500">
              <kbd className="rounded bg-gray-700 px-1.5 py-0.5 font-mono">Enter</kbd>
              öffnen
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-500">
              <kbd className="rounded bg-gray-700 px-1.5 py-0.5 font-mono">Esc</kbd>
              schließen
            </span>
          </div>
        </div>
      )}

      {/* No results message */}
      {isOpen && results.length === 0 && query.length >= 2 && !isLoading && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-gray-700 bg-gray-800 shadow-xl p-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <p className="text-sm text-gray-400 text-center">
            Keine Ergebnisse für "{query}"
          </p>
        </div>
      )}
    </div>
  );
}
