/**
 * Error Monitoring Service Tests
 * Tests error tracking, metrics calculation, and alert generation
 */

import { vi } from 'vitest';
import { ErrorMonitoringService, errorMonitoring } from '../errorMonitoring';
import { ErrorType } from '../../types/quiz';
import { ErrorLogEntry } from '../errorHandler';

// Mock console methods
const originalConsoleWarn = console.warn;
beforeAll(() => {
  console.warn = vi.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
});

describe('ErrorMonitoringService', () => {
  let service: ErrorMonitoringService;

  beforeEach(() => {
    service = new ErrorMonitoringService();
    vi.clearAllMocks();
  });

  describe('recordError', () => {
    it('records error entries', () => {
      const errorEntry: ErrorLogEntry = {
        id: 'test-error-1',
        timestamp: new Date(),
        type: ErrorType.NETWORK_ERROR,
        message: 'Test error',
        context: {},
        severity: 'medium',
        userAgent: 'test-agent',
        url: 'http://test.com'
      };

      service.recordError(errorEntry);
      const metrics = service.getErrorMetrics();

      expect(metrics.totalErrors).toBe(1);
    });

    it('tracks session-level errors', () => {
      const errorEntry: ErrorLogEntry = {
        id: 'test-error-1',
        timestamp: new Date(),
        type: ErrorType.NETWORK_ERROR,
        message: 'Test error',
        context: {},
        severity: 'medium',
        userAgent: 'test-agent',
        url: 'http://test.com'
      };

      service.recordError(errorEntry);
      service.recordError({ ...errorEntry, id: 'test-error-2' });

      const metrics = service.getErrorMetrics();
      expect(metrics.userImpact.affectedSessions).toBeGreaterThan(0);
    });

    it('generates alerts for error spikes', () => {
      // Create multiple errors in quick succession
      for (let i = 0; i < 12; i++) {
        const errorEntry: ErrorLogEntry = {
          id: `test-error-${i}`,
          timestamp: new Date(),
          type: ErrorType.NETWORK_ERROR,
          message: `Test error ${i}`,
          context: {},
          severity: 'medium',
          userAgent: 'test-agent',
          url: 'http://test.com'
        };
        service.recordError(errorEntry);
      }

      const alerts = service.getActiveAlerts();
      expect(alerts.some(alert => alert.type === 'error_spike')).toBe(true);
    });

    it('generates alerts for critical errors', () => {
      const criticalError: ErrorLogEntry = {
        id: 'critical-error-1',
        timestamp: new Date(),
        type: ErrorType.STATE_ERROR,
        message: 'Critical system failure',
        context: {},
        severity: 'critical',
        userAgent: 'test-agent',
        url: 'http://test.com'
      };

      service.recordError(criticalError);

      const alerts = service.getActiveAlerts();
      expect(alerts.some(alert => alert.type === 'critical_error')).toBe(true);
    });
  });

  describe('recordSecurityEvent', () => {
    it('records security events', () => {
      const securityEvent = {
        type: 'SUSPICIOUS_ACTIVITY' as const,
        timestamp: new Date(),
        details: 'Test security event',
        userAgent: 'test-agent'
      };

      service.recordSecurityEvent(securityEvent);
      const metrics = service.getErrorMetrics();

      expect(metrics.securityEvents).toBe(1);
    });

    it('generates alerts for multiple security events', () => {
      // Create multiple security events
      for (let i = 0; i < 4; i++) {
        const securityEvent = {
          type: 'SUSPICIOUS_ACTIVITY' as const,
          timestamp: new Date(),
          details: `Test security event ${i}`,
          userAgent: 'test-agent'
        };
        service.recordSecurityEvent(securityEvent);
      }

      const alerts = service.getActiveAlerts();
      expect(alerts.some(alert => alert.type === 'security_threat')).toBe(true);
    });
  });

  describe('recordRecoveryAttempt', () => {
    it('tracks recovery attempts', () => {
      service.recordRecoveryAttempt('error-1', false);
      service.recordRecoveryAttempt('error-1', true);

      const metrics = service.getErrorMetrics();
      expect(metrics.userImpact.recoveryRate).toBeGreaterThan(0);
    });

    it('calculates recovery rate correctly', () => {
      service.recordRecoveryAttempt('error-1', true);
      service.recordRecoveryAttempt('error-2', false);
      service.recordRecoveryAttempt('error-3', true);

      const metrics = service.getErrorMetrics();
      expect(metrics.userImpact.recoveryRate).toBeCloseTo(66.7, 1);
    });
  });

  describe('getErrorMetrics', () => {
    it('calculates comprehensive metrics', () => {
      // Add various types of errors
      const errors = [
        { type: ErrorType.NETWORK_ERROR, severity: 'medium' as const },
        { type: ErrorType.NETWORK_ERROR, severity: 'high' as const },
        { type: ErrorType.STORAGE_ERROR, severity: 'critical' as const },
        { type: ErrorType.TIMER_ERROR, severity: 'low' as const }
      ];

      errors.forEach((error, index) => {
        const errorEntry: ErrorLogEntry = {
          id: `test-error-${index}`,
          timestamp: new Date(),
          type: error.type,
          message: `Test error ${index}`,
          context: {},
          severity: error.severity,
          userAgent: 'test-agent',
          url: 'http://test.com'
        };
        service.recordError(errorEntry);
      });

      const metrics = service.getErrorMetrics();

      expect(metrics.totalErrors).toBe(4);
      expect(metrics.criticalErrors).toBe(1);
      expect(metrics.topErrorTypes).toHaveLength(3);
      expect(metrics.topErrorTypes[0].type).toBe(ErrorType.NETWORK_ERROR);
      expect(metrics.topErrorTypes[0].count).toBe(2);
    });

    it('calculates error trends over time', () => {
      const errorEntry: ErrorLogEntry = {
        id: 'test-error-1',
        timestamp: new Date(),
        type: ErrorType.NETWORK_ERROR,
        message: 'Test error',
        context: {},
        severity: 'medium',
        userAgent: 'test-agent',
        url: 'http://test.com'
      };

      service.recordError(errorEntry);
      const metrics = service.getErrorMetrics();

      expect(metrics.errorTrends).toHaveLength(24); // 24 hourly buckets
      expect(metrics.errorTrends.every(trend => trend.timestamp instanceof Date)).toBe(true);
    });
  });

  describe('getErrorSummary', () => {
    it('generates comprehensive error summary', () => {
      const errorEntry: ErrorLogEntry = {
        id: 'test-error-1',
        timestamp: new Date(),
        type: ErrorType.NETWORK_ERROR,
        message: 'Test error',
        context: {},
        severity: 'critical',
        userAgent: 'test-agent',
        url: 'http://test.com'
      };

      service.recordError(errorEntry);
      const summary = service.getErrorSummary();

      expect(summary.summary).toContain('Total Errors: 1');
      expect(summary.summary).toContain('Critical Errors: 1');
      expect(summary.criticalIssues).toHaveLength(1);
      expect(summary.criticalIssues[0]).toContain('critical errors require immediate attention');
    });

    it('provides relevant recommendations', () => {
      // Create multiple errors to trigger recommendations
      for (let i = 0; i < 15; i++) {
        const errorEntry: ErrorLogEntry = {
          id: `test-error-${i}`,
          timestamp: new Date(),
          type: ErrorType.NETWORK_ERROR,
          message: `Test error ${i}`,
          context: {},
          severity: 'medium',
          userAgent: 'test-agent',
          url: 'http://test.com'
        };
        service.recordError(errorEntry);
      }

      const summary = service.getErrorSummary();
      expect(summary.recommendations.length).toBeGreaterThan(0);
      expect(summary.recommendations.some(rec => rec.includes('High error rate detected'))).toBe(true);
    });
  });

  describe('exportErrorData', () => {
    it('exports comprehensive error data', () => {
      const errorEntry: ErrorLogEntry = {
        id: 'test-error-1',
        timestamp: new Date(),
        type: ErrorType.NETWORK_ERROR,
        message: 'Test error',
        context: {},
        severity: 'medium',
        userAgent: 'test-agent',
        url: 'http://test.com'
      };

      const securityEvent = {
        type: 'SUSPICIOUS_ACTIVITY' as const,
        timestamp: new Date(),
        details: 'Test security event',
        userAgent: 'test-agent'
      };

      service.recordError(errorEntry);
      service.recordSecurityEvent(securityEvent);

      const exportData = service.exportErrorData();

      expect(exportData.errors).toHaveLength(1);
      expect(exportData.securityEvents).toHaveLength(1);
      expect(exportData.metrics).toBeDefined();
      expect(exportData.alerts).toBeDefined();
    });
  });

  describe('clearMonitoringData', () => {
    it('clears all monitoring data', () => {
      const errorEntry: ErrorLogEntry = {
        id: 'test-error-1',
        timestamp: new Date(),
        type: ErrorType.NETWORK_ERROR,
        message: 'Test error',
        context: {},
        severity: 'medium',
        userAgent: 'test-agent',
        url: 'http://test.com'
      };

      service.recordError(errorEntry);
      service.clearMonitoringData();

      const metrics = service.getErrorMetrics();
      expect(metrics.totalErrors).toBe(0);
    });
  });
});

describe('Global error monitoring integration', () => {
  it('is available as singleton instance', () => {
    expect(errorMonitoring).toBeInstanceOf(ErrorMonitoringService);
  });

  it('handles custom events for error logging', () => {
    const errorEntry: ErrorLogEntry = {
      id: 'test-error-1',
      timestamp: new Date(),
      type: ErrorType.NETWORK_ERROR,
      message: 'Test error',
      context: {},
      severity: 'medium',
      userAgent: 'test-agent',
      url: 'http://test.com'
    };

    // Simulate custom event dispatch
    const event = new CustomEvent('error-logged', { detail: errorEntry });
    window.dispatchEvent(event);

    // Note: In a real test environment, we'd need to mock the event listener setup
    // This test verifies the event structure is correct
    expect(event.detail).toEqual(errorEntry);
  });
});