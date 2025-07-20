/**
 * Error Screen Component
 * Displays user-friendly error messages with recovery options
 * Implements requirements: 5.2, 6.8, 6.13
 */

import React from 'react';
import { ErrorType } from '../types/quiz';
import Button from './Button';
import styles from './ErrorScreen.module.css';

export interface ErrorScreenProps {
  errorType?: ErrorType;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showTechnicalDetails?: boolean;
  errorId?: string;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  errorType,
  message,
  onRetry,
  onGoHome,
  showTechnicalDetails = false,
  errorId
}) => {
  const getErrorIcon = (type?: ErrorType): string => {
    switch (type) {
      case ErrorType.NETWORK_ERROR:
        return '🌐';
      case ErrorType.STORAGE_ERROR:
        return '💾';
      case ErrorType.TIMER_ERROR:
        return '⏰';
      case ErrorType.VALIDATION_ERROR:
        return '⚠️';
      case ErrorType.ANIMATION_ERROR:
        return '🎬';
      default:
        return '🦎';
    }
  };

  const getErrorTitle = (type?: ErrorType): string => {
    switch (type) {
      case ErrorType.NETWORK_ERROR:
        return 'Connection Problem';
      case ErrorType.STORAGE_ERROR:
        return 'Storage Issue';
      case ErrorType.TIMER_ERROR:
        return 'Timer Malfunction';
      case ErrorType.VALIDATION_ERROR:
        return 'Input Error';
      case ErrorType.ANIMATION_ERROR:
        return 'Display Issue';
      default:
        return 'Something Went Wrong';
    }
  };

  const getErrorDescription = (type?: ErrorType): string => {
    switch (type) {
      case ErrorType.NETWORK_ERROR:
        return 'We\'re having trouble connecting. Check your internet connection and try again.';
      case ErrorType.STORAGE_ERROR:
        return 'We couldn\'t save your progress, but don\'t worry - your current answers are safe.';
      case ErrorType.TIMER_ERROR:
        return 'The quiz timer encountered an issue, but you can continue at your own pace.';
      case ErrorType.VALIDATION_ERROR:
        return 'There was an issue with your input. Please try again.';
      case ErrorType.ANIMATION_ERROR:
        return 'Some visual effects aren\'t working, but the quiz functions normally.';
      default:
        return 'Don\'t worry - even the most adaptable animals sometimes need a moment to recover!';
    }
  };

  return (
    <div className={styles.errorScreen}>
      <div className={styles.errorContainer} data-testid="error-container">
        <div className={styles.errorIcon}>
          {getErrorIcon(errorType)}
        </div>
        
        <h2 className={styles.errorTitle}>
          {getErrorTitle(errorType)}
        </h2>
        
        <p className={styles.errorDescription}>
          {message || getErrorDescription(errorType)}
        </p>

        {errorId && (
          <div className={styles.errorId}>
            <p>Error ID: {errorId}</p>
          </div>
        )}

        <div className={styles.errorActions}>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="primary"
              className={styles.retryButton}
            >
              Try Again
            </Button>
          )}
          
          {onGoHome && (
            <Button
              onClick={onGoHome}
              variant="secondary"
              className={styles.homeButton}
            >
              Go to Home
            </Button>
          )}
        </div>

        {showTechnicalDetails && errorType && (
          <details className={styles.technicalDetails} role="group">
            <summary>Technical Information</summary>
            <div className={styles.technicalContent}>
              <p>Error Type: {errorType}</p>
              <p>Timestamp: {new Date().toISOString()}</p>
              <p>User Agent: {navigator.userAgent}</p>
            </div>
          </details>
        )}

        <div className={styles.helpText}>
          <p>
            If this problem persists, try refreshing the page or clearing your browser cache.
          </p>
        </div>
      </div>
    </div>
  );
};