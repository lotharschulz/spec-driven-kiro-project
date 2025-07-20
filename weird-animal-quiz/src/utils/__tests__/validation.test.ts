/**
 * Unit tests for validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  validateQuestionId,
  validateAnswerId,
  validateDifficulty,
  validateEmoji,
  validateAnswer,
  validateQuestion,
  sanitizeAndValidateQuestion,
  validateTime,
  validateQuizState
} from '../validation';
import type { Question, Answer, QuizState } from '../../types/quiz';
import { Difficulty } from '../../types/quiz';

describe('Validation Utilities', () => {
  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello  World');
    });

    it('should remove HTML tags', () => {
      const input = 'Hello <div>World</div>';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeInput(input);
      expect(result).toBe('alert("xss")');
    });

    it('should remove event handlers', () => {
      const input = 'onclick=alert("xss")';
      const result = sanitizeInput(input);
      expect(result).toBe('alert("xss")');
    });

    it('should remove dangerous data URLs', () => {
      const input = 'data:text/html,<script>alert("xss")</script>';
      const result = sanitizeInput(input);
      // The function removes both the data URL prefix and the script tags
      expect(result).toBe('');
    });

    it('should preserve image data URLs', () => {
      const input = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      const result = sanitizeInput(input);
      expect(result).toBe(input);
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });

    it('should handle non-string input', () => {
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
      expect(sanitizeInput(123 as any)).toBe('');
      expect(sanitizeInput({} as any)).toBe('');
    });

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });
  });

  describe('validateQuestionId', () => {
    it('should accept valid question IDs', () => {
      expect(validateQuestionId('easy-1')).toBe(true);
      expect(validateQuestionId('medium_2')).toBe(true);
      expect(validateQuestionId('hard123')).toBe(true);
      expect(validateQuestionId('question-id-with-hyphens')).toBe(true);
    });

    it('should reject invalid question IDs', () => {
      expect(validateQuestionId('')).toBe(false);
      expect(validateQuestionId('question with spaces')).toBe(false);
      expect(validateQuestionId('question@special')).toBe(false);
      expect(validateQuestionId('question.with.dots')).toBe(false);
      expect(validateQuestionId('a'.repeat(51))).toBe(false); // Too long
    });

    it('should handle non-string input', () => {
      expect(validateQuestionId(null as any)).toBe(false);
      expect(validateQuestionId(undefined as any)).toBe(false);
      expect(validateQuestionId(123 as any)).toBe(false);
    });
  });

  describe('validateAnswerId', () => {
    it('should accept valid answer IDs', () => {
      expect(validateAnswerId('a1')).toBe(true);
      expect(validateAnswerId('answer-1')).toBe(true);
      expect(validateAnswerId('ans_2')).toBe(true);
    });

    it('should reject invalid answer IDs', () => {
      expect(validateAnswerId('')).toBe(false);
      expect(validateAnswerId('answer with spaces')).toBe(false);
      expect(validateAnswerId('answer@special')).toBe(false);
      expect(validateAnswerId('a'.repeat(21))).toBe(false); // Too long
    });

    it('should handle non-string input', () => {
      expect(validateAnswerId(null as any)).toBe(false);
      expect(validateAnswerId(undefined as any)).toBe(false);
      expect(validateAnswerId(123 as any)).toBe(false);
    });
  });

  describe('validateDifficulty', () => {
    it('should accept valid difficulty levels', () => {
      expect(validateDifficulty('easy')).toBe(true);
      expect(validateDifficulty('medium')).toBe(true);
      expect(validateDifficulty('hard')).toBe(true);
    });

    it('should reject invalid difficulty levels', () => {
      expect(validateDifficulty('beginner')).toBe(false);
      expect(validateDifficulty('expert')).toBe(false);
      expect(validateDifficulty('')).toBe(false);
      expect(validateDifficulty('EASY')).toBe(false); // Case sensitive
    });
  });

  describe('validateEmoji', () => {
    it('should accept valid emojis', () => {
      expect(validateEmoji('🐨')).toBe(true);
      expect(validateEmoji('😴')).toBe(true);
      expect(validateEmoji('🦁')).toBe(true);
      expect(validateEmoji('🌟')).toBe(true);
    });

    it('should reject invalid emojis', () => {
      expect(validateEmoji('')).toBe(false);
      expect(validateEmoji('abc')).toBe(false);
      expect(validateEmoji('123')).toBe(false);
    });

    it('should handle non-string input', () => {
      expect(validateEmoji(null as any)).toBe(false);
      expect(validateEmoji(undefined as any)).toBe(false);
      expect(validateEmoji(123 as any)).toBe(false);
    });
  });

  describe('validateAnswer', () => {
    const validAnswer: Answer = {
      id: 'a1',
      text: 'Koala',
      isCorrect: true
    };

    it('should accept valid answer', () => {
      const result = validateAnswer(validAnswer);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject answer with invalid ID', () => {
      const invalidAnswer = { ...validAnswer, id: 'invalid id' };
      const result = validateAnswer(invalidAnswer);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Answer ID must be alphanumeric with hyphens/underscores, max 20 characters');
    });

    it('should reject answer with empty text', () => {
      const invalidAnswer = { ...validAnswer, text: '' };
      const result = validateAnswer(invalidAnswer);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Answer text is required and must be a non-empty string');
    });

    it('should reject answer with text too long', () => {
      const invalidAnswer = { ...validAnswer, text: 'a'.repeat(201) };
      const result = validateAnswer(invalidAnswer);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Answer text must be 200 characters or less');
    });

    it('should reject answer with non-boolean isCorrect', () => {
      const invalidAnswer = { ...validAnswer, isCorrect: 'true' as any };
      const result = validateAnswer(invalidAnswer);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Answer isCorrect must be a boolean');
    });

    it('should handle null/undefined answer', () => {
      const result = validateAnswer(null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Answer object is required');
    });
  });

  describe('validateQuestion', () => {
    const validQuestion: Question = {
      id: 'easy-1',
      difficulty: Difficulty.EASY,
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

    it('should accept valid question', () => {
      const result = validateQuestion(validQuestion);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject question with invalid ID', () => {
      const invalidQuestion = { ...validQuestion, id: 'invalid id' };
      const result = validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question ID must be alphanumeric with hyphens/underscores, max 50 characters');
    });

    it('should reject question with invalid difficulty', () => {
      const invalidQuestion = { ...validQuestion, difficulty: 'beginner' as any };
      const result = validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question difficulty must be easy, medium, or hard');
    });

    it('should reject question with empty text', () => {
      const invalidQuestion = { ...validQuestion, text: '' };
      const result = validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question text is required and must be a non-empty string');
    });

    it('should reject question with text too long', () => {
      const invalidQuestion = { ...validQuestion, text: 'a'.repeat(501) };
      const result = validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question text must be 500 characters or less');
    });

    it('should reject question with insufficient emojis', () => {
      const invalidQuestion = { ...validQuestion, emojis: ['🐨'] };
      const result = validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question must have at least 2 emojis');
    });

    it('should reject question with wrong number of answers', () => {
      const invalidQuestion = { 
        ...validQuestion, 
        answers: validQuestion.answers.slice(0, 3) 
      };
      const result = validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question must have exactly 4 answers');
    });

    it('should reject question with no correct answer', () => {
      const invalidQuestion = { 
        ...validQuestion, 
        answers: validQuestion.answers.map(a => ({ ...a, isCorrect: false }))
      };
      const result = validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question must have exactly one correct answer');
    });

    it('should reject question with multiple correct answers', () => {
      const invalidQuestion = { 
        ...validQuestion, 
        answers: validQuestion.answers.map(a => ({ ...a, isCorrect: true }))
      };
      const result = validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question must have exactly one correct answer');
    });

    it('should reject question with empty explanation', () => {
      const invalidQuestion = { ...validQuestion, explanation: '' };
      const result = validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question explanation is required and must be a non-empty string');
    });

    it('should reject question with explanation too long', () => {
      const invalidQuestion = { ...validQuestion, explanation: 'a'.repeat(1001) };
      const result = validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question explanation must be 1000 characters or less');
    });

    it('should reject question with empty funFact', () => {
      const invalidQuestion = { ...validQuestion, funFact: '' };
      const result = validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question funFact is required and must be a non-empty string');
    });

    it('should reject question with funFact too long', () => {
      const invalidQuestion = { ...validQuestion, funFact: 'a'.repeat(501) };
      const result = validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question funFact must be 500 characters or less');
    });

    it('should reject question with empty category', () => {
      const invalidQuestion = { ...validQuestion, category: '' };
      const result = validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question category is required and must be a non-empty string');
    });

    it('should reject question with category too long', () => {
      const invalidQuestion = { ...validQuestion, category: 'a'.repeat(51) };
      const result = validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question category must be 50 characters or less');
    });

    it('should handle null/undefined question', () => {
      const result = validateQuestion(null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question object is required');
    });
  });

  describe('sanitizeAndValidateQuestion', () => {
    it('should sanitize and validate question', () => {
      const questionWithXSS: Question = {
        id: 'easy-1<script>alert("xss")</script>',
        difficulty: Difficulty.EASY,
        text: 'Which animal <script>alert("xss")</script> can sleep?',
        emojis: ['🐨', '😴'],
        answers: [
          { id: 'a1<script>', text: 'Koala<script>alert("xss")</script>', isCorrect: true },
          { id: 'a2', text: 'Sloth', isCorrect: false },
          { id: 'a3', text: 'Panda', isCorrect: false },
          { id: 'a4', text: 'Cat', isCorrect: false }
        ],
        explanation: 'Koalas sleep <script>alert("xss")</script> 18-22 hours daily.',
        funFact: 'Koalas have <script>alert("xss")</script> fingerprints!',
        category: 'behavior<script>alert("xss")</script>'
      };

      const result = sanitizeAndValidateQuestion(questionWithXSS);
      
      expect(result.sanitizedQuestion.id).toBe('easy-1');
      expect(result.sanitizedQuestion.text).toBe('Which animal  can sleep?');
      expect(result.sanitizedQuestion.answers[0].id).toBe('a1');
      expect(result.sanitizedQuestion.answers[0].text).toBe('Koala');
      expect(result.sanitizedQuestion.explanation).toBe('Koalas sleep  18-22 hours daily.');
      expect(result.sanitizedQuestion.funFact).toBe('Koalas have  fingerprints!');
      expect(result.sanitizedQuestion.category).toBe('behavior');
    });
  });

  describe('validateTime', () => {
    it('should accept valid time values', () => {
      expect(validateTime(0)).toBe(true);
      expect(validateTime(30)).toBe(true);
      expect(validateTime(3600)).toBe(true); // 1 hour
    });

    it('should reject invalid time values', () => {
      expect(validateTime(-1)).toBe(false);
      expect(validateTime(3601)).toBe(false); // Over 1 hour
      expect(validateTime('30' as any)).toBe(false);
      expect(validateTime(null as any)).toBe(false);
      expect(validateTime(undefined as any)).toBe(false);
    });
  });

  describe('validateQuizState', () => {
    const validQuizState: QuizState = {
      currentQuestionIndex: 0,
      questions: new Array(9).fill(null).map((_, i) => ({
        id: `q${i}`,
        difficulty: Difficulty.EASY,
        text: `Question ${i}`,
        emojis: ['🐨', '😴'],
        answers: [
          { id: 'a1', text: 'Answer 1', isCorrect: true },
          { id: 'a2', text: 'Answer 2', isCorrect: false },
          { id: 'a3', text: 'Answer 3', isCorrect: false },
          { id: 'a4', text: 'Answer 4', isCorrect: false }
        ],
        explanation: 'Explanation',
        funFact: 'Fun fact',
        category: 'category'
      })),
      userAnswers: [],
      timeRemaining: 30,
      hintsUsed: [],
      quizStartTime: new Date(),
      isComplete: false,
      isPaused: false
    };

    it('should accept valid quiz state', () => {
      const result = validateQuizState(validQuizState);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject quiz state with negative question index', () => {
      const invalidState = { ...validQuizState, currentQuestionIndex: -1 };
      const result = validateQuizState(invalidState);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Current question index must be a non-negative number');
    });

    it('should reject quiz state with wrong number of questions', () => {
      const invalidState = { ...validQuizState, questions: [] };
      const result = validateQuizState(invalidState);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Quiz must have exactly 9 questions');
    });

    it('should reject quiz state with invalid time remaining', () => {
      const invalidState = { ...validQuizState, timeRemaining: -1 };
      const result = validateQuizState(invalidState);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Time remaining must be a valid time value');
    });

    it('should reject quiz state with invalid start time', () => {
      const invalidState = { ...validQuizState, quizStartTime: 'invalid date' as any };
      const result = validateQuizState(invalidState);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Quiz start time must be a valid Date');
    });

    it('should reject quiz state with invalid boolean flags', () => {
      const invalidState = { 
        ...validQuizState, 
        isComplete: 'false' as any,
        isPaused: 'true' as any
      };
      const result = validateQuizState(invalidState);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('isComplete must be a boolean');
      expect(result.errors).toContain('isPaused must be a boolean');
    });

    it('should handle null/undefined quiz state', () => {
      const result = validateQuizState(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Quiz state is required');
    });
  });
});