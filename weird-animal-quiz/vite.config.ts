/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  server: {
    // Security headers for development server
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  build: {
    // Target bundle size under 200KB
    chunkSizeWarningLimit: 200,
    // Security and performance optimizations for production build
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and performance
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            return 'vendor';
          }
          
          // Component chunks - split by screen/feature
          if (id.includes('/components/')) {
            if (id.includes('WelcomeScreen') || id.includes('ResultsScreen')) {
              return 'screens';
            }
            if (id.includes('QuestionCard') || id.includes('FeedbackDisplay') || id.includes('Timer')) {
              return 'quiz-components';
            }
            if (id.includes('ErrorBoundary') || id.includes('ErrorScreen') || id.includes('ErrorRecovery')) {
              return 'error-components';
            }
            return 'ui-components';
          }
          
          // Utility chunks
          if (id.includes('/utils/')) {
            if (id.includes('scoringEngine') || id.includes('hintSystem')) {
              return 'quiz-utils';
            }
            if (id.includes('errorHandler') || id.includes('errorMonitoring')) {
              return 'error-utils';
            }
            return 'utils';
          }
          
          // Context and hooks
          if (id.includes('/contexts/') || id.includes('/hooks/')) {
            return 'state-management';
          }
          
          // Data layer
          if (id.includes('/data/')) {
            return 'data';
          }
        },
        // Optimize chunk names for caching
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
    },
    // Enable source maps for debugging but not in production
    sourcemap: process.env.NODE_ENV !== 'production',
    // Minify for production with optimizations
    minify: false, // Disabled for development build
    terserOptions: {
      compress: {
        // Remove console logs in production
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        // Additional optimizations
        pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log', 'console.info'] : [],
        passes: 2,
        // Remove unused code
        dead_code: true,
        // Optimize conditionals
        conditionals: true,
        // Optimize comparisons
        comparisons: true,
        // Optimize sequences
        sequences: true,
        // Optimize properties
        properties: true,
        // Optimize loops
        loops: true,
        // Optimize if statements
        if_return: true,
        // Join consecutive var statements
        join_vars: true,
        // Collapse single-use variables
        collapse_vars: true,
        // Reduce variables
        reduce_vars: true,
        // Optimize boolean expressions
        booleans: true,
        // Optimize typeof
        typeofs: true,
        // Optimize undefined
        unsafe_undefined: true,
      },
      mangle: {
        safari10: true,
        // Mangle properties for smaller bundle
        properties: {
          regex: /^_/
        }
      },
      format: {
        comments: false,
        // Reduce whitespace
        beautify: false,
        // Optimize ASCII output
        ascii_only: true,
      },
    },
    // CSS optimization
    cssCodeSplit: true,
    cssMinify: true,
    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets smaller than 4KB
    // Report bundle size
    reportCompressedSize: true,
    // Optimize for modern browsers
    target: ['es2020', 'chrome80', 'firefox78', 'safari14']
  },
});
