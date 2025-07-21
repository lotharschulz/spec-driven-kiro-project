/**
 * Page Transition Component
 * Implements smooth transitions between pages with accessibility support
 * Requirements: 4.2, 5.1
 */

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useReducedMotion, 
  getAccessibleAnimationProps, 
  ANIMATION_VARIANTS, 
  TRANSITIONS 
} from '../utils/animationSystem';

export interface PageTransitionProps {
  /** Unique identifier for the current page/route */
  pageKey: string;
  /** Children to render with transition effects */
  children: ReactNode;
  /** Direction of the transition (horizontal or vertical) */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Custom animation variants */
  customVariants?: any;
  /** Custom transition settings */
  customTransition?: any;
  /** Whether to disable exit animations */
  disableExit?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Component that wraps page content with smooth transitions
 */
const PageTransition: React.FC<PageTransitionProps> = ({
  pageKey,
  children,
  direction = 'up',
  customVariants,
  customTransition,
  disableExit = false,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  // Select animation variants based on direction
  const getVariants = () => {
    if (customVariants) return customVariants;
    
    switch (direction) {
      case 'up':
        return ANIMATION_VARIANTS.SLIDE_UP;
      case 'down':
        return ANIMATION_VARIANTS.SLIDE_DOWN;
      case 'left':
        return ANIMATION_VARIANTS.SLIDE_LEFT;
      case 'right':
        return ANIMATION_VARIANTS.SLIDE_RIGHT;
      default:
        return ANIMATION_VARIANTS.FADE;
    }
  };
  
  // Get transition settings
  const getTransition = () => {
    return customTransition || TRANSITIONS.DEFAULT;
  };
  
  // Apply accessibility considerations
  const { variants, transition, animate } = getAccessibleAnimationProps(
    prefersReducedMotion,
    getVariants(),
    getTransition()
  );

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pageKey}
        initial="initial"
        animate={animate}
        exit={disableExit ? undefined : "exit"}
        variants={variants}
        transition={transition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;