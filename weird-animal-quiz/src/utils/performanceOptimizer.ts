/**
 * Performance optimization utilities for maintaining 60fps animations
 * and efficient resource usage
 */

// Animation performance utilities
export class AnimationOptimizer {
  private static rafId: number | null = null;
  private static callbacks: (() => void)[] = [];

  /**
   * Batch animation updates to single RAF call
   */
  static batchAnimations(callback: () => void): void {
    this.callbacks.push(callback);
    
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        const callbacksToRun = [...this.callbacks];
        this.callbacks.length = 0;
        this.rafId = null;
        
        callbacksToRun.forEach(cb => cb());
      });
    }
  }

  /**
   * Cancel batched animations
   */
  static cancelBatchedAnimations(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
      this.callbacks.length = 0;
    }
  }

  /**
   * Check if user prefers reduced motion
   */
  static prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Get optimized animation duration based on user preferences
   */
  static getAnimationDuration(defaultMs: number): number {
    return this.prefersReducedMotion() ? 0 : defaultMs;
  }

  /**
   * Create performance-optimized CSS transform
   */
  static createTransform(options: {
    x?: number;
    y?: number;
    scale?: number;
    rotate?: number;
  }): string {
    const transforms: string[] = [];
    
    if (options.x !== undefined || options.y !== undefined) {
      transforms.push(`translate3d(${options.x || 0}px, ${options.y || 0}px, 0)`);
    }
    
    if (options.scale !== undefined) {
      transforms.push(`scale(${options.scale})`);
    }
    
    if (options.rotate !== undefined) {
      transforms.push(`rotate(${options.rotate}deg)`);
    }
    
    return transforms.join(' ');
  }
}

// Resource management utilities
export class ResourceOptimizer {
  private static imageCache = new Map<string, HTMLImageElement>();
  private static preloadedComponents = new Set<string>();

  /**
   * Preload images for better performance
   */
  static preloadImage(src: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(src)) {
      return Promise.resolve(this.imageCache.get(src)!);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Preload component chunks
   */
  static async preloadComponent(importFn: () => Promise<any>): Promise<void> {
    const componentKey = importFn.toString();
    
    if (this.preloadedComponents.has(componentKey)) {
      return;
    }

    try {
      await importFn();
      this.preloadedComponents.add(componentKey);
    } catch (error) {
      console.warn('Failed to preload component:', error);
    }
  }

  /**
   * Clean up unused resources
   */
  static cleanup(): void {
    // Clear image cache if it gets too large
    if (this.imageCache.size > 50) {
      this.imageCache.clear();
    }
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  /**
   * Measure and track performance metrics
   */
  static measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    const duration = end - start;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const measurements = this.metrics.get(name)!;
    measurements.push(duration);
    
    // Keep only last 100 measurements
    if (measurements.length > 100) {
      measurements.shift();
    }
    
    return result;
  }

  /**
   * Measure async operations
   */
  static async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    const duration = end - start;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const measurements = this.metrics.get(name)!;
    measurements.push(duration);
    
    // Keep only last 100 measurements
    if (measurements.length > 100) {
      measurements.shift();
    }
    
    return result;
  }

  /**
   * Get performance statistics
   */
  static getStats(name: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const measurements = this.metrics.get(name);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const avg = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);

    return { avg, min, max, count: measurements.length };
  }

  /**
   * Log performance report
   */
  static logReport(): void {
    if (process.env.NODE_ENV === 'development') {
      console.group('Performance Report');
      
      for (const [name, measurements] of this.metrics) {
        const stats = this.getStats(name);
        if (stats) {
          console.log(`${name}:`, {
            average: `${stats.avg.toFixed(2)}ms`,
            min: `${stats.min.toFixed(2)}ms`,
            max: `${stats.max.toFixed(2)}ms`,
            samples: stats.count
          });
        }
      }
      
      console.groupEnd();
    }
  }

  /**
   * Clear all metrics
   */
  static clear(): void {
    this.metrics.clear();
  }
}

// Bundle size optimization utilities
export class BundleOptimizer {
  /**
   * Dynamically import modules only when needed
   */
  static async importWhenNeeded<T>(
    condition: () => boolean,
    importFn: () => Promise<T>
  ): Promise<T | null> {
    if (!condition()) {
      return null;
    }

    return await importFn();
  }

  /**
   * Lazy load features based on user interaction
   */
  static createLazyLoader<T>(importFn: () => Promise<T>) {
    let loadPromise: Promise<T> | null = null;

    return {
      load: (): Promise<T> => {
        if (!loadPromise) {
          loadPromise = importFn();
        }
        return loadPromise;
      },
      preload: (): void => {
        if (!loadPromise) {
          loadPromise = importFn();
        }
      }
    };
  }
}

// Memory management utilities
export class MemoryOptimizer {
  private static observers = new Set<IntersectionObserver>();
  private static timers = new Set<number>();

  /**
   * Create intersection observer with automatic cleanup
   */
  static createIntersectionObserver(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): IntersectionObserver {
    const observer = new IntersectionObserver(callback, options);
    this.observers.add(observer);
    return observer;
  }

  /**
   * Create timer with automatic cleanup tracking
   */
  static setTimeout(callback: () => void, delay: number): number {
    const timerId = window.setTimeout(() => {
      this.timers.delete(timerId);
      callback();
    }, delay);
    
    this.timers.add(timerId);
    return timerId;
  }

  /**
   * Create interval with automatic cleanup tracking
   */
  static setInterval(callback: () => void, delay: number): number {
    const intervalId = window.setInterval(callback, delay);
    this.timers.add(intervalId);
    return intervalId;
  }

  /**
   * Clean up all managed resources
   */
  static cleanup(): void {
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Clear all timers
    this.timers.forEach(timerId => {
      clearTimeout(timerId);
      clearInterval(timerId);
    });
    this.timers.clear();

    // Clean up other resources
    ResourceOptimizer.cleanup();
    PerformanceMonitor.clear();
  }
}

// All classes are already exported individually above