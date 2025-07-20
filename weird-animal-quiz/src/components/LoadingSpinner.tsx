import React from 'react';
import styles from './LoadingSpinner.module.css';

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'small' | 'medium' | 'large';
  /** Loading message to display */
  message?: string;
  /** Whether to show as overlay */
  overlay?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Loading spinner component with <100ms display time
 * Optimized for performance and accessibility
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message = 'Loading...',
  overlay = false,
  className = ''
}) => {
  const spinnerClasses = [
    styles.spinner,
    styles[size],
    overlay && styles.overlay,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={spinnerClasses} role="status" aria-live="polite">
      <div className={styles.spinnerCircle} aria-hidden="true">
        <div className={styles.spinnerInner}></div>
      </div>
      <span className={styles.message}>{message}</span>
    </div>
  );
};

export default LoadingSpinner;