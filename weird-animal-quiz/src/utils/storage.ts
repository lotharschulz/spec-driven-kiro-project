/**
 * Secure Storage Manager for Quiz Progress Persistence
 * Implements requirements: 5.3, 6.12
 * 
 * This module provides secure storage functionality that:
 * - Stores only non-sensitive data in localStorage
 * - Keeps sensitive data in memory only
 * - Implements auto-save functionality
 * - Provides data cleanup and memory management
 */

import type { QuizState, Question, UserResponse } from '../types/quiz';
import { validateQuestionId } from './validation';
// import { logSecurityEvent } from './errorMonitoring';

// Storage keys
const STORAGE_KEYS = {
  QUIZ_PROGRESS: 'weird-animal-quiz-progress',
  USER_PREFERENCES: 'weird-animal-quiz-preferences',
  LAST_SAVE: 'weird-animal-quiz-last-save'
} as const;

// Non-sensitive data that can be stored in localStorage
export interface SafeStorageData {
  currentQuestionIndex: number;
  difficulty: string;
  startTime: string;
  hintsUsed: string[];
  totalQuestions: number;
  isComplete: boolean;
  lastSaveTime: string;
  version: string; // For data migration
}

// User preferences (non-sensitive)
export interface UserPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large';
  soundEnabled: boolean;
}

// Sensitive data kept in memory only
interface SensitiveData {
  userAnswers: UserResponse[];
  questions: Question[];
  quizEndTime?: Date;
  sessionId: string;
}

class SecureStorageManager {
  private sensitiveData: Map<string, SensitiveData> = new Map();
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private readonly AUTO_SAVE_INTERVAL = 10000; // 10 seconds
  private readonly STORAGE_VERSION = '1.0.0';

  constructor() {
    this.setupCleanup();
    this.startAutoSave();
  }

  /**
   * Save quiz progress to localStorage (non-sensitive data only)
   */
  saveQuizProgress(state: QuizState): boolean {
    try {
      // Validate input data
      if (!this.validateQuizState(state)) {
        logSecurityEvent({
          type: 'INVALID_INPUT',
          timestamp: new Date(),
          details: 'Invalid quiz state provided to saveQuizProgress'
        });
        return false;
      }

      // Prepare safe data for localStorage
      const safeData: SafeStorageData = {
        currentQuestionIndex: Math.max(0, state.currentQuestionIndex),
        difficulty: this.extractDifficulty(state),
        startTime: state.quizStartTime.toISOString(),
        hintsUsed: state.hintsUsed.filter(id => validateQuestionId(id)),
        totalQuestions: state.questions.length,
        isComplete: state.isComplete,
        lastSaveTime: new Date().toISOString(),
        version: this.STORAGE_VERSION
      };

      // Store non-sensitive data in localStorage
      localStorage.setItem(STORAGE_KEYS.QUIZ_PROGRESS, JSON.stringify(safeData));

      // Store sensitive data in memory with session ID
      const sessionId = this.generateSessionId();
      const sensitiveData: SensitiveData = {
        userAnswers: state.userAnswers,
        questions: state.questions,
        quizEndTime: state.quizEndTime,
        sessionId
      };

      this.sensitiveData.set('current', sensitiveData);

      return true;
    } catch (error) {
      console.error('Failed to save quiz progress:', error);
      logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        timestamp: new Date(),
        details: `Storage error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      return false;
    }
  }

  /**
   * Load quiz progress from storage
   */
  loadQuizProgress(): Partial<QuizState> | null {
    try {
      // Load non-sensitive data from localStorage
      const storedData = localStorage.getItem(STORAGE_KEYS.QUIZ_PROGRESS);
      if (!storedData) {
        return null;
      }

      const safeData: SafeStorageData = JSON.parse(storedData);

      // Validate stored data
      if (!this.validateSafeStorageData(safeData)) {
        console.warn('Invalid stored data detected, clearing storage');
        this.clearQuizProgress();
        return null;
      }

      // Check data version for migration
      if (safeData.version !== this.STORAGE_VERSION) {
        console.info('Storage version mismatch, migrating data');
        // Future: implement data migration logic
      }

      // Load sensitive data from memory
      const sensitiveData = this.sensitiveData.get('current');

      // Reconstruct partial quiz state
      const partialState: Partial<QuizState> = {
        currentQuestionIndex: safeData.currentQuestionIndex,
        hintsUsed: safeData.hintsUsed,
        quizStartTime: new Date(safeData.startTime),
        isComplete: safeData.isComplete,
        // Sensitive data from memory (may be null if app was restarted)
        userAnswers: sensitiveData?.userAnswers || [],
        questions: sensitiveData?.questions || [],
        quizEndTime: sensitiveData?.quizEndTime
      };

      return partialState;
    } catch (error) {
      console.error('Failed to load quiz progress:', error);
      this.clearQuizProgress(); // Clear corrupted data
      return null;
    }
  }

  /**
   * Save user preferences
   */
  saveUserPreferences(preferences: UserPreferences): boolean {
    try {
      // Sanitize preference values
      const safePreferences = {
        reducedMotion: Boolean(preferences.reducedMotion),
        highContrast: Boolean(preferences.highContrast),
        fontSize: ['normal', 'large'].includes(preferences.fontSize) ? preferences.fontSize : 'normal',
        soundEnabled: Boolean(preferences.soundEnabled)
      };

      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(safePreferences));
      return true;
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      return false;
    }
  }

  /**
   * Load user preferences
   */
  loadUserPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (!stored) {
        return this.getDefaultPreferences();
      }

      const preferences = JSON.parse(stored);
      return {
        reducedMotion: Boolean(preferences.reducedMotion),
        highContrast: Boolean(preferences.highContrast),
        fontSize: ['normal', 'large'].includes(preferences.fontSize) ? preferences.fontSize : 'normal',
        soundEnabled: Boolean(preferences.soundEnabled)
      };
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Clear all quiz progress data
   */
  clearQuizProgress(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.QUIZ_PROGRESS);
      localStorage.removeItem(STORAGE_KEYS.LAST_SAVE);
      this.sensitiveData.clear();
    } catch (error) {
      console.error('Failed to clear quiz progress:', error);
    }
  }

  /**
   * Clear all stored data (including preferences)
   */
  clearAllData(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      this.sensitiveData.clear();
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      let used = 0;
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Estimate available space (most browsers have 5-10MB limit)
      const estimated = 5 * 1024 * 1024; // 5MB estimate
      const available = Math.max(0, estimated - used);
      const percentage = (used / estimated) * 100;

      return { 
        used: isNaN(used) ? 0 : used, 
        available: isNaN(available) ? 0 : available, 
        percentage: isNaN(percentage) ? 0 : percentage 
      };
    } catch {
      console.error('Failed to get storage info');
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Check if storage is available
   */
  isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Start auto-save functionality
   */
  private startAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(() => {
      // Auto-save will be triggered by the quiz context when state changes
      localStorage.setItem(STORAGE_KEYS.LAST_SAVE, new Date().toISOString());
    }, this.AUTO_SAVE_INTERVAL);
  }

  /**
   * Stop auto-save functionality
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Setup cleanup on page unload
   */
  private setupCleanup(): void {
    const cleanup = () => {
      this.sensitiveData.clear();
      this.stopAutoSave();
    };

    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('unload', cleanup);
    
    // Cleanup on visibility change (mobile apps going to background)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // App going to background, clear sensitive data
        this.sensitiveData.clear();
      }
    });
  }

  /**
   * Validate quiz state before saving
   */
  private validateQuizState(state: QuizState): boolean {
    if (!state || typeof state !== 'object') return false;
    if (typeof state.currentQuestionIndex !== 'number') return false;
    if (!Array.isArray(state.questions)) return false;
    if (!Array.isArray(state.userAnswers)) return false;
    if (!Array.isArray(state.hintsUsed)) return false;
    if (!(state.quizStartTime instanceof Date)) return false;
    if (typeof state.isComplete !== 'boolean') return false;

    return true;
  }

  /**
   * Validate safe storage data
   */
  private validateSafeStorageData(data: unknown): data is SafeStorageData {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.currentQuestionIndex !== 'number') return false;
    if (typeof data.difficulty !== 'string') return false;
    if (typeof data.startTime !== 'string') return false;
    if (!Array.isArray(data.hintsUsed)) return false;
    if (typeof data.totalQuestions !== 'number') return false;
    if (typeof data.isComplete !== 'boolean') return false;
    if (typeof data.lastSaveTime !== 'string') return false;
    if (typeof data.version !== 'string') return false;

    return true;
  }

  /**
   * Extract difficulty from quiz state
   */
  private extractDifficulty(state: QuizState): string {
    const currentQuestion = state.questions[state.currentQuestionIndex];
    return currentQuestion?.difficulty || 'easy';
  }

  /**
   * Generate secure session ID
   */
  private generateSessionId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get default user preferences
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      fontSize: 'normal',
      soundEnabled: true
    };
  }
}

// Export singleton instance
export const storageManager = new SecureStorageManager();

// Export types and interfaces
export type { SafeStorageData, UserPreferences };