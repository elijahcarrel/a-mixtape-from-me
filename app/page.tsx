'use client';

import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { useMemo } from 'react';

export default function Home() {
  // Generate a new UUID for the mixtape
  const newMixtapeId = useMemo(() => uuidv4(), []);

  return (
    <div className="flex flex-col items-center gap-4">
      <Link
        href={`/mixtape/${newMixtapeId}/edit?create=true`}
        className="text-lg hover:underline"
      >
        Create a new mixtape
      </Link>
    </div>
  );
}
