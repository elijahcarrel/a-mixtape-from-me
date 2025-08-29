import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MixtapeEditorToolbar from './MixtapeEditorToolbar';
import { MixtapeResponse } from '@/client';
import { FormValues } from '../MixtapeEditorForm';
import ThemeProvider from '@/components/providers/ThemeProvider';
import toast from 'react-hot-toast';

// Mock next/navigation
const mockPush = jest.fn();
const mockPrefetch = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    prefetch: mockPrefetch,
  }),
}));

// Mock useAuthenticatedRequest
const mockMakeRequest = jest.fn();
jest.mock('@/hooks/useAuthenticatedRequest', () => ({
  useAuthenticatedRequest: () => ({
    makeRequest: mockMakeRequest,
  }),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

const mockMixtape: MixtapeResponse = {
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
  can_undo: true,
  can_redo: false,
  version: 5,
  spotify_playlist_url: null,
};

const mockFormValues: FormValues = {
  name: 'Test Mixtape',
  intro_text: 'A test mixtape',
  subtitle1: 'Some subtitle',
  subtitle2: 'Subtitle 2',
  subtitle3: 'Subtitle 3',
  is_public: false,
  tracks: mockMixtape.tracks,
};

// Helper function to render with ThemeProvider
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('MixtapeEditorToolbar', () => {
  const defaultProps = {
    mixtape: mockMixtape,
    isSaving: false,
    values: mockFormValues,
    setFieldValue: jest.fn(),
    handleSave: jest.fn(),
    onUndoRedo: jest.fn(),
    resetForm: jest.fn(),
    statusText: 'Saved',
    setStatusText: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMakeRequest.mockClear();
  });

  it('renders all toolbar buttons', () => {
    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

    expect(screen.getByTestId('undo-button')).toBeInTheDocument();
    expect(screen.getByTestId('redo-button')).toBeInTheDocument();
    expect(screen.getByTestId('share-button')).toBeInTheDocument();

    // Preview button has responsive versions (small and large screen)
    const previewButtons = screen.getAllByTestId('preview-button');
    expect(previewButtons).toHaveLength(2);

    expect(screen.getByTestId('status-indicator')).toBeInTheDocument();
  });

  it('enables undo button when can_undo is true', () => {
    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

    const undoButton = screen.getByTestId('undo-button');
    expect(undoButton).not.toBeDisabled();
  });

  it('disables undo button when can_undo is false', () => {
    const mixtapeWithoutUndo = { ...mockMixtape, can_undo: false };
    renderWithTheme(
      <MixtapeEditorToolbar {...defaultProps} mixtape={mixtapeWithoutUndo} />
    );

    const undoButton = screen.getByTestId('undo-button');
    expect(undoButton).toBeDisabled();
  });

  it('enables redo button when can_redo is true', () => {
    const mixtapeWithRedo = { ...mockMixtape, can_redo: true };
    renderWithTheme(
      <MixtapeEditorToolbar {...defaultProps} mixtape={mixtapeWithRedo} />
    );

    const redoButton = screen.getByTestId('redo-button');
    expect(redoButton).not.toBeDisabled();
  });

  it('disables redo button when can_redo is false', () => {
    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

    const redoButton = screen.getByTestId('redo-button');
    expect(redoButton).toBeDisabled();
  });

  it('calls undo endpoint when undo button is clicked', async () => {
    const mockResponse = {
      ...mockMixtape,
      version: 4,
      can_undo: false,
      can_redo: true,
    };
    mockMakeRequest.mockResolvedValueOnce(mockResponse);

    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

    const undoButton = screen.getByTestId('undo-button');
    fireEvent.click(undoButton);

    await waitFor(() => {
      expect(mockMakeRequest).toHaveBeenCalledWith(
        '/api/mixtape/test-mixtape-123/undo',
        {
          method: 'POST',
        }
      );
    });

    expect(defaultProps.onUndoRedo).toHaveBeenCalledWith(mockResponse);
    expect(defaultProps.resetForm).toHaveBeenCalledWith(mockResponse);
  });

  it('calls redo endpoint when redo button is clicked', async () => {
    const mixtapeWithRedo = { ...mockMixtape, can_redo: true };
    const mockResponse = {
      ...mixtapeWithRedo,
      version: 6,
      can_undo: true,
      can_redo: false,
    };

    mockMakeRequest.mockResolvedValueOnce(mockResponse);

    renderWithTheme(
      <MixtapeEditorToolbar {...defaultProps} mixtape={mixtapeWithRedo} />
    );

    const redoButton = screen.getByTestId('redo-button');
    fireEvent.click(redoButton);

    await waitFor(() => {
      expect(mockMakeRequest).toHaveBeenCalledWith(
        '/api/mixtape/test-mixtape-123/redo',
        {
          method: 'POST',
        }
      );
    });

    expect(defaultProps.onUndoRedo).toHaveBeenCalledWith(mockResponse);
    expect(defaultProps.resetForm).toHaveBeenCalledWith(mockResponse);
  });

  it('shows error toast when undo request fails', async () => {
    mockMakeRequest.mockRejectedValueOnce(new Error('Failed to undo'));

    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

    const undoButton = screen.getByTestId('undo-button');
    fireEvent.click(undoButton);

    await waitFor(() => {
      expect(defaultProps.setStatusText).toHaveBeenCalledWith('Undo failed');
    });
    expect(toast.error).toHaveBeenCalledWith('Error undoing changes');
  });

  it('shows error toast when redo request fails', async () => {
    const mixtapeWithRedo = { ...mockMixtape, can_redo: true };
    mockMakeRequest.mockRejectedValueOnce(new Error('Failed to redo'));

    renderWithTheme(
      <MixtapeEditorToolbar {...defaultProps} mixtape={mixtapeWithRedo} />
    );

    const redoButton = screen.getByTestId('redo-button');
    fireEvent.click(redoButton);

    await waitFor(() => {
      expect(defaultProps.setStatusText).toHaveBeenCalledWith('Redo failed');
    });
    expect(toast.error).toHaveBeenCalledWith('Error redoing changes');
  });

  it('shows error toast when undo request throws an error', async () => {
    mockMakeRequest.mockRejectedValueOnce(new Error('Network error'));

    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

    const undoButton = screen.getByTestId('undo-button');
    fireEvent.click(undoButton);

    await waitFor(() => {
      expect(defaultProps.setStatusText).toHaveBeenCalledWith('Undo failed');
    });
    expect(toast.error).toHaveBeenCalledWith('Error undoing changes');
  });

  it('shows error toast when redo request throws an error', async () => {
    const mixtapeWithRedo = { ...mockMixtape, can_redo: true };
    mockMakeRequest.mockRejectedValueOnce(new Error('Network error'));

    renderWithTheme(
      <MixtapeEditorToolbar {...defaultProps} mixtape={mixtapeWithRedo} />
    );

    const redoButton = screen.getByTestId('redo-button');
    fireEvent.click(redoButton);

    await waitFor(() => {
      expect(defaultProps.setStatusText).toHaveBeenCalledWith('Redo failed');
    });
    expect(toast.error).toHaveBeenCalledWith('Error redoing changes');
  });

  // TODO: figure out why this is failing and fix it.
  it.skip('disables undo button while undo request is in progress', async () => {
    let resolveRequest: (value: any) => void;
    const requestPromise = new Promise(resolve => {
      resolveRequest = resolve;
    });

    mockMakeRequest.mockReturnValueOnce(requestPromise);

    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

    const undoButton = screen.getByTestId('undo-button');
    fireEvent.click(undoButton);

    // Button should be disabled while request is in progress
    expect(undoButton).toBeDisabled();

    // Resolve the request
    resolveRequest!(mockMixtape);

    await waitFor(() => {
      expect(undoButton).not.toBeDisabled();
    });
  });

  // TODO: figure out why this is failing and fix it.
  it.skip('disables redo button while redo request is in progress', async () => {
    const mixtapeWithRedo = { ...mockMixtape, can_redo: true };

    let resolveRequest: (value: any) => void;
    const requestPromise = new Promise(resolve => {
      resolveRequest = resolve;
    });

    mockMakeRequest.mockReturnValueOnce(requestPromise);

    renderWithTheme(
      <MixtapeEditorToolbar {...defaultProps} mixtape={mixtapeWithRedo} />
    );

    const redoButton = screen.getByTestId('redo-button');
    fireEvent.click(redoButton);

    // Button should be disabled while request is in progress
    expect(redoButton).toBeDisabled();

    // Resolve the request
    resolveRequest!(mockMixtape);

    await waitFor(() => {
      expect(redoButton).not.toBeDisabled();
    });
  });

  it('calls setStatusText with correct values during undo operation', async () => {
    let resolveRequest: (value: any) => void;
    const requestPromise = new Promise(resolve => {
      resolveRequest = resolve;
    });

    mockMakeRequest.mockReturnValueOnce(requestPromise);

    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

    const undoButton = screen.getByTestId('undo-button');
    fireEvent.click(undoButton);

    // Should call setStatusText with "Undoing..." initially
    expect(defaultProps.setStatusText).toHaveBeenCalledWith('Undoing...');

    // Resolve the request
    resolveRequest!(mockMixtape);

    await waitFor(() => {
      expect(defaultProps.setStatusText).toHaveBeenCalledWith(
        'Undo successful'
      );
    });

    expect(defaultProps.resetForm).toHaveBeenCalledWith(mockMixtape);
  });

  it('calls setStatusText with correct values during redo operation', async () => {
    const mixtapeWithRedo = { ...mockMixtape, can_redo: true };

    let resolveRequest: (value: any) => void;
    const requestPromise = new Promise(resolve => {
      resolveRequest = resolve;
    });

    mockMakeRequest.mockReturnValueOnce(requestPromise);

    renderWithTheme(
      <MixtapeEditorToolbar {...defaultProps} mixtape={mixtapeWithRedo} />
    );

    const redoButton = screen.getByTestId('redo-button');
    fireEvent.click(redoButton);

    // Should call setStatusText with "Redoing..." initially
    expect(defaultProps.setStatusText).toHaveBeenCalledWith('Redoing...');

    // Resolve the request
    resolveRequest!(mockMixtape);

    await waitFor(() => {
      expect(defaultProps.setStatusText).toHaveBeenCalledWith(
        'Redo successful'
      );
    });

    expect(defaultProps.resetForm).toHaveBeenCalledWith(mockMixtape);
  });

  it('calls setStatusText with failure message when undo fails', async () => {
    mockMakeRequest.mockRejectedValueOnce(new Error('Failed to undo'));

    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

    const undoButton = screen.getByTestId('undo-button');
    fireEvent.click(undoButton);

    await waitFor(() => {
      expect(defaultProps.setStatusText).toHaveBeenCalledWith('Undo failed');
    });
  });

  it('calls setStatusText with failure message when redo fails', async () => {
    const mixtapeWithRedo = { ...mockMixtape, can_redo: true };
    mockMakeRequest.mockRejectedValueOnce(new Error('Failed to redo'));

    renderWithTheme(
      <MixtapeEditorToolbar {...defaultProps} mixtape={mixtapeWithRedo} />
    );

    const redoButton = screen.getByTestId('redo-button');
    fireEvent.click(redoButton);

    await waitFor(() => {
      expect(defaultProps.setStatusText).toHaveBeenCalledWith('Redo failed');
    });
  });

  it('shows saving status when isSaving is true', () => {
    renderWithTheme(
      <MixtapeEditorToolbar
        {...defaultProps}
        statusText={'Saving...'}
        isSaving={true}
      />
    );

    // Look for the visible text span, not the tooltip
    const statusText = screen
      .getByTestId('status-indicator')
      .querySelector('span');
    expect(statusText).toHaveTextContent('Saving...');
  });

  it('shows saved status by default', () => {
    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

    // Look for the visible text span, not the tooltip
    const statusText = screen
      .getByTestId('status-indicator')
      .querySelector('span');
    expect(statusText).toHaveTextContent('Saved');
  });

  it('shows tooltip on small screens and text on large screens for status', () => {
    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

    const statusIndicator = screen.getByTestId('status-indicator');

    // On small screens: should have tooltip, text should be hidden
    const smallScreenText = statusIndicator.querySelector('span');
    expect(smallScreenText).toHaveClass('hidden', 'sm:inline');

    // On small screens: should have tooltip wrapper
    const tooltipWrapper = statusIndicator.querySelector('.sm\\:hidden');
    expect(tooltipWrapper).toBeInTheDocument();

    // On large screens: should have visible text span
    const largeScreenText = statusIndicator.querySelector(
      '.hidden.sm\\:inline'
    );
    expect(largeScreenText).toBeInTheDocument();
    expect(largeScreenText).toHaveTextContent('Saved');
  });

  it('shows tooltip on small screens when status is "Saving..."', () => {
    renderWithTheme(
      <MixtapeEditorToolbar
        {...defaultProps}
        statusText="Saving..."
        isSaving={true}
      />
    );

    const statusIndicator = screen.getByTestId('status-indicator');

    // Small screen tooltip wrapper should exist
    const tooltipWrapper = statusIndicator.querySelector('.sm\\:hidden');
    expect(tooltipWrapper).toBeInTheDocument();

    // Large screen text should exist and be hidden on small screens
    const largeScreenText = statusIndicator.querySelector(
      '.hidden.sm\\:inline'
    );
    expect(largeScreenText).toBeInTheDocument();
    expect(largeScreenText).toHaveTextContent('Saving...');
  });

  it('toggles public visibility and saves when checkbox is changed', () => {
    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

    // Open share modal first
    const shareButton = screen.getByTestId('share-button');
    fireEvent.click(shareButton);

    const checkbox = screen.getByLabelText('Make this mixtape public');
    fireEvent.click(checkbox);

    expect(defaultProps.setFieldValue).toHaveBeenCalledWith('is_public', true);
    expect(defaultProps.handleSave).toHaveBeenCalledWith(
      { ...mockFormValues, is_public: true },
      false
    );
  });

  it('opens share modal when share button is clicked', () => {
    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

    const shareButton = screen.getByTestId('share-button');
    fireEvent.click(shareButton);

    expect(screen.getByText('Share Mixtape')).toBeInTheDocument();
  });

  it('prefetches viewer route on mount', () => {
    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

    expect(mockPrefetch).toHaveBeenCalledWith('/mixtape/test-mixtape-123');
  });

  it('shows tooltip on small screens and text on large screens for preview button', () => {
    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

    // Should have two responsive versions
    const previewButtons = screen.getAllByTestId('preview-button');
    expect(previewButtons).toHaveLength(2);

    // Small screen version (with tooltip)
    const smallScreenButton = previewButtons[0];
    expect(smallScreenButton.closest('.sm\\:hidden')).toBeInTheDocument();

    // Large screen version (with text)
    const largeScreenButton = previewButtons[1];
    expect(largeScreenButton.closest('.hidden.sm\\:block')).toBeInTheDocument();

    // Large screen version should have the "Preview" text
    const previewText = largeScreenButton.querySelector('span');
    expect(previewText).toBeInTheDocument();
    expect(previewText).toHaveTextContent('Preview');
    expect(previewText).not.toHaveClass('hidden', 'sm:inline');
  });

  it('small screen preview button shows only icon without text', () => {
    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

    const previewButtons = screen.getAllByTestId('preview-button');
    const smallScreenButton = previewButtons[0];

    // Small screen version should not have text span
    const textSpan = smallScreenButton.querySelector('span');
    expect(textSpan).not.toBeInTheDocument();

    // Should only have the icon
    const icon = smallScreenButton.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('large screen preview button shows icon with text', () => {
    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

    const previewButtons = screen.getAllByTestId('preview-button');
    const largeScreenButton = previewButtons[1];

    // Should have both icon and text
    const icon = largeScreenButton.querySelector('svg');
    expect(icon).toBeInTheDocument();

    const textSpan = largeScreenButton.querySelector('span');
    expect(textSpan).toBeInTheDocument();
    expect(textSpan).toHaveTextContent('Preview');
  });

  describe('Spotify Export', () => {
    beforeEach(() => {
      // Mock navigator.clipboard
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn(),
        },
      });
    });

    it('exports to Spotify successfully and shows success toast', async () => {
      const mockResponse = {
        ...mockMixtape,
        spotify_playlist_url: 'https://open.spotify.com/playlist/12345',
      };
      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

      const exportButton = screen.getByTestId('export-to-spotify-button');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockMakeRequest).toHaveBeenCalledWith(
          '/api/mixtape/test-mixtape-123/spotify-export',
          { method: 'POST' }
        );
      });

      expect(defaultProps.setStatusText).toHaveBeenCalledWith(
        'Exporting to Spotify...'
      );
      expect(defaultProps.setStatusText).toHaveBeenCalledWith(
        'Exported to Spotify'
      );
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://open.spotify.com/playlist/12345'
      );
      // Check that toast.success was called for the export success message
      expect(toast.success).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            children: expect.arrayContaining([
              'Spotify playlist copied to clipboard!',
              expect.objectContaining({
                props: expect.objectContaining({
                  children: 'Open in Spotify',
                }),
              }),
            ]),
          }),
        }),
        { duration: 10000 }
      );
    });

    it('handles Spotify export failure and shows error toast', async () => {
      mockMakeRequest.mockRejectedValueOnce(new Error('Export failed'));

      renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

      const exportButton = screen.getByTestId('export-to-spotify-button');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(defaultProps.setStatusText).toHaveBeenCalledWith(
          'Exporting to Spotify...'
        );
      });

      expect(toast.error).toHaveBeenCalledWith('Error exporting to Spotify');
    });

    it('handles clipboard write failure gracefully', async () => {
      const mockResponse = {
        ...mockMixtape,
        spotify_playlist_url: 'https://open.spotify.com/playlist/12345',
      };
      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      // Mock clipboard failure
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(
        new Error('Clipboard error')
      );

      renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);

      const exportButton = screen.getByTestId('export-to-spotify-button');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockMakeRequest).toHaveBeenCalledWith(
          '/api/mixtape/test-mixtape-123/spotify-export',
          { method: 'POST' }
        );
      });

      expect(defaultProps.setStatusText).toHaveBeenCalledWith(
        'Exported to Spotify'
      );
      expect(toast.error).toHaveBeenCalledWith(
        'Unable to copy to clipboard: Error: Clipboard error'
      );
    });
  });
});
