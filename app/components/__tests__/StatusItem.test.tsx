import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusItem from '../StatusItem';
import { Eye } from 'lucide-react';

// Mock the Tooltip component to make testing easier
jest.mock('../Tooltip', () => {
  return function MockTooltip({ content, children }: any) {
    return (
      <div data-testid="tooltip" data-content={content}>
        {children}
      </div>
    );
  };
});

describe('StatusItem', () => {
  const defaultProps = {
    icon: Eye,
    text: 'Test Status',
  };

  it('renders icon and text', () => {
    render(<StatusItem {...defaultProps} />);

    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Test Status')).toBeInTheDocument();
  });

  it('applies custom icon className', () => {
    render(<StatusItem {...defaultProps} iconClassName="custom-icon-class" />);

    const icon = screen.getByTestId('tooltip').querySelector('svg');
    expect(icon).toHaveClass('custom-icon-class');
  });

  it('applies custom text className', () => {
    render(<StatusItem {...defaultProps} textClassName="custom-text-class" />);

    expect(screen.getByText('Test Status')).toHaveClass('custom-text-class');
  });

  it('passes text content to Tooltip', () => {
    render(<StatusItem {...defaultProps} />);

    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip).toHaveAttribute('data-content', 'Test Status');
  });

  it('text has hidden sm:inline classes for responsive behavior', () => {
    render(<StatusItem {...defaultProps} />);

    const text = screen.getByText('Test Status');
    expect(text).toHaveClass('hidden', 'sm:inline');
  });

  it('renders without text when text is empty string', () => {
    render(<StatusItem {...defaultProps} text="" />);

    expect(screen.queryByText('Test Status')).not.toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toHaveAttribute('data-content', '');
  });

  it('automatically applies opacity-50 to icon and text', () => {
    render(<StatusItem {...defaultProps} />);

    const icon = screen.getByTestId('tooltip').querySelector('svg');
    const text = screen.getByText('Test Status');

    expect(icon).toHaveClass('opacity-50');
    expect(text).toHaveClass('opacity-50');
  });

  it('combines custom iconClassName with default opacity-50', () => {
    render(<StatusItem {...defaultProps} iconClassName="custom-icon-class" />);

    const icon = screen.getByTestId('tooltip').querySelector('svg');
    expect(icon).toHaveClass('opacity-50', 'custom-icon-class');
  });

  it('combines custom textClassName with default opacity-50', () => {
    render(<StatusItem {...defaultProps} textClassName="custom-text-class" />);

    const text = screen.getByText('Test Status');
    expect(text).toHaveClass('opacity-50', 'custom-text-class');
  });
});
