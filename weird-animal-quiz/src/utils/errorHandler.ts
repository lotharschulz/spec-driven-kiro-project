/**
 * Error Handler Utility
 * Implements requirements: 5.2, 6.8, 6.13
 * Provides secure error logging, user-friendly messages, and recovery mechanisms
 */

import { ErrorType, SecurityEvent } from '../types/quiz';

export interface ErrorContext {
  componentStack?: string;
  errorBoundary?: boolean;
  retryCount?: number;
  userAction?: string;
  timestamp?: Date;
  [key: string]: any;
}

export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  type: ErrorType;
  message: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userAgent: string;
  url: string;
}

export class ErrorHandler {
  private errorLog: ErrorLogEntry[] = [];
  private securityEvents: SecurityEvent[] = [];
  private maxLogEntries = 100;
  private retryAttempts = new Map<string, number>();

  /**
   * Handle an error with appropriate logging and user messaging
   */
  handleError(error: Error, errorType: ErrorType, context: ErrorContext = {}): void {
    const errorId = this.generateErrorId();
    const severity = this.determineSeverity(errorType, error);
    
    // Create error log entry
    const logEntry: ErrorLogEntry = {
      id: errorId,
      timestamp: new Date(),
      type: errorType,
      message: this.sanitizeErrorMessage(error.message),
      context: {
        ...context,
        timestamp: new Date()
      },
      severity,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Log error securely
    this.logError(logEntry);

    // Handle security-related errors
    if (this.isSecurityError(errorType)) {
      this.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        timestamp: new Date(),
        details: `Security error: ${errorType}`,
        userAgent: navigator.userAgent
      });
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error [${errorType}]`);
      console.error('Original Error:', error);
      console.log('Error ID:', errorId);
      console.log('Context:', context);
      console.log('Severity:', severity);
      console.groupEnd();
    }
  }

  /**
   * Get user-friendly error message without exposing internal details
   */
  getUserFriendlyMessage(errorType: ErrorType): string {
    const messages: Record<ErrorType, string> = {
      [ErrorType.TIMER_ERROR]: 'Timer issue detected. The quiz will continue without timing.',
      [ErrorType.STATE_ERROR]: 'Something went wrong with the quiz state. Please try again.',
      [ErrorType.STORAGE_ERROR]: 'Unable to save your progress. Your answers are still recorded.',
      [ErrorType.ANIMATION_ERROR]: 'Display issue detected. The quiz will continue normally.',
      [ErrorType.VALIDATION_ERROR]: 'Invalid input detected. Please check your answer.',
      [ErrorType.NETWORK_ERROR]: 'Connection issue. Please check your internet and try again.'
    };

    return messages[errorType] || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Attempt automatic retry for transient errors
   */
  async attemptRetry<T>(
    operation: () => Promise<T>,
    errorType: ErrorType,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    const operationId = this.generateOperationId();
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Reset retry count on success
        this.retryAttempts.delete(operationId);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Log retry attempt
        this.handleError(lastError, errorType, {
          retryAttempt: attempt,
          maxRetries,
          operationId
        });

        // Don't retry on final attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry with exponential backoff
        await this.delay(delay * Math.pow(2, attempt - 1));
      }
    }

    // All retries failed
    this.retryAttempts.set(operationId, maxRetries);
    throw lastError!;
  }

  /**
   * Check if an error type should trigger automatic retry
   */
  isRetriableError(errorType: ErrorType): boolean {
    const retriableErrors = [
      ErrorType.NETWORK_ERROR,
      ErrorType.STORAGE_ERROR,
      ErrorType.TIMER_ERROR
    ];
    return retriableErrors.includes(errorType);
  }

  /**
   * Log security events for monitoring
   */
  logSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
    
    // Keep only recent events
    if (this.securityEvents.length > 50) {
      this.securityEvents = this.securityEvents.slice(-50);
    }

    // In production, this would send to security monitoring service
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.warn('🔒 Security Event:', event);
    }

    // Dispatch custom event for error monitoring
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('security-event', { detail: event }));
    }
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: ErrorLogEntry[];
  } {
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    this.errorLog.forEach(entry => {
      errorsByType[entry.type] = (errorsByType[entry.type] || 0) + 1;
      errorsBySeverity[entry.severity] = (errorsBySeverity[entry.severity] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: this.errorLog.slice(-10)
    };
  }

  /**
   * Clear error logs (for privacy/memory management)
   */
  clearErrorLogs(): void {
    this.errorLog = [];
    this.securityEvents = [];
    this.retryAttempts.clear();
  }

  // Private methods

  private logError(entry: ErrorLogEntry): void {
    this.errorLog.push(entry);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogEntries) {
      this.errorLog = this.errorLog.slice(-this.maxLogEntries);
    }

    // Dispatch custom event for error monitoring
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('error-logged', { detail: entry }));
    }
  }

  private sanitizeErrorMessage(message: string): string {
    // Remove potentially sensitive information
    return message
      .replace(/\b\d{4}-\d{4}-\d{4}-\d{4}\b/g, '[REDACTED]') // Credit card numbers
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]') // Email addresses
      .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP]') // IP addresses
      .replace(/password|token|key|secret/gi, '[SENSITIVE]'); // Sensitive keywords
  }

  private determineSeverity(errorType: ErrorType, error: Error): 'low' | 'medium' | 'high' | 'critical' {
    // Critical errors that break core functionality
    if (errorType === ErrorType.STATE_ERROR && error.message.includes('Cannot read property')) {
      return 'critical';
    }

    // High severity errors
    if ([ErrorType.VALIDATION_ERROR, ErrorType.STATE_ERROR].includes(errorType)) {
      return 'high';
    }

    // Medium severity errors
    if ([ErrorType.STORAGE_ERROR, ErrorType.NETWORK_ERROR].includes(errorType)) {
      return 'medium';
    }

    // Low severity errors
    return 'low';
  }

  private isSecurityError(errorType: ErrorType): boolean {
    return errorType === ErrorType.VALIDATION_ERROR;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global error handler instance
export const globalErrorHandler = new ErrorHandler();

// Global error event listeners
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    globalErrorHandler.handleError(
      new Error(event.reason?.message || 'Unhandled promise rejection'),
      ErrorType.STATE_ERROR,
      { unhandledRejection: true, reason: event.reason }
    );
  });

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    globalErrorHandler.handleError(
      event.error || new Error(event.message),
      ErrorType.STATE_ERROR,
      { 
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        globalError: true
      }
    );
  });
}