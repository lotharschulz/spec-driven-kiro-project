/**
 * Touch-Friendly Button Component
 * Mobile-first design with 44px minimum touch targets and haptic feedback
 * Requirements: 4.3, 4.4, 4.6, 4.7, 4.8
 */

import React, { forwardRef, useEffect, useRef, useCallback } from 'react';
import { HapticFeedback, MobileLayoutOptimizer, MobileDetector } from '../utils/mobileUtils';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  'aria-checked'?: boolean;
  hapticFeedback?: boolean;
  touchOptimized?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-checked': ariaChecked,
      type = 'button',
      hapticFeedback = true,
      touchOptimized = true,
      onClick,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLButtonElement>(null);
    const buttonRef = (ref as React.RefObject<HTMLButtonElement>) || internalRef;

    // Mobile optimization
    useEffect(() => {
      const element = buttonRef.current;
      if (!element || !touchOptimized) return;

      // Apply mobile optimizations
      MobileLayoutOptimizer.addTouchFeedback(element);
      MobileLayoutOptimizer.optimizeTouchTargets(element.parentElement || document.body);
    }, [touchOptimized]);

    // Handle click with haptic feedback
    const handleClick = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;

      // Trigger haptic feedback on mobile devices
      if (hapticFeedback && MobileDetector.isTouchDevice()) {
        try {
          if (variant === 'success') {
            await HapticFeedback.success();
          } else if (variant === 'error') {
            await HapticFeedback.error();
          } else {
            await HapticFeedback.selection();
          }
        } catch (error) {
          // Haptic feedback failed, continue without it
          console.debug('Haptic feedback not available:', error);
        }
      }

      // Call original onClick handler
      onClick?.(event);
    }, [disabled, loading, hapticFeedback, variant, onClick]);

    const deviceInfo = MobileDetector.getDeviceInfo();
    const buttonClasses = [
      styles.button,
      styles[variant],
      styles[size],
      fullWidth && styles.fullWidth,
      loading && styles.loading,
      touchOptimized && 'touch-feedback',
      touchOptimized && 'adaptive-touch-target',
      deviceInfo.isMobile && 'mobile-optimized',
      className
    ]
      .filter(Boolean)
      .join(' ');

    // Enhanced aria-label for loading state
    const enhancedAriaLabel = loading 
      ? `${ariaLabel || children} - Loading, please wait`
      : ariaLabel;

    return (
      <button
        ref={buttonRef}
        type={type}
        className={buttonClasses}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-label={enhancedAriaLabel}
        aria-describedby={ariaDescribedBy}
        aria-checked={ariaChecked}
        onClick={handleClick}
        {...props}
      >
        {loading && (
          <span className={styles.spinner} aria-hidden="true">
            <svg
              className={styles.spinnerIcon}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="31.416"
                strokeDashoffset="31.416"
              />
            </svg>
          </span>
        )}
        
        {leftIcon && !loading && (
          <span className={styles.leftIcon} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        <span className={styles.content}>
          {children}
        </span>
        
        {rightIcon && !loading && (
          <span className={styles.rightIcon} aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;