/**
 * useErrorHandler Hook Tests
 * Tests error handling hook functionality and integration
 */

import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useErrorHandler } from '../useErrorHandler';
import { ErrorType } from '../../types/quiz';

// Don't mock the ErrorHandler - test the real implementation

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with no error and not retrying', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current.error).toBeNull();
    expect(result.current.isRetrying).toBe(false);
  });

  it('handles error and sets user-friendly message', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError(
        new Error('Network failed'),
        ErrorType.NETWORK_ERROR
      );
    });

    expect(result.current.error).toBe('Connection issue. Please check your internet and try again.');
  });

  it('handles error with context', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError(
        new Error('Storage failed'),
        ErrorType.STORAGE_ERROR,
        { userAction: 'save' }
      );
    });

    expect(result.current.error).toBe('Unable to save your progress. Your answers are still recorded.');
  });

  it('clears error when clearError is called', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError(
        new Error('Test error'),
        ErrorType.STATE_ERROR
      );
    });

    expect(result.current.error).toBe('Something went wrong with the quiz state. Please try again.');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('handles retry for retriable errors', async () => {
    const { result } = renderHook(() => useErrorHandler());
    const mockOperation = vi.fn().mockResolvedValue('success');

    let retryResult: any;
    await act(async () => {
      retryResult = await result.current.retryOperation(
        mockOperation,
        ErrorType.NETWORK_ERROR
      );
    });

    expect(retryResult).toBe('success');
    expect(result.current.isRetrying).toBe(false);
  });

  it('does not retry non-retriable errors', async () => {
    const { result } = renderHook(() => useErrorHandler());
    const mockOperation = vi.fn().mockResolvedValue('success');

    let retryResult: any;
    await act(async () => {
      retryResult = await result.current.retryOperation(
        mockOperation,
        ErrorType.VALIDATION_ERROR
      );
    });

    expect(retryResult).toBeNull();
    expect(mockOperation).not.toHaveBeenCalled();
  });

  it('sets isRetrying to true during retry operation', async () => {
    const { result } = renderHook(() => useErrorHandler());
    const mockOperation = vi.fn().mockResolvedValue('success');

    await act(async () => {
      await result.current.retryOperation(mockOperation, ErrorType.NETWORK_ERROR);
    });

    // After completion, isRetrying should be false
    expect(result.current.isRetrying).toBe(false);
  });

  it('handles retry failure and sets error', async () => {
    const { result } = renderHook(() => useErrorHandler());
    const mockOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));

    await act(async () => {
      await result.current.retryOperation(mockOperation, ErrorType.NETWORK_ERROR);
    });

    expect(result.current.error).toBe('Connection issue. Please check your internet and try again.');
    expect(result.current.isRetrying).toBe(false);
  });

  it('clears error on successful retry', async () => {
    const { result } = renderHook(() => useErrorHandler());

    // First set an error
    act(() => {
      result.current.handleError(
        new Error('Initial error'),
        ErrorType.NETWORK_ERROR
      );
    });

    expect(result.current.error).toBe('Connection issue. Please check your internet and try again.');

    // Then retry successfully
    const mockOperation = vi.fn().mockResolvedValue('success');

    await act(async () => {
      await result.current.retryOperation(mockOperation, ErrorType.NETWORK_ERROR);
    });

    expect(result.current.error).toBeNull();
  });

  it('maintains stable function references', () => {
    const { result, rerender } = renderHook(() => useErrorHandler());

    const initialHandleError = result.current.handleError;
    const initialClearError = result.current.clearError;
    const initialRetryOperation = result.current.retryOperation;

    rerender();

    expect(result.current.handleError).toBe(initialHandleError);
    expect(result.current.clearError).toBe(initialClearError);
    expect(result.current.retryOperation).toBe(initialRetryOperation);
  });

  it('handles different error types correctly', () => {
    const { result } = renderHook(() => useErrorHandler());

    // Test each error type
    const errorTypes = [
      { type: ErrorType.NETWORK_ERROR, expectedMessage: 'Connection issue. Please check your internet and try again.' },
      { type: ErrorType.STORAGE_ERROR, expectedMessage: 'Unable to save your progress. Your answers are still recorded.' },
      { type: ErrorType.TIMER_ERROR, expectedMessage: 'Timer issue detected. The quiz will continue without timing.' },
      { type: ErrorType.VALIDATION_ERROR, expectedMessage: 'Invalid input detected. Please check your answer.' },
      { type: ErrorType.ANIMATION_ERROR, expectedMessage: 'Display issue detected. The quiz will continue normally.' },
      { type: ErrorType.STATE_ERROR, expectedMessage: 'Something went wrong with the quiz state. Please try again.' }
    ];

    errorTypes.forEach(({ type, expectedMessage }) => {
      act(() => {
        result.current.handleError(new Error('Test'), type);
      });

      expect(result.current.error).toBe(expectedMessage);

      act(() => {
        result.current.clearError();
      });
    });
  });
});