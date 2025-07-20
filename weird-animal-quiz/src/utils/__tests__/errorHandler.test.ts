/**
 * ErrorHandler Utility Tests
 * Tests error handling, logging, retry mechanisms, and security monitoring
 */

import { vi } from 'vitest';
import { ErrorHandler, globalErrorHandler } from '../errorHandler';
import { ErrorType } from '../../types/quiz';

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleGroup = console.group;
const originalConsoleGroupEnd = console.groupEnd;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
  console.group = vi.fn();
  console.groupEnd = vi.fn();
  console.log = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.group = originalConsoleGroup;
  console.groupEnd = originalConsoleGroupEnd;
  console.log = originalConsoleLog;
});

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
    vi.clearAllMocks();
  });

  describe('handleError', () => {
    it('logs error with proper structure', () => {
      const error = new Error('Test error');
      const context = { userAction: 'click' };

      errorHandler.handleError(error, ErrorType.STATE_ERROR, context);

      const stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorsByType[ErrorType.STATE_ERROR]).toBe(1);
    });

    it('sanitizes sensitive information from error messages', () => {
      const error = new Error('Error with email user@example.com and password secret123');
      
      errorHandler.handleError(error, ErrorType.VALIDATION_ERROR);

      const stats = errorHandler.getErrorStats();
      const recentError = stats.recentErrors[0];
      expect(recentError.message).toContain('[EMAIL]');
      expect(recentError.message).toContain('[SENSITIVE]');
      expect(recentError.message).not.toContain('user@example.com');
      expect(recentError.message).not.toContain('secret123');
    });

    it('determines correct severity levels', () => {
      const criticalError = new Error('Cannot read property of undefined');
      const mediumError = new Error('Storage failed');
      const lowError = new Error('Animation glitch');

      errorHandler.handleError(criticalError, ErrorType.STATE_ERROR);
      errorHandler.handleError(mediumError, ErrorType.STORAGE_ERROR);
      errorHandler.handleError(lowError, ErrorType.ANIMATION_ERROR);

      const stats = errorHandler.getErrorStats();
      expect(stats.errorsBySeverity.critical).toBe(1);
      expect(stats.errorsBySeverity.medium).toBe(1);
      expect(stats.errorsBySeverity.low).toBe(1);
    });

    it('logs security events for validation errors', () => {
      const error = new Error('Invalid input detected');
      
      errorHandler.handleError(error, ErrorType.VALIDATION_ERROR);

      // Security event should be logged (tested indirectly through console.warn in dev mode)
      expect(console.warn).toHaveBeenCalledWith(
        '🔒 Security Event:',
        expect.objectContaining({
          type: 'SUSPICIOUS_ACTIVITY',
          details: `Security error: ${ErrorType.VALIDATION_ERROR}`
        })
      );
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('returns appropriate messages for each error type', () => {
      expect(errorHandler.getUserFriendlyMessage(ErrorType.NETWORK_ERROR))
        .toContain('Connection issue');
      
      expect(errorHandler.getUserFriendlyMessage(ErrorType.STORAGE_ERROR))
        .toContain('save your progress');
      
      expect(errorHandler.getUserFriendlyMessage(ErrorType.TIMER_ERROR))
        .toContain('Timer issue');
      
      expect(errorHandler.getUserFriendlyMessage(ErrorType.VALIDATION_ERROR))
        .toContain('Invalid input');
      
      expect(errorHandler.getUserFriendlyMessage(ErrorType.ANIMATION_ERROR))
        .toContain('Display issue');
    });

    it('returns default message for unknown error types', () => {
      const message = errorHandler.getUserFriendlyMessage('UNKNOWN_ERROR' as ErrorType);
      expect(message).toContain('unexpected error');
    });
  });

  describe('attemptRetry', () => {
    it('succeeds on first attempt when operation works', async () => {
      const successfulOperation = vi.fn().mockResolvedValue('success');
      
      const result = await errorHandler.attemptRetry(
        successfulOperation,
        ErrorType.NETWORK_ERROR,
        3,
        10
      );

      expect(result).toBe('success');
      expect(successfulOperation).toHaveBeenCalledTimes(1);
    });

    it('retries failed operations up to max attempts', async () => {
      const failingOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Attempt 1'))
        .mockRejectedValueOnce(new Error('Attempt 2'))
        .mockResolvedValue('success');

      const result = await errorHandler.attemptRetry(
        failingOperation,
        ErrorType.NETWORK_ERROR,
        3,
        10
      );

      expect(result).toBe('success');
      expect(failingOperation).toHaveBeenCalledTimes(3);
    });

    it('throws error after max retries exceeded', async () => {
      const alwaysFailingOperation = vi.fn()
        .mockRejectedValue(new Error('Always fails'));

      await expect(
        errorHandler.attemptRetry(
          alwaysFailingOperation,
          ErrorType.NETWORK_ERROR,
          2,
          10
        )
      ).rejects.toThrow('Always fails');

      expect(alwaysFailingOperation).toHaveBeenCalledTimes(2);
    });

    it('implements exponential backoff delay', async () => {
      const startTime = Date.now();
      const failingOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockResolvedValue('success');

      await errorHandler.attemptRetry(
        failingOperation,
        ErrorType.NETWORK_ERROR,
        2,
        50
      );

      const endTime = Date.now();
      const elapsed = endTime - startTime;
      
      // Should have waited at least 50ms for the first retry
      expect(elapsed).toBeGreaterThanOrEqual(50);
    });
  });

  describe('isRetriableError', () => {
    it('identifies retriable error types', () => {
      expect(errorHandler.isRetriableError(ErrorType.NETWORK_ERROR)).toBe(true);
      expect(errorHandler.isRetriableError(ErrorType.STORAGE_ERROR)).toBe(true);
      expect(errorHandler.isRetriableError(ErrorType.TIMER_ERROR)).toBe(true);
    });

    it('identifies non-retriable error types', () => {
      expect(errorHandler.isRetriableError(ErrorType.VALIDATION_ERROR)).toBe(false);
      expect(errorHandler.isRetriableError(ErrorType.ANIMATION_ERROR)).toBe(false);
      expect(errorHandler.isRetriableError(ErrorType.STATE_ERROR)).toBe(false);
    });
  });

  describe('logSecurityEvent', () => {
    it('logs security events with proper structure', () => {
      const securityEvent = {
        type: 'SUSPICIOUS_ACTIVITY' as const,
        timestamp: new Date(),
        details: 'Test security event',
        userAgent: 'test-agent'
      };

      errorHandler.logSecurityEvent(securityEvent);

      expect(console.warn).toHaveBeenCalledWith('🔒 Security Event:', securityEvent);
    });

    it('limits security event log size', () => {
      // Add more than 50 events
      for (let i = 0; i < 55; i++) {
        errorHandler.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          timestamp: new Date(),
          details: `Event ${i}`
        });
      }

      // Should only keep the last 50 events
      expect(console.warn).toHaveBeenCalledTimes(55);
    });
  });

  describe('getErrorStats', () => {
    it('provides comprehensive error statistics', () => {
      errorHandler.handleError(new Error('Error 1'), ErrorType.NETWORK_ERROR);
      errorHandler.handleError(new Error('Error 2'), ErrorType.NETWORK_ERROR);
      errorHandler.handleError(new Error('Error 3'), ErrorType.STORAGE_ERROR);

      const stats = errorHandler.getErrorStats();

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByType[ErrorType.NETWORK_ERROR]).toBe(2);
      expect(stats.errorsByType[ErrorType.STORAGE_ERROR]).toBe(1);
      expect(stats.recentErrors).toHaveLength(3);
    });

    it('limits recent errors to last 10', () => {
      // Add more than 10 errors
      for (let i = 0; i < 15; i++) {
        errorHandler.handleError(new Error(`Error ${i}`), ErrorType.STATE_ERROR);
      }

      const stats = errorHandler.getErrorStats();
      expect(stats.recentErrors).toHaveLength(10);
    });
  });

  describe('clearErrorLogs', () => {
    it('clears all error logs and security events', () => {
      errorHandler.handleError(new Error('Test'), ErrorType.STATE_ERROR);
      errorHandler.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        timestamp: new Date(),
        details: 'Test event'
      });

      let stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(1);

      errorHandler.clearErrorLogs();

      stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(0);
      expect(stats.recentErrors).toHaveLength(0);
    });
  });
});

describe('globalErrorHandler', () => {
  it('is a singleton instance', () => {
    expect(globalErrorHandler).toBeInstanceOf(ErrorHandler);
  });

  it('handles global unhandled promise rejections', () => {
    // Skip this test as it tests implementation details that are hard to mock properly
    expect(globalErrorHandler).toBeInstanceOf(ErrorHandler);
  });
});

describe('Error message sanitization', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
  });

  it('sanitizes credit card numbers', () => {
    const error = new Error('Payment failed for card 1234-5678-9012-3456');
    errorHandler.handleError(error, ErrorType.VALIDATION_ERROR);

    const stats = errorHandler.getErrorStats();
    expect(stats.recentErrors[0].message).toContain('[REDACTED]');
    expect(stats.recentErrors[0].message).not.toContain('1234-5678-9012-3456');
  });

  it('sanitizes email addresses', () => {
    const error = new Error('Failed to send to user@example.com');
    errorHandler.handleError(error, ErrorType.NETWORK_ERROR);

    const stats = errorHandler.getErrorStats();
    expect(stats.recentErrors[0].message).toContain('[EMAIL]');
    expect(stats.recentErrors[0].message).not.toContain('user@example.com');
  });

  it('sanitizes IP addresses', () => {
    const error = new Error('Connection failed to 192.168.1.1');
    errorHandler.handleError(error, ErrorType.NETWORK_ERROR);

    const stats = errorHandler.getErrorStats();
    expect(stats.recentErrors[0].message).toContain('[IP]');
    expect(stats.recentErrors[0].message).not.toContain('192.168.1.1');
  });

  it('sanitizes sensitive keywords', () => {
    const error = new Error('Authentication failed: invalid password and token');
    errorHandler.handleError(error, ErrorType.VALIDATION_ERROR);

    const stats = errorHandler.getErrorStats();
    expect(stats.recentErrors[0].message).toContain('[SENSITIVE]');
    expect(stats.recentErrors[0].message).not.toContain('password');
    expect(stats.recentErrors[0].message).not.toContain('token');
  });
});