// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent } from './test-utils';
import '@testing-library/jest-dom';
import TrackList from '../TrackList';

const mockTrackDetails1 = {
  id: 'track1',
  name: 'Test Track 1',
  artists: [{ name: 'Artist 1' }],
  album: {
    name: 'Album 1',
    images: [{ url: 'https://example.com/image1.jpg', width: 300, height: 300 }],
  },
  uri: 'spotify:track:track1',
};
const mockTrackDetails2 = {
  id: 'track2',
  name: 'Test Track 2',
  artists: [{ name: 'Artist 2' }],
  album: {
    name: 'Album 2',
    images: [{ url: 'https://example.com/image2.jpg', width: 300, height: 300 }],
  },
  uri: 'spotify:track:track2',
};

const mockTracks = [
  {
    track_position: 1,
    track_text: 'This song always reminds me of our road trip to Big Sur!',
    track: mockTrackDetails1,
  },
  {
    track_position: 2,
    track_text: 'You played this for me on our first date. <3',
    track: mockTrackDetails2,
  },
];

describe('TrackList', () => {
  it('shows empty state when no tracks are present', () => {
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={[]} onRemoveTrack={mockOnRemoveTrack} />);
    expect(screen.getByText('No tracks added yet. Search for tracks above to get started!')).toBeInTheDocument();
  });

  it('displays tracks with details', () => {
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={mockTracks} onRemoveTrack={mockOnRemoveTrack} />);
    // Track titles
    expect(screen.getByText('Test Track 1')).toBeInTheDocument();
    expect(screen.getByText('Artist 1')).toBeInTheDocument();
    expect(screen.getByText('Test Track 2')).toBeInTheDocument();
    expect(screen.getByText('Artist 2')).toBeInTheDocument();
    // Track texts (personal messages)
    expect(screen.getByText('This song always reminds me of our road trip to Big Sur!')).toBeInTheDocument();
    expect(screen.getByText('You played this for me on our first date. <3')).toBeInTheDocument();
  });

  it('shows album art when available', () => {
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={mockTracks} onRemoveTrack={mockOnRemoveTrack} />);
    const albumImage = screen.getByAltText('Album 1');
    expect(albumImage).toBeInTheDocument();
    expect(albumImage).toHaveAttribute('src', 'https://example.com/image1.jpg');
  });

  it('shows placeholder when album art is not available', () => {
    const trackWithoutImage = {
      ...mockTrackDetails1,
      album: { name: 'Album 1', images: [] },
    };
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={[{ track_position: 1, track_text: 'A special note for you', track: trackWithoutImage }]} onRemoveTrack={mockOnRemoveTrack} />);
    // There are two 'No Image' elements: one in album art, one possibly in track_text. Use getAllByText.
    expect(screen.getAllByText('No Image').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onRemoveTrack when remove button is clicked', () => {
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={mockTracks} onRemoveTrack={mockOnRemoveTrack} />);
    const removeButtons = screen.getAllByTitle('Remove track');
    fireEvent.click(removeButtons[0]);
    expect(mockOnRemoveTrack).toHaveBeenCalledWith(1);
  });

  it('displays track_text if present', () => {
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={mockTracks} onRemoveTrack={mockOnRemoveTrack} />);
    expect(screen.getByText('This song always reminds me of our road trip to Big Sur!')).toBeInTheDocument();
    expect(screen.getByText('You played this for me on our first date. <3')).toBeInTheDocument();
  });

  it('handles multiple artists correctly', () => {
    const trackWithMultipleArtists = {
      ...mockTrackDetails1,
      artists: [{ name: 'Artist 1' }, { name: 'Artist 2' }],
    };
    const mockOnRemoveTrack = jest.fn();
    render(<TrackList tracks={[{ track_position: 1, track_text: 'A duet for us', track: trackWithMultipleArtists }]} onRemoveTrack={mockOnRemoveTrack} />);
    expect(screen.getByText('Artist 1, Artist 2')).toBeInTheDocument();
  });
}); 