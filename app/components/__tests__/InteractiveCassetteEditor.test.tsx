import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InteractiveCassetteEditor from '../InteractiveCassetteEditor';

// Mock the theme context
const mockTheme = 'light';

describe('InteractiveCassetteEditor', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders the cassette preview', () => {
    render(
      <InteractiveCassetteEditor
        value=""
        onChange={mockOnChange}
        theme={mockTheme}
      />
    );

    expect(screen.getByLabelText('Cassette tape')).toBeInTheDocument();
  });

  it('displays existing text on the cassette', () => {
    const testValue = "Line 1\nLine 2\nLine 3";
    
    render(
      <InteractiveCassetteEditor
        value={testValue}
        onChange={mockOnChange}
        theme={mockTheme}
      />
    );

    expect(screen.getByText('Line 1')).toBeInTheDocument();
    expect(screen.getByText('Line 2')).toBeInTheDocument();
    expect(screen.getByText('Line 3')).toBeInTheDocument();
  });

  it('shows character count for each line', () => {
    const testValue = "Short\nMedium length text\nVery long text that exceeds limit";
    
    render(
      <InteractiveCassetteEditor
        value={testValue}
        onChange={mockOnChange}
        theme={mockTheme}
      />
    );

    expect(screen.getByTestId('count-0')).toHaveTextContent('5/35');
    expect(screen.getByTestId('count-1')).toHaveTextContent('18/40');
    expect(screen.getByTestId('count-2')).toHaveTextContent('33/40');
  });

  it('opens editor when clicking on a line', () => {
    render(
      <InteractiveCassetteEditor
        value="Test line"
        onChange={mockOnChange}
        theme={mockTheme}
      />
    );

    // Find and click on the first line using test ID
    const firstLine = screen.getByTestId('line-0');
    fireEvent.click(firstLine);

    // Should show the editor overlay
    expect(screen.getByText('Edit Line 1 (max 35 characters)')).toBeInTheDocument();
  });

  it('saves changes when pressing Enter', async () => {
    render(
      <InteractiveCassetteEditor
        value="Original text"
        onChange={mockOnChange}
        theme={mockTheme}
      />
    );

    // Open editor
    const firstLine = screen.getByTestId('line-0');
    fireEvent.click(firstLine);

    // Type new text
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New text' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('New text');
    });
  });

  it('cancels changes when pressing Escape', () => {
    render(
      <InteractiveCassetteEditor
        value="Original text"
        onChange={mockOnChange}
        theme={mockTheme}
      />
    );

    // Open editor
    const firstLine = screen.getByTestId('line-0');
    fireEvent.click(firstLine);

    // Type new text
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New text' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    // Should not call onChange
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('shows instructions to the user', () => {
    render(
      <InteractiveCassetteEditor
        value=""
        onChange={mockOnChange}
        theme={mockTheme}
      />
    );

    expect(screen.getByText(/Click on any line to edit/)).toBeInTheDocument();
    expect(screen.getByText(/Press Enter to save/)).toBeInTheDocument();
    expect(screen.getByText(/Press Esc to cancel/)).toBeInTheDocument();
  });
}); 