/**
 * Typography Component
 * Consistent text styling with WCAG contrast ratios
 * Requirements: 4.5, 4.6
 */

import React, { forwardRef } from 'react';
import styles from './Typography.module.css';

export type TypographyVariant = 
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'body1' | 'body2' | 'caption' | 'overline';

export type TypographyColor = 
  | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  | 'forest-dark' | 'forest-medium' | 'ocean-dark' | 'ocean-medium'
  | 'sunset-dark' | 'sunset-medium' | 'gray-500' | 'gray-600' 
  | 'gray-700' | 'gray-800' | 'gray-900';

export type TypographyAlign = 'left' | 'center' | 'right' | 'justify';

export interface TypographyProps {
  variant?: TypographyVariant;
  color?: TypographyColor;
  align?: TypographyAlign;
  gutterBottom?: boolean;
  noWrap?: boolean;
  component?: React.ElementType;
  className?: string;
  children: React.ReactNode;
}

const variantMapping: Record<TypographyVariant, React.ElementType> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  overline: 'span',
};

export const Typography = forwardRef<HTMLElement, TypographyProps>(
  (
    {
      variant = 'body1',
      color = 'gray-800',
      align = 'left',
      gutterBottom = false,
      noWrap = false,
      component,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const Component = component || variantMapping[variant];
    
    const typographyClasses = [
      styles.typography,
      styles[variant],
      styles[`color-${color}`],
      styles[`align-${align}`],
      gutterBottom && styles.gutterBottom,
      noWrap && styles.noWrap,
      className
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <Component
        ref={ref}
        className={typographyClasses}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Typography.displayName = 'Typography';

export default Typography;