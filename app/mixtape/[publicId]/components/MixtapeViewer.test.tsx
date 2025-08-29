import React from 'react';
import { screen } from '@testing-library/react';
import { render } from '../../../components/__tests__/test-utils';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import MixtapeViewer from './MixtapeViewer';
import { MixtapeResponse } from '@/app/client';

// Mock next/navigation
jest.mock('next/navigation');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

jest.mock('../EditButton', () => {
  const mockReact = require('react');
  return function MockEditButton() {
    return <div data-testid="mock-edit-button" />;
  };
});

const mockMixtape: MixtapeResponse = {
  public_id: 'test-mixtape-123',
  name: 'Test Mixtape',
  intro_text: 'A test mixtape intro',
  subtitle1: 'Some subtitle',
  subtitle2: 'Subtitle 2',
  subtitle3: 'Subtitle 3',
  is_public: true,
  can_undo: true,
  can_redo: false,
  version: 5,
  create_time: '2023-01-01T00:00:00Z',
  last_modified_time: '2023-01-01T00:00:00Z',
  stack_auth_user_id: 'user123',
  tracks: [
    {
      track_position: 1,
      track_text: 'Test track note',
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

describe('MixtapeViewer', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders mixtape viewer with correct data', () => {
    render(<MixtapeViewer mixtape={mockMixtape} />);

    expect(screen.getByText('Test Mixtape')).toBeInTheDocument();
    expect(screen.getByText('A test mixtape intro')).toBeInTheDocument();
    expect(screen.getByText('Some subtitle')).toBeInTheDocument();
    expect(screen.getByText('Subtitle 2')).toBeInTheDocument();
    expect(screen.getByText('Subtitle 3')).toBeInTheDocument();
  });

  it('navigates to first track when next button is clicked', () => {
    render(<MixtapeViewer mixtape={mockMixtape} />);

    const nextButton = screen.getByText('Next');
    nextButton.click();

    expect(mockPush).toHaveBeenCalledWith('/mixtape/test-mixtape-123/track/1');
  });

  it('renders the EditButton', () => {
    render(<MixtapeViewer mixtape={mockMixtape} />);
    expect(screen.getByTestId('mock-edit-button')).toBeInTheDocument();
  });
});
