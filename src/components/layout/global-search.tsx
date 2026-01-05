'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, FileCheck, User, Loader2 } from 'lucide-react';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleSelect = (result: SearchResult) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    router.push(result.href);
    onNavigate?.();
  };

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
          placeholder="Suchen..."
          className="w-full rounded-xl bg-gray-800/50 border border-gray-700 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 animate-spin" />
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-gray-700 bg-gray-800 shadow-xl overflow-hidden">
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700 transition-colors"
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
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && results.length === 0 && query.length >= 2 && !isLoading && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-gray-700 bg-gray-800 shadow-xl p-4">
          <p className="text-sm text-gray-400 text-center">
            Keine Ergebnisse für "{query}"
          </p>
        </div>
      )}
    </div>
  );
}
