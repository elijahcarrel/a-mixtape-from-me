'use client';

import { MixtapeTrackRequest, MixtapeTrackResponse } from '../client';
import { useTheme } from './ThemeProvider';
import { useState } from 'react';

interface TrackListProps {
  tracks: MixtapeTrackResponse[];
  onRemoveTrack: (position: number) => void;
  onEditTrackText?: (position: number, newText: string) => void;
}

export default function TrackList({ tracks, onRemoveTrack, onEditTrackText }: TrackListProps) {
  const { theme } = useTheme();
  const [editingTrack, setEditingTrack] = useState<number | null>(null);
  const [draftText, setDraftText] = useState<string>('');

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
        const isEditing = editingTrack === track.track_position;
        const preview = track.track_text
          ? track.track_text.length > 80
            ? track.track_text.slice(0, 80) + '...'
            : track.track_text
          : '';
        return (
          <div
            key={track.track_position}
            className={`flex items-start space-x-4 p-4 border rounded-lg hover:transition-colors duration-200 ${
              theme === 'dark'
                ? 'bg-neutral-900 border-amber-700 hover:bg-neutral-800'
                : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
            }`}
            data-testid={`track-${track.track_position}`}
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
              {/* Track Text Editor */}
              {isEditing ? (
                <div className="mt-2">
                  <textarea
                    className={`w-full p-2 rounded border resize-y focus:outline-none transition-colors duration-200 ${
                      theme === 'dark'
                        ? 'border-amber-700 bg-neutral-900 text-neutral-100 focus:border-amber-400'
                        : 'border-amber-300 bg-white text-neutral-900 focus:border-amber-600'
                    }`}
                    rows={5}
                    value={draftText}
                    onChange={e => setDraftText(e.target.value)}
                    data-testid={`track-textarea-${track.track_position}`}
                  />
                  <div className="flex space-x-2 mt-1">
                    <button
                      className={`px-3 py-1 rounded font-medium text-xs transition-colors duration-200 border ${
                        theme === 'dark'
                          ? 'bg-amber-700 text-white hover:bg-amber-600 border-amber-800'
                          : 'bg-amber-600 text-white hover:bg-amber-700 border-amber-700'
                      }`}
                      style={{ boxShadow: theme === 'dark' ? '0 0 0 1.5px #a16207' : '0 0 0 1.5px #b45309' }}
                      onClick={() => {
                        onEditTrackText?.(track.track_position, draftText);
                        setEditingTrack(null);
                      }}
                      data-testid={`save-track-text-${track.track_position}`}
                    >
                      Save
                    </button>
                    <button
                      className={`px-3 py-1 rounded font-medium text-xs border transition-colors duration-200 ${
                        theme === 'dark'
                          ? 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border-neutral-700'
                          : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 border-neutral-400'
                      }`}
                      style={{ boxShadow: theme === 'dark' ? '0 0 0 1.5px #404040' : '0 0 0 1.5px #a3a3a3' }}
                      onClick={() => setEditingTrack(null)}
                      data-testid={`cancel-track-text-${track.track_position}`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {track.track_text ? (
                      <span className={`text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-amber-700'}`}>{preview}</span>
                    ) : (
                      <span className="text-xs italic text-neutral-400">No note</span>
                    )}
                  </div>
                  <button
                    className={`text-xs underline flex-shrink-0 ml-2 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`}
                    onClick={() => {
                      setEditingTrack(track.track_position);
                      setDraftText(track.track_text || '');
                    }}
                    data-testid={`edit-track-text-${track.track_position}`}
                  >
                    {track.track_text ? 'Edit note' : 'Add note'}
                  </button>
                </div>
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