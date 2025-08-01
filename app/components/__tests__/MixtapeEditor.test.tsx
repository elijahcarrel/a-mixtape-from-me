// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from './test-utils';
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

// Mock useAuth hook
const mockUseAuth = jest.fn();
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/mixtape/test-mixtape-123/edit"
}));

// Mock components
jest.mock('../TrackAutocomplete', () => {
  return function MockTrackAutocomplete({ onTrackSelect }: any) {
    return (
      <div data-testid="track-autocomplete">
        <button
          onClick={() => onTrackSelect('spotify:track:456', {
            id: 'track456',
            name: 'Test Track 2',
            artists: [{ name: 'Artist 2' }],
            album: {
              name: 'Album 2',
              images: [{ url: 'https://example.com/image2.jpg', width: 300, height: 300 }],
            },
            uri: 'spotify:track:456',
            // Simulate a user-supplied message (track_text) if the UI ever supports it
            // track_text: 'You played this for me on our first date. <3',
          })}
          data-testid="add-track-button"
        >
          Add Test Track
        </button>
      </div>
    );
  };
});

jest.mock('../TrackList', () => {
  return function MockTrackList({ tracks, onRemoveTrack, onEditTrackText }: any) {
    return (
      <div data-testid="track-list">
        {tracks.map((track: any) => (
          <div key={track.track_position} data-testid={`track-${track.track_position}`}>
            {/* Render the track title */}
            {track.track && track.track.name}
            {/* Render the track_text if present */}
            {track.track_text && <div data-testid={`track-text-${track.track_position}`}>{track.track_text}</div>}
            {/* Mock edit track text button */}
            <button
              onClick={() => onEditTrackText?.(track.track_position, 'Updated note for track ' + track.track_position)}
              data-testid={`edit-track-text-${track.track_position}`}
            >
              Edit Note
            </button>
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

// Mock HeaderContainer to include the saving indicator
jest.mock('../layout/HeaderContainer', () => {
  return function MockHeaderContainer({ children, isSaving }: any) {
    return (
      <div data-testid="header-container">
        {children}
        {isSaving && <div data-testid="saving-indicator">Saving...</div>}
      </div>
    );
  };
});

const mockTrackDetails = {
  id: 'track123',
  name: 'Test Track 1',
  artists: [{ name: 'Artist 1' }],
  album: {
    name: 'Album 1',
    images: [{ url: 'https://example.com/image1.jpg', width: 300, height: 300 }],
  },
  uri: 'spotify:track:123',
};
const mockTrackDetails2 = {
  id: 'track456',
  name: 'Test Track 2',
  artists: [{ name: 'Artist 2' }],
  album: {
    name: 'Album 2',
    images: [{ url: 'https://example.com/image2.jpg', width: 300, height: 300 }],
  },
  uri: 'spotify:track:456',
};

const mockMixtapeData = {
  public_id: 'test-mixtape-123',
  name: 'Test Mixtape',
  intro_text: 'A test mixtape',
  is_public: false,
  create_time: '2023-01-01T00:00:00Z',
  last_modified_time: '2023-01-01T00:00:00Z',
  stack_auth_user_id: 'user123',
  tracks: [
    {
      track_position: 1,
      track_text: 'This song always reminds me of our road trip to Big Sur!',
      track: mockTrackDetails,
    },
  ],
};

const mockAnonymousMixtapeData = {
  public_id: 'test-mixtape-123',
  name: 'Test Mixtape',
  intro_text: 'A test mixtape',
  is_public: true,
  create_time: '2023-01-01T00:00:00Z',
  last_modified_time: '2023-01-01T00:00:00Z',
  stack_auth_user_id: null,
  tracks: [
    {
      track_position: 1,
      track_text: 'This song always reminds me of our road trip to Big Sur!',
      track: mockTrackDetails,
    },
  ],
};

// In tests that simulate adding a track, use:
const newTrackDetails = {
  id: 'track456',
  name: 'Test Track 2',
  artists: [{ name: 'Artist 2' }],
  album: {
    name: 'Album 2',
    images: [{ url: 'https://example.com/image2.jpg', width: 300, height: 300 }],
  },
  uri: 'spotify:track:456',
};
const newTrack = {
  track_position: 2,
  track_text: 'You played this for me on our first date. <3',
  track: newTrackDetails,
};

// When asserting save API calls, expect:
// tracks: [
//   { track_position: 1, track_text: ..., spotify_uri: ... },
//   { track_position: 2, track_text: ..., spotify_uri: ... },
// ]
// where spotify_uri is track.track.uri
// ... update all usages of tracks in tests to use the new structure and intent ...

describe('MixtapeEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Default to authenticated user
    mockUseAuth.mockReturnValue({
      user: { id: 'user123' },
      isAuthenticated: true,
    });
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
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    // Look for the saving indicator
    expect(screen.getByTestId('saving-indicator')).toBeInTheDocument();
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('calls save API when form values change', async () => {
    render(<MixtapeEditor mixtape={mockMixtapeData} />);
    
    const nameInput = screen.getByDisplayValue('Test Mixtape');
    fireEvent.change(nameInput, { target: { value: 'Updated Mixtape' } });
    
    // Fast-forward debounce timer
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(mockMakeRequest).toHaveBeenCalledWith('/api/mixtape/test-mixtape-123', {
        method: 'PUT',
        body: {
          name: 'Updated Mixtape',
          intro_text: 'A test mixtape',
          is_public: false,
          tracks: mockMixtapeData.tracks.map(track => ({
            track_position: track.track_position,
            track_text: track.track_text,
            spotify_uri: track.track.uri,
          })),
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
    // track_text is undefined for new tracks, so only the title is rendered
    expect(screen.getByText('Test Track 2')).toBeInTheDocument();
  });

  it('updates track text when TrackList calls onEditTrackText', async () => {
    render(<MixtapeEditor mixtape={mockMixtapeData} />);
    
    // Initially has the original track text
    expect(screen.getByTestId('track-text-1')).toHaveTextContent('This song always reminds me of our road trip to Big Sur!');
    
    // Edit the track text
    const editNoteButton = screen.getByTestId('edit-track-text-1');
    fireEvent.click(editNoteButton);
    
    // Should call save API immediately (no debounce for track changes)
    await waitFor(() => {
      expect(mockMakeRequest).toHaveBeenCalledWith('/api/mixtape/test-mixtape-123', {
        method: 'PUT',
        body: {
          name: 'Test Mixtape',
          intro_text: 'A test mixtape',
          is_public: false,
          tracks: [
            {
              track_position: 1,
              track_text: 'Updated note for track 1',
              spotify_uri: 'spotify:track:123',
            },
          ],
        },
      });
    });
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
        { track_position: 1, track_text: 'Track 1', track: mockTrackDetails },
        { track_position: 2, track_text: 'Track 2', track: mockTrackDetails2 },
        { track_position: 3, track_text: 'Track 3', track: mockTrackDetails },
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
    
    // Should call save API immediately (no debounce for track changes)
    await waitFor(() => {
      expect(mockMakeRequest).toHaveBeenCalledWith('/api/mixtape/test-mixtape-123', {
        method: 'PUT',
        body: {
          name: 'Test Mixtape',
          intro_text: 'A test mixtape',
          is_public: false,
          tracks: [
            {
              track_position: 1,
              track_text: 'This song always reminds me of our road trip to Big Sur!',
              spotify_uri: 'spotify:track:123',
            },
            {
              track_position: 2,
              track_text: undefined,
              spotify_uri: 'spotify:track:456',
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
        { track_position: 1, track_text: 'Track 1', track: mockTrackDetails },
        { track_position: 2, track_text: 'Track 2', track: mockTrackDetails2 },
      ],
    };
    
    render(<MixtapeEditor mixtape={mixtapeWithMultipleTracks} />);
    
    const removeButton = screen.getByTestId('remove-track-1');
    fireEvent.click(removeButton);
    
    // Should call save API immediately (no debounce for track changes)
    await waitFor(() => {
      expect(mockMakeRequest).toHaveBeenCalledWith('/api/mixtape/test-mixtape-123', {
        method: 'PUT',
        body: {
          name: 'Test Mixtape',
          intro_text: 'A test mixtape',
          is_public: false,
          tracks: [
            {
              track_position: 1,
              track_text: 'Track 2',
              spotify_uri: mockTrackDetails2.uri,
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
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(mockMakeRequest).toHaveBeenCalledWith('/api/mixtape/test-mixtape-123', {
        method: 'PUT',
        body: {
          name: 'Test Mixtape',
          intro_text: 'A test mixtape',
          is_public: true,
          tracks: mockMixtapeData.tracks.map(track => ({
            track_position: track.track_position,
            track_text: track.track_text,
            spotify_uri: track.track.uri,
          })),
        },
      });
    });
  });

  it('displays correct track count', () => {
    const mixtapeWithMultipleTracks = {
      ...mockMixtapeData,
      tracks: [
        { track_position: 1, track_text: 'Track 1', track: mockTrackDetails },
        { track_position: 2, track_text: 'Track 2', track: mockTrackDetails2 },
      ],
    };
    
    render(<MixtapeEditor mixtape={mixtapeWithMultipleTracks} />);
    expect(screen.getByText('Tracks (2)')).toBeInTheDocument();
  });

  it('renders the Preview button', () => {
    render(<MixtapeEditor mixtape={mockMixtapeData} />);
    expect(screen.getByTestId('preview-button')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('navigates to the viewer page when Preview button is clicked', () => {
    render(<MixtapeEditor mixtape={mockMixtapeData} />);
    const previewButton = screen.getByTestId('preview-button');
    fireEvent.click(previewButton);
    expect(mockPush).toHaveBeenCalledWith('/mixtape/test-mixtape-123');
  });

  // NEW TESTS: Testing the bug fix and new functionality

  describe('Form Value Persistence', () => {
    it('preserves form values when tracks are added', async () => {
      render(<MixtapeEditor mixtape={mockMixtapeData} />);
      
      // First, change the form values
      const nameInput = screen.getByDisplayValue('Test Mixtape');
      const introInput = screen.getByDisplayValue('A test mixtape');
      
      fireEvent.change(nameInput, { target: { value: 'My Updated Mixtape' } });
      fireEvent.change(introInput, { target: { value: 'This is my updated intro text' } });
      
      // Wait for debounced save to be called
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      // Clear the mock to verify the next call
      mockMakeRequest.mockClear();
      
      // Now add a track
      const addTrackButton = screen.getByTestId('add-track-button');
      fireEvent.click(addTrackButton);
      
      // Verify that the save includes the updated form values, not the original ones
      await waitFor(() => {
        expect(mockMakeRequest).toHaveBeenCalledWith('/api/mixtape/test-mixtape-123', {
          method: 'PUT',
          body: {
            name: 'My Updated Mixtape',
            intro_text: 'This is my updated intro text',
            is_public: false,
            tracks: [
              {
                track_position: 1,
                track_text: 'This song always reminds me of our road trip to Big Sur!',
                spotify_uri: 'spotify:track:123',
              },
              {
                track_position: 2,
                track_text: undefined,
                spotify_uri: 'spotify:track:456',
              },
            ],
          },
        });
      });
    });

    it('preserves form values when tracks are removed', async () => {
      const mixtapeWithMultipleTracks = {
        ...mockMixtapeData,
        tracks: [
          { track_position: 1, track_text: 'Track 1', track: mockTrackDetails },
          { track_position: 2, track_text: 'Track 2', track: mockTrackDetails2 },
        ],
      };
      
      render(<MixtapeEditor mixtape={mixtapeWithMultipleTracks} />);
      
      // First, change the form values
      const nameInput = screen.getByDisplayValue('Test Mixtape');
      const introInput = screen.getByDisplayValue('A test mixtape');
      
      fireEvent.change(nameInput, { target: { value: 'My Updated Mixtape' } });
      fireEvent.change(introInput, { target: { value: 'This is my updated intro text' } });
      
      // Wait for debounced save to be called
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      // Clear the mock to verify the next call
      mockMakeRequest.mockClear();
      
      // Now remove a track
      const removeButton = screen.getByTestId('remove-track-1');
      fireEvent.click(removeButton);
      
      // Verify that the save includes the updated form values, not the original ones
      await waitFor(() => {
        expect(mockMakeRequest).toHaveBeenCalledWith('/api/mixtape/test-mixtape-123', {
          method: 'PUT',
          body: {
            name: 'My Updated Mixtape',
            intro_text: 'This is my updated intro text',
            is_public: false,
            tracks: [
              {
                track_position: 1,
                track_text: 'Track 2',
                spotify_uri: mockTrackDetails2.uri,
              },
            ],
          },
        });
      });
    });

    it('preserves form values when track text is edited', async () => {
      render(<MixtapeEditor mixtape={mockMixtapeData} />);
      
      // First, change the form values
      const nameInput = screen.getByDisplayValue('Test Mixtape');
      const introInput = screen.getByDisplayValue('A test mixtape');
      
      fireEvent.change(nameInput, { target: { value: 'My Updated Mixtape' } });
      fireEvent.change(introInput, { target: { value: 'This is my updated intro text' } });
      
      // Wait for debounced save to be called
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      // Clear the mock to verify the next call
      mockMakeRequest.mockClear();
      
      // Now edit track text
      const editNoteButton = screen.getByTestId('edit-track-text-1');
      fireEvent.click(editNoteButton);
      
      // Verify that the save includes the updated form values, not the original ones
      await waitFor(() => {
        expect(mockMakeRequest).toHaveBeenCalledWith('/api/mixtape/test-mixtape-123', {
          method: 'PUT',
          body: {
            name: 'My Updated Mixtape',
            intro_text: 'This is my updated intro text',
            is_public: false,
            tracks: [
              {
                track_position: 1,
                track_text: 'Updated note for track 1',
                spotify_uri: 'spotify:track:123',
              },
            ],
          },
        });
      });
    });
  });

  describe('Save Timing', () => {
    it('uses immediate save for track operations', async () => {
      render(<MixtapeEditor mixtape={mockMixtapeData} />);
      
      // Add a track
      const addTrackButton = screen.getByTestId('add-track-button');
      fireEvent.click(addTrackButton);
      
      // Should save immediately without waiting for debounce
      await waitFor(() => {
        expect(mockMakeRequest).toHaveBeenCalled();
      });
      
      // Verify no debounce was used (should be called immediately)
      expect(mockMakeRequest).toHaveBeenCalledTimes(1);
    });

    it('uses debounced save for text field changes', async () => {
      render(<MixtapeEditor mixtape={mockMixtapeData} />);
      
      // Change the name
      const nameInput = screen.getByDisplayValue('Test Mixtape');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      
      // Should not save immediately
      expect(mockMakeRequest).not.toHaveBeenCalled();
      
      // Should save after debounce
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(mockMakeRequest).toHaveBeenCalled();
      });
    });

    it('uses debounced save for intro text changes', async () => {
      render(<MixtapeEditor mixtape={mockMixtapeData} />);
      
      // Change the intro text
      const introInput = screen.getByDisplayValue('A test mixtape');
      fireEvent.change(introInput, { target: { value: 'Updated intro' } });
      
      // Should not save immediately
      expect(mockMakeRequest).not.toHaveBeenCalled();
      
      // Should save after debounce
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(mockMakeRequest).toHaveBeenCalled();
      });
    });

    it('uses debounced save for public/private toggle', async () => {
      render(<MixtapeEditor mixtape={mockMixtapeData} />);
      
      // Toggle public/private
      const publicToggle = screen.getByRole('checkbox');
      fireEvent.click(publicToggle);
      
      // Should not save immediately
      expect(mockMakeRequest).not.toHaveBeenCalled();
      
      // Should save after debounce
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(mockMakeRequest).toHaveBeenCalled();
      });
    });
  });

  describe('Form State Management', () => {
    it('updates form when mixtape prop changes', () => {
      const { rerender } = render(<MixtapeEditor mixtape={mockMixtapeData} />);
      
      // Verify initial values
      expect(screen.getByDisplayValue('Test Mixtape')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A test mixtape')).toBeInTheDocument();
      
      // Create updated mixtape data
      const updatedMixtapeData = {
        ...mockMixtapeData,
        name: 'Updated Mixtape Name',
        intro_text: 'Updated intro text',
        is_public: true,
      };
      
      // Rerender with new data
      rerender(<MixtapeEditor mixtape={updatedMixtapeData} />);
      
      // Verify form values are updated
      expect(screen.getByDisplayValue('Updated Mixtape Name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Updated intro text')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('maintains form state during track operations', async () => {
      render(<MixtapeEditor mixtape={mockMixtapeData} />);
      
      // Change form values
      const nameInput = screen.getByDisplayValue('Test Mixtape');
      fireEvent.change(nameInput, { target: { value: 'Modified Title' } });
      
      // Verify the change is reflected in the input
      expect(screen.getByDisplayValue('Modified Title')).toBeInTheDocument();
      
      // Add a track
      const addTrackButton = screen.getByTestId('add-track-button');
      fireEvent.click(addTrackButton);
      
      // Verify the form value is still there after track operation
      expect(screen.getByDisplayValue('Modified Title')).toBeInTheDocument();
    });
  });

  describe('Anonymous Mixtape Warning', () => {
    it('shows warning banner for anonymous mixtapes when user is authenticated', () => {
      render(<MixtapeEditor mixtape={mockAnonymousMixtapeData} />);
      
      expect(screen.getByText('Claim this mixtape')).toBeInTheDocument();
      expect(screen.getByText(/This mixtape was created anonymously/)).toBeInTheDocument();
      expect(screen.getByText('Claim Mixtape')).toBeInTheDocument();
    });

    it('shows sign in prompt for anonymous mixtapes when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
      });
      
      render(<MixtapeEditor mixtape={mockAnonymousMixtapeData} />);
      
      expect(screen.getByText('Sign in to save this mixtape')).toBeInTheDocument();
      expect(screen.getByText(/This mixtape was created anonymously/)).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('does not show warning banner for owned mixtapes', () => {
      render(<MixtapeEditor mixtape={mockMixtapeData} />);
      
      expect(screen.queryByText('Claim this mixtape')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign in to save this mixtape')).not.toBeInTheDocument();
    });

    it('redirects to sign in when unauthenticated user clicks sign in', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
      });
      
      render(<MixtapeEditor mixtape={mockAnonymousMixtapeData} />);

      const signInButton = screen.getByText('Sign In');
      fireEvent.click(signInButton);
      
      expect(mockPush).toHaveBeenCalledWith('/handler/signup?next=%2Fmixtape%2Ftest-mixtape-123%2Fedit');
    });

    it('calls claim endpoint when authenticated user clicks claim', async () => {
      const mockOnMixtapeClaimed = jest.fn();
      render(<MixtapeEditor mixtape={mockAnonymousMixtapeData} onMixtapeClaimed={mockOnMixtapeClaimed} />);
      
      const claimButton = screen.getByText('Claim Mixtape');
      fireEvent.click(claimButton);
      
      await waitFor(() => {
        expect(mockMakeRequest).toHaveBeenCalledWith('/api/mixtape/test-mixtape-123/claim', {
          method: 'POST',
          body: {},
        });
      });
      
      // Simulate successful API response
      await waitFor(() => {
        expect(mockOnMixtapeClaimed).toHaveBeenCalled();
      });
    });

    it('shows claiming state when claim is in progress', async () => {
      mockMakeRequest.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<MixtapeEditor mixtape={mockAnonymousMixtapeData} />);
      
      const claimButton = screen.getByText('Claim Mixtape');
      fireEvent.click(claimButton);
      
      expect(screen.getByText('Claiming...')).toBeInTheDocument();
      expect(screen.getByText('Claiming...')).toBeDisabled();
    });
  });
}); 