// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TrackAutocomplete from '../TrackAutocomplete';

// Mock useAuthenticatedRequest
const mockMakeRequest = jest.fn();
jest.mock('../../hooks/useApiRequest', () => ({
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
      images: [{ url: 'https://example.com/image1.jpg', width: 300, height: 300 }],
    },
    uri: 'spotify:track:track1',
  },
  {
    id: 'track2',
    name: 'Test Track 2',
    artists: [{ name: 'Artist 2' }],
    album: {
      name: 'Album 2',
      images: [{ url: 'https://example.com/image2.jpg', width: 300, height: 300 }],
    },
    uri: 'spotify:track:track2',
  },
];

describe('TrackAutocomplete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders search input', () => {
    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);
    
    expect(screen.getByPlaceholderText('Search for tracks...')).toBeInTheDocument();
  });

  it('shows loading spinner when searching', async () => {
    mockMakeRequest.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search for tracks...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Fast-forward debounce timer
    jest.advanceTimersByTime(1000);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('calls search API when user types', async () => {
    mockMakeRequest.mockResolvedValue({ tracks: { items: mockSearchResults } });
    
    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search for tracks...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Fast-forward debounce timer
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(mockMakeRequest).toHaveBeenCalledWith('/api/main/spotify/search?query=test');
    });
  });

  it('displays search results', async () => {
    mockMakeRequest.mockResolvedValue({ tracks: { items: mockSearchResults } });
    
    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search for tracks...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Fast-forward debounce timer
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('Test Track 1')).toBeInTheDocument();
      expect(screen.getByText('Test Track 2')).toBeInTheDocument();
      expect(screen.getByText('Artist 1')).toBeInTheDocument();
      expect(screen.getByText('Artist 2')).toBeInTheDocument();
    });
  });

  it('calls onTrackSelect when a track is clicked', async () => {
    mockMakeRequest.mockResolvedValue({ tracks: { items: mockSearchResults } });
    
    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search for tracks...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Fast-forward debounce timer
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      const firstTrack = screen.getByText('Test Track 1');
      fireEvent.click(firstTrack);
    });
    
    expect(mockOnTrackSelect).toHaveBeenCalledWith('spotify:track:track1', {
      name: 'Test Track 1',
      artists: [{ name: 'Artist 1' }],
      album: {
        name: 'Album 1',
        images: [{ url: 'https://example.com/image1.jpg', width: 300, height: 300 }],
      },
      uri: 'spotify:track:track1',
    });
  });

  it('clears search input after track selection', async () => {
    mockMakeRequest.mockResolvedValue({ tracks: { items: mockSearchResults } });
    
    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search for tracks...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Fast-forward debounce timer
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      const firstTrack = screen.getByText('Test Track 1');
      fireEvent.click(firstTrack);
    });
    
    expect(searchInput).toHaveValue('');
  });

  it('handles keyboard navigation with arrow keys', async () => {
    mockMakeRequest.mockResolvedValue({ tracks: { items: mockSearchResults } });
    
    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search for tracks...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Fast-forward debounce timer
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      // Press arrow down to select first item
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      
      // Press enter to select the highlighted item
      fireEvent.keyDown(searchInput, { key: 'Enter' });
    });
    
    expect(mockOnTrackSelect).toHaveBeenCalledWith('spotify:track:track1', expect.any(Object));
  });

  it('closes dropdown when escape key is pressed', async () => {
    mockMakeRequest.mockResolvedValue({ tracks: { items: mockSearchResults } });
    
    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search for tracks...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Fast-forward debounce timer
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('Test Track 1')).toBeInTheDocument();
      
      // Press escape to close dropdown
      fireEvent.keyDown(searchInput, { key: 'Escape' });
    });
    
    expect(screen.queryByText('Test Track 1')).not.toBeInTheDocument();
  });

  it('handles empty search results', async () => {
    mockMakeRequest.mockResolvedValue({ tracks: { items: [] } });
    
    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search for tracks...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    // Fast-forward debounce timer
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.queryByText('Test Track 1')).not.toBeInTheDocument();
    });
  });

  it('handles search API errors gracefully', async () => {
    mockMakeRequest.mockRejectedValue(new Error('Search failed'));
    
    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search for tracks...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Fast-forward debounce timer
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.queryByText('Test Track 1')).not.toBeInTheDocument();
    });
  });

  it('debounces search requests', async () => {
    mockMakeRequest.mockResolvedValue({ tracks: { items: mockSearchResults } });
    
    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search for tracks...');
    
    // Type multiple characters quickly
    fireEvent.change(searchInput, { target: { value: 't' } });
    fireEvent.change(searchInput, { target: { value: 'te' } });
    fireEvent.change(searchInput, { target: { value: 'tes' } });
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Only advance part of the debounce time
    jest.advanceTimersByTime(500);
    
    expect(mockMakeRequest).not.toHaveBeenCalled();
    
    // Complete the debounce time
    jest.advanceTimersByTime(500);
    
    await waitFor(() => {
      expect(mockMakeRequest).toHaveBeenCalledTimes(1);
      expect(mockMakeRequest).toHaveBeenCalledWith('/api/main/spotify/search?query=test');
    });
  });
}); 