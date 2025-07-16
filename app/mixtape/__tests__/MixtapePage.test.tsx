// @ts-nocheck
import React from 'react';
import { render, screen, waitFor } from '../../components/__tests__/test-utils';
import '@testing-library/jest-dom';
import ViewMixtapePage from '../[publicId]/page';

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

// Mock useApiRequest
jest.mock('../../hooks/useApiRequest', () => ({
  useApiRequest: jest.fn(),
}));

// Mock components
jest.mock('../../components/MixtapeViewer', () => {
  return function MockMixtapeViewer({ mixtape }: any) {
    return <div data-testid="mixtape-viewer">Mixtape Viewer: {mixtape.name}</div>;
  };
});

jest.mock('../../components/LoadingDisplay', () => {
  return function MockLoadingDisplay({ message }: any) {
    return <div data-testid="loading-display">{message}</div>;
  };
});

jest.mock('../../components/ErrorDisplay', () => {
  return function MockErrorDisplay({ message }: any) {
    return <div data-testid="error-display">{message}</div>;
  };
});

import { useApiRequest } from '../../hooks/useApiRequest';

const mockedUseApiRequest = useApiRequest as jest.Mock;

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
  stack_auth_user_id: '00000000-0000-0000-0000-000000000000',
};

describe('MixtapePage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state while fetching mixtape', () => {
    mockedUseApiRequest.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<ViewMixtapePage />);
    expect(screen.getByTestId('loading-display')).toBeInTheDocument();
    expect(screen.getByText('Loading mixtape...')).toBeInTheDocument();
  });

  it('shows error state when API request fails', () => {
    const mockRefetch = jest.fn();
    mockedUseApiRequest.mockReturnValue({
      data: null,
      loading: false,
      error: 'Failed to load mixtape',
      refetch: mockRefetch,
    });

    render(<ViewMixtapePage />);
    expect(screen.getByTestId('error-display')).toBeInTheDocument();
    expect(screen.getByText('Failed to load mixtape')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('shows error when mixtape is not found', () => {
    mockedUseApiRequest.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ViewMixtapePage />);
    expect(screen.getByTestId('error-display')).toBeInTheDocument();
    expect(screen.getByText('Mixtape not found')).toBeInTheDocument();
  });

  it('renders MixtapeViewer with mixtape data when loaded successfully', () => {
    mockedUseApiRequest.mockReturnValue({
      data: mockMixtapeData,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ViewMixtapePage />);
    expect(screen.getByTestId('mixtape-viewer')).toBeInTheDocument();
    expect(screen.getByText('Mixtape Viewer: Test Mixtape')).toBeInTheDocument();
  });

  it('calls refetch when try again button is clicked', async () => {
    const mockRefetch = jest.fn();
    mockedUseApiRequest.mockReturnValue({
      data: null,
      loading: false,
      error: 'Failed to load mixtape',
      refetch: mockRefetch,
    });

    render(<ViewMixtapePage />);
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    tryAgainButton.click();

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });
}); 