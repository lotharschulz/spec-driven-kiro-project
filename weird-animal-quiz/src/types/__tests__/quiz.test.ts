/**
 * Unit tests for quiz data models and types
 */

import { Difficulty, ErrorType } from '../quiz';

describe('Quiz Types', () => {
  describe('Difficulty enum', () => {
    it('should have correct values', () => {
      expect(Difficulty.EASY).toBe('easy');
      expect(Difficulty.MEDIUM).toBe('medium');
      expect(Difficulty.HARD).toBe('hard');
    });

    it('should contain all expected difficulty levels', () => {
      const values = Object.values(Difficulty);
      expect(values).toHaveLength(3);
      expect(values).toContain('easy');
      expect(values).toContain('medium');
      expect(values).toContain('hard');
    });
  });

  describe('ErrorType enum', () => {
    it('should have correct values', () => {
      expect(ErrorType.TIMER_ERROR).toBe('TIMER_ERROR');
      expect(ErrorType.STATE_ERROR).toBe('STATE_ERROR');
      expect(ErrorType.STORAGE_ERROR).toBe('STORAGE_ERROR');
      expect(ErrorType.ANIMATION_ERROR).toBe('ANIMATION_ERROR');
      expect(ErrorType.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorType.NETWORK_ERROR).toBe('NETWORK_ERROR');
    });

    it('should contain all expected error types', () => {
      const values = Object.values(ErrorType);
      expect(values).toHaveLength(6);
      expect(values).toContain('TIMER_ERROR');
      expect(values).toContain('STATE_ERROR');
      expect(values).toContain('STORAGE_ERROR');
      expect(values).toContain('ANIMATION_ERROR');
      expect(values).toContain('VALIDATION_ERROR');
      expect(values).toContain('NETWORK_ERROR');
    });
  });
});