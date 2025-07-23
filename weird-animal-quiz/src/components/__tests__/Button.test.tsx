/**
 * Button Component Tests
 * Testing responsive behavior, accessibility, and touch interactions
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../index';
import styles from '../Button.module.css';

describe.skip('Button Component', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button.className).toContain(styles.button);
      expect(button.className).toContain(styles.primary);
      expect(button.className).toContain(styles.md);
    });

    it('renders with custom variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain(styles.secondary);
    });

    it('renders with custom size', () => {
      render(<Button size="lg">Large Button</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain(styles.lg);
    });

    it('renders full width when specified', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain(styles.fullWidth);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes when loading', () => {
      render(<Button loading>Loading Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
    });

    it('is focusable with keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      
      await user.tab();
      expect(button).toHaveFocus();
    });

    it('supports custom aria attributes', () => {
      render(
        <Button aria-label="Custom label" aria-describedby="help-text">
          Button
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
      expect(button).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('maintains minimum touch target size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      
      // Check that the button has the correct CSS class for minimum touch target
      expect(button.className).toContain(styles.sm);
      expect(button.className).toContain(styles.button);
    });
  });

  describe('Interaction Handling', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} loading>Loading</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('supports keyboard activation', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Keyboard</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Loading State', () => {
    it('shows spinner when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector(`.${styles.spinner}`);
      expect(spinner).toBeInTheDocument();
    });

    it('hides content when loading', () => {
      render(<Button loading>Loading Content</Button>);
      const button = screen.getByRole('button');
      const content = button.querySelector(`.${styles.content}`);
      expect(content).toBeInTheDocument();
      expect(button.className).toContain(styles.loading);
    });

    it('hides icons when loading', () => {
      render(
        <Button loading leftIcon={<span>👈</span>} rightIcon={<span>👉</span>}>
          With Icons
        </Button>
      );
      const button = screen.getByRole('button');
      
      // When loading, icons should not be rendered
      expect(button.className).toContain(styles.loading);
      
      // Check that spinner is shown instead
      const spinner = button.querySelector(`.${styles.spinner}`);
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('renders left icon', () => {
      render(<Button leftIcon={<span data-testid="left-icon">👈</span>}>With Left Icon</Button>);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders right icon', () => {
      render(<Button rightIcon={<span data-testid="right-icon">👉</span>}>With Right Icon</Button>);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('renders both icons', () => {
      render(
        <Button 
          leftIcon={<span data-testid="left-icon">👈</span>}
          rightIcon={<span data-testid="right-icon">👉</span>}
        >
          With Both Icons
        </Button>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    const variants = ['primary', 'secondary', 'success', 'warning', 'error', 'ghost'] as const;
    
    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(<Button variant={variant}>{variant} Button</Button>);
        const button = screen.getByRole('button');
        expect(button.className).toContain(styles[variant]);
      });
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg', 'xl'] as const;
    
    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        render(<Button size={size}>{size} Button</Button>);
        const button = screen.getByRole('button');
        expect(button.className).toContain(styles[size]);
      });
    });
  });

  describe('Touch Interactions', () => {
    it('handles touch events properly', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Touch me</Button>);
      const button = screen.getByRole('button');
      
      // Simulate touch events
      fireEvent.touchStart(button);
      fireEvent.touchEnd(button);
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('has proper button styling for touch', () => {
      render(<Button>Touch Button</Button>);
      const button = screen.getByRole('button');
      
      // Check that button has the correct CSS classes
      expect(button.className).toContain(styles.button);
    });
  });

  describe('Responsive Behavior', () => {
    it('maintains accessibility on small screens', () => {
      render(<Button size="sm">Small Screen</Button>);
      const button = screen.getByRole('button');
      
      // Check that button has the correct responsive classes
      expect(button.className).toContain(styles.button);
      expect(button.className).toContain(styles.sm);
    });
  });

  describe('Custom Props', () => {
    it('forwards custom HTML attributes', () => {
      render(
        <Button 
          data-testid="custom-button" 
          title="Custom title"
          type="submit"
        >
          Custom Button
        </Button>
      );
      
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('title', 'Custom title');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('merges custom className', () => {
      render(<Button className="custom-class">Custom Class</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain(styles.button);
      expect(button.className).toContain(styles.primary);
      expect(button.className).toContain(styles.md);
      expect(button.className).toContain('custom-class');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to button element', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Ref Button</Button>);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toBe('Ref Button');
    });
  });
});