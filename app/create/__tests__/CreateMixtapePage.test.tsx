// @ts-nocheck
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../../components/__tests__/test-utils';
import '@testing-library/jest-dom';
import CreateMixtapePage from '../page';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/create',
}));

// Mock useAuthenticatedRequest
const mockMakeRequest = jest.fn();
jest.mock('../../hooks/useApiRequest', () => ({
  useAuthenticatedRequest: () => ({
    makeRequest: mockMakeRequest,
  }),
}));

// Mock useAuth
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 'test-user' },
  }),
}));

describe('CreateMixtapePage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows create button initially', () => {
    render(<CreateMixtapePage />);
    expect(screen.getByText('Create a New Mixtape')).toBeInTheDocument();
    expect(screen.getByText('Start Creating')).toBeInTheDocument();
  });

  it('shows loading state when creating', async () => {
    mockMakeRequest.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ public_id: 'test-123' }), 100))
    );

    render(<CreateMixtapePage />);
    
    const createButton = screen.getByText('Start Creating');
    fireEvent.click(createButton);

    expect(screen.getByText('Creating...')).toBeInTheDocument();
  });

  it('shows mixtape editor after creation', async () => {
    mockMakeRequest.mockResolvedValue({ public_id: 'test-123' });

    render(<CreateMixtapePage />);
    
    const createButton = screen.getByText('Start Creating');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Untitled Mixtape')).toBeInTheDocument();
    });
  });
}); 