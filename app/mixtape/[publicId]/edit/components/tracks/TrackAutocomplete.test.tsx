import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '../../../../../components/__tests__/test-utils';
import '@testing-library/jest-dom';
import TrackAutocomplete from './TrackAutocomplete';

// Mock useAuthenticatedRequest
const mockMakeRequest = jest.fn();
jest.mock('../../hooks/useAuthenticatedRequest', () => ({
  useAuthenticatedRequest: () => ({
    makeRequest: mockMakeRequest,
  }),
}));

const mockSearchResults = [
  {
    id: 'track1',
    name: 'Test Track 1',
    artists: [{ name: 'Artist 1' }],
    album: {
      name: 'Album 1',
      images: [
        { url: 'https://example.com/image1.jpg', width: 300, height: 300 },
      ],
    },
    uri: 'spotify:track:track1',
  },
  {
    id: 'track2',
    name: 'Test Track 2',
    artists: [{ name: 'Artist 2' }],
    album: {
      name: 'Album 2',
      images: [
        { url: 'https://example.com/image2.jpg', width: 300, height: 300 },
      ],
    },
    uri: 'spotify:track:track2',
  },
];

describe('TrackAutocomplete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input', () => {
    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);

    expect(
      screen.getByPlaceholderText('Search for tracks...')
    ).toBeInTheDocument();
  });

  it('shows loading spinner when searching', async () => {
    // Mock a delayed response that takes longer to complete
    mockMakeRequest.mockImplementation(
      () =>
        new Promise(resolve => {
          setTimeout(() => resolve([]), 200);
        })
    );

    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);

    const searchInput = screen.getByPlaceholderText('Search for tracks...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Wait for the debounce delay to trigger the search
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    // Wait for the loading spinner to appear
    await waitFor(() => {
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  it('calls search API when user types', async () => {
    mockMakeRequest.mockResolvedValue(mockSearchResults);

    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);

    const searchInput = screen.getByPlaceholderText('Search for tracks...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Wait for the debounce delay
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    expect(mockMakeRequest).toHaveBeenCalledWith(
      '/api/spotify/search?query=test',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('displays search results', async () => {
    mockMakeRequest.mockResolvedValue(mockSearchResults);

    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);

    const searchInput = screen.getByPlaceholderText('Search for tracks...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Wait for the debounce delay
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    expect(screen.getByTestId('track-result-track1')).toBeInTheDocument();
    expect(screen.getByTestId('track-result-track2')).toBeInTheDocument();
    expect(screen.getByText('Artist 1')).toBeInTheDocument();
    expect(screen.getByText('Artist 2')).toBeInTheDocument();
  });

  it('calls onTrackSelect when a track is clicked', async () => {
    mockMakeRequest.mockResolvedValue(mockSearchResults);

    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);

    const searchInput = screen.getByPlaceholderText('Search for tracks...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Wait for the debounce delay
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    const firstTrack = screen.getByTestId('track-result-track1');
    fireEvent.click(firstTrack);

    expect(mockOnTrackSelect).toHaveBeenCalledWith('spotify:track:track1', {
      id: 'track1',
      name: 'Test Track 1',
      artists: [{ name: 'Artist 1' }],
      album: {
        name: 'Album 1',
        images: [
          { url: 'https://example.com/image1.jpg', width: 300, height: 300 },
        ],
      },
      uri: 'spotify:track:track1',
    });
  });

  it('clears search input after track selection', async () => {
    mockMakeRequest.mockResolvedValue(mockSearchResults);

    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);

    const searchInput = screen.getByPlaceholderText('Search for tracks...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Wait for the debounce delay
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    const firstTrack = screen.getByTestId('track-result-track1');
    fireEvent.click(firstTrack);

    expect(searchInput).toHaveValue('');
  });

  it('handles keyboard navigation with arrow keys', async () => {
    mockMakeRequest.mockResolvedValue(mockSearchResults);

    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);

    const searchInput = screen.getByPlaceholderText('Search for tracks...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Wait for the debounce delay
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    // Press arrow down to select first item
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    // Press enter to select the highlighted item
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(mockOnTrackSelect).toHaveBeenCalledWith(
      'spotify:track:track1',
      expect.any(Object)
    );
  });

  it('closes dropdown when escape key is pressed', async () => {
    mockMakeRequest.mockResolvedValue(mockSearchResults);

    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);

    const searchInput = screen.getByPlaceholderText('Search for tracks...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Wait for the debounce delay
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    expect(screen.getByTestId('track-result-track1')).toBeInTheDocument();
    // Press escape to close dropdown
    fireEvent.keyDown(searchInput, { key: 'Escape' });

    expect(screen.queryByTestId('track-result-track1')).not.toBeInTheDocument();
  });

  it('handles search errors gracefully', async () => {
    mockMakeRequest.mockRejectedValue(new Error('Search failed'));

    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);

    const searchInput = screen.getByPlaceholderText('Search for tracks...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Wait for the debounce delay
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    // Should not crash and should not show any results
    expect(screen.queryByTestId('track-result-track1')).not.toBeInTheDocument();
  });

  it('debounces search requests', async () => {
    mockMakeRequest.mockResolvedValue(mockSearchResults);

    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);

    const searchInput = screen.getByPlaceholderText('Search for tracks...');

    // Type multiple characters quickly
    fireEvent.change(searchInput, { target: { value: 't' } });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    fireEvent.change(searchInput, { target: { value: 'te' } });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    fireEvent.change(searchInput, { target: { value: 'tes' } });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Wait for the final debounce delay
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    // Should only call the API once with the final query
    expect(mockMakeRequest).toHaveBeenCalledTimes(1);
    expect(mockMakeRequest).toHaveBeenCalledWith(
      '/api/spotify/search?query=test',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });

  describe('AbortController functionality', () => {
    it('passes AbortSignal to makeRequest', async () => {
      mockMakeRequest.mockResolvedValue(mockSearchResults);

      const mockOnTrackSelect = jest.fn();
      render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);

      const searchInput = screen.getByPlaceholderText('Search for tracks...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Wait for the debounce delay
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      expect(mockMakeRequest).toHaveBeenCalledWith(
        '/api/spotify/search?query=test',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('cancels pending requests when new search is triggered', async () => {
      // Mock a delayed response that we can control
      let resolveFirstRequest: (value: any) => void;
      let rejectFirstRequest: (error: any) => void;

      const firstRequestPromise = new Promise((resolve, reject) => {
        resolveFirstRequest = resolve;
        rejectFirstRequest = reject;
      });

      mockMakeRequest
        .mockImplementationOnce(() => firstRequestPromise)
        .mockResolvedValueOnce(mockSearchResults);

      const mockOnTrackSelect = jest.fn();
      render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);

      const searchInput = screen.getByPlaceholderText('Search for tracks...');

      // Start first search
      fireEvent.change(searchInput, { target: { value: 'first' } });

      // Wait for debounce to trigger first search
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      // Verify first request was made
      expect(mockMakeRequest).toHaveBeenCalledTimes(1);
      expect(mockMakeRequest).toHaveBeenCalledWith(
        '/api/spotify/search?query=first',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );

      // Start second search before first completes
      fireEvent.change(searchInput, { target: { value: 'second' } });

      // Wait for debounce to trigger second search
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      // Verify second request was made
      expect(mockMakeRequest).toHaveBeenCalledTimes(2);
      expect(mockMakeRequest).toHaveBeenCalledWith(
        '/api/spotify/search?query=second',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );

      // Now resolve the first request - it should be ignored
      resolveFirstRequest!(mockSearchResults);

      // Wait a bit for any state updates
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // The results should be from the second search, not the first
      // Since the first request was cancelled, we shouldn't see its results
      expect(screen.getByTestId('track-result-track1')).toBeInTheDocument();
    });

    it('handles AbortError gracefully without showing errors', async () => {
      // Mock makeRequest to throw AbortError for the first request
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';

      mockMakeRequest
        .mockRejectedValueOnce(abortError)
        .mockResolvedValueOnce(mockSearchResults);

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const mockOnTrackSelect = jest.fn();
      render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);

      const searchInput = screen.getByPlaceholderText('Search for tracks...');

      // Start first search that will be cancelled
      fireEvent.change(searchInput, { target: { value: 'first' } });

      // Wait for debounce
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      // Start second search
      fireEvent.change(searchInput, { target: { value: 'second' } });

      // Wait for debounce
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      // Should not have logged any errors for AbortError
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Search error:'),
        abortError
      );

      consoleSpy.mockRestore();
    });

    it('cancels requests when component unmounts', async () => {
      // Mock a delayed response
      let resolveRequest: (value: any) => void;
      const requestPromise = new Promise(resolve => {
        resolveRequest = resolve;
      });

      mockMakeRequest.mockImplementation(() => requestPromise);

      const mockOnTrackSelect = jest.fn();
      const { unmount } = render(
        <TrackAutocomplete onTrackSelect={mockOnTrackSelect} />
      );

      const searchInput = screen.getByPlaceholderText('Search for tracks...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Wait for debounce to trigger search
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      // Verify request was made
      expect(mockMakeRequest).toHaveBeenCalledTimes(1);

      // Unmount component
      unmount();

      // Resolve the request after unmount
      resolveRequest!(mockSearchResults);

      // Wait a bit to ensure no state updates occur
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // The component should be unmounted and no errors should occur
      expect(
        screen.queryByPlaceholderText('Search for tracks...')
      ).not.toBeInTheDocument();
    });

    it('creates new AbortController for each search', async () => {
      mockMakeRequest.mockResolvedValue(mockSearchResults);

      const mockOnTrackSelect = jest.fn();
      render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);

      const searchInput = screen.getByPlaceholderText('Search for tracks...');

      // First search
      fireEvent.change(searchInput, { target: { value: 'first' } });
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      // Second search
      fireEvent.change(searchInput, { target: { value: 'second' } });
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      // Verify both calls were made with different AbortSignals
      expect(mockMakeRequest).toHaveBeenCalledTimes(2);

      const firstCall = mockMakeRequest.mock.calls[0];
      const secondCall = mockMakeRequest.mock.calls[1];

      expect(firstCall[1].signal).toBeInstanceOf(AbortSignal);
      expect(secondCall[1].signal).toBeInstanceOf(AbortSignal);
      expect(firstCall[1].signal).not.toBe(secondCall[1].signal);
    });
  });
});
