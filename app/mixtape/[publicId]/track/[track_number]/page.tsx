"use client";

import { useParams, useRouter } from 'next/navigation';
import { useApiRequest } from '../../../../hooks/useApiRequest';
import LoadingDisplay from '../../../../components/LoadingDisplay';
import ErrorDisplay from '../../../../components/ErrorDisplay';
import MainContainer from '../../../../components/layout/MainContainer';
import ContentPane from '../../../../components/layout/ContentPane';
import MixtapeTrackViewer from '../../../../components/MixtapeTrackViewer';

export default function MixtapeTrackPage() {
  const params = useParams();
  const router = useRouter();
  const publicId = params.publicId as string;
  const trackNumber = parseInt(params.track_number as string, 10);

  const { data: mixtape, loading, error, refetch } = useApiRequest({
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

  if (!mixtape || !mixtape.tracks || !mixtape.tracks[trackNumber - 1]) {
    return <ErrorDisplay message="Track not found" />;
  }

  const track = mixtape.tracks[trackNumber - 1];

  const handlePrevTrack = () => {
    if (trackNumber > 1) {
      router.push(`/mixtape/${publicId}/track/${trackNumber - 1}`);
    }
  };
  const handleNextTrack = () => {
    if (trackNumber < mixtape.tracks.length) {
      router.push(`/mixtape/${publicId}/track/${trackNumber + 1}`);
    }
  };

  return (
    <MixtapeTrackViewer
      mixtape={mixtape}
      track={track}
      trackNumber={trackNumber}
      onPrevTrack={trackNumber > 1 ? handlePrevTrack : undefined}
      onNextTrack={trackNumber < mixtape.tracks.length ? handleNextTrack : undefined}
    />
  );
} 