import React from 'react';
import { render, screen } from '../../components/__tests__/test-utils';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';

import MixtapeLayout from '../[publicId]/layout';

// Mock next/navigation
const mockPush = jest.fn();
let currentPublicId = 'test-mixtape-123';
let paramsObject = { publicId: currentPublicId };

jest.mock('next/navigation', () => ({
  useParams: () => paramsObject,
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
const mockUseApiRequest = useApiRequest as jest.Mock;

const fakeMixtape = { public_id: 'test-mixtape-123', name: 'Test', tracks: [] } as any;

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
        <div data-testid="child" track="1" />
      </MixtapeLayout>
    );

    // Simulate navigation within the same mixtape but different track by rerendering children only
    act(() => {
      rerender(
        <MixtapeLayout>
          <div data-testid="child" track="2" />
        </MixtapeLayout>
      );
    });

    // useApiRequest should have been called exactly once (initial mount)
    expect(mockUseApiRequest).toHaveBeenCalledTimes(1);
  });
});