/**
 * Core data models and types for the Weird Animal Quiz application
 * Implements requirements: 1.1, 1.7, 6.7, 6.8
 */

// Enums for difficulty levels and error types
export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export enum ErrorType {
  TIMER_ERROR = 'TIMER_ERROR',
  STATE_ERROR = 'STATE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  ANIMATION_ERROR = 'ANIMATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

// Core interfaces
export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  difficulty: Difficulty;
  text: string;
  emojis: string[];
  answers: Answer[];
  explanation: string;
  funFact: string;
  category: string;
}

export interface UserResponse {
  questionId: string;
  selectedAnswerId: string;
  isCorrect: boolean;
  timeSpent: number;
  hintUsed: boolean;
  timestamp: Date;
}

export interface QuizState {
  currentQuestionIndex: number;
  questions: Question[];
  userAnswers: UserResponse[];
  timeRemaining: number;
  hintsUsed: string[];
  quizStartTime: Date;
  quizEndTime?: Date;
  isComplete: boolean;
  isPaused: boolean;
  showingFeedback: boolean;
}

export interface QuizResults {
  totalScore: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  difficultyBreakdown: DifficultyBreakdown;
  hintsUsed: number;
}

export interface DifficultyBreakdown {
  easy: {
    correct: number;
    total: number;
    percentage: number;
  };
  medium: {
    correct: number;
    total: number;
    percentage: number;
  };
  hard: {
    correct: number;
    total: number;
    percentage: number;
  };
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Security-related interfaces
export interface SecurityEvent {
  type: 'INVALID_INPUT' | 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_ACTIVITY';
  timestamp: Date;
  details: string;
  userAgent?: string;
}