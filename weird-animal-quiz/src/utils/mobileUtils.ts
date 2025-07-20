/**
 * Mobile Utilities - Touch interactions, haptic feedback, and mobile optimizations
 * Requirements: 4.3, 4.4, 4.8
 */

export interface TouchGestureOptions {
  threshold?: number;
  timeout?: number;
  preventDefault?: boolean;
}

export interface HapticFeedbackOptions {
  type?: 'light' | 'medium' | 'heavy' | 'selection' | 'impact' | 'notification';
  pattern?: number[];
}

export interface MobileDeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  supportsHaptics: boolean;
  screenSize: 'small' | 'medium' | 'large';
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
}

/**
 * Mobile Device Detection and Capabilities
 */
export class MobileDetector {
  private static deviceInfo: MobileDeviceInfo | null = null;

  static getDeviceInfo(): MobileDeviceInfo {
    if (this.deviceInfo) {
      return this.deviceInfo;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Device type detection
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || 
                     (hasTouch && Math.max(width, height) < 1024);
    const isTablet = hasTouch && Math.min(width, height) >= 768 && Math.max(width, height) < 1024;
    const isDesktop = !isMobile && !isTablet;

    // Screen size classification
    let screenSize: 'small' | 'medium' | 'large' = 'medium';
    if (width < 480) screenSize = 'small';
    else if (width >= 1024) screenSize = 'large';

    // Orientation
    const orientation = height > width ? 'portrait' : 'landscape';

    // Haptic support detection
    const supportsHaptics = 'vibrate' in navigator || 
                           ('hapticFeedback' in navigator) ||
                           /iphone|ipad/i.test(userAgent);

    this.deviceInfo = {
      isMobile,
      isTablet,
      isDesktop,
      hasTouch,
      supportsHaptics,
      screenSize,
      orientation,
      pixelRatio: window.devicePixelRatio || 1
    };

    return this.deviceInfo;
  }

  static isTouchDevice(): boolean {
    return this.getDeviceInfo().hasTouch;
  }

  static isMobileDevice(): boolean {
    return this.getDeviceInfo().isMobile;
  }

  static supportsHapticFeedback(): boolean {
    return this.getDeviceInfo().supportsHaptics;
  }

  static getThumbZone(): { left: number; right: number; bottom: number } {
    const { innerWidth, innerHeight } = window;
    const deviceInfo = this.getDeviceInfo();
    
    if (!deviceInfo.isMobile) {
      return { left: 0, right: innerWidth, bottom: innerHeight };
    }

    // Thumb-reachable zones for mobile devices
    const thumbReach = deviceInfo.screenSize === 'small' ? 120 : 150;
    
    return {
      left: 0,
      right: Math.min(innerWidth, thumbReach),
      bottom: Math.max(innerHeight - thumbReach, innerHeight * 0.6)
    };
  }
}

/**
 * Haptic Feedback Manager
 */
export class HapticFeedback {
  private static isEnabled = true;
  private static lastFeedbackTime = 0;
  private static readonly FEEDBACK_COOLDOWN = 50; // ms

  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  static isSupported(): boolean {
    return MobileDetector.supportsHapticFeedback();
  }

  static async trigger(options: HapticFeedbackOptions = {}): Promise<void> {
    if (!this.isEnabled || !this.isSupported()) {
      return;
    }

    const now = Date.now();
    if (now - this.lastFeedbackTime < this.FEEDBACK_COOLDOWN) {
      return; // Prevent feedback spam
    }

    this.lastFeedbackTime = now;

    try {
      // Modern Haptic API (iOS Safari)
      if ('hapticFeedback' in navigator) {
        const hapticType = this.mapHapticType(options.type || 'light');
        // @ts-ignore - Haptic API not in TypeScript definitions yet
        await navigator.hapticFeedback.vibrate(hapticType);
        return;
      }

      // Vibration API fallback
      if ('vibrate' in navigator) {
        const pattern = options.pattern || this.getVibrationPattern(options.type || 'light');
        navigator.vibrate(pattern);
        return;
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  private static mapHapticType(type: string): string {
    const mapping: Record<string, string> = {
      light: 'light',
      medium: 'medium', 
      heavy: 'heavy',
      selection: 'selection',
      impact: 'impact',
      notification: 'notification'
    };
    return mapping[type] || 'light';
  }

  private static getVibrationPattern(type: string): number[] {
    const patterns: Record<string, number[]> = {
      light: [10],
      medium: [20],
      heavy: [30],
      selection: [5],
      impact: [15],
      notification: [10, 50, 10]
    };
    return patterns[type] || [10];
  }

  // Convenience methods for common feedback types
  static async light(): Promise<void> {
    return this.trigger({ type: 'light' });
  }

  static async medium(): Promise<void> {
    return this.trigger({ type: 'medium' });
  }

  static async heavy(): Promise<void> {
    return this.trigger({ type: 'heavy' });
  }

  static async selection(): Promise<void> {
    return this.trigger({ type: 'selection' });
  }

  static async success(): Promise<void> {
    return this.trigger({ pattern: [10, 50, 10, 50, 20] });
  }

  static async error(): Promise<void> {
    return this.trigger({ pattern: [50, 100, 50] });
  }
}

/**
 * Touch Gesture Handler
 */
export class TouchGestureHandler {
  protected element: HTMLElement;
  protected startX = 0;
  protected startY = 0;
  protected startTime = 0;
  protected isTracking = false;

  constructor(element: HTMLElement) {
    this.element = element;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Touch events
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

    // Mouse events for desktop testing
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.startTracking(touch.clientX, touch.clientY);
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (this.isTracking && event.touches.length === 1) {
      const touch = event.touches[0];
      this.updateTracking(touch.clientX, touch.clientY);
    }
  }

  private handleTouchEnd(_event: TouchEvent): void {
    if (this.isTracking) {
      this.endTracking();
    }
  }

  private handleTouchCancel(): void {
    this.cancelTracking();
  }

  private handleMouseDown(event: MouseEvent): void {
    this.startTracking(event.clientX, event.clientY);
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.isTracking) {
      this.updateTracking(event.clientX, event.clientY);
    }
  }

  private handleMouseUp(): void {
    if (this.isTracking) {
      this.endTracking();
    }
  }

  protected startTracking(x: number, y: number): void {
    this.startX = x;
    this.startY = y;
    this.startTime = Date.now();
    this.isTracking = true;
  }

  protected updateTracking(_x: number, _y: number): void {
    // Override in subclasses for specific gesture handling
  }

  protected endTracking(): void {
    this.isTracking = false;
  }

  private cancelTracking(): void {
    this.isTracking = false;
  }

  destroy(): void {
    // Remove all event listeners
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this));
  }
}

/**
 * Swipe Gesture Handler
 */
export class SwipeGestureHandler extends TouchGestureHandler {
  private onSwipeLeft?: () => void;
  private onSwipeRight?: () => void;
  private onSwipeUp?: () => void;
  private onSwipeDown?: () => void;
  private threshold: number;

  constructor(
    element: HTMLElement, 
    callbacks: {
      onSwipeLeft?: () => void;
      onSwipeRight?: () => void;
      onSwipeUp?: () => void;
      onSwipeDown?: () => void;
    },
    options: TouchGestureOptions = {}
  ) {
    super(element);
    this.onSwipeLeft = callbacks.onSwipeLeft;
    this.onSwipeRight = callbacks.onSwipeRight;
    this.onSwipeUp = callbacks.onSwipeUp;
    this.onSwipeDown = callbacks.onSwipeDown;
    this.threshold = options.threshold || 50;
  }

  protected updateTracking(x: number, y: number): void {
    // Swipe detection logic would go here
    const deltaX = x - this.startX;
    const deltaY = y - this.startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > this.threshold || absDeltaY > this.threshold) {
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0 && this.onSwipeRight) {
          this.onSwipeRight();
        } else if (deltaX < 0 && this.onSwipeLeft) {
          this.onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && this.onSwipeDown) {
          this.onSwipeDown();
        } else if (deltaY < 0 && this.onSwipeUp) {
          this.onSwipeUp();
        }
      }
      this.endTracking();
    }
  }
}

/**
 * Mobile Layout Optimizer
 */
export class MobileLayoutOptimizer {
  static optimizeForThumbNavigation(element: HTMLElement): void {
    const deviceInfo = MobileDetector.getDeviceInfo();
    
    if (!deviceInfo.isMobile) {
      return;
    }

    const thumbZone = MobileDetector.getThumbZone();
    
    // Add thumb-navigation class for CSS targeting
    element.classList.add('thumb-optimized');
    
    // Set CSS custom properties for thumb zone
    element.style.setProperty('--thumb-zone-left', `${thumbZone.left}px`);
    element.style.setProperty('--thumb-zone-right', `${thumbZone.right}px`);
    element.style.setProperty('--thumb-zone-bottom', `${thumbZone.bottom}px`);
  }

  static addTouchFeedback(element: HTMLElement): void {
    if (!MobileDetector.isTouchDevice()) {
      return;
    }

    element.classList.add('touch-feedback');
    
    // Add touch start/end handlers for visual feedback
    element.addEventListener('touchstart', (e) => {
      element.classList.add('touch-active');
      HapticFeedback.selection();
      
      // Prevent double-tap zoom on buttons
      if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
        e.preventDefault();
      }
    }, { passive: false });

    element.addEventListener('touchend', () => {
      setTimeout(() => {
        element.classList.remove('touch-active');
      }, 150);
    }, { passive: true });

    element.addEventListener('touchcancel', () => {
      element.classList.remove('touch-active');
    }, { passive: true });

    // Add mouse events for desktop testing
    element.addEventListener('mousedown', () => {
      element.classList.add('touch-active');
    });

    element.addEventListener('mouseup', () => {
      setTimeout(() => {
        element.classList.remove('touch-active');
      }, 150);
    });

    element.addEventListener('mouseleave', () => {
      element.classList.remove('touch-active');
    });
  }

  static optimizeTouchTargets(container: HTMLElement): void {
    const touchTargets = container.querySelectorAll('button, a, [role="button"], input, select, textarea');
    
    touchTargets.forEach((target) => {
      const element = target as HTMLElement;
      const rect = element.getBoundingClientRect();
      
      // Ensure minimum touch target size
      if (rect.width < 44 || rect.height < 44) {
        element.style.minWidth = '44px';
        element.style.minHeight = '44px';
        element.classList.add('touch-target-optimized');
      }
      
      // Add touch feedback
      this.addTouchFeedback(element);
    });
  }
}

/**
 * Mobile Performance Optimizer
 */
export class MobilePerformanceOptimizer {
  static optimizeScrolling(element: HTMLElement): void {
    // Enable momentum scrolling on iOS
    (element.style as any).webkitOverflowScrolling = 'touch';
    element.style.scrollBehavior = 'smooth';
  }

  static preventZoom(element: HTMLElement): void {
    // Prevent double-tap zoom on specific elements
    element.style.touchAction = 'manipulation';
  }

  static optimizeAnimations(): void {
    const deviceInfo = MobileDetector.getDeviceInfo();
    
    // Reduce animations on low-end devices
    if (deviceInfo.pixelRatio < 2) {
      document.documentElement.classList.add('reduced-animations');
    }
  }

  static enableHardwareAcceleration(element: HTMLElement): void {
    element.style.transform = 'translateZ(0)';
    element.style.willChange = 'transform';
  }
}

/**
 * Responsive Breakpoint Manager
 */
export class ResponsiveBreakpoints {
  private static breakpoints = {
    mobile: 320,
    tablet: 768,
    desktop: 1024
  };

  private static listeners: Array<(breakpoint: string) => void> = [];
  private static currentBreakpoint: string = '';

  static init(): void {
    this.updateBreakpoint();
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private static handleResize(): void {
    this.updateBreakpoint();
  }

  private static updateBreakpoint(): void {
    const width = window.innerWidth;
    let newBreakpoint = 'mobile';
    
    if (width >= this.breakpoints.desktop) {
      newBreakpoint = 'desktop';
    } else if (width >= this.breakpoints.tablet) {
      newBreakpoint = 'tablet';
    }

    if (newBreakpoint !== this.currentBreakpoint) {
      this.currentBreakpoint = newBreakpoint;
      document.documentElement.setAttribute('data-breakpoint', newBreakpoint);
      
      // Notify listeners
      this.listeners.forEach(listener => listener(newBreakpoint));
    }
  }

  static getCurrentBreakpoint(): string {
    return this.currentBreakpoint;
  }

  static onBreakpointChange(callback: (breakpoint: string) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  static isMobile(): boolean {
    return this.currentBreakpoint === 'mobile';
  }

  static isTablet(): boolean {
    return this.currentBreakpoint === 'tablet';
  }

  static isDesktop(): boolean {
    return this.currentBreakpoint === 'desktop';
  }
}

// Initialize responsive breakpoints
if (typeof window !== 'undefined') {
  ResponsiveBreakpoints.init();
}