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

const mockMixtapeData = {
  public_id: 'test-mixtape-123',
  name: 'Test Mixtape',
  intro_text: 'A test mixtape',
  is_public: false,
  create_time: '2023-01-01T00:00:00Z',
  last_modified_time: '2023-01-01T00:00:00Z',
  stack_auth_user_id: 'user123', // Owned mixtape
  tracks: [
    {
      track_position: 1,
      track_text: 'Test Track 1',
      spotify_uri: 'spotify:track:123',
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
  stack_auth_user_id: null, // Anonymous mixtape
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
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
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
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
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
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
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
        expect(mockMakeRequest).toHaveBeenCalledWith('/api/main/mixtape/test-mixtape-123/claim', {
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