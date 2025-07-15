'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useApiRequest } from '../../hooks/useApiRequest';
import MixtapeEditor from '../../components/MixtapeEditor';
import LoadingDisplay from '../../components/LoadingDisplay';
import ErrorDisplay from '../../components/ErrorDisplay';
import MainContainer from '../../components/layout/MainContainer';
import ContentPane from '../../components/layout/ContentPane';

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
  stack_auth_user_id?: string;
}

export default function MixtapePage() {
  const params = useParams();
  const publicId = params.publicId as string;

  const { data: mixtape, loading, error, refetch } = useApiRequest<MixtapeData>({
    url: `/api/main/mixtape/${publicId}`,
    method: 'GET',
  });

  if (loading) {
    return <LoadingDisplay message="Loading mixtape..." />;
  }

  if (error) {
    return (
      <MainContainer>
        <ContentPane>
          <ErrorDisplay message={error} />
          <div className="text-center mt-4">
            <button 
              onClick={refetch} 
              className="bg-amber-800 text-white px-4 py-2 rounded hover:bg-amber-700"
            >
              Try Again
            </button>
          </div>
        </ContentPane>
      </MainContainer>
    );
  }

  if (!mixtape) {
    return <ErrorDisplay message="Mixtape not found" />;
  }

  return (
    <MainContainer>
      <ContentPane>
        <MixtapeEditor mixtape={mixtape} onMixtapeClaimed={refetch} />
      </ContentPane>
    </MainContainer>
  );
} 