/**
 * Unit tests for security utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  RateLimiter,
  SecureStorageManager,
  SecurityMonitor,
  CSPManager,
  HTTPSEnforcer,
  InputSanitizer,
  rateLimiter,
  secureStorage,
  securityMonitor,
  initializeSecurity
} from '../security';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

// Mock location
const locationMock = {
  protocol: 'https:',
  hostname: 'example.com',
  href: 'https://example.com/quiz',
  replace: vi.fn()
};

// Mock navigator
const navigatorMock = {
  userAgent: 'Mozilla/5.0 (Test Browser)'
};

// Mock document
const documentMock = {
  head: {
    appendChild: vi.fn()
  },
  createElement: vi.fn(),
  querySelector: vi.fn(),
  addEventListener: vi.fn(),
  hidden: false
};

// Mock window
const windowMock = {
  addEventListener: vi.fn()
};

describe('Security Utilities', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup global mocks
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    Object.defineProperty(global, 'location', {
      value: locationMock,
      writable: true
    });
    
    Object.defineProperty(global, 'navigator', {
      value: navigatorMock,
      writable: true
    });
    
    Object.defineProperty(global, 'document', {
      value: documentMock,
      writable: true
    });
    
    Object.defineProperty(global, 'window', {
      value: windowMock,
      writable: true
    });
  });

  describe('RateLimiter', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter(3, 1); // 3 requests per minute
    });

    it('should allow requests within limit', () => {
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(true);
    });

    it('should block requests over limit', () => {
      // Use up the limit
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      
      // This should be blocked
      expect(limiter.isAllowed('user1')).toBe(false);
    });

    it('should track different users separately', () => {
      // Use up limit for user1
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      
      // user2 should still be allowed
      expect(limiter.isAllowed('user2')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(false);
    });

    it('should return correct remaining requests', () => {
      expect(limiter.getRemainingRequests('user1')).toBe(3);
      
      limiter.isAllowed('user1');
      expect(limiter.getRemainingRequests('user1')).toBe(2);
      
      limiter.isAllowed('user1');
      expect(limiter.getRemainingRequests('user1')).toBe(1);
      
      limiter.isAllowed('user1');
      expect(limiter.getRemainingRequests('user1')).toBe(0);
    });

    it('should clear all rate limit data', () => {
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      
      expect(limiter.isAllowed('user1')).toBe(false);
      
      limiter.clear();
      expect(limiter.isAllowed('user1')).toBe(true);
    });
  });

  describe('SecureStorageManager', () => {
    let storage: SecureStorageManager;

    beforeEach(() => {
      storage = new SecureStorageManager();
      localStorageMock.getItem.mockReturnValue(null);
      localStorageMock.setItem.mockClear();
      localStorageMock.removeItem.mockClear();
    });

    it('should store and retrieve data from localStorage', () => {
      const testData = { score: 100, level: 'easy' };
      
      storage.setLocalStorage('test', testData);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'weird-animal-quiz-test',
        JSON.stringify(testData)
      );
    });

    it('should retrieve data from localStorage', () => {
      const testData = { score: 100, level: 'easy' };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(testData));
      
      const result = storage.getLocalStorage('test');
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('weird-animal-quiz-test');
      expect(result).toEqual(testData);
    });

    it('should fallback to memory storage when localStorage fails', () => {
      const testData = { score: 100, level: 'easy' };
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      storage.setLocalStorage('test', testData);
      const result = storage.getLocalStorage('test');
      
      expect(result).toEqual(testData);
    });

    it('should store and retrieve memory-only data', () => {
      const sensitiveData = { sessionToken: 'abc123' };
      
      storage.setMemoryOnly('session', sensitiveData);
      const result = storage.getMemoryOnly('session');
      
      expect(result).toEqual(sensitiveData);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should remove data from both localStorage and memory', () => {
      const testData = { score: 100 };
      
      storage.setLocalStorage('test', testData);
      storage.setMemoryOnly('test', testData);
      
      storage.remove('test');
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('weird-animal-quiz-test');
      expect(storage.getMemoryOnly('test')).toBeUndefined();
    });

    it('should clear sensitive data from memory', () => {
      storage.setMemoryOnly('session1', { token: 'abc' });
      storage.setMemoryOnly('session2', { token: 'def' });
      
      storage.clearSensitiveData();
      
      expect(storage.getMemoryOnly('session1')).toBeUndefined();
      expect(storage.getMemoryOnly('session2')).toBeUndefined();
    });

    it('should clear all data', () => {
      // Mock localStorage.key to return quiz-related keys
      localStorageMock.length = 3;
      localStorageMock.key
        .mockReturnValueOnce('weird-animal-quiz-test1')
        .mockReturnValueOnce('other-app-data')
        .mockReturnValueOnce('weird-animal-quiz-test2');
      
      storage.setMemoryOnly('memory-data', { test: true });
      
      storage.clearAllData();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('weird-animal-quiz-test1');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('weird-animal-quiz-test2');
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('other-app-data');
      expect(storage.getMemoryOnly('memory-data')).toBeUndefined();
    });
  });

  describe('SecurityMonitor', () => {
    let monitor: SecurityMonitor;

    beforeEach(() => {
      monitor = new SecurityMonitor();
      vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should log security events', () => {
      const event = {
        type: 'INVALID_INPUT' as const,
        details: 'Malicious script detected'
      };
      
      monitor.logSecurityEvent(event);
      
      const recentEvents = monitor.getRecentEvents();
      expect(recentEvents).toHaveLength(1);
      expect(recentEvents[0].type).toBe('INVALID_INPUT');
      expect(recentEvents[0].details).toBe('Malicious script detected');
      expect(recentEvents[0].userAgent).toBe('Mozilla/5.0 (Test Browser)');
    });

    it('should detect suspicious activity with too many events', () => {
      // Generate many events quickly
      for (let i = 0; i < 12; i++) {
        monitor.logSecurityEvent({
          type: 'INVALID_INPUT',
          details: `Event ${i}`
        });
      }
      
      const recentEvents = monitor.getRecentEvents();
      const suspiciousEvents = recentEvents.filter(e => e.type === 'SUSPICIOUS_ACTIVITY');
      expect(suspiciousEvents.length).toBeGreaterThan(0);
    });

    it('should detect suspicious activity with repeated invalid inputs', () => {
      // Generate many invalid input events
      for (let i = 0; i < 6; i++) {
        monitor.logSecurityEvent({
          type: 'INVALID_INPUT',
          details: `Invalid input ${i}`
        });
      }
      
      const recentEvents = monitor.getRecentEvents();
      const suspiciousEvents = recentEvents.filter(e => e.type === 'SUSPICIOUS_ACTIVITY');
      expect(suspiciousEvents.length).toBeGreaterThan(0);
    });

    it('should limit stored events to maximum', () => {
      // Generate more than max events
      for (let i = 0; i < 150; i++) {
        monitor.logSecurityEvent({
          type: 'INVALID_INPUT',
          details: `Event ${i}`
        });
      }
      
      const allEvents = monitor.getRecentEvents(60); // Get events from last hour
      expect(allEvents.length).toBeLessThanOrEqual(100);
    });

    it('should clear all events', () => {
      monitor.logSecurityEvent({
        type: 'INVALID_INPUT',
        details: 'Test event'
      });
      
      expect(monitor.getRecentEvents()).toHaveLength(1);
      
      monitor.clearEvents();
      expect(monitor.getRecentEvents()).toHaveLength(0);
    });
  });

  describe('CSPManager', () => {
    it('should generate correct CSP header', () => {
      const csp = CSPManager.generateCSP();
      
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self' 'unsafe-inline'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
      expect(csp).toContain("img-src 'self' data: https:");
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should apply CSP via meta tag', () => {
      const mockMeta = { httpEquiv: '', content: '' };
      documentMock.createElement.mockReturnValue(mockMeta);
      
      CSPManager.applyCSP();
      
      expect(documentMock.createElement).toHaveBeenCalledWith('meta');
      expect(mockMeta.httpEquiv).toBe('Content-Security-Policy');
      expect(mockMeta.content).toContain("default-src 'self'");
      expect(documentMock.head.appendChild).toHaveBeenCalledWith(mockMeta);
    });
  });

  describe('HTTPSEnforcer', () => {
    it('should enforce HTTPS in production', () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Mock HTTP connection
      locationMock.protocol = 'http:';
      locationMock.href = 'http://example.com/quiz';
      
      HTTPSEnforcer.enforceHTTPS();
      
      expect(locationMock.replace).toHaveBeenCalledWith('https://example.com/quiz');
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should not enforce HTTPS in development', () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      locationMock.protocol = 'http:';
      locationMock.replace.mockClear();
      
      HTTPSEnforcer.enforceHTTPS();
      
      expect(locationMock.replace).not.toHaveBeenCalled();
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should check if connection is secure', () => {
      locationMock.protocol = 'https:';
      expect(HTTPSEnforcer.isSecure()).toBe(true);
      
      locationMock.protocol = 'http:';
      locationMock.hostname = 'localhost';
      expect(HTTPSEnforcer.isSecure()).toBe(true);
      
      locationMock.hostname = 'example.com';
      expect(HTTPSEnforcer.isSecure()).toBe(false);
    });
  });

  describe('InputSanitizer', () => {
    it('should sanitize XSS attempts', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = InputSanitizer.sanitizeForXSS(maliciousInput);
      
      expect(sanitized).toBe('Hello World');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove HTML tags', () => {
      const htmlInput = '<div>Hello <span>World</span></div>';
      const sanitized = InputSanitizer.sanitizeForXSS(htmlInput);
      
      expect(sanitized).toBe('Hello World');
    });

    it('should remove javascript protocols', () => {
      const jsInput = 'javascript:alert("xss")';
      const sanitized = InputSanitizer.sanitizeForXSS(jsInput);
      
      expect(sanitized).toBe('alert("xss")');
    });

    it('should remove event handlers', () => {
      const eventInput = 'onclick=alert("xss") Hello';
      const sanitized = InputSanitizer.sanitizeForXSS(eventInput);
      
      expect(sanitized).toBe('alert("xss") Hello');
    });

    it('should preserve image data URLs', () => {
      const imageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      const sanitized = InputSanitizer.sanitizeForXSS(imageDataUrl);
      
      expect(sanitized).toBe(imageDataUrl);
    });

    it('should remove dangerous data URLs', () => {
      const dangerousDataUrl = 'data:text/html,<script>alert("xss")</script>';
      const sanitized = InputSanitizer.sanitizeForXSS(dangerousDataUrl);
      
      expect(sanitized).toBe('');
    });

    it('should handle non-string input', () => {
      expect(InputSanitizer.sanitizeForXSS(null as any)).toBe('');
      expect(InputSanitizer.sanitizeForXSS(undefined as any)).toBe('');
      expect(InputSanitizer.sanitizeForXSS(123 as any)).toBe('');
      expect(InputSanitizer.sanitizeForXSS({} as any)).toBe('');
    });

    it('should sanitize HTML attributes', () => {
      const attrInput = 'Hello "World" & <script>';
      const sanitized = InputSanitizer.sanitizeAttribute(attrInput);
      
      expect(sanitized).toBe('Hello &quot;World&quot; &amp; &lt;script&gt;');
    });

    it('should sanitize URLs', () => {
      expect(InputSanitizer.sanitizeURL('https://example.com')).toBe('https://example.com');
      expect(InputSanitizer.sanitizeURL('http://example.com')).toBe('http://example.com');
      expect(InputSanitizer.sanitizeURL('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
      expect(InputSanitizer.sanitizeURL('javascript:alert("xss")')).toBe('');
      expect(InputSanitizer.sanitizeURL('ftp://example.com')).toBe('');
      expect(InputSanitizer.sanitizeURL('invalid-url')).toBe('');
    });
  });

  describe('Singleton instances', () => {
    it('should provide singleton instances', () => {
      expect(rateLimiter).toBeInstanceOf(RateLimiter);
      expect(secureStorage).toBeInstanceOf(SecureStorageManager);
      expect(securityMonitor).toBeInstanceOf(SecurityMonitor);
    });
  });

  describe('initializeSecurity', () => {
    it('should initialize security measures', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      locationMock.protocol = 'http:';
      documentMock.querySelector.mockReturnValue(null);
      
      initializeSecurity();
      
      // Should enforce HTTPS
      expect(locationMock.replace).toHaveBeenCalled();
      
      // Should apply CSP
      expect(documentMock.createElement).toHaveBeenCalledWith('meta');
      
      // Should set up event listeners
      expect(windowMock.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
      expect(documentMock.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not apply CSP if already present', () => {
      documentMock.querySelector.mockReturnValue({}); // Mock existing CSP meta tag
      documentMock.createElement.mockClear();
      
      initializeSecurity();
      
      expect(documentMock.createElement).not.toHaveBeenCalled();
    });
  });
});