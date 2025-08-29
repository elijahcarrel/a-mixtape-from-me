import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useApiRequest } from './useApiRequest';

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

jest.mock('../useAuth', () => ({
  getAuthHeaders: jest
    .fn()
    .mockResolvedValue({ 'x-stack-access-token': 'test-token' }),
}));

// Mock fetch globally
global.fetch = mockFetch;

describe('useApiRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('basic functionality', () => {
    it('should return initial state', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      });

      const { result } = renderHook(() =>
        useApiRequest({
          url: '/api/test',
        })
      );

      expect(result.current.data).toBe(null);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should make a GET request on mount', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() =>
        useApiRequest({
          url: '/api/test',
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

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
      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.error).toBe(null);
    });

    it('should handle POST requests with body', async () => {
      const mockResponse = { success: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() =>
        useApiRequest({
          url: '/api/test',
          method: 'POST',
          body: { test: 'data' },
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ test: 'data' }),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result.current.data).toEqual(mockResponse);
    });

    it('should handle custom headers', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() =>
        useApiRequest({
          url: '/api/test',
          headers: { 'Custom-Header': 'custom-value' },
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
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
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const errorMessage = 'Network error';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() =>
        useApiRequest({
          url: '/api/test',
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.data).toBe(null);
    });

    it('should handle HTTP errors', async () => {
      const errorText = 'Not found';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve(errorText),
      });

      const { result } = renderHook(() =>
        useApiRequest({
          url: '/api/test',
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(errorText);
      expect(result.current.data).toBe(null);
    });

    it('should handle 401 errors and redirect to login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      });

      const { result } = renderHook(() =>
        useApiRequest({
          url: '/api/test',
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/handler/signup?next=%2F'
      );
      expect(result.current.error).toBe('Authentication required');
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback when request succeeds', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const onSuccess = jest.fn();
      const onError = jest.fn();

      const { result } = renderHook(() =>
        useApiRequest({
          url: '/api/test',
          onSuccess,
          onError,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
      expect(onError).not.toHaveBeenCalled();
    });

    it('should call onError callback when request fails', async () => {
      const errorMessage = 'Network error';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const onSuccess = jest.fn();
      const onError = jest.fn();

      const { result } = renderHook(() =>
        useApiRequest({
          url: '/api/test',
          onSuccess,
          onError,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(onError).toHaveBeenCalledWith(errorMessage);
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('refetch functionality', () => {
    it('should refetch data when refetch is called', async () => {
      const mockResponse1 = { data: 'first' };
      const mockResponse2 = { data: 'second' };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse1),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse2),
        });

      const { result } = renderHook(() =>
        useApiRequest({
          url: '/api/test',
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockResponse1);

      // Call refetch
      act(() => {
        result.current.refetch();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockResponse2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('dependencies and re-renders', () => {
    it('should re-fetch when URL changes', async () => {
      const mockResponse1 = { data: 'first' };
      const mockResponse2 = { data: 'second' };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse1),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse2),
        });

      const { result, rerender } = renderHook(
        ({ url }) => useApiRequest({ url }),
        {
          initialProps: { url: '/api/test1' },
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockResponse1);

      // Change URL
      rerender({ url: '/api/test2' });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockResponse2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
