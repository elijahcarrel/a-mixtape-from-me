// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import MixtapeEditor from '../MixtapeEditor';

// Mock useAuthenticatedRequest
const mockMakeRequest = jest.fn();
jest.mock('../../hooks/useApiRequest', () => ({
  useAuthenticatedRequest: () => ({
    makeRequest: mockMakeRequest,
  }),
}));

// Mock components
jest.mock('../TrackAutocomplete', () => {
  return function MockTrackAutocomplete({ onTrackSelect }: any) {
    return (
      <div data-testid="track-autocomplete">
        <button
          onClick={() => onTrackSelect('spotify:track:456', { name: 'Test Track 2' })}
          data-testid="add-track-button"
        >
          Add Test Track
        </button>
      </div>
    );
  };
});

jest.mock('../TrackList', () => {
  return function MockTrackList({ tracks, onRemoveTrack }: any) {
    return (
      <div data-testid="track-list">
        {tracks.map((track: any) => (
          <div key={track.track_position} data-testid={`track-${track.track_position}`}>
            {track.track_text}
            <button
              onClick={() => onRemoveTrack(track.track_position)}
              data-testid={`remove-track-${track.track_position}`}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    );
  };
});

const mockMixtapeData = {
  public_id: 'test-mixtape-123',
  name: 'Test Mixtape',
  intro_text: 'A test mixtape',
  is_public: false,
  create_time: '2023-01-01T00:00:00Z',
  last_modified_time: '2023-01-01T00:00:00Z',
  tracks: [
    {
      track_position: 1,
      track_text: 'Test Track 1',
      spotify_uri: 'spotify:track:123',
    },
  ],
};

describe('MixtapeEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders mixtape form with initial values', () => {
    render(<MixtapeEditor mixtape={mockMixtapeData} />);
    
    expect(screen.getByDisplayValue('Test Mixtape')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A test mixtape')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('shows saving indicator when saving', async () => {
    mockMakeRequest.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<MixtapeEditor mixtape={mockMixtapeData} />);
    
    // Trigger a save by changing the name
    const nameInput = screen.getByDisplayValue('Test Mixtape');
    fireEvent.change(nameInput, { target: { value: 'Updated Mixtape' } });
    
    // Fast-forward debounce timer
    jest.advanceTimersByTime(1000);
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('calls save API when form values change', async () => {
    render(<MixtapeEditor mixtape={mockMixtapeData} />);
    
    const nameInput = screen.getByDisplayValue('Test Mixtape');
    fireEvent.change(nameInput, { target: { value: 'Updated Mixtape' } });
    
    // Fast-forward debounce timer
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(mockMakeRequest).toHaveBeenCalledWith('/api/main/mixtape/test-mixtape-123', {
        method: 'PUT',
        body: {
          name: 'Updated Mixtape',
          intro_text: 'A test mixtape',
          is_public: false,
          tracks: mockMixtapeData.tracks,
        },
      });
    });
  });

  it('adds a new track when TrackAutocomplete calls onTrackSelect', () => {
    render(<MixtapeEditor mixtape={mockMixtapeData} />);
    
    const addTrackButton = screen.getByTestId('add-track-button');
    fireEvent.click(addTrackButton);
    
    // Check that the new track appears in the track list
    expect(screen.getByTestId('track-2')).toBeInTheDocument();
    expect(screen.getByText('Test Track 2')).toBeInTheDocument();
  });

  it('removes a track when TrackList calls onRemoveTrack', () => {
    render(<MixtapeEditor mixtape={mockMixtapeData} />);
    
    // Initially has one track
    expect(screen.getByTestId('track-1')).toBeInTheDocument();
    
    const removeButton = screen.getByTestId('remove-track-1');
    fireEvent.click(removeButton);
    
    // Track should be removed
    expect(screen.queryByTestId('track-1')).not.toBeInTheDocument();
  });

  it('updates track positions when tracks are removed', () => {
    const mixtapeWithMultipleTracks = {
      ...mockMixtapeData,
      tracks: [
        { track_position: 1, track_text: 'Track 1', spotify_uri: 'spotify:track:1' },
        { track_position: 2, track_text: 'Track 2', spotify_uri: 'spotify:track:2' },
        { track_position: 3, track_text: 'Track 3', spotify_uri: 'spotify:track:3' },
      ],
    };
    
    render(<MixtapeEditor mixtape={mixtapeWithMultipleTracks} />);
    
    // Remove the second track
    const removeButton = screen.getByTestId('remove-track-2');
    fireEvent.click(removeButton);
    
    // Track 3 should now be position 2
    expect(screen.getByTestId('track-2')).toBeInTheDocument();
    expect(screen.getByText('Track 3')).toBeInTheDocument();
  });

  it('saves mixtape when tracks are added', async () => {
    render(<MixtapeEditor mixtape={mockMixtapeData} />);
    
    const addTrackButton = screen.getByTestId('add-track-button');
    fireEvent.click(addTrackButton);
    
    // Fast-forward debounce timer
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(mockMakeRequest).toHaveBeenCalledWith('/api/main/mixtape/test-mixtape-123', {
        method: 'PUT',
        body: {
          name: 'Test Mixtape',
          intro_text: 'A test mixtape',
          is_public: false,
          tracks: [
            ...mockMixtapeData.tracks,
            {
              track_position: 2,
              spotify_uri: 'spotify:track:456',
              track_text: 'Test Track 2',
            },
          ],
        },
      });
    });
  });

  it('saves mixtape when tracks are removed', async () => {
    const mixtapeWithMultipleTracks = {
      ...mockMixtapeData,
      tracks: [
        { track_position: 1, track_text: 'Track 1', spotify_uri: 'spotify:track:1' },
        { track_position: 2, track_text: 'Track 2', spotify_uri: 'spotify:track:2' },
      ],
    };
    
    render(<MixtapeEditor mixtape={mixtapeWithMultipleTracks} />);
    
    const removeButton = screen.getByTestId('remove-track-1');
    fireEvent.click(removeButton);
    
    // Fast-forward debounce timer
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(mockMakeRequest).toHaveBeenCalledWith('/api/main/mixtape/test-mixtape-123', {
        method: 'PUT',
        body: {
          name: 'Test Mixtape',
          intro_text: 'A test mixtape',
          is_public: false,
          tracks: [
            {
              track_position: 1,
              track_text: 'Track 2',
              spotify_uri: 'spotify:track:2',
            },
          ],
        },
      });
    });
  });

  it('handles public/private toggle', async () => {
    render(<MixtapeEditor mixtape={mockMixtapeData} />);
    
    const publicToggle = screen.getByRole('checkbox');
    fireEvent.click(publicToggle);
    
    // Fast-forward debounce timer
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(mockMakeRequest).toHaveBeenCalledWith('/api/main/mixtape/test-mixtape-123', {
        method: 'PUT',
        body: {
          name: 'Test Mixtape',
          intro_text: 'A test mixtape',
          is_public: true,
          tracks: mockMixtapeData.tracks,
        },
      });
    });
  });

  it('displays correct track count', () => {
    const mixtapeWithMultipleTracks = {
      ...mockMixtapeData,
      tracks: [
        { track_position: 1, track_text: 'Track 1', spotify_uri: 'spotify:track:1' },
        { track_position: 2, track_text: 'Track 2', spotify_uri: 'spotify:track:2' },
      ],
    };
    
    render(<MixtapeEditor mixtape={mixtapeWithMultipleTracks} />);
    expect(screen.getByText('Tracks (2)')).toBeInTheDocument();
  });
}); 