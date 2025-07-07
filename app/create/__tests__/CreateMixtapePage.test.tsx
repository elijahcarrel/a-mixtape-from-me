// @ts-nocheck
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateMixtapePage from '../page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

// Mock useApiRequest
jest.mock('../../hooks/useApiRequest', () => ({
  useApiRequest: jest.fn(),
}));

import { useApiRequest } from '../../hooks/useApiRequest';

const mockedUseApiRequest = useApiRequest as jest.Mock;

describe('CreateMixtapePage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner while creating', () => {
    mockedUseApiRequest.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });
    render(<CreateMixtapePage />);
    expect(screen.getByText('Creating your mixtape...')).toBeInTheDocument();
  });

  it('redirects when mixtape is created', async () => {
    const replace = jest.fn();
    (require('next/navigation').useRouter as jest.Mock).mockReturnValue({ replace });
    mockedUseApiRequest.mockReturnValue({
      data: { public_id: 'abc123' },
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
    render(<CreateMixtapePage />);
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/mixtape/abc123');
    });
  });

  it('shows error and retry button if creation fails', () => {
    mockedUseApiRequest.mockReturnValue({
      data: null,
      loading: false,
      error: 'Something went wrong',
      refetch: jest.fn(),
    });
    render(<CreateMixtapePage />);
    expect(screen.getByText('Error Creating Mixtape')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
}); 