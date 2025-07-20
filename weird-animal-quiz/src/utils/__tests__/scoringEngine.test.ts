/**
 * Comprehensive tests for the Scoring Engine
 * Tests requirements: 3.5, 3.6
 */

import {
  calculateQuizScore,
  calculateMaxScore,
  getPerformanceFeedback,
  getScoreByDifficulty,
  generatePerformanceAnalysis,
  SCORING_CONFIG
} from '../scoringEngine';
import { UserResponse, Question, Difficulty } from '../../types/quiz';

// Mock questions for testing
const mockQuestions: Question[] = [
  {
    id: 'easy-1',
    difficulty: Difficulty.EASY,
    text: 'Easy question',
    emojis: ['🐨'],
    answers: [
      { id: 'a1', text: 'Correct', isCorrect: true },
      { id: 'a2', text: 'Wrong', isCorrect: false }
    ],
    explanation: 'Easy explanation',
    funFact: 'Easy fun fact',
    category: 'test'
  },
  {
    id: 'medium-1',
    difficulty: Difficulty.MEDIUM,
    text: 'Medium question',
    emojis: ['🐙'],
    answers: [
      { id: 'b1', text: 'Correct', isCorrect: true },
      { id: 'b2', text: 'Wrong', isCorrect: false }
    ],
    explanation: 'Medium explanation',
    funFact: 'Medium fun fact',
    category: 'test'
  },
  {
    id: 'hard-1',
    difficulty: Difficulty.HARD,
    text: 'Hard question',
    emojis: ['🦐'],
    answers: [
      { id: 'c1', text: 'Correct', isCorrect: true },
      { id: 'c2', text: 'Wrong', isCorrect: false }
    ],
    explanation: 'Hard explanation',
    funFact: 'Hard fun fact',
    category: 'test'
  }
];

describe('Scoring Engine', () => {
  describe('calculateQuizScore', () => {
    it('should calculate correct score for all correct answers without hints', () => {
      const userResponses: UserResponse[] = [
        {
          questionId: 'easy-1',
          selectedAnswerId: 'a1',
          isCorrect: true,
          timeSpent: 15,
          hintUsed: false,
          timestamp: new Date()
        },
        {
          questionId: 'medium-1',
          selectedAnswerId: 'b1',
          isCorrect: true,
          timeSpent: 15,
          hintUsed: false,
          timestamp: new Date()
        },
        {
          questionId: 'hard-1',
          selectedAnswerId: 'c1',
          isCorrect: true,
          timeSpent: 15,
          hintUsed: false,
          timestamp: new Date()
        }
      ];

      const results = calculateQuizScore(userResponses, mockQuestions);

      // Base scores: Easy(10) + Medium(20) + Hard(30) = 60
      // Time bonus: 15 seconds remaining = good bonus (10% for each)
      // Expected: 10*1.1 + 20*1.1 + 30*1.1 = 66
      expect(results.totalScore).toBe(66);
      expect(results.correctAnswers).toBe(3);
      expect(results.totalQuestions).toBe(3);
      expect(results.percentage).toBe(100);
      expect(results.timeSpent).toBe(45);
      expect(results.hintsUsed).toBe(0);
    });

    it('should apply hint penalty correctly', () => {
      const userResponses: UserResponse[] = [
        {
          questionId: 'easy-1',
          selectedAnswerId: 'a1',
          isCorrect: true,
          timeSpent: 15,
          hintUsed: true, // Hint used
          timestamp: new Date()
        }
      ];

      const results = calculateQuizScore(userResponses, [mockQuestions[0]]);

      // Base score: 10 points
      // Hint penalty: 50% = 5 points
      // Time bonus: 15 seconds remaining = 10% bonus = 0.5 points
      // Expected: (10 * 0.5) * 1.1 = 5.5 rounded to 6
      expect(results.totalScore).toBe(6);
      expect(results.hintsUsed).toBe(1);
    });

    it('should apply time bonus for excellent timing', () => {
      const userResponses: UserResponse[] = [
        {
          questionId: 'easy-1',
          selectedAnswerId: 'a1',
          isCorrect: true,
          timeSpent: 5, // 25 seconds remaining (excellent)
          hintUsed: false,
          timestamp: new Date()
        }
      ];

      const results = calculateQuizScore(userResponses, [mockQuestions[0]]);

      // Base score: 10 points
      // Time bonus: 25 seconds remaining = excellent bonus (20%)
      // Expected: 10 * 1.2 = 12
      expect(results.totalScore).toBe(12);
    });

    it('should not award points for incorrect answers', () => {
      const userResponses: UserResponse[] = [
        {
          questionId: 'easy-1',
          selectedAnswerId: 'a2', // Wrong answer
          isCorrect: false,
          timeSpent: 15,
          hintUsed: false,
          timestamp: new Date()
        }
      ];

      const results = calculateQuizScore(userResponses, [mockQuestions[0]]);

      expect(results.totalScore).toBe(0);
      expect(results.correctAnswers).toBe(0);
      expect(results.percentage).toBe(0);
    });

    it('should calculate difficulty breakdown correctly', () => {
      const userResponses: UserResponse[] = [
        {
          questionId: 'easy-1',
          selectedAnswerId: 'a1',
          isCorrect: true,
          timeSpent: 15,
          hintUsed: false,
          timestamp: new Date()
        },
        {
          questionId: 'medium-1',
          selectedAnswerId: 'b2', // Wrong answer
          isCorrect: false,
          timeSpent: 20,
          hintUsed: false,
          timestamp: new Date()
        },
        {
          questionId: 'hard-1',
          selectedAnswerId: 'c1',
          isCorrect: true,
          timeSpent: 10,
          hintUsed: false,
          timestamp: new Date()
        }
      ];

      const results = calculateQuizScore(userResponses, mockQuestions);

      expect(results.difficultyBreakdown.easy.correct).toBe(1);
      expect(results.difficultyBreakdown.easy.total).toBe(1);
      expect(results.difficultyBreakdown.easy.percentage).toBe(100);

      expect(results.difficultyBreakdown.medium.correct).toBe(0);
      expect(results.difficultyBreakdown.medium.total).toBe(1);
      expect(results.difficultyBreakdown.medium.percentage).toBe(0);

      expect(results.difficultyBreakdown.hard.correct).toBe(1);
      expect(results.difficultyBreakdown.hard.total).toBe(1);
      expect(results.difficultyBreakdown.hard.percentage).toBe(100);
    });

    it('should handle empty responses gracefully', () => {
      const results = calculateQuizScore([], mockQuestions);

      expect(results.totalScore).toBe(0);
      expect(results.correctAnswers).toBe(0);
      expect(results.totalQuestions).toBe(0);
      expect(results.percentage).toBe(0);
      expect(results.timeSpent).toBe(0);
      expect(results.hintsUsed).toBe(0);
    });

    it('should handle responses for non-existent questions', () => {
      const userResponses: UserResponse[] = [
        {
          questionId: 'non-existent',
          selectedAnswerId: 'a1',
          isCorrect: true,
          timeSpent: 15,
          hintUsed: false,
          timestamp: new Date()
        }
      ];

      const results = calculateQuizScore(userResponses, mockQuestions);

      expect(results.totalScore).toBe(0);
      expect(results.correctAnswers).toBe(0);
      expect(results.totalQuestions).toBe(1);
      expect(results.timeSpent).toBe(15);
    });
  });

  describe('calculateMaxScore', () => {
    it('should calculate maximum possible score', () => {
      const maxScore = calculateMaxScore(mockQuestions);

      // Easy: 10 * 1.2 = 12
      // Medium: 20 * 1.2 = 24
      // Hard: 30 * 1.2 = 36
      // Total: 72
      expect(maxScore).toBe(72);
    });

    it('should handle empty questions array', () => {
      const maxScore = calculateMaxScore([]);
      expect(maxScore).toBe(0);
    });
  });

  describe('getPerformanceFeedback', () => {
    it('should return excellent feedback for 90%+', () => {
      const feedback = getPerformanceFeedback(95);
      expect(feedback.level).toBe('excellent');
      expect(feedback.message).toContain('Outstanding');
      expect(feedback.emoji).toBe('🏆');
    });

    it('should return good feedback for 75-89%', () => {
      const feedback = getPerformanceFeedback(80);
      expect(feedback.level).toBe('good');
      expect(feedback.message).toContain('Great job');
      expect(feedback.emoji).toBe('🎉');
    });

    it('should return average feedback for 60-74%', () => {
      const feedback = getPerformanceFeedback(65);
      expect(feedback.level).toBe('average');
      expect(feedback.message).toContain('Not bad');
      expect(feedback.emoji).toBe('👍');
    });

    it('should return needs-improvement feedback for <60%', () => {
      const feedback = getPerformanceFeedback(45);
      expect(feedback.level).toBe('needs-improvement');
      expect(feedback.message).toContain('Keep learning');
      expect(feedback.emoji).toBe('💪');
    });
  });

  describe('getScoreByDifficulty', () => {
    it('should calculate score breakdown by difficulty', () => {
      const userResponses: UserResponse[] = [
        {
          questionId: 'easy-1',
          selectedAnswerId: 'a1',
          isCorrect: true,
          timeSpent: 15,
          hintUsed: false,
          timestamp: new Date()
        },
        {
          questionId: 'medium-1',
          selectedAnswerId: 'b1',
          isCorrect: true,
          timeSpent: 25, // No time bonus
          hintUsed: true, // Hint penalty
          timestamp: new Date()
        }
      ];

      const breakdown = getScoreByDifficulty(userResponses, mockQuestions.slice(0, 2));

      // Easy: 10 * 1.1 = 11 (time bonus)
      expect(breakdown[Difficulty.EASY].score).toBe(11);
      expect(breakdown[Difficulty.EASY].maxScore).toBe(12);

      // Medium: 20 * 0.5 = 10 (hint penalty, no time bonus)
      expect(breakdown[Difficulty.MEDIUM].score).toBe(10);
      expect(breakdown[Difficulty.MEDIUM].maxScore).toBe(24);

      // Hard: no questions provided, so no max score
      expect(breakdown[Difficulty.HARD].score).toBe(0);
      expect(breakdown[Difficulty.HARD].maxScore).toBe(0);
    });
  });

  describe('generatePerformanceAnalysis', () => {
    it('should generate analysis for excellent performance', () => {
      const results = {
        totalScore: 66,
        percentage: 100,
        correctAnswers: 3,
        totalQuestions: 3,
        timeSpent: 45,
        difficultyBreakdown: {
          easy: { correct: 1, total: 1, percentage: 100 },
          medium: { correct: 1, total: 1, percentage: 100 },
          hard: { correct: 1, total: 1, percentage: 100 }
        },
        hintsUsed: 0
      };

      const analysis = generatePerformanceAnalysis(results, mockQuestions);

      expect(analysis.overallGrade).toBe('A+');
      expect(analysis.strengths).toContain('Strong foundation with basic animal facts');
      expect(analysis.strengths).toContain('Good understanding of complex animal adaptations');
      expect(analysis.strengths).toContain('Excellent knowledge of rare and extreme animal phenomena');
      expect(analysis.strengths).toContain('Great confidence in your animal knowledge');
      expect(analysis.recommendations).toContain('Consider exploring advanced zoology or marine biology topics');
    });

    it('should generate analysis for poor performance', () => {
      const results = {
        totalScore: 5,
        percentage: 33,
        correctAnswers: 1,
        totalQuestions: 3,
        timeSpent: 60,
        difficultyBreakdown: {
          easy: { correct: 1, total: 1, percentage: 100 },
          medium: { correct: 0, total: 1, percentage: 0 },
          hard: { correct: 0, total: 1, percentage: 0 }
        },
        hintsUsed: 3
      };

      const analysis = generatePerformanceAnalysis(results, mockQuestions);

      expect(analysis.overallGrade).toBe('F');
      expect(analysis.improvements).toContain('Study more about unique animal abilities and anatomy');
      expect(analysis.improvements).toContain('Explore more about extraordinary animal survival mechanisms');
      expect(analysis.improvements).toContain('Try to rely less on hints to build confidence');
      expect(analysis.recommendations).toContain('Start with easier animal facts and build up gradually');
    });

    it('should handle edge cases in analysis', () => {
      const results = {
        totalScore: 0,
        percentage: 0,
        correctAnswers: 0,
        totalQuestions: 0,
        timeSpent: 0,
        difficultyBreakdown: {
          easy: { correct: 0, total: 0, percentage: 0 },
          medium: { correct: 0, total: 0, percentage: 0 },
          hard: { correct: 0, total: 0, percentage: 0 }
        },
        hintsUsed: 0
      };

      const analysis = generatePerformanceAnalysis(results, []);

      expect(analysis.overallGrade).toBe('F');
      expect(analysis.strengths).toContain('Great confidence in your animal knowledge');
      expect(analysis.recommendations).toContain('Start with easier animal facts and build up gradually');
    });
  });

  describe('SCORING_CONFIG', () => {
    it('should have correct point values', () => {
      expect(SCORING_CONFIG.POINTS[Difficulty.EASY]).toBe(10);
      expect(SCORING_CONFIG.POINTS[Difficulty.MEDIUM]).toBe(20);
      expect(SCORING_CONFIG.POINTS[Difficulty.HARD]).toBe(30);
    });

    it('should have correct hint penalty', () => {
      expect(SCORING_CONFIG.HINT_PENALTY).toBe(0.5);
    });

    it('should have correct time bonus configuration', () => {
      expect(SCORING_CONFIG.TIME_BONUS.EXCELLENT).toBe(20);
      expect(SCORING_CONFIG.TIME_BONUS.GOOD).toBe(10);
      expect(SCORING_CONFIG.TIME_BONUS.BONUS_MULTIPLIER).toBe(0.2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle negative time spent', () => {
      const userResponses: UserResponse[] = [
        {
          questionId: 'easy-1',
          selectedAnswerId: 'a1',
          isCorrect: true,
          timeSpent: -5, // Invalid negative time
          hintUsed: false,
          timestamp: new Date()
        }
      ];

      const results = calculateQuizScore(userResponses, [mockQuestions[0]]);

      // Should still calculate score, treating negative time as very fast
      expect(results.totalScore).toBeGreaterThan(0);
      expect(results.timeSpent).toBe(-5); // Preserves original value
    });

    it('should handle very large time values', () => {
      const userResponses: UserResponse[] = [
        {
          questionId: 'easy-1',
          selectedAnswerId: 'a1',
          isCorrect: true,
          timeSpent: 999999,
          hintUsed: false,
          timestamp: new Date()
        }
      ];

      const results = calculateQuizScore(userResponses, [mockQuestions[0]]);

      // Should calculate base score without time bonus
      expect(results.totalScore).toBe(10);
      expect(results.timeSpent).toBe(999999);
    });

    it('should handle duplicate question IDs in responses', () => {
      const userResponses: UserResponse[] = [
        {
          questionId: 'easy-1',
          selectedAnswerId: 'a1',
          isCorrect: true,
          timeSpent: 15,
          hintUsed: false,
          timestamp: new Date()
        },
        {
          questionId: 'easy-1', // Duplicate
          selectedAnswerId: 'a1',
          isCorrect: true,
          timeSpent: 20,
          hintUsed: true,
          timestamp: new Date()
        }
      ];

      const results = calculateQuizScore(userResponses, [mockQuestions[0]]);

      // Should process both responses
      expect(results.totalQuestions).toBe(2);
      expect(results.correctAnswers).toBe(2);
      expect(results.hintsUsed).toBe(1);
    });

    it('should round scores correctly', () => {
      const userResponses: UserResponse[] = [
        {
          questionId: 'easy-1',
          selectedAnswerId: 'a1',
          isCorrect: true,
          timeSpent: 15,
          hintUsed: true, // Creates fractional score
          timestamp: new Date()
        }
      ];

      const results = calculateQuizScore(userResponses, [mockQuestions[0]]);

      // Base: 10, Hint penalty: 50% = 5, Time bonus: 10% = 0.5
      // Total: 5.5, should round to 6
      expect(results.totalScore).toBe(6);
      expect(Number.isInteger(results.totalScore)).toBe(true);
    });
  });
});