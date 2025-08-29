import React from 'react';
import { render, screen } from '@/app/test-utils';
import '@testing-library/jest-dom';
import ViewMixtapePage from './page';
import { MixtapeContext } from '../MixtapeContext';
import { MixtapeResponse } from '@/app/client';

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

// Mock components
jest.mock('../../components/MixtapeViewer', () => {
  return function MockMixtapeViewer({ mixtape }: any) {
    return (
      <div data-testid="mixtape-viewer">Mixtape Viewer: {mixtape.name}</div>
    );
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

const mockMixtapeData: MixtapeResponse = {
  public_id: 'test-mixtape-123',
  name: 'Test Mixtape',
  intro_text: 'A test mixtape',
  subtitle1: 'Subtitle 1',
  subtitle2: 'Subtitle 2',
  subtitle3: 'Subtitle 3',
  is_public: false,
  can_undo: true,
  can_redo: false,
  version: 5,
  create_time: '2023-01-01T00:00:00Z',
  last_modified_time: '2023-01-01T00:00:00Z',
  tracks: [
    {
      track_position: 1,
      track_text: 'Test Track 1',
      track: {
        id: '1',
        name: 'Test Track 1',
        artists: [{ name: 'Artist 1' }],
        album: { name: 'Album 1', images: [] },
        uri: 'spotify:track:1',
      },
    },
  ],
  stack_auth_user_id: '00000000-0000-0000-0000-000000000000',
};

describe('MixtapePage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders MixtapeViewer with mixtape data when provided via context', () => {
    const mockRefetch = jest.fn();
    const mockOnMixtapeUpdated = jest.fn();
    render(
      <MixtapeContext.Provider
        value={{
          mixtape: mockMixtapeData,
          refetch: mockRefetch,
          onMixtapeUpdated: mockOnMixtapeUpdated,
        }}
      >
        <ViewMixtapePage />
      </MixtapeContext.Provider>
    );
    expect(screen.getByTestId('mixtape-viewer')).toBeInTheDocument();
    expect(
      screen.getByText('Mixtape Viewer: Test Mixtape')
    ).toBeInTheDocument();
  });
});
