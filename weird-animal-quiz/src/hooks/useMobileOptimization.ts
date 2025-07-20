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
    swipeCallbacks
  ]);

  // Listen for breakpoint changes
  useEffect(() => {
    const unsubscribe = ResponsiveBreakpoints.onBreakpointChange((breakpoint) => {
      setCurrentBreakpoint(breakpoint);
    });

    return unsubscribe;
  }, []);

  // Update device info on window resize
  useEffect(() => {
    const handleResize = () => {
      // Reset device info cache to get updated values
      (MobileDetector as any).deviceInfo = null;
      setDeviceInfo(MobileDetector.getDeviceInfo());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  return {
    // Ref to attach to the element
    ref: elementRef,
    
    // Device information
    deviceInfo,
    currentBreakpoint,
    
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
    
    // CSS classes for conditional styling
    mobileClasses: {
      'is-mobile': deviceInfo.isMobile,
      'is-tablet': deviceInfo.isTablet,
      'is-desktop': deviceInfo.isDesktop,
      'has-touch': deviceInfo.hasTouch,
      'thumb-optimized': enableThumbNavigation && deviceInfo.isMobile,
      'touch-feedback': enableTouchFeedback && deviceInfo.hasTouch,
      'swipe-enabled': enableSwipeGestures && deviceInfo.hasTouch,
      [`breakpoint-${currentBreakpoint}`]: true,
      [`screen-${deviceInfo.screenSize}`]: true,
      [`orientation-${deviceInfo.orientation}`]: true,
    }
  };
};

export default useMobileOptimization;