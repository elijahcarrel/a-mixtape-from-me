import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InteractiveCassetteEditor from '../InteractiveCassetteEditor';

describe('InteractiveCassetteEditor', () => {
  const mockOnTitleChange = jest.fn();
  const mockOnSubtitle1Change = jest.fn();
  const mockOnSubtitle2Change = jest.fn();
  const mockOnSubtitle3Change = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders cassette with label text', () => {
    render(
      <InteractiveCassetteEditor
        title="Test line"
        subtitle1="Second line"
        subtitle2="Third line"
        subtitle3="Fourth line"
        onTitleChange={mockOnTitleChange}
        onSubtitle1Change={mockOnSubtitle1Change}
        onSubtitle2Change={mockOnSubtitle2Change}
        onSubtitle3Change={mockOnSubtitle3Change}
        theme="light"
      />
    );

    // Check that the cassette SVG is rendered
    expect(screen.getByLabelText('Cassette tape')).toBeInTheDocument();
  });

  it('opens editor when line is clicked', () => {
    render(
      <InteractiveCassetteEditor
        title="Test line"
        subtitle1="Second line"
        subtitle2="Third line"
        subtitle3="Fourth line"
        onTitleChange={mockOnTitleChange}
        onSubtitle1Change={mockOnSubtitle1Change}
        onSubtitle2Change={mockOnSubtitle2Change}
        onSubtitle3Change={mockOnSubtitle3Change}
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
        title="Test line"
        subtitle1="Second line"
        subtitle2="Third line"
        subtitle3="Fourth line"
        onTitleChange={mockOnTitleChange}
        onSubtitle1Change={mockOnSubtitle1Change}
        onSubtitle2Change={mockOnSubtitle2Change}
        onSubtitle3Change={mockOnSubtitle3Change}
        theme="light"
      />
    );

    const firstLine = screen.getByTestId('line-0');
    fireEvent.click(firstLine);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Updated line' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockOnTitleChange).toHaveBeenCalledWith('Updated line');
    });
  });

  it('cancels changes when pressing Escape', () => {
    render(
      <InteractiveCassetteEditor
        title="Test line"
        subtitle1="Second line"
        subtitle2="Third line"
        subtitle3="Fourth line"
        onTitleChange={mockOnTitleChange}
        onSubtitle1Change={mockOnSubtitle1Change}
        onSubtitle2Change={mockOnSubtitle2Change}
        onSubtitle3Change={mockOnSubtitle3Change}
        theme="light"
      />
    );

    const firstLine = screen.getByTestId('line-0');
    fireEvent.click(firstLine);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Updated line' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    // Should not call onChange
    expect(mockOnTitleChange).not.toHaveBeenCalled();
  });

  it('saves changes when Save button is clicked', async () => {
    render(
      <InteractiveCassetteEditor
        title="Test line"
        subtitle1="Second line"
        subtitle2="Third line"
        subtitle3="Fourth line"
        onTitleChange={mockOnTitleChange}
        onSubtitle1Change={mockOnSubtitle1Change}
        onSubtitle2Change={mockOnSubtitle2Change}
        onSubtitle3Change={mockOnSubtitle3Change}
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
      expect(mockOnTitleChange).toHaveBeenCalledWith('Updated line');
    });
  });

  it('cancels changes when Cancel button is clicked', () => {
    render(
      <InteractiveCassetteEditor
        title="Test line"
        subtitle1="Second line"
        subtitle2="Third line"
        subtitle3="Fourth line"
        onTitleChange={mockOnTitleChange}
        onSubtitle1Change={mockOnSubtitle1Change}
        onSubtitle2Change={mockOnSubtitle2Change}
        onSubtitle3Change={mockOnSubtitle3Change}
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
    expect(mockOnTitleChange).not.toHaveBeenCalled();
  });

  it('enforces character limit', () => {
    render(
      <InteractiveCassetteEditor
        title="Test line"
        subtitle1="Second line"
        subtitle2="Third line"
        subtitle3="Fourth line"
        onTitleChange={mockOnTitleChange}
        onSubtitle1Change={mockOnSubtitle1Change}
        onSubtitle2Change={mockOnSubtitle2Change}
        onSubtitle3Change={mockOnSubtitle3Change}
        theme="light"
      />
    );

    const firstLine = screen.getByTestId('line-0');
    fireEvent.click(firstLine);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxlength', '60');
  });

  it('calls correct change handler for each line', async () => {
    render(
      <InteractiveCassetteEditor
        title="Test line"
        subtitle1="Second line"
        subtitle2="Third line"
        subtitle3="Fourth line"
        onTitleChange={mockOnTitleChange}
        onSubtitle1Change={mockOnSubtitle1Change}
        onSubtitle2Change={mockOnSubtitle2Change}
        onSubtitle3Change={mockOnSubtitle3Change}
        theme="light"
      />
    );

    // Test title line (line 0)
    const titleLine = screen.getByTestId('line-0');
    fireEvent.click(titleLine);
    const titleInput = screen.getByRole('textbox');
    fireEvent.change(titleInput, { target: { value: 'Updated title' } });
    fireEvent.keyDown(titleInput, { key: 'Enter' });

    await waitFor(() => {
      expect(mockOnTitleChange).toHaveBeenCalledWith('Updated title');
    });

    // Test subtitle1 line (line 1)
    const subtitle1Line = screen.getByTestId('line-1');
    fireEvent.click(subtitle1Line);
    const subtitle1Input = screen.getByRole('textbox');
    fireEvent.change(subtitle1Input, { target: { value: 'Updated subtitle1' } });
    fireEvent.keyDown(subtitle1Input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockOnSubtitle1Change).toHaveBeenCalledWith('Updated subtitle1');
    });

    // Test subtitle2 line (line 2)
    const subtitle2Line = screen.getByTestId('line-2');
    fireEvent.click(subtitle2Line);
    const subtitle2Input = screen.getByRole('textbox');
    fireEvent.change(subtitle2Input, { target: { value: 'Updated subtitle2' } });
    fireEvent.keyDown(subtitle2Input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockOnSubtitle2Change).toHaveBeenCalledWith('Updated subtitle2');
    });

    // Test subtitle3 line (line 3)
    const subtitle3Line = screen.getByTestId('line-3');
    fireEvent.click(subtitle3Line);
    const subtitle3Input = screen.getByRole('textbox');
    fireEvent.change(subtitle3Input, { target: { value: 'Updated subtitle3' } });
    fireEvent.keyDown(subtitle3Input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockOnSubtitle3Change).toHaveBeenCalledWith('Updated subtitle3');
    });
  });
}); 