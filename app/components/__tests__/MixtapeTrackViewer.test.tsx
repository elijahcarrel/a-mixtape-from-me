import React from 'react';
import { render, screen, fireEvent } from './test-utils';
import '@testing-library/jest-dom';
import MixtapeTrackViewer from '../MixtapeTrackViewer';
import { MixtapeResponse, TrackDetails } from '@/app/client';

const mockTrackDetails1: TrackDetails = {
  id: 'track111',
  name: 'Mock Song One',
  artists: [{ name: 'Mock Artist' }],
  album: {
    name: 'Mock Album',
    images: [{ url: 'https://example.com/mock1.jpg', width: 300, height: 300 }],
  },
  uri: 'spotify:track:111',
};
const mockTrackDetails2: TrackDetails = {
  id: 'track222',
  name: 'Another Track',
  artists: [{ name: 'Another Artist' }],
  album: {
    name: 'Another Album',
    images: [{ url: 'https://example.com/mock2.jpg', width: 300, height: 300 }],
  },
  uri: 'spotify:track:222',
};

const mockMixtape: MixtapeResponse = {
  public_id: 'test-mixtape-123',
  name: 'Test Mixtape',
  intro_text: 'A test mixtape',
  subtitle1: 'Subtitle 1',
  subtitle2: 'Subtitle 2',
  subtitle3: 'Subtitle 3',
  is_public: true,
  create_time: '2023-01-01T00:00:00Z',
  last_modified_time: '2023-01-01T00:00:00Z',
  stack_auth_user_id: 'user123',
  tracks: [
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
  ],
  can_undo: true,
  can_redo: false,
};

jest.mock('../EditButton', () => {
  const mockReact = require('react');
  return function MockEditButton() {
    return (
      <div data-testid="mock-edit-button" />
    );
  };
});

// Mock SpotifyPlayer to avoid loading external script during tests
jest.mock('../SpotifyPlayer', () => {
  const mockReact = require('react');
  return function MockSpotifyPlayer(props: { uri: string; onTrackEnd?: () => void }) {
    // invoke onTrackEnd immediately for test when supplied
    mockReact.useEffect(() => {
      props.onTrackEnd?.();
    }, []);
    return <div data-testid="mock-spotify-player" data-track-uri={props.uri} />;
  };
});

describe('MixtapeTrackViewer', () => {
  it('renders mixtape and track info', () => {
    render(
      <MixtapeTrackViewer
        mixtape={mockMixtape}
        track={mockMixtape.tracks[0]}
        trackNumber={1}
      />
    );
    expect(screen.getByText('Test Mixtape')).toBeInTheDocument();
    expect(screen.getByText('Track 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Mock Song One')).toBeInTheDocument();
    expect(screen.getByText('Mock Artist')).toBeInTheDocument();
    expect(screen.getByText('This song always reminds me of our road trip to Big Sur!')).toBeInTheDocument();
  });

  it('shows Prev and Next buttons and calls handlers', () => {
    const onPrev = jest.fn();
    const onNext = jest.fn();
    render(
      <MixtapeTrackViewer
        mixtape={mockMixtape}
        track={mockMixtape.tracks[0]}
        trackNumber={1}
        onPrevTrack={onPrev}
        onNextTrack={onNext}
      />
    );
    const prevBtn = screen.getByText('Prev');
    const nextBtn = screen.getByText('Next');
    expect(prevBtn).toBeInTheDocument();
    expect(nextBtn).toBeInTheDocument();
    fireEvent.click(nextBtn);
    expect(onNext).toHaveBeenCalled();
    fireEvent.click(prevBtn);
    expect(onPrev).toHaveBeenCalled();
  });

  it('disables Prev/Next buttons if no handler', () => {
    render(
      <MixtapeTrackViewer
        mixtape={mockMixtape}
        track={mockMixtape.tracks[0]}
        trackNumber={1}
      />
    );
    expect(screen.getByText('Prev')).toBeDisabled();
    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('renders the animated cassette SVG', () => {
    render(
      <MixtapeTrackViewer
        mixtape={mockMixtape}
        track={mockMixtape.tracks[0]}
        trackNumber={1}
      />
    );
    // SVG should be present
    expect(screen.getByLabelText('Cassette tape')).toBeInTheDocument();
  });

  it('passes the correct track URI to the SpotifyPlayer', () => {
    render(
      <MixtapeTrackViewer
        mixtape={mockMixtape}
        track={mockMixtape.tracks[1]}
        trackNumber={2}
      />
    );
    const player = screen.getByTestId('mock-spotify-player');
    expect(player).toHaveAttribute('data-track-uri', 'spotify:track:222');
  });

  it('calls onNextTrack when track ends', () => {
    const onNext = jest.fn();
    render(
      <MixtapeTrackViewer
        mixtape={mockMixtape}
        track={mockMixtape.tracks[0]}
        trackNumber={1}
        onNextTrack={onNext}
      />
    );

    expect(onNext).toHaveBeenCalled();
  });

  it('renders the EditButton', () => {
    render(
      <MixtapeTrackViewer
        mixtape={mockMixtape}
        track={mockMixtape.tracks[0]}
        trackNumber={1}
      />
    );
    expect(screen.getByTestId('mock-edit-button')).toBeInTheDocument();
  });
}); 