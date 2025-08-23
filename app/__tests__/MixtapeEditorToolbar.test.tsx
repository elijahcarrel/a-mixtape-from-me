import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MixtapeEditorToolbar from '../components/MixtapeEditorToolbar';
import { MixtapeResponse } from '../client';
import { FormValues } from '../components/MixtapeEditorForm';
import ThemeProvider from '../components/ThemeProvider';

// Mock next/navigation
const mockPush = jest.fn();
const mockPrefetch = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    prefetch: mockPrefetch,
  }),
}));

// Mock fetch
global.fetch = jest.fn();

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

const defaultProps = {
  mixtape: mockMixtape,
  isSaving: false,
  values: mockFormValues,
  setFieldValue: jest.fn(),
  handleSave: jest.fn(),
  onUndoRedo: jest.fn(),
};

// Helper function to render with ThemeProvider
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('MixtapeEditorToolbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders all toolbar buttons', () => {
    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);
    
    expect(screen.getByTestId('undo-button')).toBeInTheDocument();
    expect(screen.getByTestId('redo-button')).toBeInTheDocument();
    expect(screen.getByTestId('share-button')).toBeInTheDocument();
    expect(screen.getByTestId('preview-button')).toBeInTheDocument();
    expect(screen.getByTestId('saving-indicator')).toBeInTheDocument();
  });

  it('enables undo button when can_undo is true', () => {
    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);
    
    const undoButton = screen.getByTestId('undo-button');
    expect(undoButton).not.toBeDisabled();
  });

  it('disables undo button when can_undo is false', () => {
    const mixtapeWithoutUndo = { ...mockMixtape, can_undo: false };
    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} mixtape={mixtapeWithoutUndo} />);
    
    const undoButton = screen.getByTestId('undo-button');
    expect(undoButton).toBeDisabled();
  });

  it('enables redo button when can_redo is true', () => {
    const mixtapeWithRedo = { ...mockMixtape, can_redo: true };
    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} mixtape={mixtapeWithRedo} />);
    
    const redoButton = screen.getByTestId('redo-button');
    expect(redoButton).not.toBeDisabled();
  });

  it('disables redo button when can_redo is false', () => {
    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);
    
    const redoButton = screen.getByTestId('redo-button');
    expect(redoButton).toBeDisabled();
  });

  it('calls undo endpoint when undo button is clicked', async () => {
    const mockResponse = { ...mockMixtape, version: 4, can_undo: false, can_redo: true };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);
    
    const undoButton = screen.getByTestId('undo-button');
    fireEvent.click(undoButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/mixtape/test-mixtape-123/undo',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });

    expect(defaultProps.onUndoRedo).toHaveBeenCalledWith(mockResponse);
  });

  it('calls redo endpoint when redo button is clicked', async () => {
    const mixtapeWithRedo = { ...mockMixtape, can_redo: true };
    const mockResponse = { ...mixtapeWithRedo, version: 6, can_undo: true, can_redo: false };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} mixtape={mixtapeWithRedo} />);
    
    const redoButton = screen.getByTestId('redo-button');
    fireEvent.click(redoButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/mixtape/test-mixtape-123/redo',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });

    expect(defaultProps.onUndoRedo).toHaveBeenCalledWith(mockResponse);
  });

  it('shows error toast when undo request fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);
    
    const undoButton = screen.getByTestId('undo-button');
    fireEvent.click(undoButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to undo')).toBeInTheDocument();
    });
  });

  it('shows error toast when redo request fails', async () => {
    const mixtapeWithRedo = { ...mockMixtape, can_redo: true };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} mixtape={mixtapeWithRedo} />);
    
    const redoButton = screen.getByTestId('redo-button');
    fireEvent.click(redoButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to redo')).toBeInTheDocument();
    });
  });

  it('shows error toast when undo request throws an error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);
    
    const undoButton = screen.getByTestId('undo-button');
    fireEvent.click(undoButton);

    await waitFor(() => {
      expect(screen.getByText('Error undoing changes')).toBeInTheDocument();
    });
  });

  it('shows error toast when redo request throws an error', async () => {
    const mixtapeWithRedo = { ...mockMixtape, can_redo: true };
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} mixtape={mixtapeWithRedo} />);
    
    const redoButton = screen.getByTestId('redo-button');
    fireEvent.click(redoButton);

    await waitFor(() => {
      expect(screen.getByText('Error redoing changes')).toBeInTheDocument();
    });
  });

  it('disables undo button while undo request is in progress', async () => {
    let resolveFetch: (value: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    
    (global.fetch as jest.Mock).mockReturnValueOnce(fetchPromise);

    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);
    
    const undoButton = screen.getByTestId('undo-button');
    fireEvent.click(undoButton);

    // Button should be disabled while request is in progress
    expect(undoButton).toBeDisabled();

    // Resolve the fetch
    resolveFetch!({
      ok: true,
      json: async () => mockMixtape,
    });

    await waitFor(() => {
      expect(undoButton).not.toBeDisabled();
    });
  });

  it('disables redo button while redo request is in progress', async () => {
    const mixtapeWithRedo = { ...mockMixtape, can_redo: true };
    
    let resolveFetch: (value: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    
    (global.fetch as jest.Mock).mockReturnValueOnce(fetchPromise);

    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} mixtape={mixtapeWithRedo} />);
    
    const redoButton = screen.getByTestId('redo-button');
    fireEvent.click(redoButton);

    // Button should be disabled while request is in progress
    expect(redoButton).toBeDisabled();

    // Resolve the fetch
    resolveFetch!({
      ok: true,
      json: async () => mockMixtape,
    });

    await waitFor(() => {
      expect(redoButton).not.toBeDisabled();
    });
  });

  it('shows success toast when undo is successful', async () => {
    const mockResponse = { ...mockMixtape, version: 4, can_undo: false, can_redo: true };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} />);
    
    const undoButton = screen.getByTestId('undo-button');
    fireEvent.click(undoButton);

    await waitFor(() => {
      expect(screen.getByText('Undo successful')).toBeInTheDocument();
    });
  });

  it('shows success toast when redo is successful', async () => {
    const mixtapeWithRedo = { ...mockMixtape, can_redo: true };
    const mockResponse = { ...mixtapeWithRedo, version: 6, can_undo: true, can_redo: false };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderWithTheme(<MixtapeEditorToolbar {...defaultProps} mixtape={mixtapeWithRedo} />);
    
    const redoButton = screen.getByTestId('redo-button');
    fireEvent.click(redoButton);

    await waitFor(() => {
      expect(screen.getByText('Redo successful')).toBeInTheDocument();
    });
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
});
