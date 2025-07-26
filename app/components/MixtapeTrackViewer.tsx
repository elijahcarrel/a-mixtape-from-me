import React from 'react';
import CassetteSVG from './CassetteSVG';
import { MixtapeResponse, MixtapeTrackResponse } from '../client';
import EditButton from './EditButton';

interface MixtapeTrackViewerProps {
  mixtape: MixtapeResponse;
  track: MixtapeTrackResponse;
  trackNumber: number;
  onPrevTrack?: () => void;
  onNextTrack?: () => void;
}

export default function MixtapeTrackViewer({ mixtape, track, trackNumber, onPrevTrack, onNextTrack }: MixtapeTrackViewerProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden pb-40">
      <EditButton mixtape={mixtape} />
      {/* Grain overlay */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P4//8/AwAI/AL+Qn6nAAAAAElFTkSuQmCC")', opacity: 0.18, mixBlendMode: 'multiply'}} />
      <div className="relative z-10 w-full max-w-md px-4 pt-8 flex flex-col items-center">
        <CassetteSVG isAnimated={true} />
        <div className="w-full text-center mb-4">
          <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-1 truncate">{mixtape.name}</h2>
          <div className="text-sm text-amber-700 dark:text-amber-200 mb-2">Track {trackNumber} of {mixtape.tracks.length}</div>
          <div className="text-xl font-semibold text-amber-800 dark:text-amber-100 mb-2 truncate">{track.track.name}</div>
          <div className="text-base text-amber-700 dark:text-amber-200 mb-2 truncate">{track.track.artists.map(a => a.name).join(', ')}</div>
        </div>
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
        <iframe
          data-testid="spotify-embed"
          style={{ borderRadius: 12 }}
          src={`https://open.spotify.com/embed/track/${track.track.uri.replace('spotify:track:', '')}?utm_source=generator`}
          width="100%"
          height="152"
          frameBorder="0"
          allowFullScreen={false}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
} 