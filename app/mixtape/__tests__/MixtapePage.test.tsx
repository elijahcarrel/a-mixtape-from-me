// @ts-nocheck
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import MixtapePage from '../page';
import { useApiRequest } from '../../../hooks/useApiRequest';
import { useAuth } from '../../../hooks/useAuth';

// Mock the hooks
jest.mock('next/navigation');
jest.mock('../../../hooks/useApiRequest');
jest.mock('../../../hooks/useAuth');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseApiRequest = useApiRequest as jest.MockedFunction<typeof useApiRequest>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('MixtapePage', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as any);

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user-id' },
      signIn: jest.fn(),
      signOut: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders mixtape viewer when data is loaded', async () => {
    const mockMixtape = {
      public_id: 'test-mixtape-id',
      name: 'Test Mixtape',
      intro_text: 'Test intro text',
      subtitle1: 'Subtitle 1',
      subtitle2: 'Subtitle 2',
      subtitle3: 'Subtitle 3',
      is_public: true,
      create_time: '2023-01-01T00:00:00Z',
      last_modified_time: '2023-01-01T00:00:00Z',
      stack_auth_user_id: 'test-user-id',
      tracks: [
        {
          track_position: 1,
          track_text: 'Test track',
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

    mockUseApiRequest.mockReturnValue({
      data: mockMixtape,
      loading: false,
      error: null,
    });

    render(<MixtapePage params={{ publicId: 'test-mixtape-id' }} />);

    await waitFor(() => {
      expect(screen.getByText('Test Mixtape')).toBeInTheDocument();
      expect(screen.getByText('Test intro text')).toBeInTheDocument();
    });
  });

  it('redirects to edit page when user is owner', async () => {
    const mockMixtape = {
      public_id: 'test-mixtape-id',
      name: 'Test Mixtape',
      intro_text: 'Test intro text',
      subtitle1: 'Subtitle 1',
      subtitle2: 'Subtitle 2',
      subtitle3: 'Subtitle 3',
      is_public: true,
      create_time: '2023-01-01T00:00:00Z',
      last_modified_time: '2023-01-01T00:00:00Z',
      stack_auth_user_id: 'test-user-id',
      tracks: [],
    };

    mockUseApiRequest.mockReturnValue({
      data: mockMixtape,
      loading: false,
      error: null,
    });

    render(<MixtapePage params={{ publicId: 'test-mixtape-id' }} />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/mixtape/test-mixtape-id/edit');
    });
  });

  it('shows loading state', () => {
    mockUseApiRequest.mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });

    render(<MixtapePage params={{ publicId: 'test-mixtape-id' }} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    mockUseApiRequest.mockReturnValue({
      data: null,
      loading: false,
      error: 'Failed to load mixtape',
    });

    render(<MixtapePage params={{ publicId: 'test-mixtape-id' }} />);

    await waitFor(() => {
      expect(screen.getByText('Error loading mixtape')).toBeInTheDocument();
      expect(screen.getByText('Failed to load mixtape')).toBeInTheDocument();
    });
  });
}); 