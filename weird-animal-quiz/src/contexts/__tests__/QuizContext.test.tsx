/**
 * Quiz Context and State Management Tests
 * Tests requirements: 2.1, 2.2, 2.3, 2.7, 2.8
 */

import React from 'react';
import { render, screen, act, renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  QuizProvider, 
  useQuiz, 
  quizReducer, 
  QuizActionType 
} from '../QuizContext';
import type { Question, QuizState } from '../../types/quiz';
import { Difficulty } from '../../types/quiz';

// Mock questions for testing
const mockQuestions: Question[] = [
  {
    id: 'easy-1',
    difficulty: Difficulty.EASY,
    text: 'Which animal sleeps 22 hours a day?',
    emojis: ['🐨', '😴'],
    answers: [
      { id: 'a1', text: 'Koala', isCorrect: true },
      { id: 'a2', text: 'Sloth', isCorrect: false },
      { id: 'a3', text: 'Panda', isCorrect: false },
      { id: 'a4', text: 'Cat', isCorrect: false }
    ],
    explanation: 'Koalas sleep 18-22 hours daily.',
    funFact: 'Koalas have fingerprints!',
    category: 'behavior'
  },
  {
    id: 'medium-1',
    difficulty: Difficulty.MEDIUM,
    text: 'Which bird can fly backwards?',
    emojis: ['🐦', '⬅️'],
    answers: [
      { id: 'b1', text: 'Eagle', isCorrect: false },
      { id: 'b2', text: 'Hummingbird', isCorrect: true },
      { id: 'b3', text: 'Sparrow', isCorrect: false },
      { id: 'b4', text: 'Robin', isCorrect: false }
    ],
    explanation: 'Hummingbirds can fly in all directions.',
    funFact: 'They beat their wings 80 times per second!',
    category: 'adaptation'
  }
];

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QuizProvider>{children}</QuizProvider>
);

// Test component to access quiz context
const TestComponent: React.FC = () => {
  const quiz = useQuiz();
  return (
    <div>
      <div data-testid="current-question-index">{quiz.state.currentQuestionIndex}</div>
      <div data-testid="time-remaining">{quiz.state.timeRemaining}</div>
      <div data-testid="is-paused">{quiz.state.isPaused.toString()}</div>
      <div data-testid="is-complete">{quiz.state.isComplete.toString()}</div>
      <div data-testid="questions-count">{quiz.state.questions.length}</div>
      <div data-testid="user-answers-count">{quiz.state.userAnswers.length}</div>
      <div data-testid="hints-used-count">{quiz.state.hintsUsed.length}</div>
      <button onClick={() => quiz.initializeQuiz(mockQuestions)}>
        Initialize Quiz
      </button>
      <button onClick={() => quiz.startTimer()}>Start Timer</button>
      <button onClick={() => quiz.pauseTimer()}>Pause Timer</button>
      <button onClick={() => quiz.resumeTimer()}>Resume Timer</button>
      <button onClick={() => quiz.updateTimer(15)}>Update Timer</button>
      <button onClick={() => quiz.submitAnswer('a1', 10)}>Submit Answer</button>
      <button onClick={() => quiz.nextQuestion()}>Next Question</button>
      <button onClick={() => quiz.useHint('easy-1')}>Use Hint</button>
      <button onClick={() => quiz.completeQuiz()}>Complete Quiz</button>
      <button onClick={() => quiz.resetQuiz()}>Reset Quiz</button>
    </div>
  );
};

describe('QuizContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('QuizProvider', () => {
    it('should provide initial quiz state', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('current-question-index')).toHaveTextContent('0');
      expect(screen.getByTestId('time-remaining')).toHaveTextContent('30');
      expect(screen.getByTestId('is-paused')).toHaveTextContent('false');
      expect(screen.getByTestId('is-complete')).toHaveTextContent('false');
      expect(screen.getByTestId('questions-count')).toHaveTextContent('0');
      expect(screen.getByTestId('user-answers-count')).toHaveTextContent('0');
      expect(screen.getByTestId('hints-used-count')).toHaveTextContent('0');
    });

    it('should throw error when useQuiz is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useQuiz());
      }).toThrow('useQuiz must be used within a QuizProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Quiz Actions', () => {
    it('should initialize quiz with questions', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      act(() => {
        screen.getByText('Initialize Quiz').click();
      });

      expect(screen.getByTestId('questions-count')).toHaveTextContent('2');
      expect(screen.getByTestId('current-question-index')).toHaveTextContent('0');
      expect(screen.getByTestId('time-remaining')).toHaveTextContent('30');
    });

    it('should handle timer actions correctly', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Start timer
      act(() => {
        screen.getByText('Start Timer').click();
      });
      expect(screen.getByTestId('is-paused')).toHaveTextContent('false');
      expect(screen.getByTestId('time-remaining')).toHaveTextContent('30');

      // Pause timer
      act(() => {
        screen.getByText('Pause Timer').click();
      });
      expect(screen.getByTestId('is-paused')).toHaveTextContent('true');

      // Resume timer
      act(() => {
        screen.getByText('Resume Timer').click();
      });
      expect(screen.getByTestId('is-paused')).toHaveTextContent('false');

      // Update timer
      act(() => {
        screen.getByText('Update Timer').click();
      });
      expect(screen.getByTestId('time-remaining')).toHaveTextContent('15');
    });

    it('should handle answer submission', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Initialize quiz first
      act(() => {
        screen.getByText('Initialize Quiz').click();
      });

      // Submit answer
      act(() => {
        screen.getByText('Submit Answer').click();
      });

      expect(screen.getByTestId('user-answers-count')).toHaveTextContent('1');
      expect(screen.getByTestId('is-paused')).toHaveTextContent('true'); // Timer paused during feedback
    });

    it('should handle question navigation', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Initialize quiz
      act(() => {
        screen.getByText('Initialize Quiz').click();
      });

      expect(screen.getByTestId('current-question-index')).toHaveTextContent('0');

      // Go to next question
      act(() => {
        screen.getByText('Next Question').click();
      });

      expect(screen.getByTestId('current-question-index')).toHaveTextContent('1');
      expect(screen.getByTestId('time-remaining')).toHaveTextContent('30'); // Timer reset
      expect(screen.getByTestId('is-paused')).toHaveTextContent('false');
    });

    it('should complete quiz when reaching last question', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Initialize quiz
      act(() => {
        screen.getByText('Initialize Quiz').click();
      });

      // Go to last question (index 1)
      act(() => {
        screen.getByText('Next Question').click();
      });

      // Try to go beyond last question
      act(() => {
        screen.getByText('Next Question').click();
      });

      expect(screen.getByTestId('is-complete')).toHaveTextContent('true');
      expect(screen.getByTestId('is-paused')).toHaveTextContent('true');
    });

    it('should handle hint usage', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Initialize quiz
      act(() => {
        screen.getByText('Initialize Quiz').click();
      });

      expect(screen.getByTestId('hints-used-count')).toHaveTextContent('0');

      // Use hint
      act(() => {
        screen.getByText('Use Hint').click();
      });

      expect(screen.getByTestId('hints-used-count')).toHaveTextContent('1');
    });

    it('should reset quiz state', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Initialize and modify state
      act(() => {
        screen.getByText('Initialize Quiz').click();
        screen.getByText('Submit Answer').click();
        screen.getByText('Use Hint').click();
      });

      expect(screen.getByTestId('user-answers-count')).toHaveTextContent('1');
      expect(screen.getByTestId('hints-used-count')).toHaveTextContent('1');

      // Reset quiz
      act(() => {
        screen.getByText('Reset Quiz').click();
      });

      expect(screen.getByTestId('current-question-index')).toHaveTextContent('0');
      expect(screen.getByTestId('time-remaining')).toHaveTextContent('30');
      expect(screen.getByTestId('is-paused')).toHaveTextContent('false');
      expect(screen.getByTestId('is-complete')).toHaveTextContent('false');
      expect(screen.getByTestId('user-answers-count')).toHaveTextContent('0');
      expect(screen.getByTestId('hints-used-count')).toHaveTextContent('0');
    });
  });

  describe('Helper Functions', () => {
    it('should get current question correctly', () => {
      const { result } = renderHook(() => useQuiz(), {
        wrapper: TestWrapper
      });

      // Initially no questions
      expect(result.current.getCurrentQuestion()).toBeNull();

      // Initialize quiz
      act(() => {
        result.current.initializeQuiz(mockQuestions);
      });

      const currentQuestion = result.current.getCurrentQuestion();
      expect(currentQuestion).toEqual(mockQuestions[0]);
    });

    it('should calculate progress correctly', () => {
      const { result } = renderHook(() => useQuiz(), {
        wrapper: TestWrapper
      });

      // Initialize quiz
      act(() => {
        result.current.initializeQuiz(mockQuestions);
      });

      let progress = result.current.getProgress();
      expect(progress).toEqual({
        current: 1,
        total: 2,
        percentage: 50
      });

      // Move to next question
      act(() => {
        result.current.nextQuestion();
      });

      progress = result.current.getProgress();
      expect(progress).toEqual({
        current: 2,
        total: 2,
        percentage: 100
      });
    });

    it('should check hint availability correctly', () => {
      const { result } = renderHook(() => useQuiz(), {
        wrapper: TestWrapper
      });

      // Initialize quiz
      act(() => {
        result.current.initializeQuiz(mockQuestions);
      });

      // Initially hint is available
      expect(result.current.isHintAvailable('easy-1')).toBe(true);

      // Use hint
      act(() => {
        result.current.useHint('easy-1');
      });

      // Hint should no longer be available
      expect(result.current.isHintAvailable('easy-1')).toBe(false);
    });

    it('should get time warning level correctly', () => {
      const { result } = renderHook(() => useQuiz(), {
        wrapper: TestWrapper
      });

      // Normal time (>10 seconds)
      act(() => {
        result.current.updateTimer(20);
      });
      expect(result.current.getTimeWarningLevel()).toBe('normal');

      // Warning time (6-10 seconds)
      act(() => {
        result.current.updateTimer(8);
      });
      expect(result.current.getTimeWarningLevel()).toBe('warning');

      // Danger time (≤5 seconds)
      act(() => {
        result.current.updateTimer(3);
      });
      expect(result.current.getTimeWarningLevel()).toBe('danger');
    });
  });

  describe('Quiz Reducer', () => {
    const initialState: QuizState = {
      currentQuestionIndex: 0,
      questions: [],
      userAnswers: [],
      timeRemaining: 30,
      hintsUsed: [],
      quizStartTime: new Date(),
      quizEndTime: undefined,
      isComplete: false,
      isPaused: false
    };

    it('should handle INITIALIZE_QUIZ action', () => {
      const action = {
        type: QuizActionType.INITIALIZE_QUIZ,
        payload: { questions: mockQuestions }
      };

      const newState = quizReducer(initialState, action);

      expect(newState.questions).toEqual(mockQuestions);
      expect(newState.currentQuestionIndex).toBe(0);
      expect(newState.timeRemaining).toBe(30);
      expect(newState.isComplete).toBe(false);
    });

    it('should handle timer actions', () => {
      let state = quizReducer(initialState, { type: QuizActionType.START_TIMER });
      expect(state.isPaused).toBe(false);
      expect(state.timeRemaining).toBe(30);

      state = quizReducer(state, { type: QuizActionType.PAUSE_TIMER });
      expect(state.isPaused).toBe(true);

      state = quizReducer(state, { type: QuizActionType.RESUME_TIMER });
      expect(state.isPaused).toBe(false);

      state = quizReducer(state, {
        type: QuizActionType.UPDATE_TIMER,
        payload: { timeRemaining: 15 }
      });
      expect(state.timeRemaining).toBe(15);
    });

    it('should handle SUBMIT_ANSWER action', () => {
      const stateWithQuestions = {
        ...initialState,
        questions: mockQuestions
      };

      const action = {
        type: QuizActionType.SUBMIT_ANSWER,
        payload: { selectedAnswerId: 'a1', timeSpent: 10 }
      };

      const newState = quizReducer(stateWithQuestions, action);

      expect(newState.userAnswers).toHaveLength(1);
      expect(newState.userAnswers[0].questionId).toBe('easy-1');
      expect(newState.userAnswers[0].selectedAnswerId).toBe('a1');
      expect(newState.userAnswers[0].isCorrect).toBe(true);
      expect(newState.userAnswers[0].timeSpent).toBe(10);
      expect(newState.isPaused).toBe(true); // Timer paused during feedback
    });

    it('should handle NEXT_QUESTION action', () => {
      const stateWithQuestions = {
        ...initialState,
        questions: mockQuestions,
        currentQuestionIndex: 0
      };

      const newState = quizReducer(stateWithQuestions, { type: QuizActionType.NEXT_QUESTION });

      expect(newState.currentQuestionIndex).toBe(1);
      expect(newState.timeRemaining).toBe(30);
      expect(newState.isPaused).toBe(false);
    });

    it('should complete quiz on last question', () => {
      const stateWithQuestions = {
        ...initialState,
        questions: mockQuestions,
        currentQuestionIndex: 1 // Last question
      };

      const newState = quizReducer(stateWithQuestions, { type: QuizActionType.NEXT_QUESTION });

      expect(newState.isComplete).toBe(true);
      expect(newState.isPaused).toBe(true);
      expect(newState.quizEndTime).toBeDefined();
    });

    it('should handle USE_HINT action', () => {
      const action = {
        type: QuizActionType.USE_HINT,
        payload: { questionId: 'easy-1' }
      };

      const newState = quizReducer(initialState, action);

      expect(newState.hintsUsed).toContain('easy-1');
    });

    it('should not allow duplicate hints', () => {
      const stateWithHint = {
        ...initialState,
        hintsUsed: ['easy-1']
      };

      const action = {
        type: QuizActionType.USE_HINT,
        payload: { questionId: 'easy-1' }
      };

      const newState = quizReducer(stateWithHint, action);

      expect(newState.hintsUsed).toEqual(['easy-1']); // No duplicate
    });

    it('should handle RESET_QUIZ action', () => {
      const modifiedState = {
        ...initialState,
        currentQuestionIndex: 1,
        userAnswers: [
          {
            questionId: 'easy-1',
            selectedAnswerId: 'a1',
            isCorrect: true,
            timeSpent: 10,
            hintUsed: false,
            timestamp: new Date()
          }
        ],
        hintsUsed: ['easy-1'],
        isComplete: true
      };

      const newState = quizReducer(modifiedState, { type: QuizActionType.RESET_QUIZ });

      expect(newState.currentQuestionIndex).toBe(0);
      expect(newState.userAnswers).toHaveLength(0);
      expect(newState.hintsUsed).toHaveLength(0);
      expect(newState.isComplete).toBe(false);
      expect(newState.timeRemaining).toBe(30);
    });
  });

  describe('Scoring Functions', () => {
    it('should calculate quiz results correctly', () => {
      const { result } = renderHook(() => useQuiz(), { wrapper: QuizProvider });

      // Initialize quiz
      act(() => {
        result.current.initializeQuiz(mockQuestions);
      });

      // Submit some answers
      act(() => {
        result.current.submitAnswer('a1', 15); // Correct answer (Koala)
      });

      act(() => {
        result.current.nextQuestion();
      });

      act(() => {
        result.current.submitAnswer('b1', 20); // Wrong answer (Eagle, not Hummingbird)
      });

      const results = result.current.calculateResults();

      expect(results.totalQuestions).toBe(2);
      expect(results.correctAnswers).toBe(1);
      expect(results.percentage).toBe(50);
      expect(results.totalScore).toBeGreaterThan(0);
      expect(results.timeSpent).toBe(35);
      expect(results.hintsUsed).toBe(0);
    });

    it('should get performance feedback correctly', () => {
      const { result } = renderHook(() => useQuiz(), { wrapper: QuizProvider });

      const excellentFeedback = result.current.getPerformanceFeedback(95);
      expect(excellentFeedback.level).toBe('excellent');
      expect(excellentFeedback.emoji).toBe('🏆');

      const poorFeedback = result.current.getPerformanceFeedback(45);
      expect(poorFeedback.level).toBe('needs-improvement');
      expect(poorFeedback.emoji).toBe('💪');
    });

    it('should generate performance analysis correctly', () => {
      const { result } = renderHook(() => useQuiz(), { wrapper: QuizProvider });

      const mockResults = {
        totalScore: 60,
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

      const analysis = result.current.getPerformanceAnalysis(mockResults);

      expect(analysis.overallGrade).toBe('A+');
      expect(analysis.strengths).toContain('Strong foundation with basic animal facts');
      expect(analysis.recommendations).toContain('Consider exploring advanced zoology or marine biology topics');
    });
  });
});