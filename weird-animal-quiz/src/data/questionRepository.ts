/**
 * Question Repository and Content Management
 * Implements question shuffling, selection logic, and content validation
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.8
 */

import { Question, Difficulty, ValidationResult } from '../types/quiz';
import { QUIZ_QUESTIONS, getQuestionsByDifficulty, getQuestionCounts } from './questions';
import { validateQuestion, sanitizeAndValidateQuestion } from '../utils/validation';

/**
 * Fisher-Yates shuffle algorithm for randomizing question order
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Question Repository class for managing quiz questions
 */
export class QuestionRepository {
  private questions: Question[];
  private validationErrors: string[] = [];

  constructor() {
    this.questions = [...QUIZ_QUESTIONS];
    this.validateAllQuestions();
  }

  /**
   * Validate all questions in the repository
   * Ensures scientific accuracy and age-appropriate content
   */
  private validateAllQuestions(): void {
    this.validationErrors = [];
    
    this.questions.forEach((question, index) => {
      const validation = validateQuestion(question);
      if (!validation.isValid) {
        this.validationErrors.push(`Question ${index + 1} (${question.id}): ${validation.errors.join(', ')}`);
      }
    });

    // Additional content validation for scientific accuracy and age-appropriateness
    this.validateContentQuality();
  }

  /**
   * Validate content quality for scientific accuracy and age-appropriate language
   */
  private validateContentQuality(): void {
    const inappropriateWords = ['stupid', 'dumb', 'idiotic', 'moronic'];
    const requiredScientificTerms = ['behavior', 'physiology', 'anatomy', 'survival', 'physics'];
    
    this.questions.forEach((question, index) => {
      // Check for age-appropriate language
      const questionText = question.text.toLowerCase();
      const explanation = question.explanation.toLowerCase();
      const funFact = question.funFact.toLowerCase();
      
      inappropriateWords.forEach(word => {
        if (questionText.includes(word) || explanation.includes(word) || funFact.includes(word)) {
          this.validationErrors.push(`Question ${index + 1} contains inappropriate language: "${word}"`);
        }
      });

      // Ensure scientific categorization
      if (!requiredScientificTerms.includes(question.category)) {
        this.validationErrors.push(`Question ${index + 1} has invalid category: "${question.category}". Must be one of: ${requiredScientificTerms.join(', ')}`);
      }

      // Ensure minimum explanation length for educational value
      if (question.explanation.length < 50) {
        this.validationErrors.push(`Question ${index + 1} explanation too short (minimum 50 characters for educational value)`);
      }

      // Ensure fun fact is engaging and informative
      if (question.funFact.length < 30) {
        this.validationErrors.push(`Question ${index + 1} fun fact too short (minimum 30 characters for engagement)`);
      }
    });
  }

  /**
   * Get all validation errors
   */
  getValidationErrors(): string[] {
    return [...this.validationErrors];
  }

  /**
   * Check if repository is valid
   */
  isValid(): boolean {
    return this.validationErrors.length === 0;
  }

  /**
   * Get all questions (unshuffled)
   */
  getAllQuestions(): Question[] {
    return [...this.questions];
  }

  /**
   * Get questions by difficulty level
   */
  getQuestionsByDifficulty(difficulty: Difficulty): Question[] {
    return this.questions.filter(q => q.difficulty === difficulty);
  }

  /**
   * Get shuffled questions for a quiz session
   * Returns exactly 9 questions: 3 easy, 3 medium, 3 hard
   */
  getShuffledQuizQuestions(): Question[] {
    const byDifficulty = getQuestionsByDifficulty();
    
    // Shuffle each difficulty group
    const shuffledEasy = shuffleArray(byDifficulty.easy);
    const shuffledMedium = shuffleArray(byDifficulty.medium);
    const shuffledHard = shuffleArray(byDifficulty.hard);

    // Take 3 from each difficulty (all available questions)
    const selectedQuestions = [
      ...shuffledEasy.slice(0, 3),
      ...shuffledMedium.slice(0, 3),
      ...shuffledHard.slice(0, 3)
    ];

    // Shuffle the final selection to mix difficulties
    return shuffleArray(selectedQuestions);
  }

  /**
   * Get questions for a specific difficulty level (for retry functionality)
   */
  getShuffledQuestionsByDifficulty(difficulty: Difficulty): Question[] {
    const questions = this.getQuestionsByDifficulty(difficulty);
    return shuffleArray(questions);
  }

  /**
   * Get a specific question by ID
   */
  getQuestionById(id: string): Question | undefined {
    return this.questions.find(q => q.id === id);
  }

  /**
   * Get question statistics
   */
  getStatistics() {
    const counts = getQuestionCounts();
    const categories = [...new Set(this.questions.map(q => q.category))];
    
    return {
      totalQuestions: counts.total,
      byDifficulty: {
        easy: counts.easy,
        medium: counts.medium,
        hard: counts.hard
      },
      categories: categories,
      averageExplanationLength: Math.round(
        this.questions.reduce((sum, q) => sum + q.explanation.length, 0) / this.questions.length
      ),
      averageFunFactLength: Math.round(
        this.questions.reduce((sum, q) => sum + q.funFact.length, 0) / this.questions.length
      )
    };
  }

  /**
   * Validate and sanitize a new question before adding to repository
   * (For future content management features)
   */
  validateNewQuestion(question: Question): ValidationResult {
    const sanitizedResult = sanitizeAndValidateQuestion(question);
    
    if (!sanitizedResult.validation.isValid) {
      return sanitizedResult.validation;
    }

    // Additional checks for repository consistency
    const errors: string[] = [];
    
    // Check for duplicate ID
    if (this.questions.some(q => q.id === question.id)) {
      errors.push('Question ID already exists in repository');
    }

    // Ensure balanced difficulty distribution
    const currentCounts = getQuestionCounts();
    const maxQuestionsPerDifficulty = 5; // Allow some flexibility for future expansion
    
    if (currentCounts[question.difficulty] >= maxQuestionsPerDifficulty) {
      errors.push(`Too many ${question.difficulty} questions. Maximum ${maxQuestionsPerDifficulty} per difficulty.`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

// Export singleton instance
export const questionRepository = new QuestionRepository();

// Export utility functions
export { getQuestionsByDifficulty, getQuestionCounts };