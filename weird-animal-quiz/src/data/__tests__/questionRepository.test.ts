/**
 * Tests for Question Repository and Content Management
 * Validates question shuffling, selection logic, and content validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { QuestionRepository, questionRepository, getQuestionsByDifficulty, getQuestionCounts } from '../questionRepository';
import { QUIZ_QUESTIONS } from '../questions';
import { Difficulty, Question } from '../../types/quiz';

describe('QuestionRepository', () => {
  let repository: QuestionRepository;

  beforeEach(() => {
    repository = new QuestionRepository();
  });

  describe('Initialization and Validation', () => {
    it('should initialize with all questions from QUIZ_QUESTIONS', () => {
      const allQuestions = repository.getAllQuestions();
      expect(allQuestions).toHaveLength(QUIZ_QUESTIONS.length);
      expect(allQuestions).toEqual(QUIZ_QUESTIONS);
    });

    it('should validate all questions on initialization', () => {
      expect(repository.isValid()).toBe(true);
      expect(repository.getValidationErrors()).toHaveLength(0);
    });

    it('should have exactly 9 questions total', () => {
      const allQuestions = repository.getAllQuestions();
      expect(allQuestions).toHaveLength(9);
    });

    it('should have exactly 3 questions per difficulty level', () => {
      const easyQuestions = repository.getQuestionsByDifficulty(Difficulty.EASY);
      const mediumQuestions = repository.getQuestionsByDifficulty(Difficulty.MEDIUM);
      const hardQuestions = repository.getQuestionsByDifficulty(Difficulty.HARD);

      expect(easyQuestions).toHaveLength(3);
      expect(mediumQuestions).toHaveLength(3);
      expect(hardQuestions).toHaveLength(3);
    });
  });

  describe('Question Content Validation', () => {
    it('should validate that all questions have required emojis', () => {
      const allQuestions = repository.getAllQuestions();
      allQuestions.forEach(question => {
        expect(question.emojis).toHaveLength(2);
        expect(question.emojis.every(emoji => emoji.length > 0)).toBe(true);
      });
    });

    it('should validate that all questions have 4 answer choices', () => {
      const allQuestions = repository.getAllQuestions();
      allQuestions.forEach(question => {
        expect(question.answers).toHaveLength(4);
      });
    });

    it('should validate that each question has exactly one correct answer', () => {
      const allQuestions = repository.getAllQuestions();
      allQuestions.forEach(question => {
        const correctAnswers = question.answers.filter(answer => answer.isCorrect);
        expect(correctAnswers).toHaveLength(1);
      });
    });

    it('should validate scientific accuracy through proper categorization', () => {
      const validCategories = ['behavior', 'physiology', 'anatomy', 'survival', 'physics'];
      const allQuestions = repository.getAllQuestions();
      
      allQuestions.forEach(question => {
        expect(validCategories).toContain(question.category);
      });
    });

    it('should ensure age-appropriate content', () => {
      const inappropriateWords = ['stupid', 'dumb', 'idiotic', 'moronic'];
      const allQuestions = repository.getAllQuestions();
      
      allQuestions.forEach(question => {
        const content = `${question.text} ${question.explanation} ${question.funFact}`.toLowerCase();
        inappropriateWords.forEach(word => {
          expect(content).not.toContain(word);
        });
      });
    });

    it('should have educational explanations of sufficient length', () => {
      const allQuestions = repository.getAllQuestions();
      allQuestions.forEach(question => {
        expect(question.explanation.length).toBeGreaterThanOrEqual(50);
      });
    });

    it('should have engaging fun facts of sufficient length', () => {
      const allQuestions = repository.getAllQuestions();
      allQuestions.forEach(question => {
        expect(question.funFact.length).toBeGreaterThanOrEqual(30);
      });
    });
  });

  describe('Question Selection and Shuffling', () => {
    it('should return shuffled quiz questions with correct distribution', () => {
      const shuffledQuestions = repository.getShuffledQuizQuestions();
      
      expect(shuffledQuestions).toHaveLength(9);
      
      const easyCount = shuffledQuestions.filter(q => q.difficulty === Difficulty.EASY).length;
      const mediumCount = shuffledQuestions.filter(q => q.difficulty === Difficulty.MEDIUM).length;
      const hardCount = shuffledQuestions.filter(q => q.difficulty === Difficulty.HARD).length;
      
      expect(easyCount).toBe(3);
      expect(mediumCount).toBe(3);
      expect(hardCount).toBe(3);
    });

    it('should shuffle questions differently on multiple calls', () => {
      const firstShuffle = repository.getShuffledQuizQuestions();
      const secondShuffle = repository.getShuffledQuizQuestions();
      
      // While it's possible they could be the same, it's extremely unlikely
      // We'll check that at least the order is different
      const firstIds = firstShuffle.map(q => q.id);
      const secondIds = secondShuffle.map(q => q.id);
      
      // At least one position should be different (very high probability)
      let isDifferent = false;
      for (let i = 0; i < firstIds.length; i++) {
        if (firstIds[i] !== secondIds[i]) {
          isDifferent = true;
          break;
        }
      }
      
      // If they're the same, run it a few more times (extremely unlikely to be same every time)
      if (!isDifferent) {
        for (let attempt = 0; attempt < 5; attempt++) {
          const newShuffle = repository.getShuffledQuizQuestions();
          const newIds = newShuffle.map(q => q.id);
          
          for (let i = 0; i < firstIds.length; i++) {
            if (firstIds[i] !== newIds[i]) {
              isDifferent = true;
              break;
            }
          }
          if (isDifferent) break;
        }
      }
      
      expect(isDifferent).toBe(true);
    });

    it('should return shuffled questions by specific difficulty', () => {
      const easyQuestions = repository.getShuffledQuestionsByDifficulty(Difficulty.EASY);
      const mediumQuestions = repository.getShuffledQuestionsByDifficulty(Difficulty.MEDIUM);
      const hardQuestions = repository.getShuffledQuestionsByDifficulty(Difficulty.HARD);
      
      expect(easyQuestions).toHaveLength(3);
      expect(mediumQuestions).toHaveLength(3);
      expect(hardQuestions).toHaveLength(3);
      
      expect(easyQuestions.every(q => q.difficulty === Difficulty.EASY)).toBe(true);
      expect(mediumQuestions.every(q => q.difficulty === Difficulty.MEDIUM)).toBe(true);
      expect(hardQuestions.every(q => q.difficulty === Difficulty.HARD)).toBe(true);
    });
  });

  describe('Question Retrieval', () => {
    it('should retrieve question by ID', () => {
      const question = repository.getQuestionById('easy-koala-sleep');
      expect(question).toBeDefined();
      expect(question?.id).toBe('easy-koala-sleep');
      expect(question?.difficulty).toBe(Difficulty.EASY);
    });

    it('should return undefined for non-existent question ID', () => {
      const question = repository.getQuestionById('non-existent-id');
      expect(question).toBeUndefined();
    });

    it('should filter questions by difficulty correctly', () => {
      const easyQuestions = repository.getQuestionsByDifficulty(Difficulty.EASY);
      const mediumQuestions = repository.getQuestionsByDifficulty(Difficulty.MEDIUM);
      const hardQuestions = repository.getQuestionsByDifficulty(Difficulty.HARD);
      
      expect(easyQuestions.every(q => q.difficulty === Difficulty.EASY)).toBe(true);
      expect(mediumQuestions.every(q => q.difficulty === Difficulty.MEDIUM)).toBe(true);
      expect(hardQuestions.every(q => q.difficulty === Difficulty.HARD)).toBe(true);
    });
  });

  describe('Statistics and Metadata', () => {
    it('should provide accurate statistics', () => {
      const stats = repository.getStatistics();
      
      expect(stats.totalQuestions).toBe(9);
      expect(stats.byDifficulty.easy).toBe(3);
      expect(stats.byDifficulty.medium).toBe(3);
      expect(stats.byDifficulty.hard).toBe(3);
      expect(stats.categories.length).toBeGreaterThan(0);
      expect(stats.averageExplanationLength).toBeGreaterThan(0);
      expect(stats.averageFunFactLength).toBeGreaterThan(0);
    });

    it('should include all expected categories', () => {
      const stats = repository.getStatistics();
      const expectedCategories = ['behavior', 'physiology', 'anatomy', 'survival', 'physics'];
      
      expectedCategories.forEach(category => {
        expect(stats.categories).toContain(category);
      });
    });
  });

  describe('New Question Validation', () => {
    it('should validate a properly formatted new question', () => {
      const newQuestion: Question = {
        id: 'test-new-question',
        difficulty: Difficulty.EASY,
        text: 'This is a test question about animals?',
        emojis: ['🐾', '❓'],
        answers: [
          { id: 'test-a1', text: 'Correct answer', isCorrect: true },
          { id: 'test-a2', text: 'Wrong answer 1', isCorrect: false },
          { id: 'test-a3', text: 'Wrong answer 2', isCorrect: false },
          { id: 'test-a4', text: 'Wrong answer 3', isCorrect: false }
        ],
        explanation: 'This is a detailed explanation that is long enough to be educational and informative.',
        funFact: 'This is an engaging fun fact that provides additional interesting information.',
        category: 'behavior'
      };

      const validation = repository.validateNewQuestion(newQuestion);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject question with duplicate ID', () => {
      const duplicateQuestion: Question = {
        id: 'easy-koala-sleep', // This ID already exists
        difficulty: Difficulty.EASY,
        text: 'This is a test question about animals?',
        emojis: ['🐾', '❓'],
        answers: [
          { id: 'test-a1', text: 'Correct answer', isCorrect: true },
          { id: 'test-a2', text: 'Wrong answer 1', isCorrect: false },
          { id: 'test-a3', text: 'Wrong answer 2', isCorrect: false },
          { id: 'test-a4', text: 'Wrong answer 3', isCorrect: false }
        ],
        explanation: 'This is a detailed explanation that is long enough to be educational.',
        funFact: 'This is an engaging fun fact with information.',
        category: 'behavior'
      };

      const validation = repository.validateNewQuestion(duplicateQuestion);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Question ID already exists in repository');
    });
  });
});

describe('Utility Functions', () => {
  describe('getQuestionsByDifficulty', () => {
    it('should return questions organized by difficulty', () => {
      const byDifficulty = getQuestionsByDifficulty();
      
      expect(byDifficulty.easy).toHaveLength(3);
      expect(byDifficulty.medium).toHaveLength(3);
      expect(byDifficulty.hard).toHaveLength(3);
      
      expect(byDifficulty.easy.every(q => q.difficulty === Difficulty.EASY)).toBe(true);
      expect(byDifficulty.medium.every(q => q.difficulty === Difficulty.MEDIUM)).toBe(true);
      expect(byDifficulty.hard.every(q => q.difficulty === Difficulty.HARD)).toBe(true);
    });
  });

  describe('getQuestionCounts', () => {
    it('should return accurate question counts', () => {
      const counts = getQuestionCounts();
      
      expect(counts.easy).toBe(3);
      expect(counts.medium).toBe(3);
      expect(counts.hard).toBe(3);
      expect(counts.total).toBe(9);
    });
  });
});

describe('Singleton Instance', () => {
  it('should provide a valid singleton instance', () => {
    expect(questionRepository).toBeInstanceOf(QuestionRepository);
    expect(questionRepository.isValid()).toBe(true);
    expect(questionRepository.getAllQuestions()).toHaveLength(9);
  });

  it('should maintain state across multiple accesses', () => {
    const firstAccess = questionRepository.getAllQuestions();
    const secondAccess = questionRepository.getAllQuestions();
    
    expect(firstAccess).toEqual(secondAccess);
  });
});

describe('Content Quality Assurance', () => {
  let repository: QuestionRepository;

  beforeEach(() => {
    repository = new QuestionRepository();
  });

  it('should have diverse animal topics across questions', () => {
    const allQuestions = repository.getAllQuestions();
    const animalTypes = new Set();
    
    allQuestions.forEach(question => {
      // Extract animal names from question text and content
      const content = question.text.toLowerCase();
      if (content.includes('koala')) animalTypes.add('koala');
      if (content.includes('flamingo')) animalTypes.add('flamingo');
      if (content.includes('penguin')) animalTypes.add('penguin');
      if (content.includes('octopus')) animalTypes.add('octopus');
      if (content.includes('mantis shrimp')) animalTypes.add('mantis shrimp');
      if (content.includes('axolotl')) animalTypes.add('axolotl');
      if (content.includes('tardigrade')) animalTypes.add('tardigrade');
      if (content.includes('vampire bat')) animalTypes.add('vampire bat');
      if (content.includes('pistol shrimp')) animalTypes.add('pistol shrimp');
    });
    
    expect(animalTypes.size).toBeGreaterThanOrEqual(8); // Should have diverse animals
  });

  it('should have educational value in explanations', () => {
    const allQuestions = repository.getAllQuestions();
    
    allQuestions.forEach(question => {
      // Check that explanations contain scientific or educational terms
      const explanation = question.explanation.toLowerCase();
      const hasEducationalContent = 
        explanation.includes('because') ||
        explanation.includes('due to') ||
        explanation.includes('process') ||
        explanation.includes('energy') ||
        explanation.includes('temperature') ||
        explanation.includes('behavior') ||
        explanation.includes('adaptation') ||
        explanation.includes('evolution') ||
        explanation.includes('survival') ||
        explanation.includes('conserve') ||
        explanation.includes('digest') ||
        explanation.includes('pigment') ||
        explanation.includes('huddle') ||
        explanation.includes('brain') ||
        explanation.includes('force') ||
        explanation.includes('regenerate') ||
        explanation.includes('withstand') ||
        explanation.includes('regurgitate') ||
        explanation.includes('cavitation');
      

      expect(hasEducationalContent).toBe(true);
    });
  });

  it('should have engaging fun facts', () => {
    const allQuestions = repository.getAllQuestions();
    
    allQuestions.forEach(question => {
      // Fun facts should be engaging and surprising
      const funFact = question.funFact.toLowerCase();
      const isEngaging = 
        funFact.includes('!') ||
        funFact.includes('amazing') ||
        funFact.includes('incredible') ||
        funFact.includes('surprising') ||
        funFact.includes('actually') ||
        funFact.includes('even') ||
        funFact.includes('literally');
      
      expect(isEngaging).toBe(true);
    });
  });
});