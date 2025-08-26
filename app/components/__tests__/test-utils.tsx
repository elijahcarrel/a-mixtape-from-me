import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import ThemeProvider from '../ThemeProvider';

const renderWithProviders = (
  ui: React.ReactElement,
  options?: RenderOptions
) => {
  const result = render(<ThemeProvider>{ui}</ThemeProvider>, options);
  const { rerender, ...otherFields } = result;
  const rerenderWithProviders = (uiValue: React.ReactNode) =>
    rerender(<ThemeProvider>{uiValue}</ThemeProvider>);
  return { rerender: rerenderWithProviders, ...otherFields };
};

export * from '@testing-library/react';
export { renderWithProviders as render };
