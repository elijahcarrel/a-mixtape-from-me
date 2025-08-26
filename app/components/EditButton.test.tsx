import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EditButton from './EditButton';
import ThemeProvider from './ThemeProvider';
import '@testing-library/jest-dom';
import { MixtapeResponse } from '../client';

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
  const mixtape: MixtapeResponse = {
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
    can_undo: true,
    can_redo: false,
    version: 5,
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
    // Should have two responsive versions
    const editButtons = screen.getAllByTestId('edit-button');
    expect(editButtons).toHaveLength(2);

    // Check that the text appears in the large screen version
    const allEditButtons = screen.getAllByTestId('edit-button');
    const largeScreenButton = allEditButtons.find(button =>
      button.closest('.hidden.sm\\:block')
    );
    expect(largeScreenButton).toBeDefined();

    const editText = largeScreenButton?.querySelector('span');
    expect(editText).toHaveTextContent('Edit');
  });

  it('renders link to edit page', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user1' } });
    render(
      <ThemeProvider>
        <EditButton mixtape={mixtape} />
      </ThemeProvider>
    );
    // Should have two responsive versions
    const editButtons = screen.getAllByTestId('edit-button');
    expect(editButtons).toHaveLength(2);

    // Check that both have the correct href
    editButtons.forEach(button => {
      expect(button).toHaveAttribute('href', '/mixtape/abc123/edit');
    });
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
