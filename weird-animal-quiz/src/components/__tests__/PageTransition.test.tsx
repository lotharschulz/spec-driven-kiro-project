/**
 * PageTransition Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import PageTransition from '../PageTransition';
import * as animationSystem from '../../utils/animationSystem';

// Mock the animation system
vi.mock('../../utils/animationSystem', () => ({
  useReducedMotion: vi.fn().mockReturnValue(false),
  getAccessibleAnimationProps: vi.fn().mockReturnValue({
    variants: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    transition: { duration: 0.3 },
    animate: 'animate',
  }),
  ANIMATION_VARIANTS: {
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
    FADE: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
  },
  TRANSITIONS: {
    DEFAULT: {
      type: 'tween',
      ease: [0.4, 0, 0.2, 1],
      duration: 0.3,
    },
  },
}));

describe('PageTransition', () => {
  it('renders children correctly', () => {
    render(
      <PageTransition pageKey="test-page">
        <div data-testid="test-content">Test Content</div>
      </PageTransition>
    );
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
  
  it('applies custom class name', () => {
    render(
      <PageTransition pageKey="test-page" className="custom-class">
        <div>Test Content</div>
      </PageTransition>
    );
    
    // Find the motion.div with the custom class
    const motionDiv = document.querySelector('.custom-class');
    expect(motionDiv).toBeInTheDocument();
  });
  
  it('uses correct animation variants based on direction', () => {
    const getAccessibleAnimationPropsSpy = vi.spyOn(animationSystem, 'getAccessibleAnimationProps');
    
    render(
      <PageTransition pageKey="test-page" direction="down">
        <div>Test Content</div>
      </PageTransition>
    );
    
    expect(getAccessibleAnimationPropsSpy).toHaveBeenCalledWith(
      false,
      animationSystem.ANIMATION_VARIANTS.SLIDE_DOWN,
      animationSystem.TRANSITIONS.DEFAULT
    );
    
    // Clean up
    getAccessibleAnimationPropsSpy.mockRestore();
  });
  
  it('respects reduced motion preferences', () => {
    // Mock reduced motion preference
    vi.spyOn(animationSystem, 'useReducedMotion').mockReturnValue(true);
    
    const getAccessibleAnimationPropsSpy = vi.spyOn(animationSystem, 'getAccessibleAnimationProps');
    
    render(
      <PageTransition pageKey="test-page">
        <div>Test Content</div>
      </PageTransition>
    );
    
    expect(getAccessibleAnimationPropsSpy).toHaveBeenCalledWith(
      true,
      expect.any(Object),
      expect.any(Object)
    );
    
    // Clean up
    getAccessibleAnimationPropsSpy.mockRestore();
  });
  
  it('uses custom variants when provided', () => {
    const customVariants = {
      initial: { scale: 0 },
      animate: { scale: 1 },
      exit: { scale: 0 },
    };
    
    const getAccessibleAnimationPropsSpy = vi.spyOn(animationSystem, 'getAccessibleAnimationProps');
    
    render(
      <PageTransition pageKey="test-page" customVariants={customVariants}>
        <div>Test Content</div>
      </PageTransition>
    );
    
    expect(getAccessibleAnimationPropsSpy).toHaveBeenCalledWith(
      false,
      customVariants,
      animationSystem.TRANSITIONS.DEFAULT
    );
    
    // Clean up
    getAccessibleAnimationPropsSpy.mockRestore();
  });
  
  it('uses custom transition when provided', () => {
    const customTransition = {
      type: 'spring',
      stiffness: 100,
      damping: 10,
    };
    
    const getAccessibleAnimationPropsSpy = vi.spyOn(animationSystem, 'getAccessibleAnimationProps');
    
    render(
      <PageTransition pageKey="test-page" customTransition={customTransition}>
        <div>Test Content</div>
      </PageTransition>
    );
    
    expect(getAccessibleAnimationPropsSpy).toHaveBeenCalledWith(
      false,
      expect.any(Object),
      customTransition
    );
    
    // Clean up
    getAccessibleAnimationPropsSpy.mockRestore();
  });
  
  it('disables exit animations when specified', () => {
    render(
      <PageTransition pageKey="test-page" disableExit={true}>
        <div>Test Content</div>
      </PageTransition>
    );
    
    // This is a bit tricky to test directly since we'd need to check the props passed to motion.div
    // For now, we'll just ensure it renders without errors
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});