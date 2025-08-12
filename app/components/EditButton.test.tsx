import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EditButton from './EditButton';
import ThemeProvider from './ThemeProvider';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUseAuth = jest.fn();
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('EditButton', () => {
  const mixtape = {
    public_id: 'abc123',
    stack_auth_user_id: 'user1',
    name: 'Test',
    subtitle1: '',
    subtitle2: '',
    subtitle3: '',
    intro_text: '',
    is_public: true,
    create_time: '',
    last_modified_time: '',
    tracks: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders for the owner', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user1' } });
    render(
      <ThemeProvider>
        <EditButton mixtape={mixtape} />
      </ThemeProvider>
    );
    expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('renders link to edit page', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user1' } });
    render(
      <ThemeProvider>
        <EditButton mixtape={mixtape} />
      </ThemeProvider>
    );
    const link = screen.getByTestId('edit-button');
    expect(link).toHaveAttribute('href', '/mixtape/abc123/edit');
  });

  it('does not render for non-owner', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'otheruser' } });
    render(
      <ThemeProvider>
        <EditButton mixtape={mixtape} />
      </ThemeProvider>
    );
    expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
  });

  it('does not render if not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null });
    render(
      <ThemeProvider>
        <EditButton mixtape={mixtape} />
      </ThemeProvider>
    );
    expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
  });
}); 