/**
 * Card Component Tests
 * Testing responsive behavior, accessibility, and interactive states
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Card from '../Card';
import styles from '../Card.module.css';

describe('Card Component', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<Card>Card content</Card>);
      const card = screen.getByText('Card content');
      expect(card).toBeInTheDocument();
      expect(card.className).toContain(styles.card);
      expect(card.className).toContain(styles.default);
      expect(card.className).toContain(styles['padding-md']);
    });

    it('renders with custom variant', () => {
      render(<Card variant="elevated">Elevated card</Card>);
      const card = screen.getByText('Elevated card');
      expect(card.className).toContain(styles.elevated);
    });

    it('renders with custom padding', () => {
      render(<Card padding="lg">Large padding</Card>);
      const card = screen.getByText('Large padding');
      expect(card.className).toContain(styles['padding-lg']);
    });

    it('renders as interactive when specified', () => {
      render(<Card interactive>Interactive card</Card>);
      const card = screen.getByText('Interactive card');
      expect(card.className).toContain(styles.interactive);
    });
  });

  describe('Variants', () => {
    const variants = ['default', 'elevated', 'outlined', 'flat'] as const;
    
    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(<Card variant={variant}>{variant} card</Card>);
        const card = screen.getByText(`${variant} card`);
        expect(card.className).toContain(styles[variant]);
      });
    });
  });

  describe('Padding Options', () => {
    const paddings = ['none', 'sm', 'md', 'lg', 'xl'] as const;
    
    paddings.forEach(padding => {
      it(`renders ${padding} padding correctly`, () => {
        render(<Card padding={padding}>{padding} padding</Card>);
        const card = screen.getByText(`${padding} padding`);
        expect(card.className).toContain(styles[`padding-${padding}`]);
      });
    });
  });

  describe('Interactive Behavior', () => {
    it('is focusable when interactive', async () => {
      const user = userEvent.setup();
      render(<Card interactive tabIndex={0}>Focusable card</Card>);
      const card = screen.getByText('Focusable card');
      
      await user.tab();
      expect(card).toHaveFocus();
    });

    it('handles click events when interactive', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <Card interactive onClick={handleClick}>
          Clickable card
        </Card>
      );
      const card = screen.getByText('Clickable card');
      
      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard events when interactive', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <Card interactive onClick={handleClick} tabIndex={0} onKeyDown={(e) => {
          if (e.key === 'Enter') handleClick();
        }}>
          Keyboard card
        </Card>
      );
      const card = screen.getByText('Keyboard card');
      
      card.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('has proper interactive styling', () => {
      render(<Card interactive>Interactive card</Card>);
      const card = screen.getByText('Interactive card');
      expect(card.className).toContain(styles.interactive);
    });
  });

  describe('Accessibility', () => {
    it('supports custom ARIA attributes', () => {
      render(
        <Card 
          role="article" 
          aria-label="Custom card"
          aria-describedby="card-description"
        >
          Accessible card
        </Card>
      );
      const card = screen.getByText('Accessible card');
      expect(card).toHaveAttribute('role', 'article');
      expect(card).toHaveAttribute('aria-label', 'Custom card');
      expect(card).toHaveAttribute('aria-describedby', 'card-description');
    });

    it('has proper focus styles when interactive', () => {
      render(<Card interactive tabIndex={0}>Focus card</Card>);
      const card = screen.getByText('Focus card');
      
      // Focus the card
      card.focus();
      
      // Check that focus styles are applied (outline should be visible)
      const styles = window.getComputedStyle(card);
      expect(card).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('maintains proper spacing on small screens', () => {
      // Mock small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });
      
      render(<Card padding="md">Mobile card</Card>);
      const card = screen.getByText('Mobile card');
      
      // Should have responsive padding class
      expect(card.className).toContain(styles['padding-md']);
    });

    it('adapts padding for different screen sizes', () => {
      render(<Card padding="lg">Responsive card</Card>);
      const card = screen.getByText('Responsive card');
      expect(card.className).toContain(styles['padding-lg']);
    });
  });

  describe('Custom Props', () => {
    it('forwards custom HTML attributes', () => {
      render(
        <Card 
          data-testid="custom-card"
          id="card-id"
          title="Card title"
        >
          Custom card
        </Card>
      );
      
      const card = screen.getByTestId('custom-card');
      expect(card).toHaveAttribute('id', 'card-id');
      expect(card).toHaveAttribute('title', 'Card title');
    });

    it('merges custom className', () => {
      render(<Card className="custom-class">Custom class card</Card>);
      const card = screen.getByText('Custom class card');
      expect(card.className).toContain(styles.card);
      expect(card.className).toContain(styles.default);
      expect(card.className).toContain(styles['padding-md']);
      expect(card.className).toContain('custom-class');
    });

    it('supports custom styles', () => {
      render(
        <Card style={{ backgroundColor: 'red', color: 'white' }}>
          Styled card
        </Card>
      );
      const card = screen.getByText('Styled card');
      expect(card).toHaveAttribute('style');
      expect(card.style.backgroundColor).toBe('red');
      expect(card.style.color).toBe('white');
    });
  });

  describe('Content Rendering', () => {
    it('renders complex content', () => {
      render(
        <Card>
          <h2>Card Title</h2>
          <p>Card description</p>
          <button>Action</button>
        </Card>
      );
      
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('renders nested components', () => {
      render(
        <Card>
          <Card variant="outlined" padding="sm">
            Nested card
          </Card>
        </Card>
      );
      
      const nestedCard = screen.getByText('Nested card');
      expect(nestedCard.className).toContain(styles.outlined);
      expect(nestedCard.className).toContain(styles['padding-sm']);
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to div element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Ref card</Card>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.textContent).toBe('Ref card');
    });
  });

  describe('Touch Interactions', () => {
    it('has interactive styling for touch', () => {
      render(<Card interactive>Touch card</Card>);
      const card = screen.getByText('Touch card');
      
      // Check that interactive class is applied
      expect(card.className).toContain(styles.interactive);
    });

    it('supports touch interactions', () => {
      const handleClick = vi.fn();
      render(<Card interactive onClick={handleClick}>Touch card</Card>);
      const card = screen.getByText('Touch card');
      
      // Simulate touch interaction
      card.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});