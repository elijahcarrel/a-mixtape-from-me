import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import MixtapeViewer from '../MixtapeViewer';

jest.mock('../EditButton', () => {
  const mockReact = require('react');
  return function MockEditButton() {
    return (
      <div data-testid="mock-edit-button" />
    );
  };
});

const mockMixtape = {
  public_id: 'test-mixtape-123',
  name: 'Test Mixtape',
  intro_text: 'A test mixtape',
  is_public: true,
  create_time: '2023-01-01T00:00:00Z',
  last_modified_time: '2023-01-01T00:00:00Z',
  stack_auth_user_id: 'user123',
  tracks: [],
};

describe('MixtapeViewer', () => {
  it('renders the EditButton', () => {
    render(<MixtapeViewer mixtape={mockMixtape} />);
    expect(screen.getByTestId('mock-edit-button')).toBeInTheDocument();
  });
}); 