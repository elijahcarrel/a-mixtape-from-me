'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  // Prefetch the edit page route pattern
  useEffect(() => {
    router.prefetch('/mixtape/[publicId]/edit');
  }, [router]);

  const handleCreateMixtape = (e: React.MouseEvent) => {
    e.preventDefault();
    const newMixtapeId = uuidv4();
    router.push(`/mixtape/${newMixtapeId}/edit?create=true`);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Link
        href="/mixtape/placeholder/edit" // Placeholder to trigger prefetch. Actual URL is handled within handleCreateMixtape.
        onClick={handleCreateMixtape}
        className="text-lg hover:underline"
      >
        Create a new mixtape
      </Link>
    </div>
  );
}
