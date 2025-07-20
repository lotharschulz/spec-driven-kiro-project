/**
 * Error Handling Hook
 * Provides error handling capabilities to React components
 * Implements requirements: 5.2, 6.8, 6.13
 */

import { useCallback, useState, useMemo } from 'react';
import { ErrorType } from '../types/quiz';
import { ErrorHandler, ErrorContext } from '../utils/errorHandler';

interface UseErrorHandlerReturn {
  error: string | null;
  isRetrying: boolean;
  handleError: (error: Error, errorType: ErrorType, context?: ErrorContext) => void;
  clearError: () => void;
  retryOperation: <T>(operation: () => Promise<T>, errorType: ErrorType) => Promise<T | null>;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const errorHandler = useMemo(() => new ErrorHandler(), []);

  const handleError = useCallback((error: Error, errorType: ErrorType, context: ErrorContext = {}) => {
    // Handle the error through the error handler
    errorHandler.handleError(error, errorType, context);
    
    // Set user-friendly error message
    const userMessage = errorHandler.getUserFriendlyMessage(errorType);
    setError(userMessage);
  }, [errorHandler]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retryOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    errorType: ErrorType
  ): Promise<T | null> => {
    if (!errorHandler.isRetriableError(errorType)) {
      return null;
    }

    setIsRetrying(true);
    try {
      const result = await errorHandler.attemptRetry(operation, errorType);
      clearError();
      return result;
    } catch (retryError) {
      handleError(retryError as Error, errorType, { finalRetryFailure: true });
      return null;
    } finally {
      setIsRetrying(false);
    }
  }, [errorHandler, handleError, clearError]);

  return {
    error,
    isRetrying,
    handleError,
    clearError,
    retryOperation
  };
}