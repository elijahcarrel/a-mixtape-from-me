'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthenticatedRequest } from '../hooks/useAuthenticatedRequest';
import { debounce } from 'lodash';

interface TrackSearchResult {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; width: number; height: number }>;
  };
  uri: string;
}

interface AutocompleteProps<T> {
  placeholder: string;
  onSelect: (item: T) => void;
  searchFunction: (query: string, signal?: AbortSignal) => Promise<T[]>;
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  getItemKey: (item: T) => string;
}

export function Autocomplete<T>({
  placeholder,
  onSelect,
  searchFunction,
  renderItem,
  getItemKey,
}: AutocompleteProps<T>) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Create debounced search function that updates when searchFunction changes
  const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null);

  useEffect(() => {
    // Cancel any existing debounced function
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current.cancel();
    }

    // Create new debounced function
    debouncedSearchRef.current = debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

      setIsSearching(true);
      try {
        const searchResults = await searchFunction(
          searchQuery,
          abortControllerRef.current.signal
        );
        setResults(searchResults);
        setIsOpen(searchResults.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        // Only handle errors that aren't from cancellation
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Search error:', error);
          setResults([]);
          setIsOpen(false);
        }
      } finally {
        setIsSearching(false);
      }
    }, 1000);

    // Cleanup function
    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cancel();
      }
    };
  }, [searchFunction]);

  useEffect(() => {
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current(query);
    }
    return () => {
      // Cancel any pending request when component unmounts or query changes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target as Node) &&
      inputRef.current &&
      !inputRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-transparent border rounded-lg p-3 focus:outline-none transition-colors duration-200 placeholder-neutral-400 border-amber-300 text-amber-900 focus:border-amber-600 placeholder-amber-500 dark:border-amber-600 dark:text-neutral-100 dark:focus:border-amber-400 dark:placeholder-neutral-400"
      />

      {isSearching && (
        <div
          className="absolute right-3 top-1/2 transform -translate-y-1/2"
          data-testid="loading-spinner"
        >
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600 dark:border-amber-400"></div>
        </div>
      )}

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto bg-amber-50 border-amber-300 dark:bg-neutral-900 dark:border-amber-700"
        >
          {results.map((item, index) => (
            <div
              key={getItemKey(item)}
              className={`cursor-pointer p-3 transition-colors duration-150 hover:bg-amber-100 text-amber-900 dark:hover:bg-neutral-800 dark:text-neutral-100 ${
                index === selectedIndex
                  ? 'bg-amber-200 dark:bg-neutral-700'
                  : ''
              }`}
              onClick={() => handleSelect(item)}
              data-testid={`track-result-${getItemKey(item)}`}
            >
              {renderItem(item, index === selectedIndex)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Track-specific autocomplete component
interface TrackAutocompleteProps {
  onTrackSelect: (spotifyUri: string, trackData: any) => void;
}

export default function TrackAutocomplete({
  onTrackSelect,
}: TrackAutocompleteProps) {
  const { makeRequest } = useAuthenticatedRequest();

  const searchTracks = async (
    query: string,
    signal?: AbortSignal
  ): Promise<TrackSearchResult[]> => {
    try {
      const data = await makeRequest(
        `/api/spotify/search?query=${encodeURIComponent(query)}`,
        {
          signal,
        }
      );
      return data || [];
    } catch (error) {
      console.error('Error searching tracks:', error);
      return [];
    }
  };

  const renderTrackItem = (track: TrackSearchResult, isSelected: boolean) => (
    <div className="flex items-center space-x-2 sm:space-x-3">
      {/* TODO: Use Image instead of img? */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={track.album.images[0]?.url || '/placeholder-album.png'}
        alt={track.album.name}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs sm:text-sm font-medium truncate text-amber-900 dark:text-neutral-100">
          {track.name}
        </div>
        <div className="text-xs truncate text-amber-600 dark:text-neutral-300">
          {track.artists.map(a => a.name).join(', ')}
        </div>
        <div className="text-xs truncate text-amber-500 dark:text-neutral-400">
          {track.album.name}
        </div>
      </div>
    </div>
  );

  const getTrackKey = (track: TrackSearchResult) => track.id;

  return (
    <Autocomplete
      placeholder="Search for tracks..."
      onSelect={track => onTrackSelect(track.uri, track)}
      searchFunction={searchTracks}
      renderItem={renderTrackItem}
      getItemKey={getTrackKey}
    />
  );
}
