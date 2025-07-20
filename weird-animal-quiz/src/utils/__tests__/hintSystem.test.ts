/**
 * Hint System Tests
 * Tests for hint generation, validation, and utility functions
 * Requirements: 3.1, 3.2
 */

import { vi } from 'vitest';
import { 
  generateHint, 
  HintType, 
  isHintUsed, 
  validateHintResult,
  type HintResult 
} from '../hintSystem';
import type { Question, Difficulty } from '../../types/quiz';

// Mock question data for testing
const mockQuestion: Question = {
  id: 'test-question-1',
  difficulty: 'medium' as Difficulty,
  text: 'Which animal can sleep for up to 22 hours a day?',
  emojis: ['🐨', '😴'],
  answers: [
    { id: 'a1', text: 'Koala', isCorrect: true },
    { id: 'a2', text: 'Sloth', isCorrect: false },
    { id: 'a3', text: 'Panda', isCorrect: false },
    { id: 'a4', text: 'Cat', isCorrect: false }
  ],
  explanation: 'Koalas sleep 18-22 hours daily to conserve energy for digesting eucalyptus leaves.',
  funFact: 'Koalas have fingerprints almost identical to humans!',
  category: 'behavior'
};

const mockQuestionWithOneWrongAnswer: Question = {
  ...mockQuestion,
  id: 'test-question-2',
  answers: [
    { id: 'a1', text: 'Correct Answer', isCorrect: true },
    { id: 'a2', text: 'Wrong Answer', isCorrect: false }
  ]
};

describe('generateHint', () => {
  beforeEach(() => {
    // Reset random seed for consistent testing
    vi.spyOn(Math, 'random').mockRestore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate a hint with valid structure', () => {
    const hint = generateHint(mockQuestion);
    
    expect(hint).toHaveProperty('type');
    expect(hint).toHaveProperty('message');
    expect(hint.type).toMatch(/^(eliminate_wrong_answer|provide_clue)$/);
    expect(hint.message).toBeTruthy();
    expect(typeof hint.message).toBe('string');
  });

  it('should generate eliminate wrong answer hint when random < 0.5', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    
    const hint = generateHint(mockQuestion);
    
    expect(hint.type).toBe(HintType.ELIMINATE_WRONG_ANSWER);
    expect(hint.eliminatedAnswerId).toBeTruthy();
    expect(hint.message).toContain('eliminated');
    
    // Verify eliminated answer is actually wrong
    const eliminatedAnswer = mockQuestion.answers.find(a => a.id === hint.eliminatedAnswerId);
    expect(eliminatedAnswer).toBeTruthy();
    expect(eliminatedAnswer!.isCorrect).toBe(false);
  });

  it('should generate provide clue hint when random >= 0.5', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    
    const hint = generateHint(mockQuestion);
    
    expect(hint.type).toBe(HintType.PROVIDE_CLUE);
    expect(hint.clue).toBeTruthy();
    expect(hint.message).toContain('clue');
    expect(typeof hint.clue).toBe('string');
  });

  it('should fallback to clue when no wrong answers available', () => {
    const questionWithNoWrongAnswers: Question = {
      ...mockQuestion,
      answers: [{ id: 'a1', text: 'Only Answer', isCorrect: true }]
    };
    
    vi.spyOn(Math, 'random').mockReturnValue(0.3); // Should trigger eliminate, but will fallback
    
    const hint = generateHint(questionWithNoWrongAnswers);
    
    expect(hint.type).toBe(HintType.PROVIDE_CLUE);
    expect(hint.clue).toBeTruthy();
  });

  it('should eliminate different wrong answers on multiple calls', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.3) // First call - eliminate
      .mockReturnValueOnce(0.5) // Random selection of wrong answer
      .mockReturnValueOnce(0.3) // Second call - eliminate  
      .mockReturnValueOnce(0.8); // Different random selection
    
    const hint1 = generateHint(mockQuestion);
    const hint2 = generateHint(mockQuestion);
    
    expect(hint1.type).toBe(HintType.ELIMINATE_WRONG_ANSWER);
    expect(hint2.type).toBe(HintType.ELIMINATE_WRONG_ANSWER);
    
    // Both should eliminate wrong answers, but they might be different
    const wrongAnswerIds = mockQuestion.answers
      .filter(a => !a.isCorrect)
      .map(a => a.id);
    
    expect(wrongAnswerIds).toContain(hint1.eliminatedAnswerId);
    expect(wrongAnswerIds).toContain(hint2.eliminatedAnswerId);
  });
});

describe('hint clue generation', () => {
  it('should generate sleep-related clue for sleep questions', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    
    const hint = generateHint(mockQuestion);
    
    expect(hint.type).toBe(HintType.PROVIDE_CLUE);
    expect(hint.clue).toContain('sleepy');
  });

  it('should generate speed-related clue for speed questions', () => {
    const speedQuestion: Question = {
      ...mockQuestion,
      text: 'Which animal can run at speeds up to 70 mph?',
      category: 'speed'
    };
    
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    
    const hint = generateHint(speedQuestion);
    
    expect(hint.type).toBe(HintType.PROVIDE_CLUE);
    expect(hint.clue).toContain('body structure');
  });

  it('should generate heart-related clue for heart questions', () => {
    const heartQuestion: Question = {
      ...mockQuestion,
      text: 'Which animal has the fastest heart beats per minute?',
      category: 'physiology'
    };
    
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    
    const hint = generateHint(heartQuestion);
    
    expect(hint.type).toBe(HintType.PROVIDE_CLUE);
    expect(hint.clue).toContain('heart rates');
  });

  it('should generate category-based clue for behavior category', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    
    const hint = generateHint(mockQuestion);
    
    expect(hint.type).toBe(HintType.PROVIDE_CLUE);
    expect(hint.clue).toMatch(/sleepy|habits|behaviors/i);
  });

  it('should generate default clue for unrecognized patterns', () => {
    const genericQuestion: Question = {
      ...mockQuestion,
      text: 'What is the most unusual thing about this animal?',
      category: 'general'
    };
    
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    
    const hint = generateHint(genericQuestion);
    
    expect(hint.type).toBe(HintType.PROVIDE_CLUE);
    expect(hint.clue).toContain('unique');
  });
});

describe('isHintUsed', () => {
  it('should return true when hint is used for question', () => {
    const hintsUsed = ['question-1', 'question-2', 'question-3'];
    
    expect(isHintUsed('question-2', hintsUsed)).toBe(true);
  });

  it('should return false when hint is not used for question', () => {
    const hintsUsed = ['question-1', 'question-3'];
    
    expect(isHintUsed('question-2', hintsUsed)).toBe(false);
  });

  it('should return false for empty hints array', () => {
    expect(isHintUsed('question-1', [])).toBe(false);
  });

  it('should handle case-sensitive question IDs', () => {
    const hintsUsed = ['Question-1'];
    
    expect(isHintUsed('question-1', hintsUsed)).toBe(false);
    expect(isHintUsed('Question-1', hintsUsed)).toBe(true);
  });
});

describe('validateHintResult', () => {
  it('should validate eliminate wrong answer hint correctly', () => {
    const validHint: HintResult = {
      type: HintType.ELIMINATE_WRONG_ANSWER,
      eliminatedAnswerId: 'a2',
      message: 'One wrong answer eliminated!'
    };
    
    expect(validateHintResult(validHint, mockQuestion)).toBe(true);
  });

  it('should reject eliminate hint without eliminatedAnswerId', () => {
    const invalidHint: HintResult = {
      type: HintType.ELIMINATE_WRONG_ANSWER,
      message: 'One wrong answer eliminated!'
    };
    
    expect(validateHintResult(invalidHint, mockQuestion)).toBe(false);
  });

  it('should reject eliminate hint with non-existent answer ID', () => {
    const invalidHint: HintResult = {
      type: HintType.ELIMINATE_WRONG_ANSWER,
      eliminatedAnswerId: 'non-existent',
      message: 'One wrong answer eliminated!'
    };
    
    expect(validateHintResult(invalidHint, mockQuestion)).toBe(false);
  });

  it('should reject eliminate hint that targets correct answer', () => {
    const invalidHint: HintResult = {
      type: HintType.ELIMINATE_WRONG_ANSWER,
      eliminatedAnswerId: 'a1', // This is the correct answer
      message: 'One wrong answer eliminated!'
    };
    
    expect(validateHintResult(invalidHint, mockQuestion)).toBe(false);
  });

  it('should validate provide clue hint correctly', () => {
    const validHint: HintResult = {
      type: HintType.PROVIDE_CLUE,
      clue: 'Think about animals that sleep a lot.',
      message: 'Here is a helpful clue!'
    };
    
    expect(validateHintResult(validHint, mockQuestion)).toBe(true);
  });

  it('should reject provide clue hint without clue', () => {
    const invalidHint: HintResult = {
      type: HintType.PROVIDE_CLUE,
      message: 'Here is a helpful clue!'
    };
    
    expect(validateHintResult(invalidHint, mockQuestion)).toBe(false);
  });

  it('should reject provide clue hint with empty clue', () => {
    const invalidHint: HintResult = {
      type: HintType.PROVIDE_CLUE,
      clue: '',
      message: 'Here is a helpful clue!'
    };
    
    expect(validateHintResult(invalidHint, mockQuestion)).toBe(false);
  });

  it('should reject hint without message', () => {
    const invalidHint: HintResult = {
      type: HintType.PROVIDE_CLUE,
      clue: 'Think about sleepy animals.',
      message: ''
    };
    
    expect(validateHintResult(invalidHint, mockQuestion)).toBe(false);
  });

  it('should reject hint with invalid type', () => {
    const invalidHint = {
      type: 'invalid_type' as HintType,
      message: 'Some message'
    };
    
    expect(validateHintResult(invalidHint, mockQuestion)).toBe(false);
  });
});

describe('hint system integration', () => {
  it('should generate valid hints that pass validation', () => {
    // Test multiple generations to ensure consistency
    for (let i = 0; i < 10; i++) {
      const hint = generateHint(mockQuestion);
      expect(validateHintResult(hint, mockQuestion)).toBe(true);
    }
  });

  it('should handle edge case with minimal wrong answers', () => {
    const hint = generateHint(mockQuestionWithOneWrongAnswer);
    expect(validateHintResult(hint, mockQuestionWithOneWrongAnswer)).toBe(true);
    
    if (hint.type === HintType.ELIMINATE_WRONG_ANSWER) {
      expect(hint.eliminatedAnswerId).toBe('a2');
    }
  });

  it('should maintain hint consistency for same question', () => {
    // Mock random to ensure same path
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    
    const hint1 = generateHint(mockQuestion);
    
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    
    const hint2 = generateHint(mockQuestion);
    
    expect(hint1.type).toBe(hint2.type);
    expect(hint1.message).toBe(hint2.message);
  });
});