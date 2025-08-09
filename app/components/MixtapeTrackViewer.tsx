import React from 'react';
import CassetteSVG from './CassetteSVG';
import { MixtapeResponse, MixtapeTrackResponse } from '../client';
import EditButton from './EditButton';
import SpotifyPlayer from './SpotifyPlayer';

interface MixtapeTrackViewerProps {
  mixtape: MixtapeResponse;
  track: MixtapeTrackResponse;
  trackNumber: number;
  onPrevTrack?: () => void;
  onNextTrack?: () => void;
}

export default function MixtapeTrackViewer({ mixtape, track, trackNumber, onPrevTrack, onNextTrack }: MixtapeTrackViewerProps) {
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);

  // Prepare label text for the cassette
  const labelText = {
    line1: mixtape.name,
    line2: `Track ${trackNumber} of ${mixtape.tracks.length}`,
    line3: track.track.name,
    line4: track.track.artists.map(a => a.name).join(', '),
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden pb-40">
      <EditButton mixtape={mixtape} />
      {/* Grain overlay */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P4//8/AwAI/AL+Qn6nAAAAAElFTkSuQmCC")', opacity: 0.18, mixBlendMode: 'multiply'}} />
      <div className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl px-4 pt-8 flex flex-col items-center">
        <CassetteSVG isAnimated={isPlaying} labelText={labelText} />
        {track.track_text && (
          <div className="w-full bg-amber-100/70 dark:bg-amber-900/40 rounded-lg p-4 mb-6 text-amber-900 dark:text-amber-100 text-base shadow-inner whitespace-pre-line" style={{textShadow: '0 1px 0 #fff8, 0 2px 8px #bfa76a22'}}>
            {track.track_text}
          </div>
        )}
        <div className="flex w-full justify-between mt-2 mb-4">
          <button
            onClick={onPrevTrack}
            disabled={!onPrevTrack}
            className="px-4 py-2 rounded-lg font-medium bg-amber-700 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-800 transition-all"
          >
            Prev
          </button>
          <button
            onClick={onNextTrack}
            disabled={!onNextTrack}
            className="px-4 py-2 rounded-lg font-medium bg-amber-700 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-800 transition-all"
          >
            Next
          </button>
        </div>
      </div>
      {/* Spotify embed at the bottom */}
      <div className="fixed bottom-0 left-0 w-full z-20 flex justify-center bg-linear-to-t from-amber-100/90 dark:from-amber-950/90 to-transparent pb-2">
        <SpotifyPlayer
          uri={track.track.uri}
          onIsPlayingChange={setIsPlaying}
          height={152}
          width="100%"
        />
      </div>
    </div>
  );
} 