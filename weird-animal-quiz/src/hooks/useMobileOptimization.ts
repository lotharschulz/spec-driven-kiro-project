/**
 * Mobile Optimization Hook
 * Provides mobile-specific optimizations and utilities for React components
 * Requirements: 4.3, 4.4, 4.8
 */

import { useEffect, useRef, useState } from 'react';
import { 
  MobileDetector, 
  MobileLayoutOptimizer, 
  MobilePerformanceOptimizer,
  ResponsiveBreakpoints,
  HapticFeedback,
  SwipeGestureHandler
} from '../utils/mobileUtils';

export interface UseMobileOptimizationOptions {
  enableTouchFeedback?: boolean;
  enableThumbNavigation?: boolean;
  enableSwipeGestures?: boolean;
  enableHapticFeedback?: boolean;
  optimizePerformance?: boolean;
}

export interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export const useMobileOptimization = (
  options: UseMobileOptimizationOptions = {},
  swipeCallbacks?: SwipeCallbacks
) => {
  const elementRef = useRef<HTMLElement>(null);
  const [deviceInfo, setDeviceInfo] = useState(() => MobileDetector.getDeviceInfo());
  const [currentBreakpoint, setCurrentBreakpoint] = useState(() => ResponsiveBreakpoints.getCurrentBreakpoint());
  const swipeHandlerRef = useRef<SwipeGestureHandler | null>(null);
  const [orientation, setOrientation] = useState(deviceInfo.orientation);

  const {
    enableTouchFeedback = true,
    enableThumbNavigation = false,
    enableSwipeGestures = false,
    enableHapticFeedback = true,
    optimizePerformance = true
  } = options;

  // Initialize mobile optimizations
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Apply touch feedback
    if (enableTouchFeedback && deviceInfo.hasTouch) {
      MobileLayoutOptimizer.addTouchFeedback(element);
    }

    // Apply thumb navigation optimization
    if (enableThumbNavigation && deviceInfo.isMobile) {
      MobileLayoutOptimizer.optimizeForThumbNavigation(element);
    }

    // Apply performance optimizations
    if (optimizePerformance) {
      MobilePerformanceOptimizer.optimizeScrolling(element);
      MobilePerformanceOptimizer.enableHardwareAcceleration(element);
      MobilePerformanceOptimizer.optimizeImages(element);
      MobilePerformanceOptimizer.optimizeTouchResponsiveness(element);
      
      if (deviceInfo.isMobile) {
        MobilePerformanceOptimizer.preventZoom(element);
      }
    }

    // Optimize touch targets
    if (deviceInfo.hasTouch) {
      MobileLayoutOptimizer.optimizeTouchTargets(element);
    }

    // Setup swipe gestures
    if (enableSwipeGestures && swipeCallbacks && deviceInfo.hasTouch) {
      swipeHandlerRef.current = new SwipeGestureHandler(element, swipeCallbacks);
    }

    // Apply orientation-specific classes
    if (orientation === 'portrait') {
      element.classList.add('orientation-portrait');
      element.classList.remove('orientation-landscape');
    } else {
      element.classList.add('orientation-landscape');
      element.classList.remove('orientation-portrait');
    }

    // Apply breakpoint-specific classes
    element.classList.remove('breakpoint-mobile', 'breakpoint-tablet', 'breakpoint-desktop');
    element.classList.add(`breakpoint-${currentBreakpoint}`);

    return () => {
      // Cleanup swipe handler
      if (swipeHandlerRef.current) {
        swipeHandlerRef.current.destroy();
        swipeHandlerRef.current = null;
      }
    };
  }, [
    deviceInfo,
    enableTouchFeedback,
    enableThumbNavigation,
    enableSwipeGestures,
    enableHapticFeedback,
    optimizePerformance,
    swipeCallbacks,
    orientation,
    currentBreakpoint
  ]);

  // Listen for breakpoint changes
  useEffect(() => {
    const unsubscribe = ResponsiveBreakpoints.onBreakpointChange((breakpoint) => {
      setCurrentBreakpoint(breakpoint);
    });

    return unsubscribe;
  }, []);

  // Update device info on window resize and orientation change
  useEffect(() => {
    const handleResize = () => {
      // Reset device info cache to get updated values
      (MobileDetector as any).deviceInfo = null;
      const newDeviceInfo = MobileDetector.getDeviceInfo();
      setDeviceInfo(newDeviceInfo);
      setOrientation(newDeviceInfo.orientation);
    };

    const handleOrientationChange = () => {
      // Reset device info cache to get updated values
      (MobileDetector as any).deviceInfo = null;
      const newDeviceInfo = MobileDetector.getDeviceInfo();
      setDeviceInfo(newDeviceInfo);
      setOrientation(newDeviceInfo.orientation);
      
      // Trigger haptic feedback on orientation change if enabled
      if (enableHapticFeedback) {
        HapticFeedback.medium();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Some browsers don't support orientationchange, so we also listen for resize
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [enableHapticFeedback]);

  // Haptic feedback utilities
  const triggerHapticFeedback = {
    light: () => enableHapticFeedback && HapticFeedback.light(),
    medium: () => enableHapticFeedback && HapticFeedback.medium(),
    heavy: () => enableHapticFeedback && HapticFeedback.heavy(),
    selection: () => enableHapticFeedback && HapticFeedback.selection(),
    success: () => enableHapticFeedback && HapticFeedback.success(),
    error: () => enableHapticFeedback && HapticFeedback.error(),
  };

  // Utility functions
  const getThumbZone = () => MobileDetector.getThumbZone();
  const isTouchDevice = () => deviceInfo.hasTouch;
  const isMobileDevice = () => deviceInfo.isMobile;
  const isTabletDevice = () => deviceInfo.isTablet;
  const isDesktopDevice = () => deviceInfo.isDesktop;

  // Responsive utilities
  const isMobileBreakpoint = () => currentBreakpoint === 'mobile';
  const isTabletBreakpoint = () => currentBreakpoint === 'tablet';
  const isDesktopBreakpoint = () => currentBreakpoint === 'desktop';

  // Detect if device is in landscape mode
  const isLandscape = deviceInfo.orientation === 'landscape';
  
  // Detect if device has notch (iPhone X and newer)
  const hasNotch = deviceInfo.isMobile && window.innerWidth >= 375 && window.innerHeight >= 812;
  
  // Get safe area insets
  const getSafeAreaInsets = () => {
    // Try to get CSS environment variables for safe areas
    const computedStyle = getComputedStyle(document.documentElement);
    
    return {
      top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
      right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
      bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0')
    };
  };
  
  // Apply thumb-friendly positioning to an element
  const applyThumbFriendlyPosition = (element: HTMLElement) => {
    if (!deviceInfo.isMobile) return;
    
    const thumbZone = getThumbZone();
    const rect = element.getBoundingClientRect();
    
    // Check if element is in a hard-to-reach zone
    if (rect.top < 150 && rect.right > window.innerWidth - 60) {
      // Move to thumb-reachable zone
      element.classList.add('thumb-nav-primary');
    }
  };
  
  // Get optimal touch target size based on device
  const getOptimalTouchSize = () => {
    if (deviceInfo.isMobile && deviceInfo.screenSize === 'small') {
      return 48; // Slightly larger for small screens
    } else if (deviceInfo.isMobile || deviceInfo.isTablet) {
      return 44; // Standard minimum size
    } else {
      return 32; // Smaller for desktop with mouse
    }
  };

  return {
    // Ref to attach to the element
    ref: elementRef,
    
    // Device information
    deviceInfo,
    currentBreakpoint,
    orientation,
    isLandscape,
    hasNotch,
    
    // Device type checks
    isTouchDevice,
    isMobileDevice,
    isTabletDevice,
    isDesktopDevice,
    
    // Breakpoint checks
    isMobileBreakpoint,
    isTabletBreakpoint,
    isDesktopBreakpoint,
    
    // Utilities
    triggerHapticFeedback,
    getThumbZone,
    getSafeAreaInsets,
    applyThumbFriendlyPosition,
    getOptimalTouchSize,
    
    // CSS classes for conditional styling
    mobileClasses: {
      'is-mobile': deviceInfo.isMobile,
      'is-tablet': deviceInfo.isTablet,
      'is-desktop': deviceInfo.isDesktop,
      'has-touch': deviceInfo.hasTouch,
      'has-notch': hasNotch,
      'thumb-optimized': enableThumbNavigation && deviceInfo.isMobile,
      'touch-feedback': enableTouchFeedback && deviceInfo.hasTouch,
      'swipe-enabled': enableSwipeGestures && deviceInfo.hasTouch,
      [`breakpoint-${currentBreakpoint}`]: true,
      [`screen-${deviceInfo.screenSize}`]: true,
      [`orientation-${deviceInfo.orientation}`]: true,
      'safe-area-support': typeof CSS !== 'undefined' && 'supports' in CSS ? CSS.supports('padding: env(safe-area-inset-top)') : false,
      'reduced-motion': typeof window !== 'undefined' && 'matchMedia' in window ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
      'high-contrast': typeof window !== 'undefined' && 'matchMedia' in window ? window.matchMedia('(prefers-contrast: high)').matches : false,
    }
  };
};

export default useMobileOptimization;