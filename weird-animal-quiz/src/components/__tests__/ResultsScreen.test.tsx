/**
 * Results Screen Component Tests
 * Tests for comprehensive score display, performance visualization, and retry options
 * Requirements: 3.6, 3.7, 5.6
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ResultsScreen from '../ResultsScreen';
import { Difficulty, type Question, type UserResponse } from '../../types/quiz';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock questions for testing
const mockQuestions: Question[] = [
  {
    id: 'easy-1',
    difficulty: Difficulty.EASY,
    text: 'Which animal sleeps the most?',
    emojis: ['🐨', '😴'],
    answers: [
      { id: 'a1', text: 'Koala', isCorrect: true },
      { id: 'a2', text: 'Sloth', isCorrect: false },
      { id: 'a3', text: 'Cat', isCorrect: false },
      { id: 'a4', text: 'Bear', isCorrect: false }
    ],
    explanation: 'Koalas sleep up to 22 hours a day.',
    funFact: 'Koalas have fingerprints like humans!',
    category: 'behavior'
  },
  {
    id: 'medium-1',
    difficulty: Difficulty.MEDIUM,
    text: 'Which animal has the strongest bite?',
    emojis: ['🐊', '💪'],
    answers: [
      { id: 'b1', text: 'Crocodile', isCorrect: true },
      { id: 'b2', text: 'Shark', isCorrect: false },
      { id: 'b3', text: 'Lion', isCorrect: false },
      { id: 'b4', text: 'Bear', isCorrect: false }
    ],
    explanation: 'Crocodiles have the strongest bite force.',
    funFact: 'A crocodile\'s bite is 10 times stronger than a great white shark!',
    category: 'anatomy'
  },
  {
    id: 'hard-1',
    difficulty: Difficulty.HARD,
    text: 'Which animal can survive in space?',
    emojis: ['🐻', '🚀'],
    answers: [
      { id: 'c1', text: 'Tardigrade', isCorrect: true },
      { id: 'c2', text: 'Cockroach', isCorrect: false },
      { id: 'c3', text: 'Extremophile', isCorrect: false },
      { id: 'c4', text: 'Bacteria', isCorrect: false }
    ],
    explanation: 'Tardigrades can survive the vacuum of space.',
    funFact: 'Tardigrades are also called water bears!',
    category: 'survival'
  }
];

// Mock user responses for different scenarios
const mockPerfectResponses: UserResponse[] = [
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
    timeSpent: 20,
    hintUsed: false,
    timestamp: new Date()
  },
  {
    questionId: 'hard-1',
    selectedAnswerId: 'c1',
    isCorrect: true,
    timeSpent: 25,
    hintUsed: false,
    timestamp: new Date()
  }
];

const mockMixedResponses: UserResponse[] = [
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
    selectedAnswerId: 'b2',
    isCorrect: false,
    timeSpent: 30,
    hintUsed: true,
    timestamp: new Date()
  },
  {
    questionId: 'hard-1',
    selectedAnswerId: 'c1',
    isCorrect: true,
    timeSpent: 25,
    hintUsed: false,
    timestamp: new Date()
  }
];

// Mock the QuizContext
const mockUseQuiz = vi.fn();
vi.mock('../../contexts/QuizContext', () => ({
  useQuiz: () => mockUseQuiz()
}));

// Helper function to create mock quiz context
const createMockQuizContext = (userResponses: UserResponse[]) => {
  // Create mock results based on user responses
  const correctAnswers = userResponses.filter(r => r.isCorrect).length;
  const totalQuestions = userResponses.length;
  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const hintsUsed = userResponses.filter(r => r.hintUsed).length;
  const timeSpent = userResponses.reduce((total, r) => total + r.timeSpent, 0);
  
  // Create difficulty breakdown
  const difficultyBreakdown = {
    easy: { correct: 0, total: 0, percentage: 0 },
    medium: { correct: 0, total: 0, percentage: 0 },
    hard: { correct: 0, total: 0, percentage: 0 }
  };
  
  userResponses.forEach(response => {
    const question = mockQuestions.find(q => q.id === response.questionId);
    if (question) {
      const difficulty = question.difficulty;
      difficultyBreakdown[difficulty].total++;
      if (response.isCorrect) {
        difficultyBreakdown[difficulty].correct++;
      }
    }
  });
  
  // Calculate percentages
  Object.keys(difficultyBreakdown).forEach(key => {
    const breakdown = difficultyBreakdown[key as keyof typeof difficultyBreakdown];
    breakdown.percentage = breakdown.total > 0 
      ? Math.round((breakdown.correct / breakdown.total) * 100)
      : 0;
  });
  
  const results = {
    totalScore: correctAnswers * 10, // Simple scoring
    percentage,
    correctAnswers,
    totalQuestions,
    timeSpent,
    difficultyBreakdown,
    hintsUsed
  };
  
  return {
    state: {
      currentQuestionIndex: mockQuestions.length - 1,
      questions: mockQuestions,
      userAnswers: userResponses,
      timeRemaining: 0,
      hintsUsed: userResponses.filter(r => r.hintUsed).map(r => r.questionId),
      quizStartTime: new Date(Date.now() - 180000), // 3 minutes ago
      quizEndTime: new Date(),
      isComplete: true,
      isPaused: true,
      showingFeedback: false
    },
    calculateResults: vi.fn(() => results)
  };
};

describe('ResultsScreen', () => {
  const mockOnPlayAgain = vi.fn();
  const mockOnRetryDifficulty = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Score Display', () => {
    it('displays perfect score correctly', async () => {
      const mockContext = createMockQuizContext(mockPerfectResponses);
      mockUseQuiz.mockReturnValue(mockContext);

      render(
        <ResultsScreen 
          onPlayAgain={mockOnPlayAgain}
          onRetryDifficulty={mockOnRetryDifficulty}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('100%');
        expect(screen.getByText('3/3 correct')).toBeInTheDocument();
        expect(screen.getByText('Grade: A+')).toBeInTheDocument();
      });
    });

    it('displays mixed score correctly', async () => {
      const mockContext = createMockQuizContext(mockMixedResponses);
      mockUseQuiz.mockReturnValue(mockContext);

      render(
        <ResultsScreen 
          onPlayAgain={mockOnPlayAgain}
          onRetryDifficulty={mockOnRetryDifficulty}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('67%');
        expect(screen.getByText('2/3 correct')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Breakdown', () => {
    it('shows difficulty breakdown correctly', async () => {
      const mockContext = createMockQuizContext(mockMixedResponses);
      mockUseQuiz.mockReturnValue(mockContext);

      render(
        <ResultsScreen 
          onPlayAgain={mockOnPlayAgain}
          onRetryDifficulty={mockOnRetryDifficulty}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Performance Breakdown')).toBeInTheDocument();
        expect(screen.getByText('Easy')).toBeInTheDocument();
        expect(screen.getByText('Medium')).toBeInTheDocument();
        expect(screen.getByText('Hard')).toBeInTheDocument();
      });
    });

    it('displays progress bars for each difficulty', async () => {
      const mockContext = createMockQuizContext(mockMixedResponses);
      mockUseQuiz.mockReturnValue(mockContext);

      render(
        <ResultsScreen 
          onPlayAgain={mockOnPlayAgain}
          onRetryDifficulty={mockOnRetryDifficulty}
        />
      );

      await waitFor(() => {
        const progressBars = document.querySelectorAll('[class*="progressBar"]');
        expect(progressBars).toHaveLength(3);
      });
    });
  });

  describe('Statistics Display', () => {
    it('shows total score, time taken, and hints used', async () => {
      const mockContext = createMockQuizContext(mockMixedResponses);
      mockUseQuiz.mockReturnValue(mockContext);

      render(
        <ResultsScreen 
          onPlayAgain={mockOnPlayAgain}
          onRetryDifficulty={mockOnRetryDifficulty}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Total Score')).toBeInTheDocument();
        expect(screen.getByText('Time Taken')).toBeInTheDocument();
        expect(screen.getByText('Hints Used')).toBeInTheDocument();
      });
    });

    it('formats time correctly', async () => {
      const mockContext = createMockQuizContext(mockMixedResponses);
      mockUseQuiz.mockReturnValue(mockContext);

      render(
        <ResultsScreen 
          onPlayAgain={mockOnPlayAgain}
          onRetryDifficulty={mockOnRetryDifficulty}
        />
      );

      await waitFor(() => {
        // Total time should be 15 + 30 + 25 = 70 seconds = 1:10
        expect(screen.getByText('1:10')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Analysis', () => {
    it('shows performance analysis section', async () => {
      const mockContext = createMockQuizContext(mockMixedResponses);
      mockUseQuiz.mockReturnValue(mockContext);

      render(
        <ResultsScreen 
          onPlayAgain={mockOnPlayAgain}
          onRetryDifficulty={mockOnRetryDifficulty}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Your Performance Analysis')).toBeInTheDocument();
      });
    });
  });

  describe('Action Buttons', () => {
    it('renders Play Again button', async () => {
      const mockContext = createMockQuizContext(mockPerfectResponses);
      mockUseQuiz.mockReturnValue(mockContext);

      render(
        <ResultsScreen 
          onPlayAgain={mockOnPlayAgain}
          onRetryDifficulty={mockOnRetryDifficulty}
        />
      );

      await waitFor(() => {
        const playAgainButton = screen.getByRole('button', { name: /play again/i });
        expect(playAgainButton).toBeInTheDocument();
      });
    });

    it('calls onPlayAgain when Play Again button is clicked', async () => {
      const mockContext = createMockQuizContext(mockPerfectResponses);
      mockUseQuiz.mockReturnValue(mockContext);

      render(
        <ResultsScreen 
          onPlayAgain={mockOnPlayAgain}
          onRetryDifficulty={mockOnRetryDifficulty}
        />
      );

      await waitFor(() => {
        const playAgainButton = screen.getByRole('button', { name: /play again/i });
        fireEvent.click(playAgainButton);
        expect(mockOnPlayAgain).toHaveBeenCalledTimes(1);
      });
    });

    it('shows retry buttons for imperfect scores', async () => {
      const mockContext = createMockQuizContext(mockMixedResponses);
      mockUseQuiz.mockReturnValue(mockContext);

      render(
        <ResultsScreen 
          onPlayAgain={mockOnPlayAgain}
          onRetryDifficulty={mockOnRetryDifficulty}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/want to improve/i)).toBeInTheDocument();
        // Should show retry button for Medium difficulty (0% score)
        expect(screen.getByRole('button', { name: /retry medium/i })).toBeInTheDocument();
      });
    });

    it('calls onRetryDifficulty with correct difficulty', async () => {
      const mockContext = createMockQuizContext(mockMixedResponses);
      mockUseQuiz.mockReturnValue(mockContext);

      render(
        <ResultsScreen 
          onPlayAgain={mockOnPlayAgain}
          onRetryDifficulty={mockOnRetryDifficulty}
        />
      );

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry medium/i });
        fireEvent.click(retryButton);
        expect(mockOnRetryDifficulty).toHaveBeenCalledWith(Difficulty.MEDIUM);
      });
    });
  });

  describe('Celebration Animation', () => {
    it('shows celebration for high scores', async () => {
      const mockContext = createMockQuizContext(mockPerfectResponses);
      mockUseQuiz.mockReturnValue(mockContext);

      render(
        <ResultsScreen 
          onPlayAgain={mockOnPlayAgain}
          onRetryDifficulty={mockOnRetryDifficulty}
        />
      );

      // Check if celebration appears (it should for 100% score)
      expect(screen.getByText('Outstanding Performance!')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and semantic structure', async () => {
      const mockContext = createMockQuizContext(mockPerfectResponses);
      mockUseQuiz.mockReturnValue(mockContext);

      render(
        <ResultsScreen 
          onPlayAgain={mockOnPlayAgain}
          onRetryDifficulty={mockOnRetryDifficulty}
        />
      );

      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      
      // Check for button accessibility
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', async () => {
      const mockContext = createMockQuizContext(mockPerfectResponses);
      mockUseQuiz.mockReturnValue(mockContext);

      render(
        <ResultsScreen 
          onPlayAgain={mockOnPlayAgain}
          onRetryDifficulty={mockOnRetryDifficulty}
        />
      );

      const playAgainButton = screen.getByRole('button', { name: /play again/i });
      playAgainButton.focus();
      expect(document.activeElement).toBe(playAgainButton);
    });
  });
});