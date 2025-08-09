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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const LIMIT = 10;
  const [offset, setOffset] = useState(0);

  const { makeRequest } = useAuthenticatedRequest();

  // Keep refs for debouncing and aborting
  const abortControllerRef = useRef<AbortController | null>(null);
  const debouncedFetchRef = useRef<ReturnType<typeof debounce> | null>(null);
  const hasInitialFetchRef = useRef(false);

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

  // Initial fetch on mount
  useEffect(() => {
    if (!hasInitialFetchRef.current) {
      hasInitialFetchRef.current = true;
      fetchMixtapes('', 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle search queries with debounce
  useEffect(() => {
    // Skip initial render when query is empty
    if (query === '' || !hasInitialFetchRef.current) return;

    // Reset offset when search term changes
    setOffset(0);
    
    // Cancel previous debounce if any
    if (debouncedFetchRef.current) debouncedFetchRef.current.cancel();

    // Cancel any ongoing request
    if (abortControllerRef.current) abortControllerRef.current.abort();

    debouncedFetchRef.current = debounce(() => {
      abortControllerRef.current = new AbortController();
      fetchMixtapes(query, 0, abortControllerRef.current.signal);
    }, 1000);

    debouncedFetchRef.current();

    return () => {
      if (debouncedFetchRef.current) debouncedFetchRef.current.cancel();
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Handle pagination
  useEffect(() => {
    // Skip if this is the initial load
    if (!hasInitialFetchRef.current) return;

    // Skip if offset is 0 and query is empty and we haven't loaded any data yet (initial state)
    if (offset === 0 && query === '' && mixtapes === null) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    fetchMixtapes(query, offset, abortControllerRef.current.signal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">My Mixtapes</h1>
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
      {loading && <div className="text-center text-gray-500">Loading...</div>}
      {error && <div className="text-center text-red-500">{error}</div>}
      {!loading && !error && (
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
      {!loading && !error && mixtapes && mixtapes.length > 0 && (
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