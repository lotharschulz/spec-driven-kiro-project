# Weird Animal Quiz

A mobile-friendly, secure educational quiz application about fascinating animal facts, built with React, TypeScript, and Vite.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 🛠️ Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (includes security checks, linting, and tests)
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run security:verify` - Verify package security
- `npm run security:audit` - Run npm security audit

## 🔒 Security Features

- **Package Verification**: All packages are verified against security criteria
- **Dependency Scanning**: Regular security audits with npm audit
- **Input Validation**: ESLint rules prevent dangerous patterns
- **TypeScript Strict Mode**: Enhanced type safety
- **Pre-build Security Checks**: Automated security verification before builds

## 🧪 Testing

- **Framework**: Vitest with React Testing Library
- **Coverage**: Minimum 80% code coverage target
- **Accessibility**: Automated accessibility testing with jest-dom

## 📱 Mobile-First Design

- **Responsive**: Breakpoints at 320px, 768px, and 1024px
- **Touch-Optimized**: 44px minimum touch targets
- **Performance**: <200KB bundle size target
- **Accessibility**: WCAG 2.1 AA compliance

## 🎨 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS Modules
- **Animation**: Framer Motion
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier
- **Security**: Custom package verification + npm audit

## 📁 Project Structure

```
src/
├── components/     # React components
├── types/         # TypeScript type definitions
├── test/          # Test setup and utilities
└── ...

scripts/
└── verify-packages.js  # Security verification script
```

## 🔧 Configuration Files

- `vite.config.ts` - Vite configuration with testing setup
- `tsconfig.json` - TypeScript configuration with strict mode
- `eslint.config.js` - ESLint configuration with security rules
- `.prettierrc` - Prettier code formatting rules

## 🚦 Build Process

The build process includes automated checks:

1. **Security Verification** - Package security validation
2. **Linting** - Code quality and security checks
3. **Testing** - Unit and integration tests
4. **TypeScript Compilation** - Type checking
5. **Bundle Creation** - Optimized production build

## 📋 Requirements Addressed

This setup addresses the following requirements:

- **6.1**: Verified npm packages from official registry
- **6.2**: Package name verification against typosquatting
- **6.3**: Preference for packages with >1M downloads
- **6.4**: GitHub repository and maintainer verification