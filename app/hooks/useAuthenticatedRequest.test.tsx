import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useAuthenticatedRequest } from './useAuthenticatedRequest';

// Mock dependencies
const mockUser = {
  getAuthJson: jest.fn().mockResolvedValue({ accessToken: 'test-token' }),
};

const mockRouter = {
  replace: jest.fn(),
};

const mockFetch = jest.fn();

// Mock the dependencies
jest.mock('@stackframe/stack', () => ({
  useUser: () => mockUser,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('./useAuth', () => ({
  getAuthHeaders: jest
    .fn()
    .mockResolvedValue({ 'x-stack-access-token': 'test-token' }),
}));

// Mock fetch globally
global.fetch = mockFetch;

describe('useAuthenticatedRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should return makeRequest function', () => {
    const { result } = renderHook(() => useAuthenticatedRequest());

    expect(result.current.makeRequest).toBeDefined();
    expect(typeof result.current.makeRequest).toBe('function');
  });

  it('should make authenticated requests', async () => {
    const mockResponse = { data: 'test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useAuthenticatedRequest());

    const response = await result.current.makeRequest('/api/test');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-stack-access-token': 'test-token',
        }),
      })
    );
    expect(response).toEqual(mockResponse);
  });

  it('should handle AbortSignal', async () => {
    const mockResponse = { data: 'test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useAuthenticatedRequest());
    const abortController = new AbortController();

    const response = await result.current.makeRequest('/api/test', {
      signal: abortController.signal,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'GET',
        signal: abortController.signal,
      })
    );
    expect(response).toEqual(mockResponse);
  });

  it('should handle POST requests with body', async () => {
    const mockResponse = { success: true };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useAuthenticatedRequest());

    const response = await result.current.makeRequest('/api/test', {
      method: 'POST',
      body: { test: 'data' },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
      })
    );
    expect(response).toEqual(mockResponse);
  });

  it('should handle errors', async () => {
    const errorMessage = 'Network error';
    mockFetch.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useAuthenticatedRequest());

    await expect(result.current.makeRequest('/api/test')).rejects.toThrow(
      errorMessage
    );
  });

  it('should handle 401 errors and redirect to login', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    });

    const { result } = renderHook(() => useAuthenticatedRequest());

    await expect(result.current.makeRequest('/api/test')).rejects.toThrow(
      'Authentication required'
    );
    expect(mockRouter.replace).toHaveBeenCalledWith('/handler/signup?next=%2F');
  });

  it('should handle HTTP errors', async () => {
    const errorText = 'Not found';
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve(errorText),
    });

    const { result } = renderHook(() => useAuthenticatedRequest());

    await expect(result.current.makeRequest('/api/test')).rejects.toThrow(
      errorText
    );
  });

  it('should handle custom headers', async () => {
    const mockResponse = { data: 'test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useAuthenticatedRequest());

    const response = await result.current.makeRequest('/api/test', {
      headers: { 'Custom-Header': 'custom-value' },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-stack-access-token': 'test-token',
          'Custom-Header': 'custom-value',
        }),
      })
    );
    expect(response).toEqual(mockResponse);
  });
});
