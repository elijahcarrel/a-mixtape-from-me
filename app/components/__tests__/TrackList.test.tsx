// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrackList from '../TrackList';

// Mock useAuthenticatedRequest
const mockMakeRequest = jest.fn();
jest.mock('../../hooks/useApiRequest', () => ({
  useAuthenticatedRequest: () => ({
    makeRequest: mockMakeRequest,
  }),
}));

const mockTracks = [
  {
    track_position: 1,
    track_text: 'Test Track 1',
    spotify_uri: 'spotify:track:track1',
  },
  {
    track_position: 2,
    track_text: 'Test Track 2',
    spotify_uri: 'spotify:track:track2',
  },
];

const mockTrackDetails = {
  track1: {
    id: 'track1',
    name: 'Test Track 1',
    artists: [{ name: 'Artist 1' }],
    album: {
      name: 'Album 1',
      images: [{ url: 'https://example.com/image1.jpg', width: 300, height: 300 }],
    },
  },
  track2: {
    id: 'track2',
    name: 'Test Track 2',
    artists: [{ name: 'Artist 2' }],
    album: {
      name: 'Album 2',
      images: [{ url: 'https://example.com/image2.jpg', width: 300, height: 300 }],
    },
  },
};

describe('TrackList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows empty state when no tracks are present', () => {
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={[]} onRemoveTrack={mockOnRemoveTrack} />);
    
    expect(screen.getByText('No tracks added yet. Search for tracks above to get started!')).toBeInTheDocument();
  });

  it('displays tracks with basic information when details are not loaded', () => {
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={mockTracks} onRemoveTrack={mockOnRemoveTrack} />);
    
    expect(screen.getByText('Track 1')).toBeInTheDocument();
    expect(screen.getByText('Track 2')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('fetches track details for tracks without details', async () => {
    mockMakeRequest.mockResolvedValue(mockTrackDetails.track1);
    
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={[mockTracks[0]]} onRemoveTrack={mockOnRemoveTrack} />);
    
    await waitFor(() => {
      expect(mockMakeRequest).toHaveBeenCalledWith('/api/main/spotify/track/track1');
    });
  });

  it('displays track details when loaded', async () => {
    mockMakeRequest.mockResolvedValue(mockTrackDetails.track1);
    
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={[mockTracks[0]]} onRemoveTrack={mockOnRemoveTrack} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Track 1')).toBeInTheDocument();
      expect(screen.getByText('Artist 1')).toBeInTheDocument();
    });
  });

  it('shows loading state for individual tracks', async () => {
    mockMakeRequest.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={[mockTracks[0]]} onRemoveTrack={mockOnRemoveTrack} />);
    
    // Should show loading skeleton
    expect(screen.getByText('Track 1')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('calls onRemoveTrack when remove button is clicked', () => {
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={mockTracks} onRemoveTrack={mockOnRemoveTrack} />);
    
    const removeButtons = screen.getAllByTitle('Remove track');
    fireEvent.click(removeButtons[0]);
    
    expect(mockOnRemoveTrack).toHaveBeenCalledWith(1);
  });

  it('handles track details API errors gracefully', async () => {
    mockMakeRequest.mockRejectedValue(new Error('Failed to fetch track details'));
    
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={[mockTracks[0]]} onRemoveTrack={mockOnRemoveTrack} />);
    
    // Should still show basic track information even if details fail to load
    expect(screen.getByText('Track 1')).toBeInTheDocument();
  });

  it('displays album art when available', async () => {
    mockMakeRequest.mockResolvedValue(mockTrackDetails.track1);
    
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={[mockTracks[0]]} onRemoveTrack={mockOnRemoveTrack} />);
    
    await waitFor(() => {
      const albumImage = screen.getByAltText('Album 1');
      expect(albumImage).toBeInTheDocument();
      expect(albumImage).toHaveAttribute('src', 'https://example.com/image1.jpg');
    });
  });

  it('shows placeholder when album art is not available', async () => {
    const trackWithoutImage = {
      ...mockTrackDetails.track1,
      album: { name: 'Album 1', images: [] },
    };
    mockMakeRequest.mockResolvedValue(trackWithoutImage);
    
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={[mockTracks[0]]} onRemoveTrack={mockOnRemoveTrack} />);
    
    await waitFor(() => {
      expect(screen.getByText('No Image')).toBeInTheDocument();
    });
  });

  it('handles tracks with invalid Spotify URIs', () => {
    const tracksWithInvalidUri = [
      {
        track_position: 1,
        track_text: 'Invalid Track',
        spotify_uri: 'invalid:uri:format',
      },
    ];
    
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={tracksWithInvalidUri} onRemoveTrack={mockOnRemoveTrack} />);
    
    // Should still display the track with basic info
    expect(screen.getByText('Track 1')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Should not make API calls for invalid URIs
    expect(mockMakeRequest).not.toHaveBeenCalled();
  });

  it('prevents duplicate API calls for the same track', async () => {
    mockMakeRequest.mockResolvedValue(mockTrackDetails.track1);
    
    const mockOnRemoveTrack = jest.fn();
    const { rerender } = render(<TrackList tracks={[mockTracks[0]]} onRemoveTrack={mockOnRemoveTrack} />);
    
    // Re-render with the same track
    rerender(<TrackList tracks={[mockTracks[0]]} onRemoveTrack={mockOnRemoveTrack} />);
    
    await waitFor(() => {
      // Should only call the API once
      expect(mockMakeRequest).toHaveBeenCalledTimes(1);
    });
  });

  it('handles multiple artists correctly', async () => {
    const trackWithMultipleArtists = {
      ...mockTrackDetails.track1,
      artists: [{ name: 'Artist 1' }, { name: 'Artist 2' }],
    };
    mockMakeRequest.mockResolvedValue(trackWithMultipleArtists);
    
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={[mockTracks[0]]} onRemoveTrack={mockOnRemoveTrack} />);
    
    await waitFor(() => {
      expect(screen.getByText('Artist 1, Artist 2')).toBeInTheDocument();
    });
  });

  it('updates track positions correctly when tracks are reordered', () => {
    const mockOnRemoveTrack = jest.fn();
    const { rerender } = render(<TrackList tracks={mockTracks} onRemoveTrack={mockOnRemoveTrack} />);
    
    // Re-render with tracks in different order
    const reorderedTracks = [
      { track_position: 1, track_text: 'Track 2', spotify_uri: 'spotify:track:track2' },
      { track_position: 2, track_text: 'Track 1', spotify_uri: 'spotify:track:track1' },
    ];
    
    rerender(<TrackList tracks={reorderedTracks} onRemoveTrack={mockOnRemoveTrack} />);
    
    expect(screen.getByText('Track 1')).toBeInTheDocument();
    expect(screen.getByText('Track 2')).toBeInTheDocument();
  });
}); 