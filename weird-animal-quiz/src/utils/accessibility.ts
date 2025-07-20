/**
 * Accessibility Utilities
 * Provides helper functions for ARIA labels, focus management, and screen reader support
 * Requirements: 4.5, 4.6, 4.9
 */

export interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large';
  screenReader: boolean;
}

/**
 * Focus management utilities
 */
export class FocusManager {
  private static focusStack: HTMLElement[] = [];
  
  /**
   * Trap focus within a container element
   */
  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }
  
  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    return Array.from(container.querySelectorAll(focusableSelectors));
  }
  
  /**
   * Save current focus and restore later
   */
  static saveFocus(): () => void {
    const activeElement = document.activeElement as HTMLElement;
    this.focusStack.push(activeElement);
    
    return () => {
      const elementToFocus = this.focusStack.pop();
      elementToFocus?.focus();
    };
  }
  
  /**
   * Move focus to element and announce to screen readers
   */
  static moveFocusTo(element: HTMLElement, announcement?: string) {
    element.focus();
    
    if (announcement) {
      this.announceToScreenReader(announcement);
    }
  }
  
  /**
   * Announce message to screen readers
   */
  static announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
}

/**
 * ARIA label generators for quiz components
 */
export class AriaLabels {
  /**
   * Generate label for question progress
   */
  static questionProgress(current: number, total: number, difficulty: string): string {
    return `Question ${current} of ${total}, difficulty: ${difficulty}`;
  }
  
  /**
   * Generate label for timer
   */
  static timer(timeRemaining: number, warningLevel: string): string {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeText = minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}` : `${seconds} second${seconds !== 1 ? 's' : ''}`;
    
    let warningText = '';
    if (warningLevel === 'warning') {
      warningText = ', warning: time running low';
    } else if (warningLevel === 'danger') {
      warningText = ', danger: very little time remaining';
    }
    
    return `Time remaining: ${timeText}${warningText}`;
  }
  
  /**
   * Generate label for answer button
   */
  static answerButton(
    letter: string, 
    text: string, 
    index: number, 
    total: number, 
    isSelected?: boolean,
    isCorrect?: boolean,
    isEliminated?: boolean
  ): string {
    let label = `Answer ${letter}: ${text}. Option ${index + 1} of ${total}`;
    
    if (isEliminated) {
      label += '. This option has been eliminated by hint';
    }
    
    if (isSelected && isCorrect !== undefined) {
      label += isCorrect ? '. This is the correct answer' : '. This is incorrect';
    }
    
    return label;
  }
  
  /**
   * Generate label for hint button
   */
  static hintButton(available: boolean, used: boolean): string {
    if (used) {
      return 'Hint has been used for this question';
    }
    
    if (!available) {
      return 'Hint not available for this question';
    }
    
    return 'Get a hint for this question. This can only be used once per question';
  }
  
  /**
   * Generate label for quiz results
   */
  static quizResults(score: number, total: number, percentage: number): string {
    return `Quiz completed. You scored ${score} out of ${total} questions correct, which is ${percentage}%`;
  }
}

/**
 * Keyboard navigation utilities
 */
export class KeyboardNavigation {
  /**
   * Handle arrow key navigation for answer options
   */
  static handleArrowNavigation(
    event: KeyboardEvent,
    currentIndex: number,
    totalOptions: number,
    onNavigate: (newIndex: number) => void
  ) {
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        newIndex = (currentIndex + 1) % totalOptions;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = currentIndex === 0 ? totalOptions - 1 : currentIndex - 1;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = totalOptions - 1;
        break;
      default:
        return;
    }
    
    onNavigate(newIndex);
  }
  
  /**
   * Handle Enter and Space key activation
   */
  static handleActivation(
    event: KeyboardEvent,
    callback: () => void
  ) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  }
}

/**
 * Screen reader utilities
 */
export class ScreenReaderUtils {
  /**
   * Check if screen reader is likely being used
   */
  static isScreenReaderActive(): boolean {
    // Check for common screen reader indicators
    return (
      window.navigator.userAgent.includes('NVDA') ||
      window.navigator.userAgent.includes('JAWS') ||
      window.speechSynthesis?.speaking ||
      document.body.classList.contains('screen-reader-active')
    );
  }
  
  /**
   * Provide detailed description for complex UI elements
   */
  static getDetailedDescription(element: 'timer' | 'progress' | 'feedback'): string {
    switch (element) {
      case 'timer':
        return 'Circular timer showing remaining time for current question. Changes color as time runs out.';
      case 'progress':
        return 'Progress indicator showing current question number and difficulty level.';
      case 'feedback':
        return 'Answer feedback section with explanation and fun facts about the correct answer.';
      default:
        return '';
    }
  }
}

/**
 * High contrast and visual accessibility utilities
 */
export class VisualAccessibility {
  /**
   * Apply high contrast mode
   */
  static enableHighContrast() {
    document.documentElement.classList.add('high-contrast');
    localStorage.setItem('accessibility-high-contrast', 'true');
  }
  
  /**
   * Disable high contrast mode
   */
  static disableHighContrast() {
    document.documentElement.classList.remove('high-contrast');
    localStorage.setItem('accessibility-high-contrast', 'false');
  }
  
  /**
   * Apply large text mode
   */
  static enableLargeText() {
    document.documentElement.classList.add('large-text');
    localStorage.setItem('accessibility-large-text', 'true');
  }
  
  /**
   * Disable large text mode
   */
  static disableLargeText() {
    document.documentElement.classList.remove('large-text');
    localStorage.setItem('accessibility-large-text', 'false');
  }
  
  /**
   * Apply reduced motion preferences
   */
  static enableReducedMotion() {
    document.documentElement.style.setProperty('--animation-duration', '0s');
    document.documentElement.classList.add('reduced-motion');
    localStorage.setItem('accessibility-reduced-motion', 'true');
  }
  
  /**
   * Disable reduced motion
   */
  static disableReducedMotion() {
    document.documentElement.style.removeProperty('--animation-duration');
    document.documentElement.classList.remove('reduced-motion');
    localStorage.setItem('accessibility-reduced-motion', 'false');
  }
  
  /**
   * Load accessibility preferences from localStorage
   */
  static loadPreferences(): AccessibilityPreferences {
    return {
      reducedMotion: localStorage.getItem('accessibility-reduced-motion') === 'true',
      highContrast: localStorage.getItem('accessibility-high-contrast') === 'true',
      fontSize: localStorage.getItem('accessibility-large-text') === 'true' ? 'large' : 'normal',
      screenReader: ScreenReaderUtils.isScreenReaderActive()
    };
  }
  
  /**
   * Apply all accessibility preferences
   */
  static applyPreferences(preferences: AccessibilityPreferences) {
    if (preferences.reducedMotion) {
      this.enableReducedMotion();
    }
    
    if (preferences.highContrast) {
      this.enableHighContrast();
    }
    
    if (preferences.fontSize === 'large') {
      this.enableLargeText();
    }
  }
}

/**
 * Touch target size validation
 */
export class TouchTargetValidator {
  private static readonly MIN_SIZE = 44; // 44px minimum
  
  /**
   * Validate that an element meets minimum touch target size
   */
  static validateTouchTarget(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width >= this.MIN_SIZE && rect.height >= this.MIN_SIZE;
  }
  
  /**
   * Get all interactive elements that don't meet touch target requirements
   */
  static getInvalidTouchTargets(): HTMLElement[] {
    const interactiveElements = document.querySelectorAll(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    );
    
    return Array.from(interactiveElements).filter(
      (element) => !this.validateTouchTarget(element as HTMLElement)
    ) as HTMLElement[];
  }
  
  /**
   * Log touch target validation results (for development)
   */
  static logTouchTargetValidation() {
    if (process.env.NODE_ENV === 'development') {
      const invalidTargets = this.getInvalidTouchTargets();
      
      if (invalidTargets.length > 0) {
        console.warn('Touch targets below 44px minimum:', invalidTargets);
      } else {
        console.log('All touch targets meet 44px minimum requirement');
      }
    }
  }
}