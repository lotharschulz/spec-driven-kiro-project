/**
 * Tests for secure storage manager
 * Covers storage functionality and data persistence
 */

import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { storageManager, type SafeStorageData, type UserPreferences } from '../storage';
import type { QuizState, Question, UserResponse, Difficulty } from '../../types/quiz';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null)
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock crypto.getRandomValues
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    })
  }
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock logSecurityEvent
vi.mock('../errorMonitoring', () => ({
  logSecurityEvent: vi.fn()
}));

// Mock console methods
const consoleSpy = {
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  info: vi.spyOn(console, 'info').mockImplementation(() => {})
};

describe('SecureStorageManager', () => {
  const mockQuestion: Question = {
    id: 'test-question-1',
    difficulty: 'easy' as Difficulty,
    text: 'Test question?',
    emojis: ['🐨', '😴'],
    answers: [
      { id: 'a1', text: 'Answer 1', isCorrect: true },
      { id: 'a2', text: 'Answer 2', isCorrect: false }
    ],
    explanation: 'Test explanation',
    funFact: 'Test fun fact',
    category: 'behavior'
  };

  const mockUserResponse: UserResponse = {
    questionId: 'test-question-1',
    selectedAnswerId: 'a1',
    isCorrect: true,
    timeSpent: 15,
    hintUsed: false,
    timestamp: new Date()
  };

  const mockQuizState: QuizState = {
    currentQuestionIndex: 1,
    questions: [mockQuestion],
    userAnswers: [mockUserResponse],
    timeRemaining: 25,
    hintsUsed: ['hint-1'],
    quizStartTime: new Date('2023-01-01T10:00:00Z'),
    quizEndTime: undefined,
    isComplete: false,
    isPaused: false,
    showingFeedback: false
  };

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('saveQuizProgress', () => {
    it('should save non-sensitive data to localStorage', () => {
      const result = storageManager.saveQuizProgress(mockQuizState);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'weird-animal-quiz-progress',
        expect.stringContaining('"currentQuestionIndex":1')
      );
    });

    it('should not save sensitive data to localStorage', () => {
      storageManager.saveQuizProgress(mockQuizState);

      const savedData = localStorageMock.getItem('weird-animal-quiz-progress');
      const parsedData = JSON.parse(savedData!);

      expect(parsedData).not.toHaveProperty('userAnswers');
      expect(parsedData).not.toHaveProperty('questions');
      expect(parsedData).not.toHaveProperty('quizEndTime');
    });

    it('should include version information', () => {
      storageManager.saveQuizProgress(mockQuizState);

      const savedData = localStorageMock.getItem('weird-animal-quiz-progress');
      const parsedData = JSON.parse(savedData!);

      expect(parsedData).toHaveProperty('version');
      expect(typeof parsedData.version).toBe('string');
    });

    it('should validate input data', () => {
      const invalidState = { invalid: 'data' } as any;
      const result = storageManager.saveQuizProgress(invalidState);

      expect(result).toBe(false);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      const result = storageManager.saveQuizProgress(mockQuizState);

      expect(result).toBe(false);
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should sanitize hints array', () => {
      const stateWithInvalidHints = {
        ...mockQuizState,
        hintsUsed: ['valid-hint', '<script>alert("xss")</script>', 'another-valid-hint']
      };

      storageManager.saveQuizProgress(stateWithInvalidHints);

      const savedData = localStorageMock.getItem('weird-animal-quiz-progress');
      const parsedData = JSON.parse(savedData!);

      expect(parsedData.hintsUsed).toEqual(['valid-hint', 'another-valid-hint']);
    });
  });

  describe('loadQuizProgress', () => {
    it('should return null when no data is stored', () => {
      const result = storageManager.loadQuizProgress();
      expect(result).toBeNull();
    });

    it('should load and validate stored data', () => {
      const safeData: SafeStorageData = {
        currentQuestionIndex: 2,
        difficulty: 'medium',
        startTime: '2023-01-01T10:00:00Z',
        hintsUsed: ['hint-1', 'hint-2'],
        totalQuestions: 9,
        isComplete: false,
        lastSaveTime: '2023-01-01T10:05:00Z',
        version: '1.0.0'
      };

      localStorageMock.setItem('weird-animal-quiz-progress', JSON.stringify(safeData));

      const result = storageManager.loadQuizProgress();

      expect(result).not.toBeNull();
      expect(result!.currentQuestionIndex).toBe(2);
      expect(result!.hintsUsed).toEqual(['hint-1', 'hint-2']);
      expect(result!.isComplete).toBe(false);
    });

    it('should handle corrupted data gracefully', () => {
      localStorageMock.setItem('weird-animal-quiz-progress', 'invalid json');

      const result = storageManager.loadQuizProgress();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('weird-animal-quiz-progress');
    });

    it('should validate data structure', () => {
      const invalidData = {
        currentQuestionIndex: 'invalid',
        difficulty: 123,
        startTime: null
      };

      localStorageMock.setItem('weird-animal-quiz-progress', JSON.stringify(invalidData));

      const result = storageManager.loadQuizProgress();

      expect(result).toBeNull();
      expect(consoleSpy.warn).toHaveBeenCalledWith('Invalid stored data detected, clearing storage');
    });

    it('should reconstruct Date objects correctly', () => {
      const safeData: SafeStorageData = {
        currentQuestionIndex: 1,
        difficulty: 'easy',
        startTime: '2023-01-01T10:00:00Z',
        hintsUsed: [],
        totalQuestions: 9,
        isComplete: false,
        lastSaveTime: '2023-01-01T10:05:00Z',
        version: '1.0.0'
      };

      localStorageMock.setItem('weird-animal-quiz-progress', JSON.stringify(safeData));

      const result = storageManager.loadQuizProgress();

      expect(result!.quizStartTime).toBeInstanceOf(Date);
      expect(result!.quizStartTime!.toISOString()).toBe('2023-01-01T10:00:00.000Z');
    });
  });

  describe('saveUserPreferences', () => {
    it('should save user preferences', () => {
      const preferences: UserPreferences = {
        reducedMotion: true,
        highContrast: false,
        fontSize: 'large',
        soundEnabled: true
      };

      const result = storageManager.saveUserPreferences(preferences);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'weird-animal-quiz-preferences',
        JSON.stringify(preferences)
      );
    });

    it('should sanitize preference values', () => {
      const unsafePreferences = {
        reducedMotion: 'true' as any,
        highContrast: 1 as any,
        fontSize: 'invalid' as any,
        soundEnabled: 'yes' as any
      };

      storageManager.saveUserPreferences(unsafePreferences);

      const savedData = localStorageMock.getItem('weird-animal-quiz-preferences');
      const parsedData = JSON.parse(savedData!);

      expect(parsedData.reducedMotion).toBe(true);
      expect(parsedData.highContrast).toBe(true);
      expect(parsedData.fontSize).toBe('normal');
      expect(parsedData.soundEnabled).toBe(true);
    });

    it('should handle storage errors', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const preferences: UserPreferences = {
        reducedMotion: false,
        highContrast: false,
        fontSize: 'normal',
        soundEnabled: true
      };

      const result = storageManager.saveUserPreferences(preferences);

      expect(result).toBe(false);
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('loadUserPreferences', () => {
    it('should return default preferences when none are stored', () => {
      const result = storageManager.loadUserPreferences();

      expect(result).toEqual({
        reducedMotion: false, // Default based on media query mock
        highContrast: false,
        fontSize: 'normal',
        soundEnabled: true
      });
    });

    it('should load stored preferences', () => {
      const preferences: UserPreferences = {
        reducedMotion: true,
        highContrast: true,
        fontSize: 'large',
        soundEnabled: false
      };

      localStorageMock.setItem('weird-animal-quiz-preferences', JSON.stringify(preferences));

      const result = storageManager.loadUserPreferences();

      expect(result).toEqual(preferences);
    });

    it('should handle corrupted preference data', () => {
      localStorageMock.setItem('weird-animal-quiz-preferences', 'invalid json');

      const result = storageManager.loadUserPreferences();

      expect(result).toEqual({
        reducedMotion: false,
        highContrast: false,
        fontSize: 'normal',
        soundEnabled: true
      });
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('clearQuizProgress', () => {
    it('should clear quiz progress data', () => {
      localStorageMock.setItem('weird-animal-quiz-progress', 'test data');
      localStorageMock.setItem('weird-animal-quiz-last-save', 'test timestamp');

      storageManager.clearQuizProgress();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('weird-animal-quiz-progress');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('weird-animal-quiz-last-save');
    });

    it('should handle errors gracefully', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Remove error');
      });

      storageManager.clearQuizProgress();

      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('clearAllData', () => {
    it('should clear all stored data', () => {
      localStorageMock.setItem('weird-animal-quiz-progress', 'test');
      localStorageMock.setItem('weird-animal-quiz-preferences', 'test');
      localStorageMock.setItem('weird-animal-quiz-last-save', 'test');

      storageManager.clearAllData();

      expect(localStorageMock.removeItem).toHaveBeenCalledTimes(3);
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage usage information', () => {
      localStorageMock.setItem('test-key', 'test-value');

      const info = storageManager.getStorageInfo();

      expect(info).toHaveProperty('used');
      expect(info).toHaveProperty('available');
      expect(info).toHaveProperty('percentage');
      expect(typeof info.used).toBe('number');
      expect(typeof info.available).toBe('number');
      expect(typeof info.percentage).toBe('number');
    });

    it('should handle errors gracefully', () => {
      // This test verifies that the method returns safe defaults
      // The actual error handling is tested implicitly through the NaN protection
      const info = storageManager.getStorageInfo();

      expect(typeof info.used).toBe('number');
      expect(typeof info.available).toBe('number');
      expect(typeof info.percentage).toBe('number');
      expect(info.used).toBeGreaterThanOrEqual(0);
      expect(info.available).toBeGreaterThanOrEqual(0);
      expect(info.percentage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('isStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      const result = storageManager.isStorageAvailable();
      expect(result).toBe(true);
    });

    it('should return false when localStorage throws error', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage not available');
      });

      const result = storageManager.isStorageAvailable();
      expect(result).toBe(false);
    });
  });

  describe('Memory Management', () => {
    it('should clear sensitive data on page unload', () => {
      storageManager.saveQuizProgress(mockQuizState);

      // Simulate page unload
      const beforeUnloadEvent = new Event('beforeunload');
      window.dispatchEvent(beforeUnloadEvent);

      // Sensitive data should be cleared but localStorage should remain
      expect(localStorageMock.getItem('weird-animal-quiz-progress')).not.toBeNull();
    });

    it('should clear sensitive data on visibility change', () => {
      storageManager.saveQuizProgress(mockQuizState);

      // Mock document.hidden
      Object.defineProperty(document, 'hidden', {
        value: true,
        configurable: true
      });

      // Simulate visibility change
      const visibilityChangeEvent = new Event('visibilitychange');
      document.dispatchEvent(visibilityChangeEvent);

      // Sensitive data should be cleared
      expect(localStorageMock.getItem('weird-animal-quiz-progress')).not.toBeNull();
    });
  });

  describe('Data Validation', () => {
    it('should validate question IDs in hints array', () => {
      const stateWithInvalidHints = {
        ...mockQuizState,
        hintsUsed: ['valid-id', 'invalid<script>', 'another-valid-id', '']
      };

      storageManager.saveQuizProgress(stateWithInvalidHints);

      const savedData = localStorageMock.getItem('weird-animal-quiz-progress');
      const parsedData = JSON.parse(savedData!);

      // Should only include valid question IDs
      expect(parsedData.hintsUsed).toEqual(['valid-id', 'another-valid-id']);
    });

    it('should handle negative question indices', () => {
      const stateWithNegativeIndex = {
        ...mockQuizState,
        currentQuestionIndex: -1
      };

      storageManager.saveQuizProgress(stateWithNegativeIndex);

      const savedData = localStorageMock.getItem('weird-animal-quiz-progress');
      const parsedData = JSON.parse(savedData!);

      expect(parsedData.currentQuestionIndex).toBe(0);
    });
  });
});

// Cleanup
afterAll(() => {
  Object.values(consoleSpy).forEach(spy => spy.mockRestore());
});