import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EditButton from './EditButton';
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
    render(<EditButton mixtape={mixtape} />);
    expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('navigates to the edit page on click', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user1' } });
    render(<EditButton mixtape={mixtape} />);
    fireEvent.click(screen.getByTestId('edit-button'));
    expect(mockPush).toHaveBeenCalledWith('/mixtape/abc123/edit');
  });

  it('does not render for non-owner', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'otheruser' } });
    render(<EditButton mixtape={mixtape} />);
    expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
  });

  it('does not render if not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null });
    render(<EditButton mixtape={mixtape} />);
    expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
  });
}); 