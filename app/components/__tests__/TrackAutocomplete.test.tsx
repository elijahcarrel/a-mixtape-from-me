// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from './test-utils';
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
  });

  it('renders search input', () => {
    const mockOnTrackSelect = jest.fn();
    render(<TrackAutocomplete onTrackSelect={mockOnTrackSelect} />);
    
    expect(screen.getByPlaceholderText('Search for tracks...')).toBeInTheDocument();
  });

  it('shows loading spinner when searching', async () => {
    // Mock a delayed response that takes longer to complete
    mockMakeRequest.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve([]), 200);
    }));
    
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
    
    expect(mockMakeRequest).toHaveBeenCalledWith('/api/spotify/search?query=test');
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
        images: [{ url: 'https://example.com/image1.jpg', width: 300, height: 300 }],
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
    
    expect(mockOnTrackSelect).toHaveBeenCalledWith('spotify:track:track1', expect.any(Object));
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
    expect(mockMakeRequest).toHaveBeenCalledWith('/api/spotify/search?query=test');
  });
}); 