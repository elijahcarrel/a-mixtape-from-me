import React, { act } from 'react';
import { render, screen } from '@/test-utils';
import '@testing-library/jest-dom';
import { useLazyRequest } from '@/hooks/useLazyRequest';
import { useAuth } from '@/hooks/useAuth';
import { MixtapeResponse } from '@/client';
import MixtapeCreateLayout, { useMixtapeCreate } from './layout';

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ publicId: 'new' })),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

// Mock useLazyRequest
jest.mock('@/hooks/useLazyRequest', () => ({
  useLazyRequest: jest.fn(() => ({ makeRequest: jest.fn() })),
}));

// Mock useAuth
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const fakeMixtape: MixtapeResponse = {
  public_id: 'created-mixtape-123',
  name: 'Untitled Mixtape',
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

// Get mocked functions
const mockUseLazyRequest = useLazyRequest as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;

// Test component that uses the context
function TestConsumer() {
  const { createdMixtape, isCreating, didCreate, createError } =
    useMixtapeCreate();
  return (
    <div>
      <div data-testid="created-mixtape">{createdMixtape?.name || 'null'}</div>
      <div data-testid="is-creating">{isCreating.toString()}</div>
      <div data-testid="did-create">{didCreate.toString()}</div>
      <div data-testid="create-error">{createError || 'null'}</div>
    </div>
  );
}

describe('MixtapeCreateProvider', () => {
  let mockMakeRequest: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMakeRequest = jest.fn();
    mockUseLazyRequest.mockReturnValue({ makeRequest: mockMakeRequest });
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('provides default context values for non-create mode', () => {
    // Mock non-create mode
    require('next/navigation').useParams.mockReturnValue({
      publicId: 'existing-123',
    });

    render(
      <MixtapeCreateLayout>
        <TestConsumer />
      </MixtapeCreateLayout>
    );

    expect(screen.getByTestId('created-mixtape')).toHaveTextContent(
      'Untitled Mixtape'
    );
    expect(screen.getByTestId('is-creating')).toHaveTextContent('false');
    expect(screen.getByTestId('did-create')).toHaveTextContent('false');
    expect(screen.getByTestId('create-error')).toHaveTextContent('null');

    // Should not make any requests in non-create mode
    expect(mockMakeRequest).not.toHaveBeenCalled();
  });

  it('creates mixtape immediately when in create mode', async () => {
    // Mock create mode
    require('next/navigation').useParams.mockReturnValue({ publicId: 'new' });
    mockMakeRequest.mockResolvedValue(fakeMixtape);

    render(
      <MixtapeCreateLayout>
        <TestConsumer />
      </MixtapeCreateLayout>
    );

    // Should immediately provide fallback mixtape
    expect(screen.getByTestId('created-mixtape')).toHaveTextContent(
      'Untitled Mixtape'
    );
    expect(screen.getByTestId('is-creating')).toHaveTextContent('true');
    expect(screen.getByTestId('did-create')).toHaveTextContent('false');

    // Wait for create request to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should have made POST request
    expect(mockMakeRequest).toHaveBeenCalledWith('/api/mixtape', {
      method: 'POST',
      body: {
        name: 'Untitled Mixtape',
        intro_text: null,
        subtitle1: null,
        subtitle2: null,
        subtitle3: null,
        is_public: true, // Should be true for unauthenticated users
        tracks: [],
      },
    });

    // Should have redirected
    expect(mockReplace).toHaveBeenCalledWith(
      '/mixtape/created-mixtape-123/edit',
      { scroll: false }
    );
  });

  it('sets is_public to false for authenticated users', async () => {
    // Mock create mode with authenticated user
    require('next/navigation').useParams.mockReturnValue({ publicId: 'new' });
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    mockMakeRequest.mockResolvedValue(fakeMixtape);

    render(
      <MixtapeCreateLayout>
        <TestConsumer />
      </MixtapeCreateLayout>
    );

    // Wait for create request
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should have made POST request with is_public: false
    expect(mockMakeRequest).toHaveBeenCalledWith('/api/mixtape', {
      method: 'POST',
      body: {
        name: 'Untitled Mixtape',
        intro_text: null,
        subtitle1: null,
        subtitle2: null,
        subtitle3: null,
        is_public: false, // Should be false for authenticated users
        tracks: [],
      },
    });
  });

  it('handles create errors gracefully', async () => {
    // Mock create mode
    require('next/navigation').useParams.mockReturnValue({ publicId: 'new' });
    const errorMessage = 'Server error';
    mockMakeRequest.mockRejectedValue(new Error(errorMessage));

    render(
      <MixtapeCreateLayout>
        <TestConsumer />
      </MixtapeCreateLayout>
    );

    // Wait for create request to fail
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Should show error
    expect(screen.getByTestId('create-error')).toHaveTextContent(errorMessage);
    expect(screen.getByTestId('is-creating')).toHaveTextContent('false');

    // Should not have redirected
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('updates context when create succeeds', async () => {
    // Mock create mode
    require('next/navigation').useParams.mockReturnValue({ publicId: 'new' });
    mockMakeRequest.mockResolvedValue(fakeMixtape);

    render(
      <MixtapeCreateLayout>
        <TestConsumer />
      </MixtapeCreateLayout>
    );

    // Wait for create request to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Should update context with created mixtape
    expect(screen.getByTestId('created-mixtape')).toHaveTextContent(
      'Untitled Mixtape'
    );
    expect(screen.getByTestId('is-creating')).toHaveTextContent('false');
    expect(screen.getByTestId('did-create')).toHaveTextContent('true');
    expect(screen.getByTestId('create-error')).toHaveTextContent('null');
  });

  it('only creates once even with multiple renders', async () => {
    // Mock create mode
    require('next/navigation').useParams.mockReturnValue({ publicId: 'new' });
    mockMakeRequest.mockResolvedValue(fakeMixtape);

    const { rerender } = render(
      <MixtapeCreateLayout>
        <TestConsumer />
      </MixtapeCreateLayout>
    );

    // Rerender multiple times
    rerender(
      <MixtapeCreateLayout>
        <TestConsumer />
      </MixtapeCreateLayout>
    );

    rerender(
      <MixtapeCreateLayout>
        <TestConsumer />
      </MixtapeCreateLayout>
    );

    // Wait for any potential requests
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Should have made only one request
    expect(mockMakeRequest).toHaveBeenCalledTimes(1);
  });

  it('does not create when auth is still loading', async () => {
    // Mock create mode with loading auth
    require('next/navigation').useParams.mockReturnValue({ publicId: 'new' });
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true, // Auth is still loading
    });

    render(
      <MixtapeCreateLayout>
        <TestConsumer />
      </MixtapeCreateLayout>
    );

    // Wait a bit
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Should not have made any requests while auth is loading
    expect(mockMakeRequest).not.toHaveBeenCalled();
    expect(screen.getByTestId('is-creating')).toHaveTextContent('false');
  });

  it('creates after auth finishes loading', async () => {
    // Mock create mode with loading auth initially
    require('next/navigation').useParams.mockReturnValue({ publicId: 'new' });
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });
    mockMakeRequest.mockResolvedValue(fakeMixtape);

    const { rerender } = render(
      <MixtapeCreateLayout>
        <TestConsumer />
      </MixtapeCreateLayout>
    );

    // Should not create yet
    expect(mockMakeRequest).not.toHaveBeenCalled();

    // Auth finishes loading
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    rerender(
      <MixtapeCreateLayout>
        <TestConsumer />
      </MixtapeCreateLayout>
    );

    // Wait for create request
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Should now have created
    expect(mockMakeRequest).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalled();
  });
});
