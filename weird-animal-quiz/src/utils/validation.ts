/**
 * Validation utilities with input sanitization for the Weird Animal Quiz
 * Implements security requirements: 6.7, 6.8
 */

import type { Question, Answer, ValidationResult } from '../types/quiz';
import { Difficulty } from '../types/quiz';

/**
 * Sanitizes user input by removing potentially dangerous content
 * Prevents XSS attacks and script injection
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    // Remove HTML script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove event handlers
    .replace(/on\w+=/gi, '')
    // Remove data: URLs that could contain scripts (but preserve image data URLs)
    .replace(/data:(?!image\/)[^,]*,/gi, '')
    // Trim whitespace
    .trim();
}

/**
 * Validates question ID format
 * Only allows alphanumeric characters, hyphens, and underscores
 */
export function validateQuestionId(id: string): boolean {
  if (typeof id !== 'string' || id.length === 0) {
    return false;
  }
  
  // Only allow alphanumeric characters, hyphens, and underscores
  // Maximum length of 50 characters
  return /^[a-zA-Z0-9-_]+$/.test(id) && id.length <= 50;
}

/**
 * Validates answer ID format
 */
export function validateAnswerId(id: string): boolean {
  if (typeof id !== 'string' || id.length === 0) {
    return false;
  }
  
  // Only allow alphanumeric characters, hyphens, and underscores
  // Maximum length of 20 characters
  return /^[a-zA-Z0-9-_]+$/.test(id) && id.length <= 20;
}

/**
 * Validates difficulty level
 */
export function validateDifficulty(difficulty: string): difficulty is Difficulty {
  return Object.values(Difficulty).includes(difficulty as Difficulty);
}

/**
 * Validates emoji format (basic check for emoji characters)
 */
export function validateEmoji(emoji: string): boolean {
  if (typeof emoji !== 'string' || emoji.length === 0) {
    return false;
  }
  
  // More comprehensive emoji validation - checks for common emoji patterns
  const emojiRegex = /^(?:[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}])$/u;
  return emojiRegex.test(emoji);
}

/**
 * Validates Answer object
 */
export function validateAnswer(answer: Answer): ValidationResult {
  const errors: string[] = [];

  if (!answer) {
    errors.push('Answer object is required');
    return { isValid: false, errors };
  }

  // Validate ID
  if (!validateAnswerId(answer.id)) {
    errors.push('Answer ID must be alphanumeric with hyphens/underscores, max 20 characters');
  }

  // Validate text
  if (typeof answer.text !== 'string' || answer.text.trim().length === 0) {
    errors.push('Answer text is required and must be a non-empty string');
  } else if (answer.text.length > 200) {
    errors.push('Answer text must be 200 characters or less');
  }

  // Validate isCorrect
  if (typeof answer.isCorrect !== 'boolean') {
    errors.push('Answer isCorrect must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates Question object with comprehensive checks
 */
export function validateQuestion(question: Question): ValidationResult {
  const errors: string[] = [];

  if (!question) {
    errors.push('Question object is required');
    return { isValid: false, errors };
  }

  // Validate ID
  if (!validateQuestionId(question.id)) {
    errors.push('Question ID must be alphanumeric with hyphens/underscores, max 50 characters');
  }

  // Validate difficulty
  if (!validateDifficulty(question.difficulty)) {
    errors.push('Question difficulty must be easy, medium, or hard');
  }

  // Validate text
  if (typeof question.text !== 'string' || question.text.trim().length === 0) {
    errors.push('Question text is required and must be a non-empty string');
  } else if (question.text.length > 500) {
    errors.push('Question text must be 500 characters or less');
  }

  // Validate emojis
  if (!Array.isArray(question.emojis)) {
    errors.push('Question emojis must be an array');
  } else {
    if (question.emojis.length < 2) {
      errors.push('Question must have at least 2 emojis');
    }
    question.emojis.forEach((emoji, index) => {
      if (!validateEmoji(emoji)) {
        errors.push(`Invalid emoji at index ${index}`);
      }
    });
  }

  // Validate answers
  if (!Array.isArray(question.answers)) {
    errors.push('Question answers must be an array');
  } else {
    if (question.answers.length !== 4) {
      errors.push('Question must have exactly 4 answers');
    }

    let correctAnswerCount = 0;
    question.answers.forEach((answer, index) => {
      const answerValidation = validateAnswer(answer);
      if (!answerValidation.isValid) {
        errors.push(`Answer ${index + 1}: ${answerValidation.errors.join(', ')}`);
      }
      if (answer.isCorrect) {
        correctAnswerCount++;
      }
    });

    if (correctAnswerCount !== 1) {
      errors.push('Question must have exactly one correct answer');
    }
  }

  // Validate explanation
  if (typeof question.explanation !== 'string' || question.explanation.trim().length === 0) {
    errors.push('Question explanation is required and must be a non-empty string');
  } else if (question.explanation.length > 1000) {
    errors.push('Question explanation must be 1000 characters or less');
  }

  // Validate funFact
  if (typeof question.funFact !== 'string' || question.funFact.trim().length === 0) {
    errors.push('Question funFact is required and must be a non-empty string');
  } else if (question.funFact.length > 500) {
    errors.push('Question funFact must be 500 characters or less');
  }

  // Validate category
  if (typeof question.category !== 'string' || question.category.trim().length === 0) {
    errors.push('Question category is required and must be a non-empty string');
  } else if (question.category.length > 50) {
    errors.push('Question category must be 50 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitizes and validates question data
 */
export function sanitizeAndValidateQuestion(question: Question): { 
  sanitizedQuestion: Question; 
  validation: ValidationResult; 
} {
  const sanitizedQuestion: Question = {
    ...question,
    id: sanitizeInput(question.id),
    text: sanitizeInput(question.text),
    explanation: sanitizeInput(question.explanation),
    funFact: sanitizeInput(question.funFact),
    category: sanitizeInput(question.category),
    answers: question.answers.map(answer => ({
      ...answer,
      id: sanitizeInput(answer.id),
      text: sanitizeInput(answer.text)
    }))
  };

  const validation = validateQuestion(sanitizedQuestion);

  return {
    sanitizedQuestion,
    validation
  };
}

/**
 * Validates time value (in seconds)
 */
export function validateTime(time: number): boolean {
  return typeof time === 'number' && time >= 0 && time <= 3600; // Max 1 hour
}

/**
 * Validates quiz state for consistency
 */
export function validateQuizState(state: unknown): ValidationResult {
  const errors: string[] = [];

  if (!state) {
    errors.push('Quiz state is required');
    return { isValid: false, errors };
  }

  // Validate currentQuestionIndex
  if (typeof state.currentQuestionIndex !== 'number' || state.currentQuestionIndex < 0) {
    errors.push('Current question index must be a non-negative number');
  }

  // Validate questions array
  if (!Array.isArray(state.questions)) {
    errors.push('Questions must be an array');
  } else if (state.questions.length !== 9) {
    errors.push('Quiz must have exactly 9 questions');
  }

  // Validate userAnswers array
  if (!Array.isArray(state.userAnswers)) {
    errors.push('User answers must be an array');
  }

  // Validate timeRemaining
  if (!validateTime(state.timeRemaining)) {
    errors.push('Time remaining must be a valid time value');
  }

  // Validate hintsUsed array
  if (!Array.isArray(state.hintsUsed)) {
    errors.push('Hints used must be an array');
  }

  // Validate dates
  if (!(state.quizStartTime instanceof Date)) {
    errors.push('Quiz start time must be a valid Date');
  }

  if (state.quizEndTime && !(state.quizEndTime instanceof Date)) {
    errors.push('Quiz end time must be a valid Date or undefined');
  }

  // Validate boolean flags
  if (typeof state.isComplete !== 'boolean') {
    errors.push('isComplete must be a boolean');
  }

  if (typeof state.isPaused !== 'boolean') {
    errors.push('isPaused must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}