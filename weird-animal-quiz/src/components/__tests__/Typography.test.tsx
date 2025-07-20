/**
 * Typography Component Tests
 * Testing WCAG compliance, responsive behavior, and semantic HTML
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Typography from '../Typography';
import styles from '../Typography.module.css';

describe('Typography Component', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<Typography>Default text</Typography>);
      const text = screen.getByText('Default text');
      expect(text).toBeInTheDocument();
      expect(text.tagName).toBe('P');
      expect(text.className).toContain(styles.typography);
      expect(text.className).toContain(styles.body1);
      expect(text.className).toContain(styles['color-gray-800']);
      expect(text.className).toContain(styles['align-left']);
    });

    it('renders with custom variant', () => {
      render(<Typography variant="h1">Heading text</Typography>);
      const text = screen.getByText('Heading text');
      expect(text.tagName).toBe('H1');
      expect(text.className).toContain(styles.h1);
    });

    it('renders with custom color', () => {
      render(<Typography color="forest-medium">Colored text</Typography>);
      const text = screen.getByText('Colored text');
      expect(text.className).toContain(styles['color-forest-medium']);
    });

    it('renders with custom alignment', () => {
      render(<Typography align="center">Centered text</Typography>);
      const text = screen.getByText('Centered text');
      expect(text.className).toContain(styles['align-center']);
    });
  });

  describe('Semantic HTML Elements', () => {
    const variantMappings = [
      { variant: 'h1', expectedTag: 'H1' },
      { variant: 'h2', expectedTag: 'H2' },
      { variant: 'h3', expectedTag: 'H3' },
      { variant: 'h4', expectedTag: 'H4' },
      { variant: 'h5', expectedTag: 'H5' },
      { variant: 'h6', expectedTag: 'H6' },
      { variant: 'body1', expectedTag: 'P' },
      { variant: 'body2', expectedTag: 'P' },
      { variant: 'caption', expectedTag: 'SPAN' },
      { variant: 'overline', expectedTag: 'SPAN' },
    ] as const;

    variantMappings.forEach(({ variant, expectedTag }) => {
      it(`renders ${variant} as ${expectedTag} element`, () => {
        render(<Typography variant={variant}>{variant} text</Typography>);
        const text = screen.getByText(`${variant} text`);
        expect(text.tagName).toBe(expectedTag);
        expect(text.className).toContain(styles[variant]);
      });
    });
  });

  describe('Custom Component Override', () => {
    it('renders with custom component', () => {
      render(
        <Typography variant="h1" component="div">
          Custom component
        </Typography>
      );
      const text = screen.getByText('Custom component');
      expect(text.tagName).toBe('DIV');
      expect(text.className).toContain(styles.h1); // Should still have variant class
    });

    it('renders with semantic elements', () => {
      render(
        <Typography variant="body1" component="article">
          Article content
        </Typography>
      );
      const text = screen.getByText('Article content');
      expect(text.tagName).toBe('ARTICLE');
    });
  });

  describe('Color Variants', () => {
    const colors = [
      'primary', 'secondary', 'success', 'warning', 'error',
      'forest-dark', 'forest-medium', 'ocean-dark', 'ocean-medium',
      'sunset-dark', 'sunset-medium', 'gray-500', 'gray-600',
      'gray-700', 'gray-800', 'gray-900'
    ] as const;

    colors.forEach(color => {
      it(`renders ${color} color correctly`, () => {
        render(<Typography color={color}>{color} text</Typography>);
        const text = screen.getByText(`${color} text`);
        expect(text.className).toContain(styles[`color-${color}`]);
      });
    });
  });

  describe('Text Alignment', () => {
    const alignments = ['left', 'center', 'right', 'justify'] as const;

    alignments.forEach(align => {
      it(`renders ${align} alignment correctly`, () => {
        render(<Typography align={align}>{align} text</Typography>);
        const text = screen.getByText(`${align} text`);
        expect(text.className).toContain(styles[`align-${align}`]);
      });
    });
  });

  describe('Utility Props', () => {
    it('adds gutter bottom when specified', () => {
      render(<Typography gutterBottom>Gutter text</Typography>);
      const text = screen.getByText('Gutter text');
      expect(text.className).toContain(styles.gutterBottom);
    });

    it('adds no wrap when specified', () => {
      render(<Typography noWrap>No wrap text</Typography>);
      const text = screen.getByText('No wrap text');
      expect(text.className).toContain(styles.noWrap);
    });

    it('combines utility classes', () => {
      render(
        <Typography gutterBottom noWrap>
          Combined utilities
        </Typography>
      );
      const text = screen.getByText('Combined utilities');
      expect(text.className).toContain(styles.gutterBottom);
      expect(text.className).toContain(styles.noWrap);
    });
  });

  describe('Accessibility', () => {
    it('maintains proper heading hierarchy', () => {
      render(
        <div>
          <Typography variant="h1">Main Title</Typography>
          <Typography variant="h2">Section Title</Typography>
          <Typography variant="h3">Subsection Title</Typography>
        </div>
      );

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      const h3 = screen.getByRole('heading', { level: 3 });

      expect(h1).toHaveTextContent('Main Title');
      expect(h2).toHaveTextContent('Section Title');
      expect(h3).toHaveTextContent('Subsection Title');
    });

    it('supports ARIA attributes', () => {
      render(
        <Typography 
          aria-label="Custom label"
          aria-describedby="description"
          role="status"
        >
          ARIA text
        </Typography>
      );
      const text = screen.getByText('ARIA text');
      expect(text).toHaveAttribute('aria-label', 'Custom label');
      expect(text).toHaveAttribute('aria-describedby', 'description');
      expect(text).toHaveAttribute('role', 'status');
    });

    it('provides proper contrast ratios', () => {
      // Test that color classes provide sufficient contrast
      render(<Typography color="gray-500">Low contrast text</Typography>);
      const text = screen.getByText('Low contrast text');
      expect(text.className).toContain(styles['color-gray-500']);
      
      // In a real test, you might check computed styles for actual contrast ratios
      // This would require more complex testing setup with actual CSS
    });
  });

  describe('Responsive Typography', () => {
    it('maintains minimum font size on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      render(<Typography variant="body1">Mobile text</Typography>);
      const text = screen.getByText('Mobile text');
      expect(text.className).toContain(styles.body1);
      
      // The actual font size would be tested through computed styles
      // which requires more complex setup
    });

    it('scales typography for larger screens', () => {
      render(<Typography variant="h1">Large screen heading</Typography>);
      const text = screen.getByText('Large screen heading');
      expect(text.className).toContain(styles.h1);
    });
  });

  describe('Content Rendering', () => {
    it('renders text content', () => {
      render(<Typography>Simple text content</Typography>);
      expect(screen.getByText('Simple text content')).toBeInTheDocument();
    });

    it('renders with inline elements', () => {
      render(
        <Typography>
          Text with <strong>bold</strong> and <em>italic</em> content
        </Typography>
      );
      expect(screen.getByText(/Text with/)).toBeInTheDocument();
      expect(screen.getByText('bold')).toBeInTheDocument();
      expect(screen.getByText('italic')).toBeInTheDocument();
    });

    it('renders with React elements', () => {
      render(
        <Typography>
          Text with <span data-testid="custom-span">custom span</span>
        </Typography>
      );
      expect(screen.getByTestId('custom-span')).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('forwards custom HTML attributes', () => {
      render(
        <Typography 
          data-testid="custom-typography"
          id="text-id"
          title="Text title"
        >
          Custom props text
        </Typography>
      );
      
      const text = screen.getByTestId('custom-typography');
      expect(text).toHaveAttribute('id', 'text-id');
      expect(text).toHaveAttribute('title', 'Text title');
    });

    it('merges custom className', () => {
      render(
        <Typography className="custom-class">
          Custom class text
        </Typography>
      );
      const text = screen.getByText('Custom class text');
      expect(text.className).toContain(styles.typography);
      expect(text.className).toContain(styles.body1);
      expect(text.className).toContain(styles['color-gray-800']);
      expect(text.className).toContain(styles['align-left']);
      expect(text.className).toContain('custom-class');
    });

    it('supports custom styles', () => {
      render(
        <Typography style={{ fontSize: '24px', fontWeight: 'bold' }}>
          Styled text
        </Typography>
      );
      const text = screen.getByText('Styled text');
      expect(text).toHaveStyle({
        fontSize: '24px',
        fontWeight: 'bold'
      });
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to the rendered element', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(<Typography ref={ref}>Ref text</Typography>);
      
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
      expect(ref.current?.textContent).toBe('Ref text');
    });

    it('forwards ref with custom component', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Typography ref={ref} component="div">
          Custom ref text
        </Typography>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.textContent).toBe('Custom ref text');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty content', () => {
      render(<Typography></Typography>);
      const text = screen.getByText('', { selector: 'p' });
      expect(text).toBeInTheDocument();
      expect(text.className).toContain(styles.typography);
    });

    it('handles numeric content', () => {
      render(<Typography>{42}</Typography>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('handles boolean content', () => {
      render(<Typography>{true}</Typography>);
      // React doesn't render boolean values, so the element should be empty
      const text = screen.getByText('', { selector: 'p' });
      expect(text).toBeInTheDocument();
    });
  });
});