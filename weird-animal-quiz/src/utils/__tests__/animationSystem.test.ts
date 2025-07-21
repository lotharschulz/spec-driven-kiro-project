/**
 * Animation System Tests
 * Tests animation performance, accessibility, and functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  useReducedMotion,
  getAccessibleAnimationProps,
  AnimationPerformanceMonitor,
  useAccessibleAnimations,
  ANIMATION_VARIANTS,
  TRANSITIONS,
  ANIMATION_DURATIONS,
  CelebrationAnimations,
  injectAnimationKeyframes
} from '../animationSystem';
import { PerformanceMonitor } from '../performanceOptimizer';

// Mock matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// Mock localStorage
const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => {
        delete store[key];
      });
    }),
  };
};

// Mock performance API
const mockPerformanceNow = vi.fn(() => Date.now());
const originalPerformanceNow = performance.now;

describe('Animation System', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    performance.now = mockPerformanceNow;
    
    // Mock requestAnimationFrame and cancelAnimationFrame
    global.requestAnimationFrame = vi.fn((callback) => {
      return setTimeout(() => callback(performance.now()), 16) as unknown as number;
    });
    
    global.cancelAnimationFrame = vi.fn((id) => {
      clearTimeout(id);
    });
  });
  
  afterEach(() => {
    vi.useRealTimers();
    performance.now = originalPerformanceNow;
    vi.restoreAllMocks();
  });
  
  describe('useReducedMotion', () => {
    it('should detect system preference for reduced motion', () => {
      // Mock matchMedia to prefer reduced motion
      mockMatchMedia(true);
      
      const { result } = renderHook(() => useReducedMotion());
      expect(result.current).toBe(true);
    });
    
    it('should detect system preference for standard motion', () => {
      // Mock matchMedia to not prefer reduced motion
      mockMatchMedia(false);
      
      const { result } = renderHook(() => useReducedMotion());
      expect(result.current).toBe(false);
    });
    
    it('should prioritize localStorage preference over system preference', () => {
      // Mock localStorage with reduced motion preference
      const mockStorage = mockLocalStorage();
      Object.defineProperty(window, 'localStorage', { value: mockStorage });
      mockStorage.getItem.mockReturnValue('true');
      
      // Mock matchMedia to not prefer reduced motion
      mockMatchMedia(false);
      
      const { result } = renderHook(() => useReducedMotion());
      expect(result.current).toBe(true);
    });
  });
  
  describe('getAccessibleAnimationProps', () => {
    it('should return simplified animations when reduced motion is preferred', () => {
      const result = getAccessibleAnimationProps(
        true, // prefers reduced motion
        ANIMATION_VARIANTS.SLIDE_UP,
        TRANSITIONS.DEFAULT
      );
      
      // Should only animate opacity, not position
      expect(result.variants.animate).toEqual({ opacity: 1 });
      expect(result.transition?.duration).toBeLessThan(TRANSITIONS.DEFAULT.duration as number);
    });
    
    it('should return full animations when reduced motion is not preferred', () => {
      const result = getAccessibleAnimationProps(
        false, // does not prefer reduced motion
        ANIMATION_VARIANTS.SLIDE_UP,
        TRANSITIONS.DEFAULT
      );
      
      // Should keep original animations
      expect(result.variants).toEqual(ANIMATION_VARIANTS.SLIDE_UP);
      expect(result.transition).toEqual(TRANSITIONS.DEFAULT);
    });
  });
  
  describe('AnimationPerformanceMonitor', () => {
    it('should track frame rates during monitoring', () => {
      AnimationPerformanceMonitor.startMonitoring();
      
      // Simulate multiple animation frames
      for (let i = 0; i < 10; i++) {
        mockPerformanceNow.mockReturnValue(Date.now() + i * 16.67); // ~60fps
        vi.advanceTimersByTime(16.67);
      }
      
      const avgFrameRate = AnimationPerformanceMonitor.getAverageFrameRate();
      AnimationPerformanceMonitor.stopMonitoring();
      
      expect(avgFrameRate).toBeGreaterThanOrEqual(55); // Should be close to 60fps
    });
    
    it('should detect performance issues', async () => {
      const logSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      AnimationPerformanceMonitor.startMonitoring();
      
      // Simulate slow frames
      for (let i = 0; i < 5; i++) {
        mockPerformanceNow.mockReturnValue(Date.now() + i * 50); // ~20fps (slow)
        vi.advanceTimersByTime(50);
      }
      
      const avgFrameRate = AnimationPerformanceMonitor.getAverageFrameRate();
      const isPerformanceSufficient = AnimationPerformanceMonitor.isPerformanceSufficient();
      AnimationPerformanceMonitor.stopMonitoring();
      
      expect(avgFrameRate).toBeLessThan(30); // Should detect low frame rate
      expect(isPerformanceSufficient).toBe(false);
      
      if (process.env.NODE_ENV === 'development') {
        expect(logSpy).toHaveBeenCalled();
      }
    });
    
    it('should measure animation performance', async () => {
      const measureSpy = vi.spyOn(PerformanceMonitor, 'measureAsync');
      const logSpy = vi.spyOn(PerformanceMonitor, 'log');
      
      await AnimationPerformanceMonitor.measureAnimation('test-animation', async () => {
        // Simulate animation work
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      
      expect(measureSpy).toHaveBeenCalledWith(
        'animation-test-animation',
        expect.any(Function)
      );
      expect(logSpy).toHaveBeenCalled();
    });
  });
  
  describe('useAccessibleAnimations', () => {
    it('should not start animations when reduced motion is preferred', () => {
      // Mock reduced motion preference
      mockMatchMedia(true);
      
      const { result } = renderHook(() => useAccessibleAnimations());
      
      act(() => {
        result.current.startAnimation();
      });
      
      expect(result.current.isAnimating).toBe(false);
    });
    
    it('should start animations when reduced motion is not preferred', () => {
      // Mock standard motion preference
      mockMatchMedia(false);
      
      const { result } = renderHook(() => useAccessibleAnimations());
      
      act(() => {
        result.current.startAnimation();
      });
      
      expect(result.current.isAnimating).toBe(true);
    });
    
    it('should stop animations when requested', () => {
      // Mock standard motion preference
      mockMatchMedia(false);
      
      const { result } = renderHook(() => useAccessibleAnimations(true));
      expect(result.current.isAnimating).toBe(true);
      
      act(() => {
        result.current.stopAnimation();
      });
      
      expect(result.current.isAnimating).toBe(false);
    });
  });
  
  describe('CelebrationAnimations', () => {
    it('should generate confetti with correct properties', () => {
      const confetti = CelebrationAnimations.generateConfetti(10);
      
      expect(confetti).toHaveLength(10);
      expect(confetti[0]).toHaveProperty('position', 'absolute');
      expect(confetti[0]).toHaveProperty('backgroundColor');
      expect(confetti[0]).toHaveProperty('animation');
    });
    
    it('should generate star burst with correct properties', () => {
      const starBurst = CelebrationAnimations.generateStarBurst();
      
      expect(starBurst).toHaveProperty('position', 'absolute');
      expect(starBurst).toHaveProperty('animation', 'starburst 0.5s ease-out forwards');
    });
  });
  
  describe('Animation Constants', () => {
    it('should have page transition duration that meets requirements', () => {
      // Requirement 5.1: Maximum 300ms for transitions
      expect(ANIMATION_DURATIONS.PAGE_TRANSITION).toBeLessThanOrEqual(0.3);
    });
    
    it('should have feedback animation duration that meets requirements', () => {
      // Requirement 3.4: 0.3-0.5 seconds for answer feedback
      expect(ANIMATION_DURATIONS.FEEDBACK).toBeGreaterThanOrEqual(0.3);
      expect(ANIMATION_DURATIONS.FEEDBACK).toBeLessThanOrEqual(0.5);
    });
  });
  
  describe('Animation Keyframes', () => {
    it('should inject animation keyframes into document', () => {
      // Mock document methods
      document.getElementById = vi.fn().mockReturnValue(null);
      document.createElement = vi.fn().mockReturnValue({
        id: '',
        textContent: '',
      });
      document.head.appendChild = vi.fn();
      
      injectAnimationKeyframes();
      
      expect(document.createElement).toHaveBeenCalledWith('style');
      expect(document.head.appendChild).toHaveBeenCalled();
    });
    
    it('should not inject keyframes if already present', () => {
      // Mock document methods
      document.getElementById = vi.fn().mockReturnValue({ id: 'animation-keyframes' });
      document.createElement = vi.fn();
      document.head.appendChild = vi.fn();
      
      injectAnimationKeyframes();
      
      expect(document.createElement).not.toHaveBeenCalled();
      expect(document.head.appendChild).not.toHaveBeenCalled();
    });
  });
});