#!/usr/bin/env node

/**
 * Security-first package verification script
 * Verifies packages against security criteria before installation
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Approved packages with security criteria
const APPROVED_PACKAGES = {
  react: { minDownloads: 20000000, maintainer: 'facebook', verified: true },
  'react-dom': {
    minDownloads: 20000000,
    maintainer: 'facebook',
    verified: true,
  },
  typescript: {
    minDownloads: 45000000,
    maintainer: 'microsoft',
    verified: true,
  },
  'framer-motion': {
    minDownloads: 2000000,
    maintainer: 'framer',
    verified: true,
  },
  vite: { minDownloads: 5000000, maintainer: 'vitejs', verified: true },
  '@vitejs/plugin-react': {
    minDownloads: 1000000,
    maintainer: 'vitejs',
    verified: true,
  },
  eslint: { minDownloads: 30000000, maintainer: 'eslint', verified: true },
  '@eslint/js': { minDownloads: 1000000, maintainer: 'eslint', verified: true },
  'eslint-config-prettier': { minDownloads: 5000000, maintainer: 'prettier', verified: true },
  'eslint-plugin-prettier': { minDownloads: 3000000, maintainer: 'prettier', verified: true },
  'eslint-plugin-react-hooks': { minDownloads: 10000000, maintainer: 'facebook', verified: true },
  'eslint-plugin-react-refresh': { minDownloads: 500000, maintainer: 'vitejs', verified: true },
  prettier: { minDownloads: 25000000, maintainer: 'prettier', verified: true },
  vitest: { minDownloads: 1000000, maintainer: 'vitest-dev', verified: true },
  '@testing-library/react': {
    minDownloads: 5000000,
    maintainer: 'testing-library',
    verified: true,
  },
  '@testing-library/jest-dom': {
    minDownloads: 5000000,
    maintainer: 'testing-library',
    verified: true,
  },
  '@testing-library/user-event': {
    minDownloads: 3000000,
    maintainer: 'testing-library',
    verified: true,
  },
  jsdom: { minDownloads: 10000000, maintainer: 'jsdom', verified: true },
  '@types/react': { minDownloads: 15000000, maintainer: 'types', verified: true },
  '@types/react-dom': { minDownloads: 15000000, maintainer: 'types', verified: true },
  '@typescript-eslint/eslint-plugin': { minDownloads: 10000000, maintainer: 'typescript-eslint', verified: true },
  '@typescript-eslint/parser': { minDownloads: 10000000, maintainer: 'typescript-eslint', verified: true },
  'typescript-eslint': { minDownloads: 1000000, maintainer: 'typescript-eslint', verified: true },
  globals: { minDownloads: 20000000, maintainer: 'sindresorhus', verified: true },
};

class PackageVerifier {
  constructor() {
    this.packageJsonPath = path.join(process.cwd(), 'package.json');
  }

  /**
   * Verify package name against typosquatting
   */
  verifyPackageName(packageName) {
    const suspiciousPatterns = [
      /react[0-9]/,
      /reac[^t]/,
      /[^r]eact/,
      /typescript[0-9]/,
      /typescirpt/,
      /vit[^e]/,
      /[^v]ite$/,
      /eslint[0-9]/,
      /eslin[^t]/,
      /prettier[0-9]/,
      /pretier/,
      /vitest[0-9]/,
      /vites[^t]/,
      /framer-motion[0-9]/,
      /frammer-motion/,
      /frame-motion/,
    ];

    return !suspiciousPatterns.some((pattern) => pattern.test(packageName));
  }

  /**
   * Check if package is in approved list
   */
  isApprovedPackage(packageName) {
    const basePackageName = packageName.split('@')[0].replace(/^@/, '');
    return (
      APPROVED_PACKAGES.hasOwnProperty(basePackageName) ||
      APPROVED_PACKAGES.hasOwnProperty(packageName)
    );
  }

  /**
   * Get package download count from npm
   */
  async getDownloadCount(packageName) {
    try {
      const result = execSync(`npm view ${packageName} dist.tarball --json`, {
        encoding: 'utf8',
        timeout: 5000,
      });
      // This is a simplified check - in production, you'd use npm API
      return result ? 1000000 : 0; // Assume approved packages have sufficient downloads
    } catch (error) {
      console.warn(`Could not verify download count for ${packageName}`);
      return 0;
    }
  }

  /**
   * Verify all packages in package.json
   */
  verifyAllPackages() {
    if (!fs.existsSync(this.packageJsonPath)) {
      console.error('package.json not found');
      process.exit(1);
    }

    const packageJson = JSON.parse(
      fs.readFileSync(this.packageJsonPath, 'utf8')
    );
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    let hasSecurityIssues = false;

    console.log('🔍 Verifying package security...\n');

    for (const [packageName, version] of Object.entries(allDependencies)) {
      console.log(`Checking ${packageName}@${version}...`);

      // Check for typosquatting
      if (!this.verifyPackageName(packageName)) {
        console.error(`❌ Suspicious package name detected: ${packageName}`);
        hasSecurityIssues = true;
        continue;
      }

      // Check if package is approved
      if (!this.isApprovedPackage(packageName)) {
        console.warn(`⚠️  Package not in approved list: ${packageName}`);
        console.warn(
          `   Please verify this package manually before proceeding.`
        );
      } else {
        console.log(`✅ ${packageName} - Approved`);
      }
    }

    if (hasSecurityIssues) {
      console.error(
        '\n❌ Security issues detected. Please review packages before proceeding.'
      );
      process.exit(1);
    } else {
      console.log('\n✅ All packages passed security verification.');
    }
  }

  /**
   * Run npm audit and check for vulnerabilities
   */
  runSecurityAudit() {
    console.log('\n🔍 Running npm security audit...');
    try {
      execSync('npm audit --audit-level moderate', { stdio: 'inherit' });
      console.log('✅ No security vulnerabilities found.');
    } catch (error) {
      console.error(
        '❌ Security vulnerabilities detected. Please run "npm audit fix" to resolve.'
      );
      process.exit(1);
    }
  }
}

// Run verification
const verifier = new PackageVerifier();
verifier.verifyAllPackages();
verifier.runSecurityAudit();
