import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditMixtapePage from '../mixtape/[publicId]/edit/page';
import { MixtapeEditorProps } from '../components/MixtapeEditor';
import { MixtapeRequest, MixtapeResponse, MixtapeTrackResponse } from '../client';
import { MixtapeContext } from '../mixtape/MixtapeContext';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useParams: () => ({
    publicId: 'test-mixtape-123',
  }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock components with more realistic behavior
jest.mock('../components/MixtapeEditor', () => {
  const mockReact = require('react');
  return function MockMixtapeEditor({ mixtape }: MixtapeEditorProps) {
    const [tracks, setTracks] = mockReact.useState(mixtape.tracks);
    const [name, setName] = mockReact.useState(mixtape.name);
    
    const addTrack = () => {
      const newTrack = {
        track_position: tracks.length + 1,
        track_text: 'New Track',
        spotify_uri: 'spotify:track:new123',
      };
      setTracks([...tracks, newTrack]);
    };
    
    const removeTrack = (position: number) => {
      setTracks(tracks.filter((t: MixtapeTrackResponse) => t.track_position !== position));
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

const mockMixtapeData: MixtapeResponse = {
  public_id: 'test-mixtape-123',
  name: 'Test Mixtape',
  intro_text: 'A test mixtape',
  subtitle1: 'Some subtitle',
  subtitle2: 'Subtitle 2',
  subtitle3: 'Subtitle 3',
  is_public: false,
  create_time: '2023-01-01T00:00:00Z',
  last_modified_time: '2023-01-01T00:00:00Z',
  stack_auth_user_id: 'user123',
  tracks: [
    {
      track_position: 1,
      track_text: 'Test Track 1',
      track: {
        id: 'track-1',
        name: 'Test Track',
        artists: [{ name: 'Test Artist' }],
        album: { name: 'Test Album', images: [] },
        uri: 'spotify:track:123',
      },
    },
  ],
  can_undo: true,
  can_redo: false,
};

describe('Mixtape Editing Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('completes full mixtape editing workflow', async () => {
    const mockRefetch = jest.fn();
    render(
      <MixtapeContext.Provider value={{ mixtape: mockMixtapeData, refetch: mockRefetch }}>
        <EditMixtapePage />
      </MixtapeContext.Provider>
    );
    
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

  it('handles mixtape with no tracks', () => {
    const emptyMixtape = {
      ...mockMixtapeData,
      tracks: [],
    };
    
    const mockRefetch3 = jest.fn();
    render(
      <MixtapeContext.Provider value={{ mixtape: emptyMixtape, refetch: mockRefetch3 }}>
        <EditMixtapePage />
      </MixtapeContext.Provider>
    );
    
    expect(screen.getByTestId('mixtape-editor')).toBeInTheDocument();
    expect(screen.getByText('Tracks: 0')).toBeInTheDocument();
    expect(screen.queryByTestId('track-1')).not.toBeInTheDocument();
  });

  it('handles mixtape with multiple tracks', () => {
    const multiTrackMixtape = {
      ...mockMixtapeData,
      tracks: [
        { track_position: 1, track_text: 'Track 1', track: { id: '1', name: 'Track 1', artists: [{ name: 'Artist 1' }], album: { name: 'Album 1', images: [] }, uri: 'spotify:track:1' } },
        { track_position: 2, track_text: 'Track 2', track: { id: '2', name: 'Track 2', artists: [{ name: 'Artist 2' }], album: { name: 'Album 2', images: [] }, uri: 'spotify:track:2' } },
        { track_position: 3, track_text: 'Track 3', track: { id: '3', name: 'Track 3', artists: [{ name: 'Artist 3' }], album: { name: 'Album 3', images: [] }, uri: 'spotify:track:3' } },
      ],
    };
    
    const mockRefetch4 = jest.fn();
    render(
      <MixtapeContext.Provider value={{ mixtape: multiTrackMixtape, refetch: mockRefetch4 }}>
        <EditMixtapePage />
      </MixtapeContext.Provider>
    );
    
    expect(screen.getByText('Tracks: 3')).toBeInTheDocument();
    expect(screen.getByTestId('track-1')).toBeInTheDocument();
    expect(screen.getByTestId('track-2')).toBeInTheDocument();
    expect(screen.getByTestId('track-3')).toBeInTheDocument();
    expect(screen.getByText('Track 1')).toBeInTheDocument();
    expect(screen.getByText('Track 2')).toBeInTheDocument();
    expect(screen.getByText('Track 3')).toBeInTheDocument();
  });
}); 