'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { debounce } from 'lodash';
import { useAuthenticatedRequest } from '../hooks/useAuthenticatedRequest';
import { formatRelativeTime } from '../util/time';

export default function MyMixtapesPage() {
  // --- Local state management for search & pagination
  const [query, setQuery] = useState('');
  const [mixtapes, setMixtapes] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const LIMIT = 10;
  const [offset, setOffset] = useState(0);

  const { makeRequest } = useAuthenticatedRequest();

  // Keep refs for debouncing and aborting
  const abortControllerRef = useRef<AbortController | null>(null);
  const debouncedFetchRef = useRef<ReturnType<typeof debounce> | null>(null);

  // Helper to build URL based on current state
  const buildUrl = (q: string, off: number) => {
    const params: Record<string, string> = { limit: String(LIMIT), offset: String(off) };
    if (q.trim()) params.q = q.trim();
    return `/api/mixtape?${new URLSearchParams(params).toString()}`;
  };

  const fetchMixtapes = async (q: string, off: number, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await makeRequest<any[]>(buildUrl(q, off), { signal });
      setMixtapes(data);
    } catch (err: any) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Ignore aborted requests
        return;
      }
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Handle search queries with debounce (including initial load)
  useEffect(() => {
    // Reset offset when search term changes
    setOffset(0);
    
    // Cancel previous debounce if any
    if (debouncedFetchRef.current) debouncedFetchRef.current.cancel();

    // Cancel any ongoing request
    if (abortControllerRef.current) abortControllerRef.current.abort();

    // For initial load (query is empty and no data loaded yet), make immediate request
    if (query === '' && mixtapes === null) {
      abortControllerRef.current = new AbortController();
      fetchMixtapes(query, 0, abortControllerRef.current.signal);
    } else {
      // For subsequent searches, set loading immediately and use debounce
      if (mixtapes && mixtapes.length > 0) {
        setLoading(true);
      }
      
      debouncedFetchRef.current = debounce(() => {
        abortControllerRef.current = new AbortController();
        fetchMixtapes(query, 0, abortControllerRef.current.signal);
      }, 1000);

      debouncedFetchRef.current();
    }

    return () => {
      if (debouncedFetchRef.current) debouncedFetchRef.current.cancel();
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Handle pagination
  useEffect(() => {
    // Skip if offset is 0 and query is empty (initial state)
    if (offset === 0 && query === '' && mixtapes === null) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    fetchMixtapes(query, offset, abortControllerRef.current.signal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 relative">
      <h1 className="text-3xl font-bold mb-6 text-center">My Mixtapes</h1>
      
      {/* Floating Loading Indicator */}
      {loading && mixtapes && mixtapes.length > 0 && (
        <div 
          className="absolute top-2 right-2 text-xs sm:text-sm flex items-center px-2 sm:px-3 py-1 sm:py-2 rounded-lg shadow-sm border z-10 bg-white/90 backdrop-blur-sm text-amber-600 border-amber-200"
          data-testid="loading-indicator"
        >
          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-amber-600 mr-1 sm:mr-2"></div>
          Loading...
        </div>
      )}
      
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search mixtapes..."
          className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-600"
        />
      </div>
      
      {error && <div className="text-center text-red-500">{error}</div>}
      
      {/* Show loading text only on initial load when no data exists */}
      {loading && (!mixtapes || mixtapes.length === 0) && (
        <div className="text-center text-gray-500">Loading...</div>
      )}
      
      {/* Content - always show if we have data, even when loading */}
      {(!loading || mixtapes) && (
        <ul className="space-y-4">
          {(!mixtapes || mixtapes.length === 0) && !loading && (
            <li className="text-center text-gray-500">No mixtapes found.</li>
          )}
          {mixtapes && mixtapes.map((m) => (
            <li key={m.public_id} className="flex items-center justify-between bg-white rounded-lg shadow p-4 hover:bg-gray-50 transition">
              <Link href={`/mixtape/${m.public_id}/edit`} className="text-lg font-semibold text-blue-600 hover:underline">
                {m.name}
              </Link>
              <span
                className="text-sm text-gray-500 ml-4"
                title={new Date(m.last_modified_time).toLocaleString()}
              >
                {formatRelativeTime(m.last_modified_time)}
              </span>
            </li>
          ))}
        </ul>
      )}
      
      {/* Pagination Controls */}
      {!error && mixtapes && mixtapes.length > 0 && (
        <div className="flex justify-between mt-8">
          <button
            className="px-4 py-2 rounded bg-amber-600 text-white disabled:opacity-50"
            disabled={offset === 0 || loading}
            onClick={() => setOffset(Math.max(0, offset - LIMIT))}
          >
            Previous
          </button>
          <button
            className="px-4 py-2 rounded bg-amber-600 text-white disabled:opacity-50"
            disabled={loading || (mixtapes.length < LIMIT)}
            onClick={() => setOffset(offset + LIMIT)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
} 