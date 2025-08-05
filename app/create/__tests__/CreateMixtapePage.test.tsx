import React from 'react';
import { render, screen } from '../../components/__tests__/test-utils';
import '@testing-library/jest-dom';
import CreateMixtapePage from '../page';

// Use a Jest-allowed mock variable name
const mockReplace = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
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
    mockedUseApiRequest.mockReturnValue({
      data: { public_id: 'abc123' },
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
    render(<CreateMixtapePage />);
    await expect(mockReplace).toHaveBeenCalledWith('/mixtape/abc123/edit');
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