import React from 'react';
import { render, screen, fireEvent } from './test-utils';
import '@testing-library/jest-dom';
import MixtapeTrackViewer from '../MixtapeTrackViewer';

const mockMixtape = {
  public_id: 'test-mixtape-123',
  name: 'Test Mixtape',
  intro_text: 'A test mixtape',
  is_public: true,
  create_time: '2023-01-01T00:00:00Z',
  last_modified_time: '2023-01-01T00:00:00Z',
  stack_auth_user_id: 'user123',
  tracks: [
    {
      track_position: 1,
      track_text: 'Track 1 notes',
      spotify_uri: 'spotify:track:111',
    },
    {
      track_position: 2,
      track_text: 'Track 2 notes',
      spotify_uri: 'spotify:track:222',
    },
  ],
};

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
    expect(screen.getByText('Track 1 notes')).toBeInTheDocument();
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

  it('renders the Spotify embed with correct URI', () => {
    render(
      <MixtapeTrackViewer
        mixtape={mockMixtape}
        track={mockMixtape.tracks[1]}
        trackNumber={2}
      />
    );
    const iframe = screen.getByTitle('Spotify Embed') || screen.getByRole('iframe');
    expect(iframe).toHaveAttribute(
      'src',
      expect.stringContaining('spotify.com/embed/track/222')
    );
  });
}); 