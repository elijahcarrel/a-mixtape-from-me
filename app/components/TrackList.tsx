'use client';

import { useTheme } from './ThemeProvider';

interface TrackDetails {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; width: number; height: number }>;
  };
  uri: string;
}

interface Track {
  track_position: number;
  track_text?: string;
  track: TrackDetails;
}

interface TrackListProps {
  tracks: Track[];
  onRemoveTrack: (position: number) => void;
}

export default function TrackList({ tracks, onRemoveTrack }: TrackListProps) {
  const { theme } = useTheme();

  if (tracks.length === 0) {
    return (
      <div className={`text-center py-8 ${
        theme === 'dark' ? 'text-neutral-300' : 'text-amber-600'
      }`}>
        <p>No tracks added yet. Search for tracks above to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tracks.map((track) => {
        const details = track.track;
        return (
          <div
            key={track.track_position}
            className={`flex items-center space-x-4 p-4 border rounded-lg hover:transition-colors duration-200 ${
              theme === 'dark'
                ? 'bg-neutral-900 border-amber-700 hover:bg-neutral-800'
                : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
            }`}
          >
            {/* Album Art */}
            <div className="flex-shrink-0">
              {details.album.images[0] ? (
                <img
                  src={details.album.images[0].url}
                  alt={details.album.name}
                  className="w-16 h-16 rounded object-cover"
                />
              ) : (
                <div className={`w-16 h-16 rounded flex items-center justify-center ${
                  theme === 'dark' ? 'bg-neutral-800' : 'bg-amber-200'
                }`}>
                  <span className={`text-xs ${
                    theme === 'dark' ? 'text-neutral-300' : 'text-amber-600'
                  }`}>No Image</span>
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className={`text-lg font-medium truncate ${
                theme === 'dark' ? 'text-neutral-100' : 'text-amber-900'
              }`}>
                {details.name}
              </div>
              <div className={`text-sm truncate ${
                theme === 'dark' ? 'text-neutral-300' : 'text-amber-600'
              }`}>
                {details.artists.map(a => a.name).join(', ')}
              </div>
              {track.track_text && (
                <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-neutral-400' : 'text-amber-700'}`}>{track.track_text}</div>
              )}
            </div>

            {/* Delete Button */}
            <button
              onClick={() => onRemoveTrack(track.track_position)}
              className={`flex-shrink-0 p-2 rounded-full transition-colors duration-200 ${
                theme === 'dark'
                  ? 'text-amber-400 hover:text-red-400 hover:bg-red-900/20'
                  : 'text-amber-600 hover:text-red-600 hover:bg-red-50'
              }`}
              title="Remove track"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
} 