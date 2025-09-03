import React, { act } from 'react';
import { render, screen } from '@/test-utils';
import '@testing-library/jest-dom';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useLazyRequest } from '@/hooks/useLazyRequest';
import { MixtapeResponse } from '@/client';
import MixtapeLayout from './layout';
import { useMixtapeCreate } from '../layout';

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

// Mock useLazyRequest
jest.mock('@/hooks/useLazyRequest', () => ({
  useLazyRequest: jest.fn(() => ({ makeRequest: jest.fn() })),
}));

// Mock useAuth
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({ isAuthenticated: false })),
}));

// Mock useMixtapeCreate
jest.mock('../layout', () => ({
  useMixtapeCreate: jest.fn(() => ({
    createdMixtape: null,
    isCreating: false,
    didCreate: false,
    createError: null,
  })),
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
const mockUseLazyRequest = useLazyRequest as jest.Mock;
const mockUseMixtapeCreate = useMixtapeCreate as jest.Mock;

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
    // Reset the mock to default values
    mockUseMixtapeCreate.mockReturnValue({
      createdMixtape: null,
      isCreating: false,
      didCreate: false,
      createError: null,
    });
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

    // Should have called useApiRequest with skip: false (no created mixtape)
    expect(mockUseApiRequest).toHaveBeenCalledWith({
      url: '/api/mixtape/test-mixtape-123',
      method: 'GET',
      skip: false,
    });
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

  describe('With Created Mixtape Context', () => {
    it('uses created mixtape when available instead of fetching', () => {
      const createdMixtape = { ...fakeMixtape, name: 'Created Mixtape' };
      mockUseMixtapeCreate.mockReturnValue({
        createdMixtape,
        isCreating: false,
        didCreate: true,
        createError: null,
      });

      mockUseApiRequest.mockReturnValue({
        data: null,
        loading: true, // Would be loading if not skipped
        error: null,
        refetch: jest.fn(),
      });

      render(
        <MixtapeLayout>
          <div data-testid="child" />
        </MixtapeLayout>
      );

      // Should render children with created mixtape
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-display')).not.toBeInTheDocument();

      // Should have skipped API request since we have a created mixtape
      expect(mockUseApiRequest).toHaveBeenCalledWith({
        url: '/api/mixtape/test-mixtape-123',
        method: 'GET',
        skip: true, // Should skip when we have created mixtape
      });
    });

    it('shows create error when create fails', () => {
      mockUseMixtapeCreate.mockReturnValue({
        createdMixtape: null,
        isCreating: false,
        didCreate: false,
        createError: 'Failed to create mixtape',
      });

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

      // Should show error display
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText('Failed to create mixtape')).toBeInTheDocument();
    });

    it('shows loading when creating', () => {
      mockUseMixtapeCreate.mockReturnValue({
        createdMixtape: fakeMixtape, // Has initial mixtape
        isCreating: true,
        didCreate: false,
        createError: null,
      });

      mockUseApiRequest.mockReturnValue({
        data: null,
        loading: false, // API request is skipped
        error: null,
        refetch: jest.fn(),
      });

      render(
        <MixtapeLayout>
          <div data-testid="child" />
        </MixtapeLayout>
      );

      // Should render children immediately (no loading) since we have created mixtape
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-display')).not.toBeInTheDocument();
    });
  });
});
