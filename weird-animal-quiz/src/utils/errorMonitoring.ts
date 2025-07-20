/**
 * Error Monitoring Service
 * Provides comprehensive error tracking, analytics, and reporting
 * Implements requirements: 5.2, 6.8, 6.13
 */

import { ErrorType, SecurityEvent } from '../types/quiz';
import { ErrorLogEntry } from './errorHandler';

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  criticalErrors: number;
  securityEvents: number;
  topErrorTypes: Array<{ type: ErrorType; count: number; percentage: number }>;
  errorTrends: Array<{ timestamp: Date; count: number }>;
  userImpact: {
    affectedSessions: number;
    recoveryRate: number;
    averageRecoveryTime: number;
  };
}

export interface ErrorAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'error_spike' | 'security_threat' | 'critical_error' | 'recovery_failure';
  message: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export class ErrorMonitoringService {
  private errorHistory: ErrorLogEntry[] = [];
  private securityHistory: SecurityEvent[] = [];
  private sessionErrors: Map<string, number> = new Map();
  private recoveryAttempts: Map<string, { attempts: number; successful: boolean; startTime: Date }> = new Map();
  private alerts: ErrorAlert[] = [];
  private readonly maxHistorySize = 1000;
  private readonly alertThresholds = {
    errorSpike: 10, // errors per minute
    criticalErrorThreshold: 5, // critical errors per hour
    securityEventThreshold: 3 // security events per hour
  };

  /**
   * Record an error occurrence
   */
  recordError(errorEntry: ErrorLogEntry): void {
    this.errorHistory.push(errorEntry);
    this.trimHistory();
    
    // Track session-level errors
    const sessionId = this.getSessionId();
    this.sessionErrors.set(sessionId, (this.sessionErrors.get(sessionId) || 0) + 1);

    // Check for alerts
    this.checkErrorAlerts(errorEntry);
  }

  /**
   * Record a security event
   */
  recordSecurityEvent(event: SecurityEvent): void {
    this.securityHistory.push(event);
    this.trimSecurityHistory();
    
    // Check for security alerts
    this.checkSecurityAlerts(event);
  }

  /**
   * Record error recovery attempt
   */
  recordRecoveryAttempt(errorId: string, successful: boolean): void {
    const existing = this.recoveryAttempts.get(errorId);
    if (existing) {
      existing.attempts += 1;
      existing.successful = successful;
    } else {
      this.recoveryAttempts.set(errorId, {
        attempts: 1,
        successful,
        startTime: new Date()
      });
    }
  }

  /**
   * Get comprehensive error metrics
   */
  getErrorMetrics(): ErrorMetrics {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentErrors = this.errorHistory.filter(e => e.timestamp >= oneHourAgo);

    // Calculate error rate (errors per hour)
    const errorRate = recentErrors.length;

    // Count critical errors
    const criticalErrors = recentErrors.filter(e => e.severity === 'critical').length;

    // Count security events
    const recentSecurityEvents = this.securityHistory.filter(e => e.timestamp >= oneHourAgo);
    const securityEvents = recentSecurityEvents.length;

    // Calculate top error types
    const errorTypeCounts: Record<string, number> = {};
    recentErrors.forEach(error => {
      errorTypeCounts[error.type] = (errorTypeCounts[error.type] || 0) + 1;
    });

    const topErrorTypes = Object.entries(errorTypeCounts)
      .map(([type, count]) => ({
        type: type as ErrorType,
        count,
        percentage: (count / recentErrors.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate error trends (last 24 hours, hourly buckets)
    const errorTrends = this.calculateErrorTrends();

    // Calculate user impact metrics
    const userImpact = this.calculateUserImpact();

    return {
      totalErrors: this.errorHistory.length,
      errorRate,
      criticalErrors,
      securityEvents,
      topErrorTypes,
      errorTrends,
      userImpact
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): ErrorAlert[] {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp >= oneHourAgo);
  }

  /**
   * Get error summary for reporting
   */
  getErrorSummary(): {
    summary: string;
    recommendations: string[];
    criticalIssues: string[];
  } {
    const metrics = this.getErrorMetrics();
    const alerts = this.getActiveAlerts();

    const summary = `Error Monitoring Summary:
- Total Errors: ${metrics.totalErrors}
- Error Rate: ${metrics.errorRate} errors/hour
- Critical Errors: ${metrics.criticalErrors}
- Security Events: ${metrics.securityEvents}
- Recovery Rate: ${metrics.userImpact.recoveryRate.toFixed(1)}%`;

    const recommendations: string[] = [];
    const criticalIssues: string[] = [];

    // Generate recommendations based on metrics
    if (metrics.errorRate > this.alertThresholds.errorSpike) {
      recommendations.push('High error rate detected. Consider implementing additional error prevention measures.');
    }

    if (metrics.criticalErrors > 0) {
      criticalIssues.push(`${metrics.criticalErrors} critical errors require immediate attention.`);
    }

    if (metrics.securityEvents > this.alertThresholds.securityEventThreshold) {
      criticalIssues.push('Multiple security events detected. Review security measures.');
    }

    if (metrics.userImpact.recoveryRate < 80) {
      recommendations.push('Low recovery rate. Improve error recovery mechanisms.');
    }

    if (metrics.topErrorTypes.length > 0) {
      const topError = metrics.topErrorTypes[0];
      recommendations.push(`Focus on reducing ${topError.type} errors (${topError.percentage.toFixed(1)}% of all errors).`);
    }

    return {
      summary,
      recommendations,
      criticalIssues
    };
  }

  /**
   * Export error data for analysis
   */
  exportErrorData(): {
    errors: ErrorLogEntry[];
    securityEvents: SecurityEvent[];
    metrics: ErrorMetrics;
    alerts: ErrorAlert[];
  } {
    return {
      errors: [...this.errorHistory],
      securityEvents: [...this.securityHistory],
      metrics: this.getErrorMetrics(),
      alerts: this.getActiveAlerts()
    };
  }

  /**
   * Clear all monitoring data
   */
  clearMonitoringData(): void {
    this.errorHistory = [];
    this.securityHistory = [];
    this.sessionErrors.clear();
    this.recoveryAttempts.clear();
    this.alerts = [];
  }

  // Private methods

  private trimHistory(): void {
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }
  }

  private trimSecurityHistory(): void {
    if (this.securityHistory.length > this.maxHistorySize) {
      this.securityHistory = this.securityHistory.slice(-this.maxHistorySize);
    }
  }

  private checkErrorAlerts(errorEntry: ErrorLogEntry): void {
    // Check for error spike
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentErrors = this.errorHistory.filter(e => e.timestamp >= oneMinuteAgo);
    
    if (recentErrors.length >= this.alertThresholds.errorSpike) {
      this.createAlert({
        severity: 'high',
        type: 'error_spike',
        message: `Error spike detected: ${recentErrors.length} errors in the last minute`,
        metadata: { errorCount: recentErrors.length, timeWindow: '1 minute' }
      });
    }

    // Check for critical errors
    if (errorEntry.severity === 'critical') {
      this.createAlert({
        severity: 'critical',
        type: 'critical_error',
        message: `Critical error occurred: ${errorEntry.message}`,
        metadata: { errorId: errorEntry.id, errorType: errorEntry.type }
      });
    }
  }

  private checkSecurityAlerts(event: SecurityEvent): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSecurityEvents = this.securityHistory.filter(e => e.timestamp >= oneHourAgo);
    
    if (recentSecurityEvents.length >= this.alertThresholds.securityEventThreshold) {
      this.createAlert({
        severity: 'high',
        type: 'security_threat',
        message: `Multiple security events detected: ${recentSecurityEvents.length} events in the last hour`,
        metadata: { eventCount: recentSecurityEvents.length, timeWindow: '1 hour' }
      });
    }
  }

  private createAlert(alertData: Omit<ErrorAlert, 'id' | 'timestamp'>): void {
    const alert: ErrorAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...alertData
    };

    this.alerts.push(alert);

    // Keep only recent alerts
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.alerts = this.alerts.filter(a => a.timestamp >= oneHourAgo);

    // In production, this would send to monitoring service
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 Error Alert:', alert);
    }
  }

  private calculateErrorTrends(): Array<{ timestamp: Date; count: number }> {
    const now = new Date();
    const trends: Array<{ timestamp: Date; count: number }> = [];

    // Create hourly buckets for the last 24 hours
    for (let i = 23; i >= 0; i--) {
      const bucketStart = new Date(now.getTime() - (i + 1) * 60 * 60 * 1000);
      const bucketEnd = new Date(now.getTime() - i * 60 * 60 * 1000);
      
      const errorsInBucket = this.errorHistory.filter(
        e => e.timestamp >= bucketStart && e.timestamp < bucketEnd
      ).length;

      trends.push({
        timestamp: bucketStart,
        count: errorsInBucket
      });
    }

    return trends;
  }

  private calculateUserImpact(): {
    affectedSessions: number;
    recoveryRate: number;
    averageRecoveryTime: number;
  } {
    const affectedSessions = this.sessionErrors.size;
    
    const recoveryData = Array.from(this.recoveryAttempts.values());
    const successfulRecoveries = recoveryData.filter(r => r.successful).length;
    const recoveryRate = recoveryData.length > 0 ? (successfulRecoveries / recoveryData.length) * 100 : 0;
    
    const recoveryTimes = recoveryData
      .filter(r => r.successful)
      .map(r => Date.now() - r.startTime.getTime());
    
    const averageRecoveryTime = recoveryTimes.length > 0 
      ? recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length 
      : 0;

    return {
      affectedSessions,
      recoveryRate,
      averageRecoveryTime
    };
  }

  private getSessionId(): string {
    // Simple session ID generation - in production, use proper session management
    let sessionId = sessionStorage.getItem('error_monitoring_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('error_monitoring_session_id', sessionId);
    }
    return sessionId;
  }
}

// Global error monitoring instance
export const errorMonitoring = new ErrorMonitoringService();

// Integration with global error handler
if (typeof window !== 'undefined') {
  // Listen for custom error events from the error handler
  window.addEventListener('error-logged', ((event: CustomEvent) => {
    errorMonitoring.recordError(event.detail);
  }) as EventListener);

  window.addEventListener('security-event', ((event: CustomEvent) => {
    errorMonitoring.recordSecurityEvent(event.detail);
  }) as EventListener);
}