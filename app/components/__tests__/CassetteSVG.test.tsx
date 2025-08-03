import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CassetteSVG from '../CassetteSVG';

describe('CassetteSVG', () => {
  it('renders the cassette with basic props', () => {
    render(
      <CassetteSVG
        isAnimated={false}
        labelText={{
          line1: 'Test Line 1',
          line2: 'Test Line 2'
        }}
      />
    );

    expect(screen.getByLabelText('Cassette tape')).toBeInTheDocument();
    expect(screen.getByText('Test Line 1')).toBeInTheDocument();
    expect(screen.getByText('Test Line 2')).toBeInTheDocument();
  });

  it('renders in interactive mode with clickable areas', () => {
    const mockOnLineClick = jest.fn();
    
    render(
      <CassetteSVG
        isAnimated={false}
        labelText={{
          line1: 'Interactive Line 1',
          line2: 'Interactive Line 2'
        }}
        isInteractive={true}
        onLineClick={mockOnLineClick}
        showCharacterCounts={true}
      />
    );

    expect(screen.getByLabelText('Cassette tape')).toBeInTheDocument();
    expect(screen.getByText('Interactive Line 1')).toBeInTheDocument();
    expect(screen.getByText('Interactive Line 2')).toBeInTheDocument();
    
    // Should have clickable areas
    expect(screen.getByTestId('line-0')).toBeInTheDocument();
    expect(screen.getByTestId('line-1')).toBeInTheDocument();
    expect(screen.getByTestId('line-2')).toBeInTheDocument();
    
    // Should have character counts
    expect(screen.getByTestId('count-0')).toBeInTheDocument();
    expect(screen.getByTestId('count-1')).toBeInTheDocument();
  });

  it('hides text when editing a line', () => {
    render(
      <CassetteSVG
        isAnimated={false}
        labelText={{
          line1: 'Hidden Line',
          line2: 'Visible Line'
        }}
        isInteractive={true}
        editingLine={0}
        showCharacterCounts={true}
      />
    );

    // The first line should be hidden (has 'hidden' class)
    const firstLineText = screen.getByTestId('text-0');
    expect(firstLineText).toHaveClass('hidden');
    
    // The second line should be visible
    const secondLineText = screen.getByTestId('text-1');
    expect(secondLineText).not.toHaveClass('hidden');
  });
}); 