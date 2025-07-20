/**
 * Security utilities for the Weird Animal Quiz
 * Implements security requirements: 6.1, 6.2, 6.5, 6.7, 6.8, 6.9, 6.11, 6.12
 */

import type { SecurityEvent } from '../types/quiz';

/**
 * Rate limiter for user interactions
 * Prevents abuse by limiting actions per time window
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly timeWindow: number; // in milliseconds

  constructor(maxRequests = 10, timeWindowMinutes = 1) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMinutes * 60 * 1000;
  }

  /**
   * Check if an action is allowed for the given identifier
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside time window
    const validRequests = userRequests.filter(time => now - time < this.timeWindow);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  /**
   * Get remaining requests for identifier
   */
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    const validRequests = userRequests.filter(time => now - time < this.timeWindow);
    return Math.max(0, this.maxRequests - validRequests.length);
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.requests.clear();
  }
}

/**
 * Secure storage manager for localStorage vs memory-only data
 * Implements requirement 6.12 - secure data handling
 */
export class SecureStorageManager {
  private memoryStore: Map<string, any> = new Map();
  private readonly storagePrefix = 'weird-animal-quiz-';

  /**
   * Store non-sensitive data in localStorage
   */
  setLocalStorage(key: string, data: any): void {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(this.storagePrefix + key, serializedData);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
      // Fallback to memory storage
      this.memoryStore.set(key, data);
    }
  }

  /**
   * Retrieve data from localStorage
   */
  getLocalStorage(key: string): any {
    try {
      const item = localStorage.getItem(this.storagePrefix + key);
      if (item === null) {
        return this.memoryStore.get(key);
      }
      return JSON.parse(item);
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return this.memoryStore.get(key);
    }
  }

  /**
   * Store sensitive data in memory only
   */
  setMemoryOnly(key: string, data: any): void {
    this.memoryStore.set(key, data);
  }

  /**
   * Retrieve data from memory
   */
  getMemoryOnly(key: string): any {
    return this.memoryStore.get(key);
  }

  /**
   * Remove data from both localStorage and memory
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(this.storagePrefix + key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
    this.memoryStore.delete(key);
  }

  /**
   * Clear all sensitive data from memory
   */
  clearSensitiveData(): void {
    this.memoryStore.clear();
  }

  /**
   * Clear all quiz data (both localStorage and memory)
   */
  clearAllData(): void {
    try {
      // Remove all quiz-related items from localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
    this.memoryStore.clear();
  }
}

/**
 * Security monitor for logging and detecting suspicious activity
 */
export class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 100; // Keep last 100 events

  /**
   * Log a security event
   */
  logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
      userAgent: navigator.userAgent
    };

    this.events.push(securityEvent);
    
    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security Event:', securityEvent);
    }

    // Check for suspicious patterns
    if (this.detectSuspiciousActivity(securityEvent)) {
      this.handleSuspiciousActivity(securityEvent);
    }
  }

  /**
   * Detect suspicious activity patterns
   */
  private detectSuspiciousActivity(event: SecurityEvent): boolean {
    const recentEvents = this.events.filter(e => 
      Date.now() - e.timestamp.getTime() < 60000 // Last minute
    );

    // Too many events in short time
    if (recentEvents.length > 10) {
      return true;
    }

    // Multiple invalid input attempts
    const invalidInputEvents = recentEvents.filter(e => e.type === 'INVALID_INPUT');
    if (invalidInputEvents.length > 5) {
      return true;
    }

    return false;
  }

  /**
   * Handle suspicious activity
   */
  private handleSuspiciousActivity(event: SecurityEvent): void {
    console.warn('Suspicious activity detected:', event);
    
    // In a real application, you might:
    // - Send alert to security team
    // - Temporarily block the user
    // - Increase monitoring
    
    // Add suspicious activity event directly to avoid recursion
    const suspiciousEvent: SecurityEvent = {
      type: 'SUSPICIOUS_ACTIVITY',
      details: `Suspicious pattern detected: ${event.type}`,
      timestamp: new Date(),
      userAgent: navigator.userAgent
    };
    
    this.events.push(suspiciousEvent);
    
    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  /**
   * Get recent security events
   */
  getRecentEvents(minutes = 5): SecurityEvent[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.events.filter(e => e.timestamp.getTime() > cutoff);
  }

  /**
   * Clear all security events
   */
  clearEvents(): void {
    this.events = [];
  }
}

/**
 * Content Security Policy utilities
 */
export class CSPManager {
  /**
   * Generate CSP header value
   */
  static generateCSP(): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Allow inline scripts for React
      "style-src 'self' 'unsafe-inline'", // Allow inline styles for CSS modules
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ];

    return directives.join('; ');
  }

  /**
   * Apply CSP via meta tag (for client-side applications)
   */
  static applyCSP(): void {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = this.generateCSP();
    document.head.appendChild(meta);
  }
}

/**
 * HTTPS enforcement utilities
 */
export class HTTPSEnforcer {
  /**
   * Enforce HTTPS in production
   */
  static enforceHTTPS(): void {
    if (process.env.NODE_ENV === 'production' && location.protocol !== 'https:') {
      location.replace(`https:${location.href.substring(location.protocol.length)}`);
    }
  }

  /**
   * Check if connection is secure
   */
  static isSecure(): boolean {
    return location.protocol === 'https:' || location.hostname === 'localhost';
  }
}

/**
 * Input sanitization utilities (enhanced from validation.ts)
 */
export class InputSanitizer {
  /**
   * Advanced XSS prevention
   */
  static sanitizeForXSS(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove all HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove javascript: protocol
      .replace(/javascript:/gi, '')
      // Remove vbscript: protocol
      .replace(/vbscript:/gi, '')
      // Remove data: URLs (except images)
      .replace(/data:(?!image\/)[^,]*,/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove expression() CSS
      .replace(/expression\s*\(/gi, '')
      // Remove @import CSS
      .replace(/@import/gi, '')
      // Trim whitespace
      .trim();
  }

  /**
   * Sanitize for HTML attributes
   */
  static sanitizeAttribute(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/[<>"'&]/g, (match) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[match] || match;
      });
  }

  /**
   * Validate and sanitize URL
   */
  static sanitizeURL(url: string): string {
    if (typeof url !== 'string') {
      return '';
    }

    // Check for data URLs first (they don't work with URL constructor)
    if (url.startsWith('data:image/')) {
      return url;
    }

    // Only allow http and https protocols for regular URLs
    const allowedProtocols = /^https?:/i;
    
    try {
      const urlObj = new URL(url);
      if (allowedProtocols.test(urlObj.protocol)) {
        return url;
      }
    } catch {
      // Invalid URL
    }

    return '';
  }
}

// Create singleton instances for global use
export const rateLimiter = new RateLimiter();
export const secureStorage = new SecureStorageManager();
export const securityMonitor = new SecurityMonitor();

// Initialize security measures
export function initializeSecurity(): void {
  // Enforce HTTPS
  HTTPSEnforcer.enforceHTTPS();
  
  // Apply CSP (if not already set by server)
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    CSPManager.applyCSP();
  }
  
  // Clear sensitive data on page unload
  window.addEventListener('beforeunload', () => {
    secureStorage.clearSensitiveData();
  });
  
  // Clear sensitive data on visibility change (tab switch, minimize)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      secureStorage.clearSensitiveData();
    }
  });
}