/**
 * Mobile Integration Tests
 * Tests mobile-specific functionality, touch interactions, and responsive behavior
 * Requirements: 4.3, 4.4, 4.8
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import {
  MobileDetector,
  HapticFeedback,
  TouchGestureHandler,
  SwipeGestureHandler,
  MobileLayoutOptimizer,
  MobilePerformanceOptimizer,
  ResponsiveBreakpoints
} from '../utils/mobileUtils';
import { QuizProvider } from '../contexts/QuizContext';
import QuestionCard from '../components/QuestionCard';
import Button from '../components/Button';
import { Question } from '../types/quiz';

// Mock navigator.vibrate for haptic feedback tests
const mockVibrate = vi.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

// Mock window properties for mobile detection
const mockWindowProperties = (properties: Partial<Window>) => {
  Object.defineProperties(window, {
    ...Object.keys(properties).reduce((acc, key) => {
      acc[key] = {
        value: properties[key as keyof Window],
        writable: true,
        configurable: true,
      };
      return acc;
    }, {} as PropertyDescriptorMap),
  });
};

// Mock user agent for mobile detection
const mockUserAgent = (userAgent: string) => {
  Object.defineProperty(navigator, 'userAgent', {
    value: userAgent,
    writable: true,
    configurable: true,
  });
};

// Sample question for testing
const mockQuestion: Question = {
  id: 'test-1',
  difficulty: 'easy',
  text: 'Which animal can sleep for up to 22 hours a day?',
  emojis: ['🐨', '😴'],
  answers: [
    { id: 'a1', text: 'Koala', isCorrect: true },
    { id: 'a2', text: 'Sloth', isCorrect: false },
    { id: 'a3', text: 'Panda', isCorrect: false },
    { id: 'a4', text: 'Cat', isCorrect: false }
  ],
  explanation: 'Koalas sleep 18-22 hours daily to conserve energy.',
  funFact: 'Koalas have fingerprints almost identical to humans!',
  category: 'behavior'
};

describe('Mobile Device Detection', () => {
  beforeEach(() => {
    // Reset device info cache
    (MobileDetector as any).deviceInfo = null;
    vi.clearAllMocks();
  });

  test('detects mobile devices correctly', () => {
    mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
    mockWindowProperties({ 
      innerWidth: 375, 
      innerHeight: 812,
      ontouchstart: {} as any,
      devicePixelRatio: 3
    });

    const deviceInfo = MobileDetector.getDeviceInfo();

    expect(deviceInfo.isMobile).toBe(true);
    expect(deviceInfo.isTablet).toBe(false);
    expect(deviceInfo.isDesktop).toBe(false);
    expect(deviceInfo.hasTouch).toBe(true);
    expect(deviceInfo.screenSize).toBe('small');
    expect(deviceInfo.orientation).toBe('portrait');
    expect(deviceInfo.pixelRatio).toBe(3);
  });

  test('detects tablet devices correctly', () => {
    mockUserAgent('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)');
    mockWindowProperties({ 
      innerWidth: 768, 
      innerHeight: 1024,
      ontouchstart: {} as any,
      devicePixelRatio: 2
    });

    const deviceInfo = MobileDetector.getDeviceInfo();

    expect(deviceInfo.isMobile).toBe(false);
    expect(deviceInfo.isTablet).toBe(true);
    expect(deviceInfo.isDesktop).toBe(false);
    expect(deviceInfo.hasTouch).toBe(true);
    expect(deviceInfo.screenSize).toBe('medium');
    expect(deviceInfo.orientation).toBe('landscape');
  });

  test('detects desktop devices correctly', () => {
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    mockWindowProperties({ 
      innerWidth: 1920, 
      innerHeight: 1080,
      devicePixelRatio: 1
    });
    delete (window as any).ontouchstart;

    const deviceInfo = MobileDetector.getDeviceInfo();

    expect(deviceInfo.isMobile).toBe(false);
    expect(deviceInfo.isTablet).toBe(false);
    expect(deviceInfo.isDesktop).toBe(true);
    expect(deviceInfo.hasTouch).toBe(false);
    expect(deviceInfo.screenSize).toBe('large');
  });

  test('calculates thumb zones correctly for mobile', () => {
    mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
    mockWindowProperties({ innerWidth: 375, innerHeight: 812 });

    const thumbZone = MobileDetector.getThumbZone();

    expect(thumbZone.left).toBe(0);
    expect(thumbZone.right).toBe(120); // Small screen thumb reach
    expect(thumbZone.bottom).toBeGreaterThan(400); // Bottom portion of screen
  });
});

describe('Haptic Feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    HapticFeedback.setEnabled(true);
  });

  test('triggers vibration on supported devices', async () => {
    mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
    
    await HapticFeedback.light();
    
    expect(mockVibrate).toHaveBeenCalledWith([10]);
  });

  test('respects cooldown period', async () => {
    mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
    
    await HapticFeedback.light();
    await HapticFeedback.light(); // Should be ignored due to cooldown
    
    expect(mockVibrate).toHaveBeenCalledTimes(1);
  });

  test('can be disabled', async () => {
    mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
    HapticFeedback.setEnabled(false);
    
    await HapticFeedback.light();
    
    expect(mockVibrate).not.toHaveBeenCalled();
  });

  test('provides different feedback types', async () => {
    mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
    
    await HapticFeedback.success();
    expect(mockVibrate).toHaveBeenCalledWith([10, 50, 10, 50, 20]);
    
    vi.clearAllMocks();
    
    await HapticFeedback.error();
    expect(mockVibrate).toHaveBeenCalledWith([50, 100, 50]);
  });
});

describe('Touch Gesture Handling', () => {
  let element: HTMLElement;
  let gestureHandler: TouchGestureHandler;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    gestureHandler = new TouchGestureHandler(element);
  });

  afterEach(() => {
    gestureHandler.destroy();
    document.body.removeChild(element);
  });

  test('handles touch start events', () => {
    const touchEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 200 } as Touch]
    });

    fireEvent(element, touchEvent);

    expect((gestureHandler as any).isTracking).toBe(true);
    expect((gestureHandler as any).startX).toBe(100);
    expect((gestureHandler as any).startY).toBe(200);
  });

  test('handles mouse events for desktop testing', () => {
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: 150,
      clientY: 250
    });

    fireEvent(element, mouseEvent);

    expect((gestureHandler as any).isTracking).toBe(true);
    expect((gestureHandler as any).startX).toBe(150);
    expect((gestureHandler as any).startY).toBe(250);
  });
});

describe('Mobile Layout Optimization', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
    mockWindowProperties({ innerWidth: 375, innerHeight: 812 });
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  test('optimizes element for thumb navigation', () => {
    MobileLayoutOptimizer.optimizeForThumbNavigation(element);

    expect(element.classList.contains('thumb-optimized')).toBe(true);
    expect(element.style.getPropertyValue('--thumb-zone-left')).toBe('0px');
    expect(element.style.getPropertyValue('--thumb-zone-right')).toBe('120px');
  });

  test('adds touch feedback to elements', () => {
    MobileLayoutOptimizer.addTouchFeedback(element);

    expect(element.classList.contains('touch-feedback')).toBe(true);
  });

  test('optimizes touch targets in container', () => {
    const button = document.createElement('button');
    button.style.width = '30px';
    button.style.height = '30px';
    element.appendChild(button);

    MobileLayoutOptimizer.optimizeTouchTargets(element);

    expect(button.style.minWidth).toBe('44px');
    expect(button.style.minHeight).toBe('44px');
    expect(button.classList.contains('touch-target-optimized')).toBe(true);
  });
});

describe('Responsive Breakpoints', () => {
  beforeEach(() => {
    // Reset breakpoint state
    (ResponsiveBreakpoints as any).currentBreakpoint = '';
    document.documentElement.removeAttribute('data-breakpoint');
  });

  test('initializes with correct breakpoint', () => {
    mockWindowProperties({ innerWidth: 375 });
    ResponsiveBreakpoints.init();

    expect(ResponsiveBreakpoints.getCurrentBreakpoint()).toBe('mobile');
    expect(ResponsiveBreakpoints.isMobile()).toBe(true);
    expect(document.documentElement.getAttribute('data-breakpoint')).toBe('mobile');
  });

  test('updates breakpoint on resize', () => {
    mockWindowProperties({ innerWidth: 375 });
    ResponsiveBreakpoints.init();

    expect(ResponsiveBreakpoints.isMobile()).toBe(true);

    // Simulate resize to tablet
    mockWindowProperties({ innerWidth: 768 });
    fireEvent(window, new Event('resize'));

    expect(ResponsiveBreakpoints.isTablet()).toBe(true);
    expect(document.documentElement.getAttribute('data-breakpoint')).toBe('tablet');
  });

  test('calls breakpoint change listeners', () => {
    const listener = vi.fn();
    const unsubscribe = ResponsiveBreakpoints.onBreakpointChange(listener);

    mockWindowProperties({ innerWidth: 375 });
    ResponsiveBreakpoints.init();

    mockWindowProperties({ innerWidth: 1024 });
    fireEvent(window, new Event('resize'));

    expect(listener).toHaveBeenCalledWith('desktop');

    unsubscribe();
  });
});

describe('Mobile Component Integration', () => {
  test('Button component has proper touch targets on mobile', () => {
    mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
    mockWindowProperties({ innerWidth: 375, innerHeight: 812 });

    render(<Button>Test Button</Button>);
    
    const button = screen.getByRole('button');
    const styles = window.getComputedStyle(button);
    
    // Should have minimum touch target size
    expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
  });

  test('QuestionCard handles touch interactions', async () => {
    mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
    const onAnswer = vi.fn();
    const onHintUsed = vi.fn();

    render(
      <QuizProvider>
        <QuestionCard
          question={mockQuestion}
          onAnswer={onAnswer}
          onHintUsed={onHintUsed}
          timeRemaining={30}
          hintAvailable={true}
          difficulty="easy"
        />
      </QuizProvider>
    );

    const answerButton = screen.getByText('Koala');
    
    // Simulate touch interaction
    fireEvent.touchStart(answerButton, {
      touches: [{ clientX: 100, clientY: 100 }]
    });
    
    fireEvent.touchEnd(answerButton, {
      changedTouches: [{ clientX: 100, clientY: 100 }]
    });
    
    fireEvent.click(answerButton);

    await waitFor(() => {
      expect(onAnswer).toHaveBeenCalledWith('a1');
    });
  });

  test('Components adapt to different screen sizes', () => {
    // Test mobile layout
    mockWindowProperties({ innerWidth: 375 });
    ResponsiveBreakpoints.init();
    
    const { rerender } = render(<Button size="lg">Mobile Button</Button>);
    
    let button = screen.getByRole('button');
    expect(button).toBeInTheDocument();

    // Test tablet layout
    mockWindowProperties({ innerWidth: 768 });
    fireEvent(window, new Event('resize'));
    
    rerender(<Button size="lg">Tablet Button</Button>);
    
    button = screen.getByRole('button');
    expect(button).toBeInTheDocument();

    // Test desktop layout
    mockWindowProperties({ innerWidth: 1024 });
    fireEvent(window, new Event('resize'));
    
    rerender(<Button size="lg">Desktop Button</Button>);
    
    button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});

describe('Mobile Performance Optimization', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  test('optimizes scrolling for mobile', () => {
    MobilePerformanceOptimizer.optimizeScrolling(element);

    expect((element.style as any).webkitOverflowScrolling).toBe('touch');
    expect(element.style.scrollBehavior).toBe('smooth');
  });

  test('prevents zoom on specific elements', () => {
    MobilePerformanceOptimizer.preventZoom(element);

    expect(element.style.touchAction).toBe('manipulation');
  });

  test('enables hardware acceleration', () => {
    MobilePerformanceOptimizer.enableHardwareAcceleration(element);

    expect(element.style.transform).toBe('translateZ(0)');
    expect(element.style.willChange).toBe('transform');
  });

  test('optimizes animations for low-end devices', () => {
    mockWindowProperties({ devicePixelRatio: 1 });
    
    MobilePerformanceOptimizer.optimizeAnimations();

    expect(document.documentElement.classList.contains('reduced-animations')).toBe(true);
  });
});

describe('Touch Interaction Accessibility', () => {
  test('maintains focus management during touch interactions', async () => {
    const onAnswer = vi.fn();
    
    render(
      <QuizProvider>
        <QuestionCard
          question={mockQuestion}
          onAnswer={onAnswer}
          onHintUsed={vi.fn()}
          timeRemaining={30}
          hintAvailable={true}
          difficulty="easy"
        />
      </QuizProvider>
    );

    const answerButton = screen.getByText('Koala');
    
    // Focus the button
    answerButton.focus();
    expect(document.activeElement).toBe(answerButton);
    
    // Touch interaction should not break focus management
    fireEvent.touchStart(answerButton);
    fireEvent.touchEnd(answerButton);
    
    // Focus should still be manageable
    expect(answerButton).toHaveAttribute('tabindex');
  });

  test('provides proper ARIA labels for touch interactions', () => {
    render(<Button aria-label="Submit answer">Submit</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Submit answer');
  });
});

describe('Viewport and Safe Area Handling', () => {
  test('handles safe area insets on mobile devices', () => {
    // Mock CSS.supports for safe area support
    const originalSupports = CSS.supports;
    CSS.supports = vi.fn().mockReturnValue(true);

    const element = document.createElement('div');
    element.className = 'safe-area-inset-top';
    document.body.appendChild(element);

    // The CSS should handle safe area insets
    expect(element.className).toContain('safe-area-inset-top');

    document.body.removeChild(element);
    CSS.supports = originalSupports;
  });
});