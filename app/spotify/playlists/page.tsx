"use client";
import React from "react";
import { useApiRequest } from "../../hooks/useApiRequest";
import LoadingDisplay from "../../components/LoadingDisplay";
import ErrorDisplay from "../../components/ErrorDisplay";
import CenteredPane from '../../components/layout/CenteredPane';

interface PlaylistItem {
  name: string;
  tracks: {
    total: number;
  };
}

interface PlaylistsResponse {
  items: PlaylistItem[];
}

export default function SpotifyPlaylists() {
  const { data: playlists, loading, error } = useApiRequest<PlaylistsResponse>({
    url: "/api/main/spotify/playlists"
  });

  if (loading) {
    return <LoadingDisplay message="Loading your Spotify playlists..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} showLoginLink={true} />;
  }

  return (
    <CenteredPane>
      <h1 className="text-2xl font-bold mb-4">Your Spotify Playlists</h1>
      {playlists?.items && (
        <ul className="mb-4">
          {playlists.items.map((item: PlaylistItem, index: number) => (
            <li key={index} className="text-gray-600">
              {item.name} ({item.tracks.total} tracks)
            </li>
          ))}
        </ul>
      )}
    </CenteredPane>
  );
} 