// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MixtapePage from '../mixtape/[publicId]/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: () => ({
    publicId: 'test-mixtape-123',
  }),
}));

// Mock useApiRequest for the page
const mockUseApiRequest = jest.fn();
jest.mock('../hooks/useApiRequest', () => ({
  useApiRequest: mockUseApiRequest,
  useAuthenticatedRequest: () => ({
    makeRequest: jest.fn(),
  }),
}));

// Mock components with more realistic behavior
jest.mock('../components/MixtapeEditor', () => {
  return function MockMixtapeEditor({ mixtape }: any) {
    const [tracks, setTracks] = React.useState(mixtape.tracks);
    const [name, setName] = React.useState(mixtape.name);
    
    const addTrack = () => {
      const newTrack = {
        track_position: tracks.length + 1,
        track_text: 'New Track',
        spotify_uri: 'spotify:track:new123',
      };
      setTracks([...tracks, newTrack]);
    };
    
    const removeTrack = (position: number) => {
      setTracks(tracks.filter(t => t.track_position !== position));
    };
    
    const updateName = (newName: string) => {
      setName(newName);
    };
    
    return (
      <div data-testid="mixtape-editor">
        <input
          data-testid="mixtape-name"
          value={name}
          onChange={(e) => updateName(e.target.value)}
          placeholder="Mixtape name"
        />
        <button data-testid="add-track-btn" onClick={addTrack}>
          Add Track
        </button>
        <div data-testid="tracks-count">Tracks: {tracks.length}</div>
        {tracks.map((track: any) => (
          <div key={track.track_position} data-testid={`track-${track.track_position}`}>
            {track.track_text}
            <button
              data-testid={`remove-track-${track.track_position}`}
              onClick={() => removeTrack(track.track_position)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../components/LoadingDisplay', () => {
  return function MockLoadingDisplay({ message }: any) {
    return <div data-testid="loading-display">{message}</div>;
  };
});

jest.mock('../components/ErrorDisplay', () => {
  return function MockErrorDisplay({ message }: any) {
    return <div data-testid="error-display">{message}</div>;
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

describe('Mixtape Editing Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('completes full mixtape editing workflow', async () => {
    // Step 1: Load mixtape
    mockUseApiRequest.mockReturnValue({
      data: mockMixtapeData,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<MixtapePage />);
    
    // Verify mixtape is loaded
    expect(screen.getByTestId('mixtape-editor')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Mixtape')).toBeInTheDocument();
    expect(screen.getByText('Tracks: 1')).toBeInTheDocument();
    expect(screen.getByTestId('track-1')).toBeInTheDocument();
    expect(screen.getByText('Test Track 1')).toBeInTheDocument();

    // Step 2: Edit mixtape name
    const nameInput = screen.getByTestId('mixtape-name');
    fireEvent.change(nameInput, { target: { value: 'Updated Mixtape Name' } });
    expect(nameInput).toHaveValue('Updated Mixtape Name');

    // Step 3: Add a new track
    const addTrackButton = screen.getByTestId('add-track-btn');
    fireEvent.click(addTrackButton);
    
    // Verify track was added
    expect(screen.getByText('Tracks: 2')).toBeInTheDocument();
    expect(screen.getByTestId('track-2')).toBeInTheDocument();
    expect(screen.getByText('New Track')).toBeInTheDocument();

    // Step 4: Remove the first track
    const removeFirstTrackButton = screen.getByTestId('remove-track-1');
    fireEvent.click(removeFirstTrackButton);
    
    // Verify track was removed and count updated
    expect(screen.getByText('Tracks: 1')).toBeInTheDocument();
    expect(screen.queryByTestId('track-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('track-2')).toBeInTheDocument();
  });

  it('handles loading state during mixtape fetch', () => {
    mockUseApiRequest.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<MixtapePage />);
    
    expect(screen.getByTestId('loading-display')).toBeInTheDocument();
    expect(screen.getByText('Loading mixtape...')).toBeInTheDocument();
  });

  it('handles error state and allows retry', async () => {
    const mockRefetch = jest.fn();
    mockUseApiRequest.mockReturnValue({
      data: null,
      loading: false,
      error: 'Failed to load mixtape',
      refetch: mockRefetch,
    });

    render(<MixtapePage />);
    
    expect(screen.getByTestId('error-display')).toBeInTheDocument();
    expect(screen.getByText('Failed to load mixtape')).toBeInTheDocument();
    
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainButton);
    
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  it('transitions from loading to editing successfully', async () => {
    // Start with loading state
    mockUseApiRequest.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    const { rerender } = render(<MixtapePage />);
    
    expect(screen.getByTestId('loading-display')).toBeInTheDocument();

    // Transition to loaded state
    mockUseApiRequest.mockReturnValue({
      data: mockMixtapeData,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    rerender(<MixtapePage />);
    
    expect(screen.getByTestId('mixtape-editor')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-display')).not.toBeInTheDocument();
  });

  it('handles mixtape with no tracks', () => {
    const emptyMixtape = {
      ...mockMixtapeData,
      tracks: [],
    };
    
    mockUseApiRequest.mockReturnValue({
      data: emptyMixtape,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<MixtapePage />);
    
    expect(screen.getByTestId('mixtape-editor')).toBeInTheDocument();
    expect(screen.getByText('Tracks: 0')).toBeInTheDocument();
    expect(screen.queryByTestId('track-1')).not.toBeInTheDocument();
  });

  it('handles mixtape with multiple tracks', () => {
    const multiTrackMixtape = {
      ...mockMixtapeData,
      tracks: [
        { track_position: 1, track_text: 'Track 1', spotify_uri: 'spotify:track:1' },
        { track_position: 2, track_text: 'Track 2', spotify_uri: 'spotify:track:2' },
        { track_position: 3, track_text: 'Track 3', spotify_uri: 'spotify:track:3' },
      ],
    };
    
    mockUseApiRequest.mockReturnValue({
      data: multiTrackMixtape,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<MixtapePage />);
    
    expect(screen.getByText('Tracks: 3')).toBeInTheDocument();
    expect(screen.getByTestId('track-1')).toBeInTheDocument();
    expect(screen.getByTestId('track-2')).toBeInTheDocument();
    expect(screen.getByTestId('track-3')).toBeInTheDocument();
    expect(screen.getByText('Track 1')).toBeInTheDocument();
    expect(screen.getByText('Track 2')).toBeInTheDocument();
    expect(screen.getByText('Track 3')).toBeInTheDocument();
  });
}); 