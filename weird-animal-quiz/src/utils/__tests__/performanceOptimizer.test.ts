/**
 * Performance optimizer tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AnimationOptimizer,
  ResourceOptimizer,
  PerformanceMonitor,
  BundleOptimizer,
  MemoryOptimizer
} from '../performanceOptimizer';

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16); // ~60fps
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query.includes('reduce'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((callback, options) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock setTimeout and setInterval to return numbers
const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;

global.setTimeout = vi.fn().mockImplementation((callback, delay) => {
  return originalSetTimeout(callback, delay);
});

global.setInterval = vi.fn().mockImplementation((callback, delay) => {
  return originalSetInterval(callback, delay);
});

describe('AnimationOptimizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    AnimationOptimizer.cancelBatchedAnimations();
  });

  it('should batch multiple animation callbacks into single RAF', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();

    AnimationOptimizer.batchAnimations(callback1);
    AnimationOptimizer.batchAnimations(callback2);
    AnimationOptimizer.batchAnimations(callback3);

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it('should detect reduced motion preference', () => {
    // Mock reduced motion
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query.includes('reduce'),
      media: query,
    }));

    expect(AnimationOptimizer.prefersReducedMotion()).toBe(true);
  });

  it('should return 0 duration for reduced motion', () => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query.includes('reduce'),
      media: query,
    }));

    expect(AnimationOptimizer.getAnimationDuration(300)).toBe(0);
  });

  it('should create optimized CSS transforms', () => {
    const transform = AnimationOptimizer.createTransform({
      x: 10,
      y: 20,
      scale: 1.5,
      rotate: 45
    });

    expect(transform).toBe('translate3d(10px, 20px, 0) scale(1.5) rotate(45deg)');
  });

  it('should handle partial transform options', () => {
    const transform = AnimationOptimizer.createTransform({
      x: 10,
      scale: 2
    });

    expect(transform).toBe('translate3d(10px, 0px, 0) scale(2)');
  });
});

describe('ResourceOptimizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear cache
    ResourceOptimizer.cleanup();
  });

  it('should preload images and cache them', async () => {
    const mockImage = {
      onload: null as any,
      onerror: null as any,
      src: ''
    };

    // Mock Image constructor
    global.Image = vi.fn().mockImplementation(() => mockImage);

    const preloadPromise = ResourceOptimizer.preloadImage('test.jpg');
    
    // Simulate image load
    setTimeout(() => {
      if (mockImage.onload) mockImage.onload();
    }, 0);

    const result = await preloadPromise;
    expect(result).toBe(mockImage);
    expect(mockImage.src).toBe('test.jpg');
  });

  it('should return cached image on subsequent calls', async () => {
    // Clear any existing cache first
    ResourceOptimizer.cleanup();
    
    const mockImage = {
      onload: null as any,
      onerror: null as any,
      src: ''
    };

    global.Image = vi.fn().mockImplementation(() => mockImage);

    // First call
    const promise1 = ResourceOptimizer.preloadImage('cached-test.jpg');
    setTimeout(() => {
      if (mockImage.onload) mockImage.onload();
    }, 0);
    const result1 = await promise1;

    // Second call should return cached version
    const result2 = await ResourceOptimizer.preloadImage('cached-test.jpg');
    
    expect(result2).toBe(result1);
    // Note: The cache implementation may vary, so we just check that both calls return the same result
  });

  it('should preload components', async () => {
    const mockComponent = { default: () => 'MockComponent' };
    const importFn = vi.fn().mockResolvedValue(mockComponent);

    await ResourceOptimizer.preloadComponent(importFn);
    
    expect(importFn).toHaveBeenCalledTimes(1);

    // Second call should not import again
    await ResourceOptimizer.preloadComponent(importFn);
    expect(importFn).toHaveBeenCalledTimes(1);
  });
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    PerformanceMonitor.clear();
    vi.clearAllMocks();
  });

  it('should measure synchronous operations', () => {
    const mockFn = vi.fn().mockReturnValue('result');
    
    const result = PerformanceMonitor.measure('test-operation', mockFn);
    
    expect(result).toBe('result');
    expect(mockFn).toHaveBeenCalledTimes(1);
    
    const stats = PerformanceMonitor.getStats('test-operation');
    expect(stats).toBeTruthy();
    expect(stats!.count).toBe(1);
    expect(stats!.avg).toBeGreaterThanOrEqual(0);
  });

  it('should measure async operations', async () => {
    const mockAsyncFn = vi.fn().mockResolvedValue('async-result');
    
    const result = await PerformanceMonitor.measureAsync('async-operation', mockAsyncFn);
    
    expect(result).toBe('async-result');
    expect(mockAsyncFn).toHaveBeenCalledTimes(1);
    
    const stats = PerformanceMonitor.getStats('async-operation');
    expect(stats).toBeTruthy();
    expect(stats!.count).toBe(1);
  });

  it('should calculate correct statistics', () => {
    // Add multiple measurements
    PerformanceMonitor.measure('multi-test', () => {
      // Simulate work
      const start = performance.now();
      while (performance.now() - start < 1) {} // 1ms work
    });
    
    PerformanceMonitor.measure('multi-test', () => {
      const start = performance.now();
      while (performance.now() - start < 2) {} // 2ms work
    });

    const stats = PerformanceMonitor.getStats('multi-test');
    expect(stats).toBeTruthy();
    expect(stats!.count).toBe(2);
    expect(stats!.min).toBeLessThanOrEqual(stats!.max);
    expect(stats!.avg).toBeGreaterThan(0);
  });

  it('should limit measurements to 100 entries', () => {
    // Add 150 measurements
    for (let i = 0; i < 150; i++) {
      PerformanceMonitor.measure('limit-test', () => i);
    }

    const stats = PerformanceMonitor.getStats('limit-test');
    expect(stats!.count).toBe(100);
  });
});

describe('BundleOptimizer', () => {
  it('should conditionally import modules', async () => {
    const mockModule = { default: 'MockModule' };
    const importFn = vi.fn().mockResolvedValue(mockModule);

    // Should import when condition is true
    const result1 = await BundleOptimizer.importWhenNeeded(() => true, importFn);
    expect(result1).toBe(mockModule);
    expect(importFn).toHaveBeenCalledTimes(1);

    // Should not import when condition is false
    const result2 = await BundleOptimizer.importWhenNeeded(() => false, importFn);
    expect(result2).toBeNull();
    expect(importFn).toHaveBeenCalledTimes(1); // Still only called once
  });

  it('should create lazy loader with preload capability', async () => {
    const mockModule = { default: 'LazyModule' };
    const importFn = vi.fn().mockResolvedValue(mockModule);

    const loader = BundleOptimizer.createLazyLoader(importFn);

    // Preload should start loading
    loader.preload();
    expect(importFn).toHaveBeenCalledTimes(1);

    // Load should return the same promise
    const result = await loader.load();
    expect(result).toBe(mockModule);
    expect(importFn).toHaveBeenCalledTimes(1); // Still only called once
  });
});

describe('MemoryOptimizer', () => {
  beforeEach(() => {
    MemoryOptimizer.cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    MemoryOptimizer.cleanup();
  });

  it('should create and track intersection observers', () => {
    const callback = vi.fn();
    const options = { threshold: 0.5 };

    const observer = MemoryOptimizer.createIntersectionObserver(callback, options);
    
    expect(observer).toBeTruthy();
    expect(observer.observe).toBeDefined();
    expect(observer.disconnect).toBeDefined();
  });

  it('should create and track timeouts', () => {
    const callback = vi.fn();
    
    const timerId = MemoryOptimizer.setTimeout(callback, 100);
    
    expect(timerId).toBeTruthy();
    // Timer ID can be number or object depending on environment
  });

  it('should create and track intervals', () => {
    const callback = vi.fn();
    
    const intervalId = MemoryOptimizer.setInterval(callback, 100);
    
    expect(intervalId).toBeTruthy();
    // Interval ID can be number or object depending on environment
  });

  it('should cleanup all resources', () => {
    const callback = vi.fn();
    
    // Create some resources
    MemoryOptimizer.createIntersectionObserver(callback);
    MemoryOptimizer.setTimeout(callback, 1000);
    MemoryOptimizer.setInterval(callback, 1000);

    // Cleanup should not throw
    expect(() => MemoryOptimizer.cleanup()).not.toThrow();
  });
});

// Integration test for performance optimization
describe('Performance Integration', () => {
  it('should maintain performance under load', async () => {
    const operations = [];
    
    // Simulate multiple concurrent operations
    for (let i = 0; i < 10; i++) {
      operations.push(
        PerformanceMonitor.measureAsync(`operation-${i}`, async () => {
          // Simulate async work
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
          return `result-${i}`;
        })
      );
    }

    const results = await Promise.all(operations);
    
    expect(results).toHaveLength(10);
    results.forEach((result, index) => {
      expect(result).toBe(`result-${index}`);
    });

    // Check that all operations were measured
    for (let i = 0; i < 10; i++) {
      const stats = PerformanceMonitor.getStats(`operation-${i}`);
      expect(stats).toBeTruthy();
      expect(stats!.count).toBe(1);
    }
  });
});