'use client';

import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const router = useRouter();

  const handleCreateMixtape = () => {
    const newMixtapeId = uuidv4();
    router.push(`/mixtape/${newMixtapeId}/edit?create=true`);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleCreateMixtape}
        className="text-lg hover:underline cursor-pointer"
      >
        Create a new mixtape
      </button>
    </div>
  );
}
