import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PreviewButton from '../PreviewButton';
import '@testing-library/jest-dom';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('PreviewButton', () => {
  const mixtape = {
    public_id: 'abc123',
    stack_auth_user_id: 'user1',
    name: 'Test',
    intro_text: '',
    cassette_text: '',
    is_public: true,
    create_time: '',
    last_modified_time: '',
    tracks: [],
  };

  it('navigates to the viewer page on click', () => {
    render(<PreviewButton mixtape={mixtape} />);
    fireEvent.click(screen.getByTestId('preview-button'));
    expect(mockPush).toHaveBeenCalledWith('/mixtape/abc123');
  });
}); 