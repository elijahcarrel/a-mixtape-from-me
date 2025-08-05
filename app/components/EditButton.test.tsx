import React from 'react';
import { screen } from '@testing-library/react';
import { render } from './__tests__/test-utils';
import '@testing-library/jest-dom';
import EditButton from './EditButton';
import { MixtapeResponse } from '../client';

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
  stack_auth_user_id: 'test-user-id',
  tracks: [],
};

describe('EditButton', () => {
  it('renders edit button', () => {
    render(<EditButton mixtape={mockMixtape} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
}); 