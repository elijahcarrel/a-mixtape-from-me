import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InteractiveCassetteEditor from '../InteractiveCassetteEditor';

describe('InteractiveCassetteEditor', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders cassette with label text', () => {
    render(
      <InteractiveCassetteEditor
        value="Test line\nSecond line\nThird line\nFourth line"
        onChange={mockOnChange}
        theme="light"
      />
    );

    // Check that the cassette SVG is rendered
    expect(screen.getByLabelText('Cassette tape')).toBeInTheDocument();
  });

  it('opens editor when line is clicked', () => {
    render(
      <InteractiveCassetteEditor
        value="Test line\nSecond line\nThird line\nFourth line"
        onChange={mockOnChange}
        theme="light"
      />
    );

    const firstLine = screen.getByTestId('line-0');
    fireEvent.click(firstLine);

    // Should show the editor overlay
    expect(screen.getByText('Edit Line 1 (max 60 characters)')).toBeInTheDocument();
  });

  it('saves changes when pressing Enter', async () => {
    render(
      <InteractiveCassetteEditor
        value="Test line\nSecond line\nThird line\nFourth line"
        onChange={mockOnChange}
        theme="light"
      />
    );

    const firstLine = screen.getByTestId('line-0');
    fireEvent.click(firstLine);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Updated line' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('Updated line');
    });
  });

  it('cancels changes when pressing Escape', () => {
    render(
      <InteractiveCassetteEditor
        value="Test line\nSecond line\nThird line\nFourth line"
        onChange={mockOnChange}
        theme="light"
      />
    );

    const firstLine = screen.getByTestId('line-0');
    fireEvent.click(firstLine);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Updated line' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    // Should not call onChange
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('saves changes when Save button is clicked', async () => {
    render(
      <InteractiveCassetteEditor
        value="Test line\nSecond line\nThird line\nFourth line"
        onChange={mockOnChange}
        theme="light"
      />
    );

    const firstLine = screen.getByTestId('line-0');
    fireEvent.click(firstLine);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Updated line' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('Updated line');
    });
  });

  it('cancels changes when Cancel button is clicked', () => {
    render(
      <InteractiveCassetteEditor
        value="Test line\nSecond line\nThird line\nFourth line"
        onChange={mockOnChange}
        theme="light"
      />
    );

    const firstLine = screen.getByTestId('line-0');
    fireEvent.click(firstLine);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Updated line' } });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Should not call onChange
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('enforces character limit', () => {
    render(
      <InteractiveCassetteEditor
        value="Test line\nSecond line\nThird line\nFourth line"
        onChange={mockOnChange}
        theme="light"
      />
    );

    const firstLine = screen.getByTestId('line-0');
    fireEvent.click(firstLine);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxlength', '60');
  });
}); 