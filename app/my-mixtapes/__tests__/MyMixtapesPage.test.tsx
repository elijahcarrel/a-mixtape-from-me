import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '../../components/__tests__/test-utils';
import '@testing-library/jest-dom';
import MyMixtapesPage from '../page';

// Mock useAuthenticatedRequest similar to TrackAutocomplete tests
const mockMakeRequest = jest.fn();
jest.mock('../../hooks/useAuthenticatedRequest', () => ({
  useAuthenticatedRequest: () => ({
    makeRequest: mockMakeRequest,
  }),
}));

const buildMixtape = (id: string, name: string, date: Date) => ({
  public_id: id,
  name,
  last_modified_time: date.toISOString(),
});

describe('MyMixtapesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading then empty state', async () => {
    mockMakeRequest.mockResolvedValueOnce([]);
    render(<MyMixtapesPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/no mixtapes found/i)).toBeInTheDocument());
  });

  it('renders mixtape items with title and relative time', async () => {
    const now = new Date();
    const mixtapes = [
      buildMixtape('abc', 'Test Mixtape', now),
      buildMixtape('def', 'Old Mixtape', new Date(now.getTime() - 3600 * 1000)), // 1 hour ago
    ];
    mockMakeRequest.mockResolvedValueOnce(mixtapes);
    render(<MyMixtapesPage />);
    await waitFor(() => expect(screen.getByText('Test Mixtape')).toBeInTheDocument());
    expect(screen.getByText('Old Mixtape')).toBeInTheDocument();
    expect(screen.getAllByText(/ago|just now/i).length).toBeGreaterThan(0);
  });

  it('shows error on fetch failure', async () => {
    mockMakeRequest.mockRejectedValueOnce(new Error('Unauthorized'));
    render(<MyMixtapesPage />);
    await waitFor(() => expect(screen.getByText(/unauthorized/i)).toBeInTheDocument());
  });

  it('calls search API when user types, with debounce', async () => {
    mockMakeRequest.mockResolvedValue([]);
    render(<MyMixtapesPage />);

    const searchInput = screen.getByPlaceholderText('Search mixtapes...');
    fireEvent.change(searchInput, { target: { value: 'rock' } });

    // wait for debounce (1000ms)
    await act(async () => {
      await new Promise((res) => setTimeout(res, 1100));
    });

    expect(mockMakeRequest).toHaveBeenLastCalledWith(expect.stringContaining('q=rock'), expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('paginates results with next and previous buttons', async () => {
    // First page results (limit 10)
    const firstPage = Array.from({ length: 10 }).map((_, idx) => buildMixtape(String(idx), `Mixtape ${idx}`, new Date()));
    const secondPage = Array.from({ length: 5 }).map((_, idx) => buildMixtape(String(idx + 10), `Mixtape ${idx + 10}`, new Date()));

    mockMakeRequest
      .mockResolvedValueOnce(firstPage) // initial load
      .mockResolvedValueOnce(secondPage); // after next click

    render(<MyMixtapesPage />);

    // Wait for first page render
    await waitFor(() => expect(screen.getByText('Mixtape 0')).toBeInTheDocument());

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => expect(screen.getByText('Mixtape 10')).toBeInTheDocument());

    const prevButton = screen.getByText('Previous');
    fireEvent.click(prevButton);

    // Third call after previous click
    expect(mockMakeRequest).toHaveBeenCalledTimes(3);
  });
}); 