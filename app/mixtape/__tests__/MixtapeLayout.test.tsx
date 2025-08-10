import React, { act } from 'react';
import { render, screen } from '../../components/__tests__/test-utils';
import '@testing-library/jest-dom';

import MixtapeLayout from '../[publicId]/layout';

// Mock next/navigation
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ publicId: 'test-mixtape-123' }),
  useRouter: () => ({ push: mockPush }),
}));

// Mock useApiRequest
jest.mock('../../hooks/useApiRequest', () => {
  return {
    useApiRequest: jest.fn(),
  };
});

// Mock displays for predictable querying
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
import { MixtapeResponse } from '@/app/client';
const mockUseApiRequest = useApiRequest as jest.Mock;


const fakeMixtape: MixtapeResponse = {
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
};

describe('MixtapeLayout', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays loading spinner while fetching', () => {
    mockUseApiRequest.mockReturnValue({ data: null, loading: true, error: null, refetch: jest.fn() });
    render(
      <MixtapeLayout>
        <div data-testid="child" />
      </MixtapeLayout>
    );
    expect(screen.getByTestId('loading-display')).toBeInTheDocument();
  });

  it('renders children and provides context once data is loaded', () => {
    mockUseApiRequest.mockReturnValue({ data: fakeMixtape, loading: false, error: null, refetch: jest.fn() });
    render(
      <MixtapeLayout>
        <div data-testid="child" />
      </MixtapeLayout>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('does not refetch mixtape when navigating between tracks', () => {
    const refetch = jest.fn();
    mockUseApiRequest.mockReturnValue({ data: fakeMixtape, loading: false, error: null, refetch });

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
});