'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useApiRequest } from '../../hooks/useApiRequest';
import MixtapeEditor from '../../components/MixtapeEditor';
import LoadingDisplay from '../../components/LoadingDisplay';
import ErrorDisplay from '../../components/ErrorDisplay';

interface Track {
  track_position: number;
  track_text?: string;
  spotify_uri: string;
}

interface MixtapeData {
  public_id: string;
  name: string;
  intro_text?: string;
  is_public: boolean;
  create_time: string;
  last_modified_time: string;
  tracks: Track[];
}

export default function MixtapePage() {
  const params = useParams();
  const publicId = params.publicId as string;

  const { data: mixtape, loading, error, refetch } = useApiRequest<MixtapeData>({
    url: `/api/main/mixtape/${publicId}`,
    method: 'GET',
    requireAuth: true
  });

  if (loading) {
    return <LoadingDisplay message="Loading mixtape..." />;
  }

  if (error) {
    return (
      <div className="main-container">
        <div className="content-pane">
          <ErrorDisplay message={error} />
          <div className="text-center mt-4">
            <button 
              onClick={refetch} 
              className="bg-amber-800 text-white px-4 py-2 rounded hover:bg-amber-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!mixtape) {
    return <ErrorDisplay message="Mixtape not found" />;
  }

  return (
    <div className="main-container">
      <div className="content-pane">
        <MixtapeEditor mixtape={mixtape} />
      </div>
    </div>
  );
} 