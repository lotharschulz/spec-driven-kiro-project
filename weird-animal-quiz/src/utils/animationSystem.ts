/**
 * Animation and Transition System
 * Implements requirements: 4.2, 5.1, 3.4, 3.8
 * 
 * This utility provides consistent animations and transitions throughout the app,
 * with support for reduced motion preferences and performance optimization.
 */

import { useEffect, useState } from 'react';
import { AnimationControls, Transition, Variants } from 'framer-motion';
import { VisualAccessibility } from './accessibility';
import { PerformanceMonitor } from './performanceOptimizer';

// Default durations that meet requirements
export const ANIMATION_DURATIONS = {
  // Requirement 5.1: Maximum 300ms for transitions
  PAGE_TRANSITION: 0.3, // 300ms
  // Requirement 3.4: 0.3-0.5 seconds for answer feedback
  FEEDBACK: 0.4, // 400ms
  MICRO_INTERACTION: 0.15, // 150ms
  CELEBRATION: 0.5, // 500ms
};

// Animation easing presets
export const ANIMATION_EASING = {
  // Organic, nature-inspired easing curves
  SPRING: [0.34, 1.56, 0.64, 1], // Bouncy spring
  SMOOTH: [0.4, 0, 0.2, 1], // Standard smooth
  EASE_OUT: [0, 0, 0.2, 1], // Smooth exit
  EASE_IN: [0.4, 0, 1, 1], // Smooth entrance
};

// Reusable animation variants
export const ANIMATION_VARIANTS = {
  // Page transitions
  PAGE: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  
  // Fade animations
  FADE: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  
  // Scale animations
  SCALE: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  
  // Slide animations
  SLIDE_UP: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  
  SLIDE_DOWN: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  
  SLIDE_LEFT: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  
  SLIDE_RIGHT: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  
  // Button press animation
  BUTTON_PRESS: {
    initial: { scale: 1 },
    tap: { scale: 0.95 },
    hover: { scale: 1.05 },
  },
  
  // Celebration animations
  CELEBRATION: {
    initial: { opacity: 0, scale: 0.8, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: -10 },
  },
  
  // Correct answer celebration
  CORRECT_ANSWER: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: [0.8, 1.1, 1],
      transition: { duration: 0.5 }
    },
    exit: { opacity: 0, scale: 0.8 },
  },
  
  // Incorrect answer animation
  INCORRECT_ANSWER: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      x: [0, -5, 5, -5, 0],
      transition: { duration: 0.4 }
    },
    exit: { opacity: 0 },
  },
};

// Transition presets
export const TRANSITIONS = {
  DEFAULT: {
    type: 'tween',
    ease: ANIMATION_EASING.SMOOTH,
    duration: ANIMATION_DURATIONS.PAGE_TRANSITION,
  },
  
  SPRING: {
    type: 'spring',
    stiffness: 300,
    damping: 20,
    mass: 1,
  },
  
  STAGGER_CHILDREN: {
    staggerChildren: 0.1,
    delayChildren: 0.2,
  },
  
  MICRO: {
    type: 'tween',
    ease: ANIMATION_EASING.SMOOTH,
    duration: ANIMATION_DURATIONS.MICRO_INTERACTION,
  },
};

/**
 * Checks if reduced motion is preferred by the user
 */
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  
  useEffect(() => {
    // Check for stored preference first
    const storedPreference = localStorage.getItem('accessibility-reduced-motion');
    if (storedPreference === 'true') {
      setPrefersReducedMotion(true);
      return;
    }
    
    // Then check for system preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    // Add event listener with compatibility for older browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // @ts-ignore - For older browsers
      mediaQuery.addListener(handleChange);
    }
    
    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // @ts-ignore - For older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);
  
  return prefersReducedMotion;
};

/**
 * Adjusts animation settings based on reduced motion preferences
 */
export const getAccessibleAnimationProps = (
  prefersReducedMotion: boolean,
  variants: Variants,
  transition?: Transition
): { 
  variants: Variants; 
  transition: Transition | undefined;
  animate: string | AnimationControls;
} => {
  if (prefersReducedMotion) {
    // For reduced motion, only use opacity for transitions
    const accessibleVariants: Variants = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
    
    // Use shorter durations for reduced motion
    const accessibleTransition: Transition = {
      duration: 0.1,
    };
    
    return {
      variants: accessibleVariants,
      transition: accessibleTransition,
      animate: 'animate',
    };
  }
  
  return {
    variants,
    transition,
    animate: 'animate',
  };
};

/**
 * Measures animation performance
 */
export class AnimationPerformanceMonitor {
  private static frameRates: number[] = [];
  private static isMonitoring = false;
  private static lastFrameTimestamp: number = 0;
  private static animationFrameId: number | null = null;
  
  /**
   * Start monitoring animation frame rates
   */
  static startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.frameRates = [];
    this.lastFrameTimestamp = performance.now();
    
    const monitorFrame = (timestamp: number) => {
      if (!this.isMonitoring) return;
      
      // Calculate frame time
      const frameTime = timestamp - this.lastFrameTimestamp;
      this.lastFrameTimestamp = timestamp;
      
      // Calculate FPS (cap at 120 to avoid division by very small numbers)
      const fps = Math.min(1000 / frameTime, 120);
      this.frameRates.push(fps);
      
      // Keep only the last 60 frames
      if (this.frameRates.length > 60) {
        this.frameRates.shift();
      }
      
      // Log performance issues in development
      if (process.env.NODE_ENV === 'development' && fps < 30) {
        console.warn(`Low frame rate detected: ${fps.toFixed(1)} FPS`);
      }
      
      // Continue monitoring
      this.animationFrameId = requestAnimationFrame(monitorFrame);
    };
    
    this.animationFrameId = requestAnimationFrame(monitorFrame);
  }
  
  /**
   * Stop monitoring animation frame rates
   */
  static stopMonitoring(): void {
    this.isMonitoring = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Get average frame rate
   */
  static getAverageFrameRate(): number {
    if (this.frameRates.length === 0) return 60; // Default to 60fps if no data
    
    const sum = this.frameRates.reduce((acc, fps) => acc + fps, 0);
    return sum / this.frameRates.length;
  }
  
  /**
   * Check if animations are running smoothly (60fps)
   */
  static isPerformanceSufficient(): boolean {
    const avgFps = this.getAverageFrameRate();
    return avgFps >= 55; // Allow for small fluctuations
  }
  
  /**
   * Measure a specific animation sequence
   */
  static async measureAnimation(
    animationName: string, 
    callback: () => Promise<void>
  ): Promise<void> {
    this.startMonitoring();
    
    try {
      await PerformanceMonitor.measureAsync(`animation-${animationName}`, callback);
    } finally {
      this.stopMonitoring();
      
      // Log performance metrics
      const avgFps = this.getAverageFrameRate();
      PerformanceMonitor.log(`Animation '${animationName}' average FPS: ${avgFps.toFixed(1)}`);
    }
  }
}

/**
 * Celebration animation generator
 */
export class CelebrationAnimations {
  /**
   * Generate confetti animation elements
   */
  static generateConfetti(count: number = 50): React.CSSProperties[] {
    const confettiStyles: React.CSSProperties[] = [];
    
    for (let i = 0; i < count; i++) {
      const color = this.getRandomConfettiColor();
      const size = Math.random() * 0.5 + 0.5; // 0.5 to 1
      const left = Math.random() * 100; // 0 to 100%
      const animationDelay = Math.random() * 2; // 0 to 2s
      const animationDuration = Math.random() * 3 + 2; // 2 to 5s
      
      confettiStyles.push({
        position: 'absolute',
        backgroundColor: color,
        width: `${size}rem`,
        height: `${size}rem`,
        left: `${left}%`,
        top: '-20px',
        borderRadius: '50%',
        animation: `fall ${animationDuration}s ease-in forwards`,
        animationDelay: `${animationDelay}s`,
      });
    }
    
    return confettiStyles;
  }
  
  /**
   * Get random confetti color from nature-inspired palette
   */
  private static getRandomConfettiColor(): string {
    const colors = [
      '#4A7C59', // forest green
      '#3B82F6', // ocean blue
      '#FB923C', // sunset orange
      '#FACC15', // sunshine yellow
      '#EC4899', // flower pink
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * Generate star burst animation
   */
  static generateStarBurst(): React.CSSProperties {
    return {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '100%',
      height: '100%',
      background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
      animation: 'starburst 0.5s ease-out forwards',
    };
  }
}

/**
 * Hook to manage animation state with accessibility considerations
 */
export const useAccessibleAnimations = (initialState: boolean = false) => {
  const [isAnimating, setIsAnimating] = useState(initialState);
  const prefersReducedMotion = useReducedMotion();
  
  const startAnimation = () => {
    if (!prefersReducedMotion) {
      setIsAnimating(true);
    }
  };
  
  const stopAnimation = () => {
    setIsAnimating(false);
  };
  
  return {
    isAnimating,
    startAnimation,
    stopAnimation,
    prefersReducedMotion,
  };
};

/**
 * CSS keyframes for common animations
 * These can be injected into the document or used in CSS files
 */
export const ANIMATION_KEYFRAMES = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes slideDown {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  @keyframes shake {
    0% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    50% { transform: translateX(5px); }
    75% { transform: translateX(-5px); }
    100% { transform: translateX(0); }
  }
  
  @keyframes fall {
    0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
  }
  
  @keyframes starburst {
    0% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
    50% { opacity: 1; }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject keyframes into document if needed
export const injectAnimationKeyframes = (): void => {
  if (typeof document === 'undefined') return;
  
  const styleId = 'animation-keyframes';
  if (document.getElementById(styleId)) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = ANIMATION_KEYFRAMES;
  document.head.appendChild(styleElement);
};