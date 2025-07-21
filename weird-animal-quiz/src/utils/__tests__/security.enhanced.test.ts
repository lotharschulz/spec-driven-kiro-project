/**
 * Enhanced security tests for the security hardening task
 * Tests the new security features added in task 20
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CSPManager,
  HTTPSEnforcer,
  InputSanitizer,
  DatabaseSecurity,
  SecurityAuditor,
  securityMonitor
} from '../security';

// Mock document
const documentMock = {
  head: {
    appendChild: vi.fn()
  },
  createElement: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn()
};

// Mock location
const locationMock = {
  protocol: 'https:',
  hostname: 'example.com',
  href: 'https://example.com/quiz',
  origin: 'https://example.com',
  replace: vi.fn()
};

// Mock window
const windowMock = {
  location: locationMock
};

describe('Enhanced Security Features', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup global mocks
    Object.defineProperty(global, 'document', {
      value: documentMock,
      writable: true
    });
    
    Object.defineProperty(global, 'location', {
      value: locationMock,
      writable: true
    });
    
    Object.defineProperty(global, 'window', {
      value: windowMock,
      writable: true
    });
    
    // Mock console
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  describe('Enhanced CSPManager', () => {
    it('should generate CSP with additional security directives', () => {
      const csp = CSPManager.generateCSP();
      
      // Check for enhanced CSP directives
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("worker-src 'self'");
      expect(csp).toContain("manifest-src 'self'");
      expect(csp).toContain("upgrade-insecure-requests");
      expect(csp).toContain("block-all-mixed-content");
    });
    
    it('should apply all security headers', () => {
      const mockMeta = { httpEquiv: '', content: '' };
      documentMock.createElement.mockReturnValue(mockMeta);
      
      CSPManager.applySecurityHeaders();
      
      // Should create multiple meta tags for different security headers
      expect(documentMock.createElement).toHaveBeenCalledTimes(expect.any(Number));
      expect(documentMock.createElement.mock.calls.every(call => call[0] === 'meta')).toBe(true);
      expect(documentMock.head.appendChild).toHaveBeenCalledTimes(expect.any(Number));
    });
    
    it('should validate URLs against CSP', () => {
      // Same origin URL should be valid
      expect(CSPManager.validateUrlAgainstCSP('https://example.com/page')).toBe(true);
      
      // HTTPS URL should be valid
      expect(CSPManager.validateUrlAgainstCSP('https://other-domain.com')).toBe(true);
      
      // HTTP URL should be invalid
      expect(CSPManager.validateUrlAgainstCSP('http://example.com')).toBe(false);
      
      // Invalid URL should be invalid
      expect(CSPManager.validateUrlAgainstCSP('not-a-url')).toBe(false);
      
      // Empty URL should be invalid
      expect(CSPManager.validateUrlAgainstCSP('')).toBe(false);
    });
  });
  
  describe('Enhanced HTTPSEnforcer', () => {
    it('should add HSTS header in production', () => {
      const mockMeta = { httpEquiv: '', content: '' };
      documentMock.createElement.mockReturnValue(mockMeta);
      
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      HTTPSEnforcer.enforceHTTPS();
      
      expect(documentMock.createElement).toHaveBeenCalledWith('meta');
      expect(mockMeta.httpEquiv).toBe('Strict-Transport-Security');
      expect(mockMeta.content).toContain('max-age=31536000');
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
    
    it('should monitor insecure connections', () => {
      // Mock insecure connection
      locationMock.protocol = 'http:';
      locationMock.hostname = 'example.com';
      
      // Spy on security monitor
      const logSpy = vi.spyOn(securityMonitor, 'logSecurityEvent');
      
      HTTPSEnforcer.monitorInsecureConnections();
      
      expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'INSECURE_CONNECTION'
      }));
      
      // Restore secure connection
      locationMock.protocol = 'https:';
    });
  });
  
  describe('Enhanced InputSanitizer', () => {
    it('should detect malicious input', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'XSS\')">',
        'document.cookie',
        'eval("alert(1)")',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>'
      ];
      
      maliciousInputs.forEach(input => {
        expect(InputSanitizer.detectMaliciousInput(input)).toBe(true);
      });
      
      const safeInputs = [
        'Hello world',
        'This is a normal text',
        'No scripts here',
        '12345',
        'https://example.com'
      ];
      
      safeInputs.forEach(input => {
        expect(InputSanitizer.detectMaliciousInput(input)).toBe(false);
      });
    });
    
    it('should sanitize JSON input', () => {
      const validJson = '{"name":"John","age":30}';
      expect(InputSanitizer.sanitizeJSON(validJson)).toBe(validJson);
      
      const invalidJson = '{"name":"John",age:30}'; // Missing quotes around age
      expect(InputSanitizer.sanitizeJSON(invalidJson)).toBe('{}');
      
      const maliciousJson = '{"__proto__":{"isAdmin":true}}'; // Prototype pollution attempt
      const sanitized = InputSanitizer.sanitizeJSON(maliciousJson);
      expect(sanitized).toBe(maliciousJson); // JSON.parse/stringify preserves this but doesn't execute it
      
      // Non-string input
      expect(InputSanitizer.sanitizeJSON(null as any)).toBe('{}');
      expect(InputSanitizer.sanitizeJSON(undefined as any)).toBe('{}');
      expect(InputSanitizer.sanitizeJSON(123 as any)).toBe('{}');
    });
    
    it('should validate file uploads', () => {
      // Valid file
      const validFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      expect(InputSanitizer.validateFileUpload(validFile)).toBe(true);
      
      // Invalid file type
      const invalidTypeFile = new File(['test content'], 'test.exe', { type: 'application/x-msdownload' });
      expect(InputSanitizer.validateFileUpload(invalidTypeFile)).toBe(false);
      
      // File too large (mock a 10MB file)
      const largeMockFile = {
        name: 'large.jpg',
        type: 'image/jpeg',
        size: 10 * 1024 * 1024 // 10MB
      } as File;
      expect(InputSanitizer.validateFileUpload(largeMockFile)).toBe(false);
    });
  });
  
  describe('DatabaseSecurity', () => {
    it('should create parameterized queries', () => {
      const query = 'SELECT * FROM users WHERE name = :name AND age > :age';
      const params = { name: "O'Reilly", age: 30 };
      
      const parameterizedQuery = DatabaseSecurity.createParameterizedQuery(query, params);
      
      // Check that parameters were replaced
      expect(parameterizedQuery).toContain("O''Reilly"); // Single quotes should be escaped
      expect(parameterizedQuery).toContain("age > 30");
      
      // Check SQL injection prevention
      const maliciousParams = { name: "'; DROP TABLE users; --" };
      const safeQuery = DatabaseSecurity.createParameterizedQuery('SELECT * FROM users WHERE name = :name', maliciousParams);
      
      expect(safeQuery).toContain("''"); // Single quotes should be escaped
      expect(safeQuery).not.toContain("DROP TABLE"); // Should be treated as string literal
    });
    
    it('should validate SQL identifiers', () => {
      // Valid identifiers
      expect(DatabaseSecurity.validateSqlIdentifier('users')).toBe(true);
      expect(DatabaseSecurity.validateSqlIdentifier('user_profiles')).toBe(true);
      expect(DatabaseSecurity.validateSqlIdentifier('table123')).toBe(true);
      
      // Invalid identifiers (SQL injection attempts)
      expect(DatabaseSecurity.validateSqlIdentifier('users; DROP TABLE users;')).toBe(false);
      expect(DatabaseSecurity.validateSqlIdentifier('users WHERE 1=1')).toBe(false);
      expect(DatabaseSecurity.validateSqlIdentifier('users--')).toBe(false);
    });
  });
  
  describe('SecurityAuditor', () => {
    it('should run security audit', async () => {
      // Mock document.querySelector to simulate security headers
      documentMock.querySelector.mockImplementation((selector) => {
        if (selector === 'meta[http-equiv="Content-Security-Policy"]') {
          return { content: "default-src 'self'" };
        }
        return null;
      });
      
      // Mock HTTPSEnforcer.isSecure
      const isSecureSpy = vi.spyOn(HTTPSEnforcer, 'isSecure').mockReturnValue(true);
      
      const results = await SecurityAuditor.runSecurityAudit();
      
      expect(results.cspImplemented).toBe(true);
      expect(results.httpsEnforced).toBe(true);
      expect(results.secureStorageImplemented).toBe(true);
      expect(results.rateLimitingImplemented).toBe(true);
      expect(results.inputValidationImplemented).toBe(true);
      
      isSecureSpy.mockRestore();
    });
    
    it('should check for vulnerabilities', () => {
      // Mock document.querySelector to simulate security headers
      documentMock.querySelector.mockImplementation((selector) => {
        if (selector === 'meta[http-equiv="X-Frame-Options"]') {
          return { content: "DENY" };
        }
        if (selector === 'meta[http-equiv="X-Content-Type-Options"]') {
          return { content: "nosniff" };
        }
        return null;
      });
      
      // Mock HTTPSEnforcer.isSecure
      const isSecureSpy = vi.spyOn(HTTPSEnforcer, 'isSecure').mockReturnValue(true);
      
      const results = SecurityAuditor.checkVulnerabilities();
      
      expect(results.xssProtection).toBe(true);
      expect(results.clickjackingProtection).toBe(true);
      expect(results.secureHeaders).toBe(true);
      expect(results.httpsEnabled).toBe(true);
      
      isSecureSpy.mockRestore();
    });
  });
});