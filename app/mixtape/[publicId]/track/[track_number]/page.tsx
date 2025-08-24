'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMixtape } from '../../../MixtapeContext';
import ErrorDisplay from '../../../../components/ErrorDisplay';
import MixtapeTrackViewer from '../../../../components/MixtapeTrackViewer';

export default function MixtapeTrackPage() {
  const params = useParams();
  const router = useRouter();
  const publicId = params.publicId as string;
  const trackNumber = parseInt(params.track_number as string, 10);

  const { mixtape } = useMixtape();

  if (!mixtape.tracks || !mixtape.tracks[trackNumber - 1]) {
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
      onNextTrack={
        trackNumber < mixtape.tracks.length ? handleNextTrack : undefined
      }
    />
  );
}
