'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApiRequest } from '../hooks/useApiRequest';

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return date.toLocaleDateString();
}

export default function MyMixtapesPage() {
  const searchParams = useSearchParams();
  const q = searchParams?.get('q') || undefined;
  const limit = searchParams?.get('limit') || undefined;
  const offset = searchParams?.get('offset') || undefined;

  const query: Record<string, string> = {};
  if (q) query.q = q;
  if (limit) query.limit = limit;
  if (offset) query.offset = offset;
  const queryString = Object.keys(query).length > 0 ? '?' + new URLSearchParams(query).toString() : '';

  const { data: mixtapes, loading, error } = useApiRequest<any[]>({
    url: `/api/mixtape/${queryString}`,
  });

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">My Mixtapes</h1>
      {loading && <div className="text-center text-gray-500">Loading...</div>}
      {error && <div className="text-center text-red-500">{error}</div>}
      {!loading && !error && (
        <ul className="space-y-4">
          {(!mixtapes || mixtapes.length === 0) && (
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
    </div>
  );
} 