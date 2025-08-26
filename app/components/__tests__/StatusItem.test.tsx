import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusItem from '../StatusItem';
import { Eye } from 'lucide-react';

describe('StatusItem', () => {
  const defaultProps = {
    icon: Eye,
    text: 'Test Status',
  };

  it('renders icon and text', () => {
    render(<StatusItem {...defaultProps} />);
    
    expect(screen.getByTitle('Test Status')).toBeInTheDocument();
    expect(screen.getByText('Test Status')).toBeInTheDocument();
  });

  it('applies custom icon className', () => {
    render(
      <StatusItem
        {...defaultProps}
        iconClassName="custom-icon-class"
      />
    );
    
    const icon = screen.getByTitle('Test Status');
    expect(icon.firstChild).toHaveClass('custom-icon-class');
  });

  it('applies custom text className', () => {
    render(
      <StatusItem
        {...defaultProps}
        textClassName="custom-text-class"
      />
    );
    
    expect(screen.getByText('Test Status')).toHaveClass('custom-text-class');
  });

  it('has cursor-help class on icon container', () => {
    render(<StatusItem {...defaultProps} />);
    
    const iconContainer = screen.getByTitle('Test Status');
    expect(iconContainer).toHaveClass('cursor-help');
  });

  it('text has hidden sm:inline classes for responsive behavior', () => {
    render(<StatusItem {...defaultProps} />);
    
    const text = screen.getByText('Test Status');
    expect(text).toHaveClass('hidden', 'sm:inline');
  });

  it('renders without text when text is empty string', () => {
    render(<StatusItem {...defaultProps} text="" />);
    
    expect(screen.queryByText('Test Status')).not.toBeInTheDocument();
    expect(screen.getByTitle('')).toBeInTheDocument();
  });

  it('renders with default empty className strings', () => {
    render(<StatusItem {...defaultProps} />);
    
    const icon = screen.getByTitle('Test Status');
    const text = screen.getByText('Test Status');
    
    // Should not have undefined or null classes
    expect(icon.firstChild).not.toHaveClass('undefined');
    expect(icon.firstChild).not.toHaveClass('null');
    expect(text).not.toHaveClass('undefined');
    expect(text).not.toHaveClass('null');
  });
});
