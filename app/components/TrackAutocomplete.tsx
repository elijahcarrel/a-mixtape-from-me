'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthenticatedRequest } from '../hooks/useApiRequest';
import { debounce } from 'lodash';
import { useTheme } from './ThemeProvider';

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
  searchFunction: (query: string) => Promise<T[]>;
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  getItemKey: (item: T) => string;
}

function Autocomplete<T>({
  placeholder,
  onSelect,
  searchFunction,
  renderItem,
  getItemKey
}: AutocompleteProps<T>) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const debouncedSearch = debounce(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await searchFunction(searchQuery);
      setResults(searchResults);
      setIsOpen(searchResults.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsSearching(false);
    }
  }, 1000);

  useEffect(() => {
    debouncedSearch(query);
    return () => debouncedSearch.cancel();
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
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
        className={`w-full bg-transparent border rounded-lg p-3 focus:outline-none transition-colors duration-200 placeholder-neutral-400 ${
          theme === 'dark'
            ? 'border-amber-600 text-neutral-100 focus:border-amber-400 placeholder-neutral-400'
            : 'border-amber-300 text-amber-900 focus:border-amber-600 placeholder-amber-500'
        }`}
      />
      
      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2" data-testid="loading-spinner">
          <div className={`animate-spin rounded-full h-5 w-5 border-b-2 ${
            theme === 'dark' ? 'border-amber-400' : 'border-amber-600'
          }`}></div>
        </div>
      )}

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
            theme === 'dark'
              ? 'bg-neutral-900 border-amber-700'
              : 'bg-amber-50 border-amber-300'
          }`}
        >
          {results.map((item, index) => (
            <div
              key={getItemKey(item)}
              className={`cursor-pointer p-3 transition-colors duration-150 ${
                theme === 'dark'
                  ? `hover:bg-neutral-800 ${index === selectedIndex ? 'bg-neutral-700' : ''} text-neutral-100`
                  : `hover:bg-amber-100 ${index === selectedIndex ? 'bg-amber-200' : ''} text-amber-900`
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

export default function TrackAutocomplete({ onTrackSelect }: TrackAutocompleteProps) {
  const { makeRequest } = useAuthenticatedRequest();
  const { theme } = useTheme();

  const searchTracks = async (query: string): Promise<TrackSearchResult[]> => {
    try {
      const data = await makeRequest(`/api/spotify/search?query=${encodeURIComponent(query)}`);
      return data || [];
    } catch (error) {
      console.error('Error searching tracks:', error);
      return [];
    }
  };

  const renderTrackItem = (track: TrackSearchResult, isSelected: boolean) => (
    <div className="flex items-center space-x-2 sm:space-x-3">
      <img
        src={track.album.images[0]?.url || '/placeholder-album.png'}
        alt={track.album.name}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className={`text-xs sm:text-sm font-medium truncate ${
          theme === 'dark' ? 'text-neutral-100' : 'text-amber-900'
        }`}>
          {track.name}
        </div>
        <div className={`text-xs truncate ${
          theme === 'dark' ? 'text-neutral-300' : 'text-amber-600'
        }`}>
          {track.artists.map(a => a.name).join(', ')}
        </div>
        <div className={`text-xs truncate ${
          theme === 'dark' ? 'text-neutral-400' : 'text-amber-500'
        }`}>
          {track.album.name}
        </div>
      </div>
    </div>
  );

  const getTrackKey = (track: TrackSearchResult) => track.id;

  return (
    <Autocomplete
      placeholder="Search for tracks..."
      onSelect={(track) => onTrackSelect(track.uri, track)}
      searchFunction={searchTracks}
      renderItem={renderTrackItem}
      getItemKey={getTrackKey}
    />
  );
} 