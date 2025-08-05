'use client';

import { useParams } from 'next/navigation';
import { useApiRequest } from '../../hooks/useApiRequest';
import LoadingDisplay from '../../components/LoadingDisplay';
import ErrorDisplay from '../../components/ErrorDisplay';
import MainContainer from '../../components/layout/MainContainer';
import ContentPane from '../../components/layout/ContentPane';
import MixtapeViewer from '../../components/MixtapeViewer';
import { MixtapeResponse } from '../../client';

export default function ViewMixtapePage() {
  const params = useParams();
  const publicId = params.publicId as string;

  const { data: mixtape, loading, error, refetch } = useApiRequest<MixtapeResponse>({
    url: `/api/mixtape/${publicId}`,
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
        <MixtapeViewer mixtape={mixtape} />
      </ContentPane>
    </MainContainer>
  );
} 