import React from 'react';
import { render, screen } from '@testing-library/react';
import MixtapeTrackViewer from '../MixtapeTrackViewer';
import { MixtapeResponse } from '../../client';

const mockMixtape: MixtapeResponse = {
  public_id: 'test-mixtape-123',
  name: 'Test Mixtape',
  intro_text: 'A test mixtape',
  subtitle1: 'Some subtitle',
  subtitle2: 'Subtitle 2',
  subtitle3: 'Subtitle 3',
  is_public: true,
  create_time: '2023-01-01T00:00:00Z',
  last_modified_time: '2023-01-01T00:00:00Z',
  stack_auth_user_id: 'user123',
  tracks: [
    {
      track_position: 1,
      track_text: 'Test track note',
      track: {
        id: 'track-1',
        name: 'Test Track',
        artists: [{ name: 'Test Artist' }],
        album: { name: 'Test Album', images: [] },
        uri: 'spotify:track:track-1',
      },
    },
  ],
};

describe('MixtapeTrackViewer', () => {
  it('renders track viewer with correct data', () => {
    render(<MixtapeTrackViewer mixtape={mockMixtape} track={mockMixtape.tracks[0]} trackNumber={1} />);
    expect(screen.getByText('Test Track')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
    expect(screen.getByText('Test track note')).toBeInTheDocument();
  });
}); 