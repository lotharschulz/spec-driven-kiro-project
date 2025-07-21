/**
 * Component Library Exports
 * Core UI Components with mobile-first responsive design
 */

// Base Components
export { default as Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { default as Card } from './Card';
export type { CardProps, CardVariant, CardPadding } from './Card';

export { default as Typography } from './Typography';
export type { 
  TypographyProps, 
  TypographyVariant, 
  TypographyColor, 
  TypographyAlign 
} from './Typography';

// Animation Components
export { default as PageTransition } from './PageTransition';
export type { PageTransitionProps } from './PageTransition';

// Existing Components
export { default as Timer } from './Timer';
export type { TimerProps } from './Timer';

export { default as ProgressTracker } from './ProgressTracker';
export type { ProgressTrackerProps } from './ProgressTracker';

// Quiz Components
export { default as QuestionCard } from './QuestionCard';
export type { QuestionCardProps } from './QuestionCard';

export { default as FeedbackDisplay } from './FeedbackDisplay';
export type { FeedbackDisplayProps } from './FeedbackDisplay';

// Screen Components
export { default as WelcomeScreen } from './WelcomeScreen';
export type { WelcomeScreenProps } from './WelcomeScreen';

export { default as ResultsScreen } from './ResultsScreen';
export type { ResultsScreenProps } from './ResultsScreen';

// Error Handling Components
export { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';
export { ErrorScreen } from './ErrorScreen';
export type { ErrorScreenProps } from './ErrorScreen';
export { ErrorRecovery, withErrorRecovery } from './ErrorRecovery';
export type { ErrorRecoveryProps } from './ErrorRecovery';

// Accessibility Components
export { default as AccessibilitySettings } from './AccessibilitySettings';
export type { AccessibilitySettingsProps } from './AccessibilitySettings';

// Example Component
export { default as Example } from './Example';