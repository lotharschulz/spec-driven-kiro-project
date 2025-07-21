/**
 * Touch-Friendly Button Component
 * Mobile-first design with 44px minimum touch targets and haptic feedback
 * Requirements: 4.3, 4.4, 4.6, 4.7, 4.8
 */

import React, { forwardRef, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HapticFeedback, MobileLayoutOptimizer, MobileDetector } from '../utils/mobileUtils';
import { useReducedMotion, ANIMATION_VARIANTS } from '../utils/animationSystem';
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

    // Check for reduced motion preference
    const prefersReducedMotion = useReducedMotion();
    
    // Use motion button with micro-interactions if animations are enabled
    const MotionButton = motion.button;
    
    return (
      <MotionButton
        ref={buttonRef}
        type={type}
        className={buttonClasses}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-label={enhancedAriaLabel}
        aria-describedby={ariaDescribedBy}
        aria-checked={ariaChecked}
        onClick={handleClick}
        // Add micro-interactions with Framer Motion
        whileHover={!prefersReducedMotion && !disabled && !loading ? { scale: 1.05 } : {}}
        whileTap={!prefersReducedMotion && !disabled && !loading ? { scale: 0.95 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...props}
      >
        {loading && (
          <span className={styles.spinner} aria-hidden="true">
            <motion.svg
              className={styles.spinnerIcon}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
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
            </motion.svg>
          </span>
        )}
        
        {leftIcon && !loading && (
          <motion.span 
            className={styles.leftIcon} 
            aria-hidden="true"
            initial={{ x: -5, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {leftIcon}
          </motion.span>
        )}
        
        <span className={styles.content}>
          {children}
        </span>
        
        {rightIcon && !loading && (
          <motion.span 
            className={styles.rightIcon} 
            aria-hidden="true"
            initial={{ x: 5, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {rightIcon}
          </motion.span>
        )}
      </MotionButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;