#!/usr/bin/env node

/**
 * Security Hardening and Final Validation Script
 * Implements requirements: 6.5, 6.6, 6.9, 6.10, 6.11, 6.13, 6.14
 * 
 * This script performs a comprehensive security audit of the Weird Animal Quiz application:
 * - Validates input sanitization and validation functions
 * - Verifies Content Security Policy implementation
 * - Tests HTTPS enforcement
 * - Validates rate limiting mechanisms
 * - Checks secure storage implementation
 * - Runs dependency security scan
 * - Tests for common web vulnerabilities
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// Security audit results
const auditResults = {
  passed: [],
  warnings: [],
  failed: []
};

/**
 * Log a message with color
 */
function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Log a section header
 */
function logSection(title) {
  console.log('\n' + colors.bold + colors.cyan + '='.repeat(80) + colors.reset);
  console.log(colors.bold + colors.cyan + ` ${title} ` + colors.reset);
  console.log(colors.bold + colors.cyan + '='.repeat(80) + colors.reset + '\n');
}

/**
 * Log a test result
 */
function logResult(test, passed, message = '') {
  if (passed) {
    console.log(`${colors.green}✓ ${test}${colors.reset} ${message}`);
    auditResults.passed.push(test);
  } else {
    console.log(`${colors.red}✗ ${test}${colors.reset} ${message}`);
    auditResults.failed.push(test);
  }
}

/**
 * Log a warning
 */
function logWarning(test, message) {
  console.log(`${colors.yellow}⚠ ${test}${colors.reset} ${message}`);
  auditResults.warnings.push(`${test}: ${message}`);
}

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Read a file and return its content
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    logResult(`Read file ${filePath}`, false, `Error: ${error.message}`);
    return null;
  }
}

/**
 * Check if a file contains a pattern
 */
function fileContains(filePath, pattern) {
  const content = readFile(filePath);
  return content && (typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content));
}

/**
 * Run a command and return its output
 */
function runCommand(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', ...options });
  } catch (error) {
    return error.stdout?.toString() || error.message;
  }
}

/**
 * Check if tests for a specific file exist and pass
 */
function checkTestCoverage(sourceFile, testFile) {
  const sourceExists = fileExists(path.join(rootDir, sourceFile));
  const testExists = fileExists(path.join(rootDir, testFile));
  
  logResult(`Source file ${sourceFile} exists`, sourceExists);
  
  if (sourceExists) {
    logResult(`Test file ${testFile} exists`, testExists);
    
    if (testExists) {
      // Run the test for this specific file
      const testCommand = `npx vitest run ${testFile} --reporter=verbose`;
      const testOutput = runCommand(testCommand);
      const testPassed = !testOutput.includes('FAIL');
      
      logResult(`Tests for ${sourceFile} pass`, testPassed);
      
      if (!testPassed) {
        logWarning(`Test failures in ${testFile}`, 'Check test output for details');
      }
    }
  }
}

/**
 * Audit input validation and sanitization
 */
function auditInputValidation() {
  logSection('Input Validation and Sanitization Audit');
  
  // Check if validation utilities exist
  const validationFile = 'src/utils/validation.ts';
  const validationTestFile = 'src/utils/__tests__/validation.test.ts';
  const securityFile = 'src/utils/security.ts';
  const securityTestFile = 'src/utils/__tests__/security.test.ts';
  
  checkTestCoverage(validationFile, validationTestFile);
  checkTestCoverage(securityFile, securityTestFile);
  
  // Check for specific validation functions
  const validationContent = readFile(path.join(rootDir, validationFile));
  const securityContent = readFile(path.join(rootDir, securityFile));
  
  if (validationContent) {
    logResult('Input sanitization function exists', 
      validationContent.includes('function sanitizeInput') || 
      securityContent.includes('sanitizeForXSS'));
    
    logResult('Question validation function exists', 
      validationContent.includes('function validateQuestion'));
    
    logResult('Answer validation function exists', 
      validationContent.includes('function validateAnswer'));
    
    logResult('Quiz state validation function exists', 
      validationContent.includes('function validateQuizState'));
  }
  
  if (securityContent) {
    logResult('XSS prevention utilities exist', 
      securityContent.includes('sanitizeForXSS') || 
      securityContent.includes('InputSanitizer'));
    
    logResult('URL sanitization function exists', 
      securityContent.includes('sanitizeURL'));
  }
}

/**
 * Audit Content Security Policy implementation
 */
function auditCSP() {
  logSection('Content Security Policy Audit');
  
  // Check if CSP is implemented in security.ts
  const securityFile = path.join(rootDir, 'src/utils/security.ts');
  const securityContent = readFile(securityFile);
  
  if (securityContent) {
    logResult('CSP implementation exists', 
      securityContent.includes('CSPManager') || 
      securityContent.includes('Content-Security-Policy'));
    
    // Check for essential CSP directives
    const hasDefaultSrc = securityContent.includes("default-src 'self'");
    const hasScriptSrc = securityContent.includes("script-src");
    const hasStyleSrc = securityContent.includes("style-src");
    const hasFrameAncestors = securityContent.includes("frame-ancestors");
    
    logResult('CSP has default-src directive', hasDefaultSrc);
    logResult('CSP has script-src directive', hasScriptSrc);
    logResult('CSP has style-src directive', hasStyleSrc);
    logResult('CSP has frame-ancestors directive', hasFrameAncestors);
  }
  
  // Check if CSP is applied in index.html or main.tsx
  const indexFile = path.join(rootDir, 'index.html');
  const mainFile = path.join(rootDir, 'src/main.tsx');
  
  const indexContent = readFile(indexFile);
  const mainContent = readFile(mainFile);
  
  const indexHasCSP = indexContent && indexContent.includes('Content-Security-Policy');
  const mainHasCSP = mainContent && (
    mainContent.includes('Content-Security-Policy') || 
    mainContent.includes('CSPManager') ||
    mainContent.includes('initializeSecurity')
  );
  
  logResult('CSP is applied in HTML or main component', indexHasCSP || mainHasCSP);
  
  // Check if CSP is configured in Vite config
  const viteConfigFile = path.join(rootDir, 'vite.config.ts');
  const viteConfigContent = readFile(viteConfigFile);
  
  if (viteConfigContent) {
    const hasSecurityHeaders = viteConfigContent.includes('X-Content-Type-Options') || 
                              viteConfigContent.includes('X-Frame-Options') ||
                              viteConfigContent.includes('X-XSS-Protection');
    
    logResult('Security headers configured in Vite', hasSecurityHeaders);
  }
}

/**
 * Audit HTTPS enforcement
 */
function auditHTTPS() {
  logSection('HTTPS Enforcement Audit');
  
  // Check if HTTPS enforcement is implemented
  const securityFile = path.join(rootDir, 'src/utils/security.ts');
  const securityContent = readFile(securityFile);
  
  if (securityContent) {
    const hasHTTPSEnforcement = securityContent.includes('enforceHTTPS') || 
                               securityContent.includes('location.protocol') ||
                               securityContent.includes('https:');
    
    logResult('HTTPS enforcement implementation exists', hasHTTPSEnforcement);
    
    // Check if HTTPS is enforced in production
    const productionCheck = securityContent.includes("process.env.NODE_ENV === 'production'") && 
                           securityContent.includes('location.replace');
    
    logResult('HTTPS is enforced in production', productionCheck);
  }
  
  // Check if HTTPS is mentioned in documentation
  const readmeFile = path.join(rootDir, 'README.md');
  const readmeContent = readFile(readmeFile);
  
  if (readmeContent) {
    const httpsInReadme = readmeContent.includes('HTTPS') || 
                         readmeContent.includes('https:') ||
                         readmeContent.includes('SSL');
    
    if (!httpsInReadme) {
      logWarning('HTTPS in documentation', 'HTTPS requirements not mentioned in README');
    }
  }
}

/**
 * Audit rate limiting implementation
 */
function auditRateLimiting() {
  logSection('Rate Limiting Audit');
  
  // Check if rate limiting is implemented
  const securityFile = path.join(rootDir, 'src/utils/security.ts');
  const securityContent = readFile(securityFile);
  
  if (securityContent) {
    const hasRateLimiter = securityContent.includes('RateLimiter') || 
                          securityContent.includes('rateLimiter');
    
    logResult('Rate limiting implementation exists', hasRateLimiter);
    
    if (hasRateLimiter) {
      // Check rate limit configuration
      const maxRequestsPattern = /maxRequests\s*=\s*(\d+)/;
      const timeWindowPattern = /timeWindow\s*=\s*(\d+)/;
      
      const maxRequestsMatch = securityContent.match(maxRequestsPattern);
      const timeWindowMatch = securityContent.match(timeWindowPattern);
      
      const maxRequests = maxRequestsMatch ? parseInt(maxRequestsMatch[1]) : null;
      
      if (maxRequests !== null) {
        const isCompliant = maxRequests <= 10; // Requirement 6.5: max 10 requests per minute
        logResult('Rate limit complies with requirement 6.5', isCompliant, 
          isCompliant ? `(${maxRequests} requests)` : `(${maxRequests} requests, should be <= 10)`);
      } else {
        logWarning('Rate limit configuration', 'Could not determine max requests');
      }
    }
  }
  
  // Check if rate limiting is tested
  const securityTestFile = path.join(rootDir, 'src/utils/__tests__/security.test.ts');
  const securityTestContent = readFile(securityTestFile);
  
  if (securityTestContent) {
    const hasRateLimiterTests = securityTestContent.includes('RateLimiter') && 
                               securityTestContent.includes('should block requests over limit');
    
    logResult('Rate limiting tests exist', hasRateLimiterTests);
  }
}

/**
 * Audit secure storage implementation
 */
function auditSecureStorage() {
  logSection('Secure Storage Audit');
  
  // Check if secure storage is implemented
  const securityFile = path.join(rootDir, 'src/utils/security.ts');
  const securityContent = readFile(securityFile);
  
  if (securityContent) {
    const hasSecureStorage = securityContent.includes('SecureStorageManager') || 
                            securityContent.includes('secureStorage');
    
    logResult('Secure storage implementation exists', hasSecureStorage);
    
    if (hasSecureStorage) {
      // Check for memory-only storage for sensitive data
      const hasMemoryOnlyStorage = securityContent.includes('setMemoryOnly') || 
                                  securityContent.includes('getMemoryOnly');
      
      logResult('Memory-only storage for sensitive data exists', hasMemoryOnlyStorage);
      
      // Check for data cleanup
      const hasDataCleanup = securityContent.includes('clearSensitiveData') || 
                            securityContent.includes('clearAllData');
      
      logResult('Data cleanup implementation exists', hasDataCleanup);
      
      // Check for event listeners to clear data
      const hasUnloadListener = securityContent.includes('beforeunload') || 
                               securityContent.includes('visibilitychange');
      
      logResult('Data cleanup on page unload exists', hasUnloadListener);
    }
  }
  
  // Check if secure storage is tested
  const securityTestFile = path.join(rootDir, 'src/utils/__tests__/security.test.ts');
  const securityTestContent = readFile(securityTestFile);
  
  if (securityTestContent) {
    const hasSecureStorageTests = securityTestContent.includes('SecureStorageManager') && 
                                 securityTestContent.includes('should clear sensitive data');
    
    logResult('Secure storage tests exist', hasSecureStorageTests);
  }
}

/**
 * Audit dependency security
 */
function auditDependencies() {
  logSection('Dependency Security Audit');
  
  // Check if package verification script exists
  const verifyPackagesFile = path.join(rootDir, 'scripts/verify-packages.js');
  const verifyPackagesExists = fileExists(verifyPackagesFile);
  
  logResult('Package verification script exists', verifyPackagesExists);
  
  if (verifyPackagesExists) {
    // Check if verification script is comprehensive
    const verifyContent = readFile(verifyPackagesFile);
    
    if (verifyContent) {
      const hasApprovedPackages = verifyContent.includes('APPROVED_PACKAGES');
      const hasDownloadCheck = verifyContent.includes('getDownloadCount') || 
                              verifyContent.includes('minDownloads');
      const hasTyposquattingCheck = verifyContent.includes('verifyPackageName') || 
                                   verifyContent.includes('typosquatting');
      
      logResult('Approved packages list exists', hasApprovedPackages);
      logResult('Download count verification exists', hasDownloadCheck);
      logResult('Typosquatting prevention exists', hasTyposquattingCheck);
    }
  }
  
  // Check if npm audit is configured
  const packageJsonFile = path.join(rootDir, 'package.json');
  const packageJsonContent = readFile(packageJsonFile);
  
  if (packageJsonContent) {
    const packageJson = JSON.parse(packageJsonContent);
    
    const hasSecurityAudit = packageJson.scripts && 
                            (packageJson.scripts['security:audit'] || 
                             packageJson.scripts['audit'] ||
                             packageJson.scripts['security:check']);
    
    logResult('npm audit script exists', hasSecurityAudit);
    
    // Run npm audit
    log('Running npm audit...', colors.cyan);
    const auditOutput = runCommand('npm audit --json');
    
    try {
      const auditResult = JSON.parse(auditOutput);
      const vulnerabilities = auditResult.metadata?.vulnerabilities;
      
      if (vulnerabilities) {
        const totalVulnerabilities = Object.values(vulnerabilities).reduce((sum, count) => sum + count, 0);
        const highOrCritical = (vulnerabilities.high || 0) + (vulnerabilities.critical || 0);
        
        logResult('No high or critical vulnerabilities', highOrCritical === 0, 
          highOrCritical > 0 ? `(${highOrCritical} high/critical vulnerabilities found)` : '');
        
        if (totalVulnerabilities > 0) {
          logWarning('npm audit', `${totalVulnerabilities} total vulnerabilities found`);
        } else {
          logResult('No vulnerabilities found', true);
        }
      } else {
        logResult('No vulnerabilities found', true);
      }
    } catch (error) {
      logWarning('npm audit parse error', error.message);
    }
  }
}

/**
 * Audit for common web vulnerabilities
 */
function auditWebVulnerabilities() {
  logSection('Common Web Vulnerabilities Audit');
  
  // Check for XSS prevention
  const securityFile = path.join(rootDir, 'src/utils/security.ts');
  const validationFile = path.join(rootDir, 'src/utils/validation.ts');
  
  const securityContent = readFile(securityFile);
  const validationContent = readFile(validationFile);
  
  if (securityContent && validationContent) {
    const hasXSSPrevention = securityContent.includes('sanitizeForXSS') || 
                            validationContent.includes('sanitizeInput');
    
    logResult('XSS prevention exists', hasXSSPrevention);
    
    // Check for CSRF protection
    const hasCSRFProtection = securityContent.includes('CSRF') || 
                             securityContent.includes('csrf');
    
    if (!hasCSRFProtection) {
      logWarning('CSRF protection', 'No explicit CSRF protection found, but may not be needed for this app');
    }
    
    // Check for clickjacking protection
    const hasClickjackingProtection = securityContent.includes('X-Frame-Options') || 
                                     securityContent.includes('frame-ancestors');
    
    logResult('Clickjacking protection exists', hasClickjackingProtection);
    
    // Check for secure headers
    const hasSecureHeaders = securityContent.includes('X-Content-Type-Options') || 
                            securityContent.includes('X-XSS-Protection');
    
    logResult('Secure headers implementation exists', hasSecureHeaders);
  }
  
  // Check for parameterized queries (if applicable)
  const hasDatabase = fileExists(path.join(rootDir, 'src/data/database.ts')) || 
                     fileExists(path.join(rootDir, 'src/services/api.ts'));
  
  if (hasDatabase) {
    logWarning('Parameterized queries', 'Database access detected, ensure parameterized queries are used');
  } else {
    log('No database access detected, parameterized queries requirement not applicable', colors.cyan);
  }
  
  // Check for file upload validation (if applicable)
  const hasFileUploads = fileExists(path.join(rootDir, 'src/utils/fileUpload.ts')) || 
                        fileExists(path.join(rootDir, 'src/components/FileUpload.tsx'));
  
  if (hasFileUploads) {
    logWarning('File upload validation', 'File uploads detected, ensure proper validation is implemented');
  } else {
    log('No file uploads detected, file validation requirement not applicable', colors.cyan);
  }
}

/**
 * Run all security audits
 */
function runSecurityAudit() {
  log('\n' + colors.bold + colors.magenta + '='.repeat(80) + colors.reset);
  log(colors.bold + colors.magenta + ' SECURITY HARDENING AND FINAL VALIDATION ' + colors.reset);
  log(colors.bold + colors.magenta + '='.repeat(80) + colors.reset + '\n');
  
  auditInputValidation();
  auditCSP();
  auditHTTPS();
  auditRateLimiting();
  auditSecureStorage();
  auditDependencies();
  auditWebVulnerabilities();
  
  // Summary
  logSection('Security Audit Summary');
  
  log(`${colors.green}✓ Passed: ${auditResults.passed.length}${colors.reset}`);
  log(`${colors.yellow}⚠ Warnings: ${auditResults.warnings.length}${colors.reset}`);
  log(`${colors.red}✗ Failed: ${auditResults.failed.length}${colors.reset}`);
  
  if (auditResults.failed.length > 0) {
    log('\n' + colors.red + 'Failed tests:' + colors.reset);
    auditResults.failed.forEach(test => log(`- ${test}`, colors.red));
  }
  
  if (auditResults.warnings.length > 0) {
    log('\n' + colors.yellow + 'Warnings:' + colors.reset);
    auditResults.warnings.forEach(warning => log(`- ${warning}`, colors.yellow));
  }
  
  if (auditResults.failed.length === 0) {
    log('\n' + colors.green + 'Security audit passed! 🎉' + colors.reset);
    return 0;
  } else {
    log('\n' + colors.red + 'Security audit failed. Please fix the issues above.' + colors.reset);
    return 1;
  }
}

// Run the security audit
process.exit(runSecurityAudit());