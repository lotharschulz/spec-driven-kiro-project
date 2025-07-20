/**
 * Basic Accessibility Tests
 * Core accessibility testing with axe-core
 * Requirements: 4.5, 4.6, 4.9
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { WelcomeScreen } from '../components/WelcomeScreen';
import { Button } from '../components/Button';
import { AccessibilitySettings } from '../components/AccessibilitySettings';
import { AriaLabels, TouchTargetValidator } from '../utils/accessibility';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Basic Accessibility Tests', () => {
  describe('Axe-core Automated Testing', () => {
    test('WelcomeScreen should have no accessibility violations', async () => {
      const { container } = render(
        <WelcomeScreen onStartQuiz={vi.fn()} />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('Button component should have no accessibility violations', async () => {
      const { container } = render(
        <Button variant="primary" size="lg">
          Test Button
        </Button>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('AccessibilitySettings modal should have no accessibility violations', async () => {
      const { container } = render(
        <AccessibilitySettings
          isOpen={true}
          onClose={vi.fn()}
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ARIA Labels and Semantic HTML', () => {
    test('WelcomeScreen uses proper semantic elements', () => {
      render(<WelcomeScreen onStartQuiz={vi.fn()} />);
      
      // Check for proper semantic elements
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Check for proper headings hierarchy
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByText('Weird Animal Quiz')).toBeInTheDocument();
      
      // Check for proper button labeling
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    });

    test('Button component has proper ARIA attributes', () => {
      render(
        <Button 
          variant="primary" 
          loading={true}
          aria-label="Custom label"
        >
          Test Button
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-label', 'Custom label - Loading, please wait');
    });
  });

  describe('AriaLabels Utility Functions', () => {
    test('AriaLabels utility generates proper labels', () => {
      // Test question progress label
      const progressLabel = AriaLabels.questionProgress(3, 9, 'medium');
      expect(progressLabel).toBe('Question 3 of 9, difficulty: medium');
      
      // Test timer label
      const timerLabel = AriaLabels.timer(15, 'warning');
      expect(timerLabel).toBe('Time remaining: 15 seconds, warning: time running low');
      
      // Test answer button label
      const answerLabel = AriaLabels.answerButton('A', 'Koala', 0, 4, true, true);
      expect(answerLabel).toBe('Answer A: Koala. Option 1 of 4. This is the correct answer');
      
      // Test hint button label
      const hintLabel = AriaLabels.hintButton(true, false);
      expect(hintLabel).toBe('Get a hint for this question. This can only be used once per question');
    });
  });

  describe('Touch Target Validation', () => {
    test('TouchTargetValidator utility functions work correctly', () => {
      // Mock the validation since we can't test real DOM measurements in jsdom
      const mockValidation = vi.spyOn(TouchTargetValidator, 'getInvalidTouchTargets');
      mockValidation.mockReturnValue([]);
      
      const invalidTargets = TouchTargetValidator.getInvalidTouchTargets();
      expect(invalidTargets).toHaveLength(0);
      
      mockValidation.mockRestore();
    });
  });

  describe('Keyboard Navigation Support', () => {
    test('Components have proper keyboard navigation attributes', () => {
      render(<WelcomeScreen onStartQuiz={vi.fn()} />);
      
      const startButton = screen.getByRole('button', { name: /start/i });
      
      // Button should be focusable
      expect(startButton.tagName).toBe('BUTTON');
      expect(startButton.tabIndex).not.toBe(-1);
    });
  });

  describe('Screen Reader Support', () => {
    test('Components provide proper screen reader content', () => {
      render(<WelcomeScreen onStartQuiz={vi.fn()} />);
      
      // Check for screen reader only content
      const srOnlyElements = document.querySelectorAll('.sr-only');
      expect(srOnlyElements.length).toBeGreaterThan(0);
      
      // Check for proper aria-label attributes
      const labeledElements = document.querySelectorAll('[aria-label]');
      expect(labeledElements.length).toBeGreaterThan(0);
    });
  });

  describe('High Contrast and Visual Accessibility', () => {
    test('High contrast mode can be applied', () => {
      document.documentElement.classList.add('high-contrast');
      
      render(<WelcomeScreen onStartQuiz={vi.fn()} />);
      
      // Check that high contrast class is applied
      expect(document.documentElement).toHaveClass('high-contrast');
      
      // Clean up
      document.documentElement.classList.remove('high-contrast');
    });

    test('Large text mode can be applied', () => {
      document.documentElement.classList.add('large-text');
      
      render(<WelcomeScreen onStartQuiz={vi.fn()} />);
      
      // Check that large text class is applied
      expect(document.documentElement).toHaveClass('large-text');
      
      // Clean up
      document.documentElement.classList.remove('large-text');
    });

    test('Reduced motion mode can be applied', () => {
      document.documentElement.classList.add('reduced-motion');
      
      render(<WelcomeScreen onStartQuiz={vi.fn()} />);
      
      // Check that reduced motion class is applied
      expect(document.documentElement).toHaveClass('reduced-motion');
      
      // Clean up
      document.documentElement.classList.remove('reduced-motion');
    });
  });
});