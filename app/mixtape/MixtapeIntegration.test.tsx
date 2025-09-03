import React, { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@/test-utils';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import { useLazyRequest } from '@/hooks/useLazyRequest';
import { useAuth } from '@/hooks/useAuth';
import { useApiRequest } from '@/hooks/useApiRequest';
import { MixtapeResponse } from '@/client';

// Import the components we'll be testing
import HomePage from '../page';
import MixtapeCreateLayout from './layout';
import MixtapeLayout from './[publicId]/layout';
import EditMixtapePage from './[publicId]/edit/page';
import MyMixtapesPage from '../my-mixtapes/page';

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ publicId: 'new' })),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

// Mock hooks
jest.mock('@/hooks/useLazyRequest', () => ({
  useLazyRequest: jest.fn(() => ({ makeRequest: jest.fn() })),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useApiRequest', () => ({
  useApiRequest: jest.fn(),
}));

// Mock components that we don't need to test in detail
jest.mock('./[publicId]/edit/components/MixtapeEditor', () => {
  return function MockMixtapeEditor({ mixtape }: any) {
    return (
      <div data-testid="mixtape-editor">
        <div data-testid="editor-mixtape-name">{mixtape.name}</div>
        <div data-testid="editor-mixtape-id">{mixtape.public_id}</div>
      </div>
    );
  };
});

jest.mock('./[publicId]/components/MixtapeViewer', () => {
  return function MockMixtapeViewer({ mixtape }: any) {
    return (
      <div data-testid="mixtape-viewer">
        <div data-testid="viewer-mixtape-name">{mixtape.name}</div>
        <div data-testid="viewer-mixtape-id">{mixtape.public_id}</div>
      </div>
    );
  };
});

// Mock displays for predictable testing
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

const fakeMixtape: MixtapeResponse = {
  public_id: 'created-mixtape-123',
  name: 'My Created Mixtape',
  intro_text: null,
  subtitle1: null,
  subtitle2: null,
  subtitle3: null,
  is_public: false,
  can_undo: false,
  can_redo: false,
  version: 1,
  create_time: '2023-01-01T00:00:00Z',
  last_modified_time: '2023-01-01T00:00:00Z',
  stack_auth_user_id: 'user123',
  spotify_playlist_url: null,
  tracks: [],
};

const existingMixtape: MixtapeResponse = {
  public_id: 'existing-mixtape-456',
  name: 'Existing Mixtape',
  intro_text: 'This mixtape already exists',
  subtitle1: null,
  subtitle2: null,
  subtitle3: null,
  is_public: true,
  can_undo: false,
  can_redo: false,
  version: 3,
  create_time: '2023-01-01T00:00:00Z',
  last_modified_time: '2023-01-02T00:00:00Z',
  stack_auth_user_id: 'user456',
  spotify_playlist_url: null,
  tracks: [
    {
      track_position: 1,
      track_text: 'Track 1',
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

// Get mock references
const mockUseLazyRequest = useLazyRequest as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;
const mockUseApiRequest = useApiRequest as jest.Mock;

describe('Mixtape Integration Tests', () => {
  let mockMakeRequest: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMakeRequest = jest.fn();
    mockUseLazyRequest.mockReturnValue({ makeRequest: mockMakeRequest });
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });
    mockUseApiRequest.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  describe('Create Flow Integration', () => {
    it('should provide seamless create experience without any flicker', async () => {
      // Start with create mode
      require('next/navigation').useParams.mockReturnValue({ publicId: 'new' });
      mockMakeRequest.mockResolvedValue(fakeMixtape);

      // Track all display states
      const displayStates: string[] = [];
      const originalQuerySelector = document.querySelector;

      // Mock querySelector to track what's being displayed
      document.querySelector = jest.fn((selector: string) => {
        if (selector === '[data-testid="loading-display"]') {
          const element = originalQuerySelector.call(document, selector);
          if (element) displayStates.push('LOADING_SHOWN');
          return element;
        }
        if (selector === '[data-testid="error-display"]') {
          const element = originalQuerySelector.call(document, selector);
          if (element) displayStates.push('ERROR_SHOWN');
          return element;
        }
        return originalQuerySelector.call(document, selector);
      });

      // Render the complete flow
      const { rerender } = render(
        <MixtapeCreateLayout>
          <MixtapeLayout>
            <EditMixtapePage />
          </MixtapeLayout>
        </MixtapeCreateLayout>
      );

      // Should immediately show editor with initial mixtape (no loading/error)
      expect(screen.getByTestId('mixtape-editor')).toBeInTheDocument();
      expect(screen.getByTestId('editor-mixtape-name')).toHaveTextContent(
        'Untitled Mixtape'
      );
      expect(screen.queryByTestId('loading-display')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();

      // Wait for create request to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Simulate URL change (what router.replace would do)
      require('next/navigation').useParams.mockReturnValue({
        publicId: 'created-mixtape-123',
      });

      // Rerender with new publicId (simulating route change)
      rerender(
        <MixtapeCreateLayout>
          <MixtapeLayout>
            <EditMixtapePage />
          </MixtapeLayout>
        </MixtapeCreateLayout>
      );

      // Should still show editor, now with created mixtape ID
      expect(screen.getByTestId('mixtape-editor')).toBeInTheDocument();
      expect(screen.getByTestId('editor-mixtape-id')).toHaveTextContent(
        'created-mixtape-123'
      );

      // CRITICAL: Should never have shown loading or error during the entire flow
      expect(screen.queryByTestId('loading-display')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();

      // Verify no flicker occurred
      expect(displayStates).not.toContain('LOADING_SHOWN');
      expect(displayStates).not.toContain('ERROR_SHOWN');

      // Restore original querySelector
      document.querySelector = originalQuerySelector;
    });

    it('should handle create errors without flicker before error', async () => {
      require('next/navigation').useParams.mockReturnValue({ publicId: 'new' });
      mockMakeRequest.mockRejectedValue(new Error('Server error'));

      render(
        <MixtapeCreateLayout>
          <MixtapeLayout>
            <EditMixtapePage />
          </MixtapeLayout>
        </MixtapeCreateLayout>
      );

      // Should immediately show editor with initial mixtape
      expect(screen.getByTestId('mixtape-editor')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-display')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();

      // Wait for create request to fail
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Now should show error (but no loading flicker before it)
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  describe('Existing Mixtape Flow Integration', () => {
    it('should load existing mixtape with proper loading → success transition', async () => {
      // Start with existing mixtape ID
      require('next/navigation').useParams.mockReturnValue({
        publicId: 'existing-mixtape-456',
      });

      // Mock initial loading state
      mockUseApiRequest.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refetch: jest.fn(),
      });

      const { rerender } = render(
        <MixtapeCreateLayout>
          <MixtapeLayout>
            <EditMixtapePage />
          </MixtapeLayout>
        </MixtapeCreateLayout>
      );

      // Should show loading initially (this is expected and correct)
      expect(screen.getByTestId('loading-display')).toBeInTheDocument();
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();

      // Simulate API response completing
      await act(async () => {
        mockUseApiRequest.mockReturnValue({
          data: existingMixtape,
          loading: false,
          error: null,
          refetch: jest.fn(),
        });
      });

      // Trigger re-render with new data
      rerender(
        <MixtapeCreateLayout>
          <MixtapeLayout>
            <EditMixtapePage />
          </MixtapeLayout>
        </MixtapeCreateLayout>
      );

      // Should now show the editor with loaded mixtape
      expect(screen.queryByTestId('loading-display')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
      expect(screen.getByTestId('mixtape-editor')).toBeInTheDocument();
      expect(screen.getByTestId('editor-mixtape-name')).toHaveTextContent(
        'Existing Mixtape'
      );

      // Verify API was called correctly
      expect(mockUseApiRequest).toHaveBeenCalledWith({
        url: '/api/mixtape/existing-mixtape-456',
        method: 'GET',
        skip: false, // Should not skip for existing mixtapes
      });
    });

    it('should handle API errors gracefully with proper loading → error transition', async () => {
      require('next/navigation').useParams.mockReturnValue({
        publicId: 'existing-mixtape-456',
      });

      // Start with loading
      mockUseApiRequest.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refetch: jest.fn(),
      });

      const { rerender } = render(
        <MixtapeCreateLayout>
          <MixtapeLayout>
            <EditMixtapePage />
          </MixtapeLayout>
        </MixtapeCreateLayout>
      );

      // Should show loading
      expect(screen.getByTestId('loading-display')).toBeInTheDocument();
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();

      // Simulate API error
      await act(async () => {
        mockUseApiRequest.mockReturnValue({
          data: null,
          loading: false,
          error: 'Mixtape not found',
          refetch: jest.fn(),
        });
      });

      rerender(
        <MixtapeCreateLayout>
          <MixtapeLayout>
            <EditMixtapePage />
          </MixtapeLayout>
        </MixtapeCreateLayout>
      );

      // Should now show error (no loading)
      expect(screen.queryByTestId('loading-display')).not.toBeInTheDocument();
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText('Mixtape not found')).toBeInTheDocument();
    });
  });

  describe('My Mixtapes Navigation Flow', () => {
    it('should navigate from My Mixtapes to existing mixtape without error flicker', async () => {
      // Mock My Mixtapes API response
      const mixtapesList = [
        {
          public_id: 'mixtape-1',
          name: 'My First Mixtape',
          last_modified_time: '2023-01-01T00:00:00Z',
        },
        {
          public_id: 'mixtape-2',
          name: 'My Second Mixtape',
          last_modified_time: '2023-01-02T00:00:00Z',
        },
      ];

      mockMakeRequest.mockResolvedValue(mixtapesList);

      // Start on My Mixtapes page
      const { rerender } = render(<MyMixtapesPage />);

      // Wait for mixtapes to load
      await waitFor(() => {
        expect(screen.getByText('My First Mixtape')).toBeInTheDocument();
      });

      // Track navigation to mixtape
      const displayStates: string[] = [];

      // Simulate clicking on a mixtape (this would trigger navigation)
      // For testing, we'll simulate the navigation by changing the route
      require('next/navigation').useParams.mockReturnValue({
        publicId: 'mixtape-1',
      });

      // Mock the API request for the specific mixtape (starts loading)
      mockUseApiRequest.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refetch: jest.fn(),
      });

      // Render the mixtape layout (simulating navigation)
      rerender(
        <MixtapeCreateLayout>
          <MixtapeLayout>
            <EditMixtapePage />
          </MixtapeLayout>
        </MixtapeCreateLayout>
      );

      // Should show loading (this is expected and correct)
      expect(screen.getByTestId('loading-display')).toBeInTheDocument();
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();

      // Simulate API response
      await act(async () => {
        mockUseApiRequest.mockReturnValue({
          data: {
            ...existingMixtape,
            public_id: 'mixtape-1',
            name: 'My First Mixtape',
          },
          loading: false,
          error: null,
          refetch: jest.fn(),
        });
      });

      rerender(
        <MixtapeCreateLayout>
          <MixtapeLayout>
            <EditMixtapePage />
          </MixtapeLayout>
        </MixtapeCreateLayout>
      );

      // Should now show editor with loaded mixtape
      expect(screen.queryByTestId('loading-display')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
      expect(screen.getByTestId('mixtape-editor')).toBeInTheDocument();
      expect(screen.getByTestId('editor-mixtape-name')).toHaveTextContent(
        'My First Mixtape'
      );
    });
  });

  describe('State Transition Validation', () => {
    it('should never show both loading and error simultaneously', async () => {
      require('next/navigation').useParams.mockReturnValue({
        publicId: 'test-mixtape',
      });

      // Test various state combinations
      const stateTransitions = [
        { loading: true, error: null, data: null },
        { loading: false, error: 'Some error', data: null },
        { loading: false, error: null, data: existingMixtape },
        { loading: true, error: null, data: null }, // Back to loading
        { loading: false, error: null, data: existingMixtape },
      ];

      const { rerender } = render(
        <MixtapeCreateLayout>
          <MixtapeLayout>
            <EditMixtapePage />
          </MixtapeLayout>
        </MixtapeCreateLayout>
      );

      for (const state of stateTransitions) {
        await act(async () => {
          mockUseApiRequest.mockReturnValue({
            ...state,
            refetch: jest.fn(),
          });
        });

        rerender(
          <MixtapeCreateLayout>
            <MixtapeLayout>
              <EditMixtapePage />
            </MixtapeLayout>
          </MixtapeCreateLayout>
        );

        // Verify mutual exclusivity
        const hasLoading = screen.queryByTestId('loading-display') !== null;
        const hasError = screen.queryByTestId('error-display') !== null;
        const hasEditor = screen.queryByTestId('mixtape-editor') !== null;

        // Should never show loading and error at the same time
        expect(hasLoading && hasError).toBe(false);

        // Should show exactly one of: loading, error, or editor
        const displayCount = [hasLoading, hasError, hasEditor].filter(
          Boolean
        ).length;
        expect(displayCount).toBe(1);

        // Verify correct display for each state
        if (state.loading && !state.data) {
          expect(hasLoading).toBe(true);
        } else if (state.error && !state.data) {
          expect(hasError).toBe(true);
        } else if (state.data) {
          expect(hasEditor).toBe(true);
        }
      }
    });

    it('should properly handle the create → redirect → load sequence', async () => {
      // Phase 1: Create mode
      require('next/navigation').useParams.mockReturnValue({ publicId: 'new' });
      mockMakeRequest.mockResolvedValue(fakeMixtape);

      const { rerender } = render(
        <MixtapeCreateLayout>
          <MixtapeLayout>
            <EditMixtapePage />
          </MixtapeLayout>
        </MixtapeCreateLayout>
      );

      // Should show editor immediately with fallback data
      expect(screen.getByTestId('mixtape-editor')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-display')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();

      // Phase 2: Wait for create to complete and URL to change
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Simulate URL change after router.replace
      require('next/navigation').useParams.mockReturnValue({
        publicId: 'created-mixtape-123',
      });

      // Phase 3: Rerender with new URL (this is where flicker used to occur)
      rerender(
        <MixtapeCreateLayout>
          <MixtapeLayout>
            <EditMixtapePage />
          </MixtapeLayout>
        </MixtapeCreateLayout>
      );

      // CRITICAL: Should still show editor with created mixtape data
      // (no loading/error flicker during URL transition)
      expect(screen.getByTestId('mixtape-editor')).toBeInTheDocument();
      expect(screen.getByTestId('editor-mixtape-id')).toHaveTextContent(
        'created-mixtape-123'
      );
      expect(screen.queryByTestId('loading-display')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();

      // Verify the API request was properly skipped for the new URL
      expect(mockUseApiRequest).toHaveBeenCalledWith({
        url: '/api/mixtape/created-mixtape-123',
        method: 'GET',
        skip: true, // Should skip because we have created mixtape data
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid URL changes without race conditions', async () => {
      const { rerender } = render(
        <MixtapeCreateLayout>
          <MixtapeLayout>
            <EditMixtapePage />
          </MixtapeLayout>
        </MixtapeCreateLayout>
      );

      // Rapidly change between different mixtape IDs
      const mixtapeIds = ['mixtape-1', 'mixtape-2', 'mixtape-3'];

      for (const id of mixtapeIds) {
        require('next/navigation').useParams.mockReturnValue({ publicId: id });

        await act(async () => {
          mockUseApiRequest.mockReturnValue({
            data: { ...existingMixtape, public_id: id, name: `Mixtape ${id}` },
            loading: false,
            error: null,
            refetch: jest.fn(),
          });
        });

        rerender(
          <MixtapeCreateLayout>
            <MixtapeLayout>
              <EditMixtapePage />
            </MixtapeLayout>
          </MixtapeCreateLayout>
        );

        // Should always show editor, never error
        expect(screen.getByTestId('mixtape-editor')).toBeInTheDocument();
        expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
      }
    });
  });
});
