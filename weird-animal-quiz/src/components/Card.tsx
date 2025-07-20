/**
 * Card Component
 * Flexible container with organic shapes and nature-inspired design
 * Requirements: 4.1, 4.2, 4.5
 */

import React, { forwardRef } from 'react';
import styles from './Card.module.css';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  children: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      interactive = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const cardClasses = [
      styles.card,
      styles[variant],
      styles[`padding-${padding}`],
      interactive && styles.interactive,
      className
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={ref}
        className={cardClasses}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;