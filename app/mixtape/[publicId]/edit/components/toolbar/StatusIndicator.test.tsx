import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusIndicator from './StatusIndicator';
import { History, RefreshCcw, CloudCheck } from 'lucide-react';

// Mock the StatusItem component to make testing easier
jest.mock('../StatusItem', () => {
  return function MockStatusItem({
    icon: Icon,
    text,
    iconClassName,
    textClassName,
  }: any) {
    // Get the display name or name from the icon component
    const iconName = Icon.displayName || Icon.name || 'UnknownIcon';
    return (
      <div
        data-testid="status-item"
        data-icon={iconName}
        data-text={text}
        data-icon-class={iconClassName || ''}
        data-text-class={textClassName || ''}
      >
        <Icon />
        <span>{text}</span>
      </div>
    );
  };
});

describe('StatusIndicator', () => {
  const defaultProps = {
    isUndoing: false,
    isRedoing: false,
    isSaving: false,
    statusText: 'Saved',
  };

  it('renders default status when no operations are in progress', () => {
    render(<StatusIndicator {...defaultProps} />);

    const statusItem = screen.getByTestId('status-item');
    expect(statusItem).toBeInTheDocument();
    expect(statusItem).toHaveAttribute('data-icon', 'CloudCheck');
    expect(statusItem).toHaveAttribute('data-text', 'Saved');
  });

  it('renders undoing status when isUndoing is true', () => {
    render(<StatusIndicator {...defaultProps} isUndoing={true} />);

    const statusItem = screen.getByTestId('status-item');
    expect(statusItem).toHaveAttribute('data-icon', 'History');
    expect(statusItem).toHaveAttribute('data-text', 'Undoing...');
    expect(statusItem).toHaveAttribute('data-icon-class', 'spinReverse');
  });

  it('renders redoing status when isRedoing is true', () => {
    render(<StatusIndicator {...defaultProps} isRedoing={true} />);

    const statusItem = screen.getByTestId('status-item');
    expect(statusItem).toHaveAttribute('data-icon', 'History');
    expect(statusItem).toHaveAttribute('data-text', 'Redoing...');
    expect(statusItem).toHaveAttribute(
      'data-icon-class',
      'spinReverse scale-x-[-1]'
    );
  });

  it('renders saving status when isSaving is true', () => {
    render(<StatusIndicator {...defaultProps} isSaving={true} />);

    const statusItem = screen.getByTestId('status-item');
    expect(statusItem).toHaveAttribute('data-icon', 'RefreshCcw');
    expect(statusItem).toHaveAttribute('data-text', 'Saving...');
    expect(statusItem).toHaveAttribute('data-icon-class', 'spinReverse');
  });

  it('prioritizes undoing over other states', () => {
    render(
      <StatusIndicator
        {...defaultProps}
        isUndoing={true}
        isRedoing={true}
        isSaving={true}
      />
    );

    const statusItem = screen.getByTestId('status-item');
    expect(statusItem).toHaveAttribute('data-text', 'Undoing...');
  });

  it('prioritizes redoing over saving when undoing is false', () => {
    render(
      <StatusIndicator
        {...defaultProps}
        isUndoing={false}
        isRedoing={true}
        isSaving={true}
      />
    );

    const statusItem = screen.getByTestId('status-item');
    expect(statusItem).toHaveAttribute('data-text', 'Redoing...');
  });

  it('shows custom status text when no operations are in progress', () => {
    render(<StatusIndicator {...defaultProps} statusText="Custom Status" />);

    const statusItem = screen.getByTestId('status-item');
    expect(statusItem).toHaveAttribute('data-text', 'Custom Status');
  });

  it('renders only one status item at a time', () => {
    render(<StatusIndicator {...defaultProps} isUndoing={true} />);

    const statusItems = screen.getAllByTestId('status-item');
    expect(statusItems).toHaveLength(1);
  });
});
