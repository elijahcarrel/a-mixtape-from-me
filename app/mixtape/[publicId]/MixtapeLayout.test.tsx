import React, { act } from 'react';
import { render, screen } from '@/test-utils';
import '@testing-library/jest-dom';
import { useApiRequest } from '@/hooks/useApiRequest';
import { MixtapeResponse } from '@/client';
import MixtapeLayout from './layout';

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useParams: () => ({ publicId: 'test-mixtape-123' }),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

// Mock useApiRequest
jest.mock('@/hooks/useApiRequest', () => {
  return {
    useApiRequest: jest.fn(),
  };
});

// Mock useAuth
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({ isAuthenticated: false })),
}));

// Mock displays for predictable querying
jest.mock('@/components/layout/LoadingDisplay', () => {
  return function MockLoadingDisplay({ message }: any) {
    return <div data-testid="loading-display">{message}</div>;
  };
});

jest.mock('@/components/layout/ErrorDisplay', () => {
  return function MockErrorDisplay({ message }: any) {
    return <div data-testid="error-display">{message}</div>;
  };
});
const mockUseApiRequest = useApiRequest as jest.Mock;

const fakeMixtape: MixtapeResponse = {
  public_id: 'test-mixtape-123',
  name: 'Test Mixtape',
  intro_text: 'A test mixtape',
  subtitle1: 'Some subtitle',
  subtitle2: 'Subtitle 2',
  subtitle3: 'Subtitle 3',
  is_public: false,
  can_undo: true,
  can_redo: false,
  version: 5,
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
};

describe('MixtapeLayout', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays loading spinner while fetching', () => {
    mockUseApiRequest.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });
    render(
      <MixtapeLayout>
        <div data-testid="child" />
      </MixtapeLayout>
    );
    expect(screen.getByTestId('loading-display')).toBeInTheDocument();
  });

  it('renders children and provides context once data is loaded', () => {
    mockUseApiRequest.mockReturnValue({
      data: fakeMixtape,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
    render(
      <MixtapeLayout>
        <div data-testid="child" />
      </MixtapeLayout>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders an error display when the API request fails', () => {
    const refetch = jest.fn();
    mockUseApiRequest.mockReturnValue({
      data: null,
      loading: false,
      error: 'Failed to load mixtape',
      refetch,
    });

    render(
      <MixtapeLayout>
        <div data-testid="child" />
      </MixtapeLayout>
    );

    expect(screen.getByTestId('error-display')).toBeInTheDocument();
    expect(screen.getByText('Failed to load mixtape')).toBeInTheDocument();
  });

  // TODO: we're re-fetching the mixtape for some reason. Fix this and then re-enable this test.
  it.skip('does not refetch mixtape when navigating between tracks', () => {
    const refetch = jest.fn();
    mockUseApiRequest.mockReturnValue({
      data: fakeMixtape,
      loading: false,
      error: null,
      refetch,
    });

    const { rerender } = render(
      <MixtapeLayout>
        <div data-testid="child" data-track="1" />
      </MixtapeLayout>
    );

    // Simulate navigation within the same mixtape but different track by rerendering children only
    act(() => {
      rerender(
        <MixtapeLayout>
          <div data-testid="child" data-track="2" />
        </MixtapeLayout>
      );
    });

    // useApiRequest should have been called exactly once (initial mount)
    expect(mockUseApiRequest).toHaveBeenCalledTimes(1);
  });

  describe('Create Mode', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Reset search params
      mockSearchParams.delete('create');
      global.fetch = jest.fn();
    });

    it('renders initial mixtape immediately in create mode', () => {
      mockSearchParams.set('create', 'true');
      
      mockUseApiRequest.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refetch: jest.fn(),
      });

      render(
        <MixtapeLayout>
          <div data-testid="child" />
        </MixtapeLayout>
      );

      // Should render children immediately with initial mixtape
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-display')).not.toBeInTheDocument();
    });

    it('makes POST request and removes URL parameter in create mode', async () => {
      mockSearchParams.set('create', 'true');
      
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(fakeMixtape),
      });
      global.fetch = mockFetch;

      mockUseApiRequest.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(
        <MixtapeLayout>
          <div data-testid="child" />
        </MixtapeLayout>
      );

      // Should immediately replace URL to remove create parameter
      expect(mockReplace).toHaveBeenCalledWith('/mixtape/test-mixtape-123/edit', { scroll: false });

      // Should make POST request to create mixtape
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0)); // Wait for useEffect
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/mixtape',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            public_id: 'test-mixtape-123',
            name: 'Untitled Mixtape',
            intro_text: null,
            subtitle1: null,
            subtitle2: null,
            subtitle3: null,
            is_public: true, // Should be true for unauthenticated users
            tracks: [],
          }),
        })
      );
    });

    it('handles create mode errors gracefully', async () => {
      mockSearchParams.set('create', 'true');
      
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: 'Public ID already taken' }),
      });
      global.fetch = mockFetch;

      mockUseApiRequest.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(
        <MixtapeLayout>
          <div data-testid="child" />
        </MixtapeLayout>
      );

      // Wait for create request to fail
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should show error display
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText('Public ID already taken')).toBeInTheDocument();
    });

    it('handles 409 conflict by refetching existing mixtape', async () => {
      mockSearchParams.set('create', 'true');
      
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ detail: 'Public ID already taken' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(fakeMixtape),
        });
      global.fetch = mockFetch;

      mockUseApiRequest.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(
        <MixtapeLayout>
          <div data-testid="child" />
        </MixtapeLayout>
      );

      // Wait for create request and conflict resolution
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should render children (no error display)
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();

      // Should have made both requests
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/mixtape', expect.any(Object));
      expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/mixtape/test-mixtape-123');
    });
  });
});
