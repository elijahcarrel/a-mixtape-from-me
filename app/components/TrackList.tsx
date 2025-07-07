'use client';

import { useState, useEffect } from 'react';
import { useAuthenticatedRequest } from '../hooks/useApiRequest';

interface Track {
  track_position: number;
  track_text?: string;
  spotify_uri: string;
}

interface TrackDetails {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; width: number; height: number }>;
  };
}

interface TrackListProps {
  tracks: Track[];
  onRemoveTrack: (position: number) => void;
}

export default function TrackList({ tracks, onRemoveTrack }: TrackListProps) {
  const [trackDetails, setTrackDetails] = useState<Record<string, TrackDetails>>({});
  const [loadingTracks, setLoadingTracks] = useState<Set<string>>(new Set());
  const { makeRequest } = useAuthenticatedRequest();

  // Extract track IDs from URIs
  const getTrackId = (uri: string) => {
    const match = uri.match(/spotify:track:(.+)/);
    return match ? match[1] : null;
  };

  // Fetch track details for tracks that don't have them yet
  useEffect(() => {
    const fetchTrackDetails = async (trackId: string) => {
      if (trackDetails[trackId] || loadingTracks.has(trackId)) return;

      setLoadingTracks(prev => new Set(prev).add(trackId));
      
      try {
        const details = await makeRequest(`/api/main/spotify/track/${trackId}`);
        setTrackDetails(prev => ({
          ...prev,
          [trackId]: details
        }));
      } catch (error) {
        console.error('Error fetching track details:', error);
      } finally {
        setLoadingTracks(prev => {
          const newSet = new Set(prev);
          newSet.delete(trackId);
          return newSet;
        });
      }
    };

    tracks.forEach(track => {
      const trackId = getTrackId(track.spotify_uri);
      if (trackId && !trackDetails[trackId]) {
        fetchTrackDetails(trackId);
      }
    });
  }, [tracks, trackDetails, loadingTracks]);

  if (tracks.length === 0) {
    return (
      <div className="text-center py-8 text-amber-600">
        <p>No tracks added yet. Search for tracks above to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tracks.map((track) => {
        const trackId = getTrackId(track.spotify_uri);
        const details = trackId ? trackDetails[trackId] : null;
        const isLoading = trackId ? loadingTracks.has(trackId) : false;

        return (
          <div
            key={track.track_position}
            className="flex items-center space-x-4 p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors duration-200"
          >
            {/* Album Art */}
            <div className="flex-shrink-0">
              {isLoading ? (
                <div className="w-16 h-16 bg-amber-200 rounded animate-pulse"></div>
              ) : details?.album.images[0] ? (
                <img
                  src={details.album.images[0].url}
                  alt={details.album.name}
                  className="w-16 h-16 rounded object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-amber-200 rounded flex items-center justify-center">
                  <span className="text-amber-600 text-xs">No Image</span>
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-amber-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-amber-200 rounded animate-pulse w-2/3"></div>
                </div>
              ) : details ? (
                <>
                  <div className="text-lg font-medium text-amber-900 truncate">
                    {details.name}
                  </div>
                  <div className="text-sm text-amber-600 truncate">
                    {details.artists.map(a => a.name).join(', ')}
                  </div>
                </>
              ) : (
                <div className="text-amber-600">
                  <div className="text-lg font-medium">Track {track.track_position}</div>
                  <div className="text-sm">Loading...</div>
                </div>
              )}
            </div>

            {/* Delete Button */}
            <button
              onClick={() => onRemoveTrack(track.track_position)}
              className="flex-shrink-0 p-2 text-amber-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
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