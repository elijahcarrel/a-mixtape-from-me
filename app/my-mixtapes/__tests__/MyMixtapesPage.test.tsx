import React from 'react';
import { render, screen, waitFor } from '../../components/__tests__/test-utils';
import '@testing-library/jest-dom';
import MyMixtapesPage from '../page';

describe('MyMixtapesPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows loading then empty state', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
    render(<MyMixtapesPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/no mixtapes found/i)).toBeInTheDocument());
  });

  it('renders mixtape items with title and relative time', async () => {
    const now = new Date();
    const mixtapes = [
      {
        public_id: 'abc',
        name: 'Test Mixtape',
        last_modified_time: now.toISOString(),
      },
      {
        public_id: 'def',
        name: 'Old Mixtape',
        last_modified_time: new Date(now.getTime() - 3600 * 1000).toISOString(), // 1 hour ago
      },
    ];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mixtapes,
    });
    render(<MyMixtapesPage />);
    await waitFor(() => expect(screen.getByText('Test Mixtape')).toBeInTheDocument());
    expect(screen.getByText('Old Mixtape')).toBeInTheDocument();
    // Relative time checks
    expect(screen.getAllByText(/ago|just now/i).length).toBeGreaterThan(0);
    // Link check
    expect(screen.getByText('Test Mixtape').closest('a')).toHaveAttribute('href', '/mixtape/abc/edit');
  });

  it('shows error on fetch failure', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => 'Unauthorized',
    });
    render(<MyMixtapesPage />);
    await waitFor(() => expect(screen.getByText(/unauthorized/i)).toBeInTheDocument());
  });
}); 