/**
 * Global Error Boundary Component
 * Implements requirements: 5.2, 6.8, 6.13
 * Provides graceful error handling with user-friendly messages and recovery options
 */

import React, { Component, ReactNode } from 'react';
import { ErrorType } from '../types/quiz';
import { ErrorHandler } from '../utils/errorHandler';
import Button from './Button';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private errorHandler: ErrorHandler;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
      retryCount: 0
    };
    this.errorHandler = new ErrorHandler();
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error securely
    this.errorHandler.handleError(error, ErrorType.STATE_ERROR, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      retryCount: this.state.retryCount
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: '',
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContainer} data-testid="error-container">
            <div className={styles.errorIcon}>🦎</div>
            <h2 className={styles.errorTitle}>Oops! Something went wrong</h2>
            <p className={styles.errorMessage}>
              Don't worry - even the most adaptable animals sometimes need a moment to recover!
            </p>
            
            <div className={styles.errorDetails}>
              <p className={styles.errorId}>Error ID: {this.state.errorId}</p>
              {this.state.retryCount > 0 && (
                <p className={styles.retryInfo}>
                  Retry attempt: {this.state.retryCount} of {this.maxRetries}
                </p>
              )}
            </div>

            <div className={styles.errorActions}>
              {this.state.retryCount < this.maxRetries ? (
                <Button
                  onClick={this.handleRetry}
                  variant="primary"
                  className={styles.retryButton}
                >
                  Try Again
                </Button>
              ) : (
                <Button
                  onClick={this.handleReload}
                  variant="primary"
                  className={styles.reloadButton}
                >
                  Reload Page
                </Button>
              )}
            </div>

            <details className={styles.technicalDetails} role="group">
              <summary>Technical Details (for developers)</summary>
              <pre className={styles.errorStack}>
                {this.state.error?.message}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}