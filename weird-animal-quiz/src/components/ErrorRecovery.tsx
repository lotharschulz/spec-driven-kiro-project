/**
 * Error Recovery Component
 * Provides comprehensive error recovery options with automatic retry logic
 * Implements requirements: 5.2, 6.8, 6.13
 */

import React, { useState, useEffect } from 'react';
import { ErrorType } from '../types/quiz';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ErrorScreen } from './ErrorScreen';
import Button from './Button';
import styles from './ErrorRecovery.module.css';

export interface ErrorRecoveryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  enableAutoRetry?: boolean;
  maxAutoRetries?: number;
  retryDelay?: number;
}

export const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({
  children,
  fallback,
  onError,
  enableAutoRetry = true,
  maxAutoRetries = 3,
  retryDelay = 2000
}) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);
  const { handleError, retryOperation, clearError } = useErrorHandler();

  // Auto-retry logic
  useEffect(() => {
    if (hasError && enableAutoRetry && autoRetryCount < maxAutoRetries && !isAutoRetrying) {
      setIsAutoRetrying(true);
      
      const retryTimer = setTimeout(async () => {
        try {
          // Attempt to recover by re-rendering children
          setHasError(false);
          setError(null);
          clearError();
          setAutoRetryCount(prev => prev + 1);
        } catch (retryError) {
          handleError(retryError as Error, ErrorType.STATE_ERROR, {
            autoRetryAttempt: autoRetryCount + 1,
            maxAutoRetries
          });
        } finally {
          setIsAutoRetrying(false);
        }
      }, retryDelay);

      return () => clearTimeout(retryTimer);
    }
  }, [hasError, enableAutoRetry, autoRetryCount, maxAutoRetries, retryDelay, isAutoRetrying, handleError, clearError]);

  const handleManualRetry = () => {
    setHasError(false);
    setError(null);
    setAutoRetryCount(0);
    clearError();
  };

  const handleGoHome = () => {
    // Reset everything and navigate to home
    setHasError(false);
    setError(null);
    setAutoRetryCount(0);
    clearError();
    window.location.href = '/';
  };

  // Error boundary-like behavior using error handling
  const handleChildError = (childError: Error, errorInfo?: React.ErrorInfo) => {
    setHasError(true);
    setError(childError);
    
    handleError(childError, ErrorType.STATE_ERROR, {
      componentStack: errorInfo?.componentStack,
      errorRecovery: true
    });

    onError?.(childError, errorInfo!);
  };

  if (hasError) {
    // Show custom fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }

    // Show auto-retry status
    if (isAutoRetrying) {
      return (
        <div className={styles.autoRetryContainer}>
          <div className={styles.autoRetryContent}>
            <div className={styles.spinner} />
            <h3>Attempting to recover...</h3>
            <p>Retry attempt {autoRetryCount + 1} of {maxAutoRetries}</p>
          </div>
        </div>
      );
    }

    // Show error screen with recovery options
    return (
      <ErrorScreen
        errorType={ErrorType.STATE_ERROR}
        message={error?.message}
        onRetry={autoRetryCount < maxAutoRetries ? handleManualRetry : undefined}
        onGoHome={handleGoHome}
        showTechnicalDetails={process.env.NODE_ENV === 'development'}
        errorId={`recovery_${Date.now()}`}
      />
    );
  }

  // Wrap children with error catching
  return (
    <ErrorCatcher onError={handleChildError}>
      {children}
    </ErrorCatcher>
  );
};

// Helper component to catch errors in children
interface ErrorCatcherProps {
  children: React.ReactNode;
  onError: (error: Error, errorInfo?: React.ErrorInfo) => void;
}

class ErrorCatcher extends React.Component<ErrorCatcherProps, { hasError: boolean }> {
  constructor(props: ErrorCatcherProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null; // Let parent handle the error display
    }

    return this.props.children;
  }
}

// Higher-order component for easy error recovery wrapping
export function withErrorRecovery<P extends object>(
  Component: React.ComponentType<P>,
  recoveryOptions?: Partial<ErrorRecoveryProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorRecovery {...recoveryOptions}>
      <Component {...props} />
    </ErrorRecovery>
  );

  WrappedComponent.displayName = `withErrorRecovery(${Component.displayName || Component.name})`;
  return WrappedComponent;
}