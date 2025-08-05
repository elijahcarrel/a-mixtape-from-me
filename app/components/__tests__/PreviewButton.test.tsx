import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PreviewButton from '../PreviewButton';
import { MixtapeResponse } from '../../client';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockMixtape: MixtapeResponse = {
  public_id: 'test-mixtape-123',
  name: 'Test Mixtape',
  intro_text: 'A test mixtape',
  subtitle1: '',
  subtitle2: '',
  subtitle3: '',
  is_public: true,
  create_time: '2023-01-01T00:00:00Z',
  last_modified_time: '2023-01-01T00:00:00Z',
  stack_auth_user_id: 'user123',
  tracks: [],
};

describe('PreviewButton', () => {
  it('navigates to the viewer page on click', () => {
    render(<PreviewButton mixtape={mockMixtape} />);
    fireEvent.click(screen.getByTestId('preview-button'));
    expect(mockPush).toHaveBeenCalledWith('/mixtape/abc123');
  }); 
}); 