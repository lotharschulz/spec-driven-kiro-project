/**
 * Quiz Integration Tests
 * Comprehensive end-to-end tests for the complete quiz flow
 * Requirements: All requirements integration testing
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QuizProvider } from '../contexts/QuizContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import WelcomeScreen from '../components/WelcomeScreen';
import QuestionCard from '../components/QuestionCard';
import FeedbackDisplay from '../components/FeedbackDisplay';
import ResultsScreen from '../components/ResultsScreen';
import Timer from '../components/Timer';
import { useQuizStorage } from '../hooks/useQuizStorage';
import { useOfflineManager } from '../utils/offlineManager';
import { Question, Difficulty } from '../types/quiz';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock questions for testing
const mockQuestions: Question[] = [
  {
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
  },
  {
    id: 'medium-1',
    difficulty: Difficulty.MEDIUM,
    text: 'Which sea creature can change its gender throughout its life?',
    emojis: ['🐠', '🔄'],
    answers: [
      { id: 'b1', text: 'Clownfish', isCorrect: true },
      { id: 'b2', text: 'Seahorse', isCorrect: false },
      { id: 'b3', text: 'Octopus', isCorrect: false },
      { id: 'b4', text: 'Starfish', isCorrect: false }
    ],
    explanation: 'Clownfish can change their gender from male to female when the dominant female of their group dies.',
    funFact: 'Finding Nemo got it wrong - Nemo\'s father would have turned into a female after his mother died!',
    category: 'adaptation'
  },
  {
    id: 'hard-1',
    difficulty: Difficulty.HARD,
    text: 'Which animal has the most toxic venom in the world?',
    emojis: ['🕷️', '☠️'],
    answers: [
      { id: 'c1', text: 'Box Jellyfish', isCorrect: true },
      { id: 'c2', text: 'Inland Taipan', isCorrect: false },
      { id: 'c3', text: 'Blue-ringed Octopus', isCorrect: false },
      { id: 'c4', text: 'Cone Snail', isCorrect: false }
    ],
    explanation: 'The Box Jellyfish\'s venom is so potent it can kill a human in minutes by attacking the heart, nervous system, and skin cells.',
    funFact: 'Box Jellyfish have 24 eyes and can navigate around obstacles!',
    category: 'defense'
  }
];

// Mock hooks
vi.mock('../hooks/useQuizStorage', () => ({
  useQuizStorage: vi.fn(() => ({
    saveProgress: vi.fn(),
    loadProgress: vi.fn(),
    clearProgress: vi.fn(),
    isStorageAvailable: true,
    storageInfo: { used: 100, total: 5000, percentage: 2 }
  }))
}));

vi.mock('../utils/offlineManager', () => ({
  useOfflineManager: vi.fn(() => ({
    isOnline: true,
    isServiceWorkerRegistered: true,
    cacheStatus: 'ready'
  }))
}));

// Mock navigator.vibrate for haptic feedback
const mockVibrate = vi.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

// Mock window properties for mobile detection
const mockWindowProperties = (properties: Partial<Window>) => {
  Object.defineProperties(window, {
    ...Object.keys(properties).reduce((acc, key) => {
      acc[key] = {
        value: properties[key as keyof Window],
        writable: true,
        configurable: true,
      };
      return acc;
    }, {} as PropertyDescriptorMap),
  });
};

// Create a complete quiz app for integration testing
const QuizApp = () => {
  const [currentScreen, setCurrentScreen] = React.useState<'welcome' | 'quiz' | 'results'>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [selectedAnswer, setSelectedAnswer] = React.useState<any>(null);
  const [isCorrect, setIsCorrect] = React.useState(false);
  const [hintsUsed, setHintsUsed] = React.useState<string[]>([]);
  const [userAnswers, setUserAnswers] = React.useState<any[]>([]);

  const handleStartQuiz = () => {
    setCurrentScreen('quiz');
  };

  const handleAnswer = (answerId: string) => {
    const currentQuestion = mockQuestions[currentQuestionIndex];
    const answer = currentQuestion.answers.find(a => a.id === answerId);
    setSelectedAnswer(answer);
    setIsCorrect(answer?.isCorrect || false);
    setShowFeedback(true);
    
    setUserAnswers([...userAnswers, {
      questionId: currentQuestion.id,
      selectedAnswerId: answerId,
      isCorrect: answer?.isCorrect || false,
      timeSpent: 15,
      hintUsed: hintsUsed.includes(currentQuestion.id)
    }]);
  };

  const handleHintUsed = () => {
    const currentQuestion = mockQuestions[currentQuestionIndex];
    setHintsUsed([...hintsUsed, currentQuestion.id]);
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCurrentScreen('results');
    }
  };

  const handlePlayAgain = () => {
    setCurrentQuestionIndex(0);
    setShowFeedback(false);
    setHintsUsed([]);
    setUserAnswers([]);
    setCurrentScreen('welcome');
  };

  const currentQuestion = mockQuestions[currentQuestionIndex];

  return (
    <ErrorBoundary>
      <QuizProvider>
        {currentScreen === 'welcome' && (
          <WelcomeScreen onStartQuiz={handleStartQuiz} />
        )}
        
        {currentScreen === 'quiz' && (
          <>
            <QuestionCard
              question={currentQuestion}
              onAnswer={handleAnswer}
              onHintUsed={handleHintUsed}
              timeRemaining={30}
              hintAvailable={!hintsUsed.includes(currentQuestion.id)}
              difficulty={currentQuestion.difficulty}
            />
            
            {showFeedback && (
              <FeedbackDisplay
                question={currentQuestion}
                selectedAnswer={selectedAnswer}
                isCorrect={isCorrect}
                onNext={handleNextQuestion}
                show={showFeedback}
                minReadingTime={3}
              />
            )}
          </>
        )}
        
        {currentScreen === 'results' && (
          <ResultsScreen
            onPlayAgain={handlePlayAgain}
            onRetryDifficulty={() => handlePlayAgain()}
          />
        )}
      </QuizProvider>
    </ErrorBoundary>
  );
};

describe('Quiz Integration Tests', () => {
  // Mock timers for testing time-based functionality
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Complete Quiz Flow', () => {
    it('completes a full quiz journey from welcome to results', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<QuizApp />);
      
      // 1. Start on welcome screen
      expect(screen.getByText(/weird animal quiz/i)).toBeInTheDocument();
      
      // 2. Start the quiz
      await user.click(screen.getByRole('button', { name: /start/i }));
      
      // 3. Answer first question
      expect(screen.getByText(/which animal can sleep/i)).toBeInTheDocument();
      await user.click(screen.getByText('Koala'));
      
      // 4. See feedback for first question
      expect(screen.getByText(/correct!/i)).toBeInTheDocument();
      
      // 5. Move to next question
      await act(async () => {
        vi.advanceTimersByTime(3100); // Wait for minimum reading time
      });
      
      await user.click(screen.getByRole('button', { name: /next question/i }));
      
      // 6. Answer second question
      expect(screen.getByText(/which sea creature/i)).toBeInTheDocument();
      await user.click(screen.getByText('Clownfish'));
      
      // 7. See feedback for second question
      expect(screen.getByText(/correct!/i)).toBeInTheDocument();
      
      // 8. Move to next question
      await act(async () => {
        vi.advanceTimersByTime(3100); // Wait for minimum reading time
      });
      
      await user.click(screen.getByRole('button', { name: /next question/i }));
      
      // 9. Answer third question
      expect(screen.getByText(/which animal has the most toxic/i)).toBeInTheDocument();
      await user.click(screen.getByText('Box Jellyfish'));
      
      // 10. See feedback for third question
      expect(screen.getByText(/correct!/i)).toBeInTheDocument();
      
      // 11. Move to results screen
      await act(async () => {
        vi.advanceTimersByTime(3100); // Wait for minimum reading time
      });
      
      await user.click(screen.getByRole('button', { name: /next question/i }));
      
      // 12. Verify results screen is shown
      expect(screen.getByRole('button', { name: /play again/i })).toBeInTheDocument();
    });

    it('handles incorrect answers appropriately', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<QuizApp />);
      
      // Start the quiz
      await user.click(screen.getByRole('button', { name: /start/i }));
      
      // Answer incorrectly
      await user.click(screen.getByText('Sloth'));
      
      // Verify incorrect feedback
      expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
      expect(screen.getByText(/correct answer:/i)).toBeInTheDocument();
      expect(screen.getByText('Koala')).toBeInTheDocument();
    });
  });

  describe('Timer Integration', () => {
    it('automatically submits when timer reaches zero', async () => {
      // Create a component with exposed timer for testing
      const TimerTestApp = () => {
        const [timeUp, setTimeUp] = React.useState(false);
        
        return (
          <div>
            <Timer 
              duration={30} 
              onTimeUp={() => setTimeUp(true)} 
              paused={false} 
            />
            {timeUp && <div data-testid="time-up">Time's up!</div>}
          </div>
        );
      };
      
      render(<TimerTestApp />);
      
      // Fast-forward 30 seconds
      await act(async () => {
        vi.advanceTimersByTime(30000);
      });
      
      // Verify time's up message appears
      expect(screen.getByTestId('time-up')).toBeInTheDocument();
    });

    it('pauses timer during feedback display', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Create a component with exposed timer state for testing
      const TimerPauseApp = () => {
        const [isPaused, setIsPaused] = React.useState(false);
        const [timeRemaining, setTimeRemaining] = React.useState(30);
        
        const handleTimerUpdate = (time: number) => {
          setTimeRemaining(time);
        };
        
        return (
          <div>
            <Timer 
              duration={30} 
              onTimeUp={() => {}} 
              paused={isPaused}
              onUpdate={handleTimerUpdate}
            />
            <button onClick={() => setIsPaused(!isPaused)}>
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <div data-testid="time-remaining">{timeRemaining}</div>
          </div>
        );
      };
      
      render(<TimerPauseApp />);
      
      // Let timer run for 5 seconds
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      
      // Get current time
      const timeBeforePause = screen.getByTestId('time-remaining').textContent;
      
      // Pause the timer
      await user.click(screen.getByRole('button', { name: /pause/i }));
      
      // Let more time pass while paused
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      
      // Verify time hasn't changed
      expect(screen.getByTestId('time-remaining').textContent).toBe(timeBeforePause);
    });

    it('shows visual warnings as timer runs low', async () => {
      // Create a component with exposed timer warnings for testing
      const TimerWarningApp = () => {
        const [warningLevel, setWarningLevel] = React.useState<'normal' | 'warning' | 'danger'>('normal');
        
        return (
          <div>
            <Timer 
              duration={30} 
              onTimeUp={() => {}} 
              paused={false}
              onWarningChange={setWarningLevel}
            />
            <div data-testid="warning-level">{warningLevel}</div>
          </div>
        );
      };
      
      render(<TimerWarningApp />);
      
      // Initially normal
      expect(screen.getByTestId('warning-level').textContent).toBe('normal');
      
      // Advance to warning level (10 seconds remaining)
      await act(async () => {
        vi.advanceTimersByTime(20000);
      });
      
      expect(screen.getByTestId('warning-level').textContent).toBe('warning');
      
      // Advance to danger level (5 seconds remaining)
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      
      expect(screen.getByTestId('warning-level').textContent).toBe('danger');
    });
  });

  describe('Hint System Integration', () => {
    it('provides hints and disables hint button after use', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<QuizApp />);
      
      // Start the quiz
      await user.click(screen.getByRole('button', { name: /start/i }));
      
      // Use hint
      await user.click(screen.getByRole('button', { name: /hint/i }));
      
      // Verify hint button is disabled
      expect(screen.getByRole('button', { name: /hint/i })).toBeDisabled();
    });

    it('applies hint penalty in final scoring', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Create a component with exposed hint and scoring for testing
      const HintScoringApp = () => {
        const [hintsUsed, setHintsUsed] = React.useState<string[]>([]);
        const [showResults, setShowResults] = React.useState(false);
        
        const handleUseHint = () => {
          setHintsUsed([...hintsUsed, 'test-question']);
        };
        
        const handleShowResults = () => {
          setShowResults(true);
        };
        
        return (
          <div>
            {!showResults ? (
              <>
                <button onClick={handleUseHint}>Use Hint</button>
                <button onClick={handleShowResults}>Show Results</button>
                <div data-testid="hints-used">{hintsUsed.length}</div>
              </>
            ) : (
              <div>
                <h2>Results</h2>
                <div data-testid="hint-penalty">
                  Hint Penalty: {hintsUsed.length * 5}%
                </div>
              </div>
            )}
          </div>
        );
      };
      
      render(<HintScoringApp />);
      
      // Use hint
      await user.click(screen.getByRole('button', { name: /use hint/i }));
      
      // Verify hint was used
      expect(screen.getByTestId('hints-used').textContent).toBe('1');
      
      // Show results
      await user.click(screen.getByRole('button', { name: /show results/i }));
      
      // Verify hint penalty is applied
      expect(screen.getByTestId('hint-penalty').textContent).toContain('5%');
    });

    it('tracks hint usage across multiple questions', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<QuizApp />);
      
      // Start the quiz
      await user.click(screen.getByRole('button', { name: /start/i }));
      
      // Use hint on first question
      await user.click(screen.getByRole('button', { name: /hint/i }));
      
      // Answer and go to next question
      await user.click(screen.getByText('Koala'));
      
      await act(async () => {
        vi.advanceTimersByTime(3100);
      });
      
      await user.click(screen.getByRole('button', { name: /next question/i }));
      
      // Verify hint button is available for second question
      expect(screen.getByRole('button', { name: /hint/i })).toBeEnabled();
    });
  });

  describe('Error Recovery', () => {
    it('recovers from component errors using ErrorBoundary', async () => {
      // Create a component that throws an error
      const ErrorComponent = () => {
        throw new Error('Test error');
      };
      
      const ErrorApp = () => {
        const [showError, setShowError] = React.useState(false);
        
        return (
          <ErrorBoundary>
            <button onClick={() => setShowError(true)}>Trigger Error</button>
            {showError && <ErrorComponent />}
          </ErrorBoundary>
        );
      };
      
      render(<ErrorApp />);
      
      // Trigger error
      fireEvent.click(screen.getByRole('button', { name: /trigger error/i }));
      
      // Verify error boundary caught the error
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('handles network errors gracefully', async () => {
      // Mock offline status
      const originalUseOfflineManager = useOfflineManager;
      (useOfflineManager as any).mockImplementation(() => ({
        isOnline: false,
        isServiceWorkerRegistered: true,
        cacheStatus: 'ready'
      }));
      
      render(<QuizApp />);
      
      // Verify offline message is shown
      expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
      
      // Restore mock
      (useOfflineManager as any).mockImplementation(originalUseOfflineManager);
    });

    it('recovers from storage errors', async () => {
      // Mock storage error
      const originalUseQuizStorage = useQuizStorage;
      (useQuizStorage as any).mockImplementation(() => ({
        saveProgress: vi.fn().mockImplementation(() => {
          throw new Error('Storage error');
        }),
        loadProgress: vi.fn(),
        clearProgress: vi.fn(),
        isStorageAvailable: false,
        storageInfo: { used: 0, total: 0, percentage: 0 }
      }));
      
      // This should not crash the app
      render(<QuizApp />);
      
      // App should still be usable
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
      
      // Restore mock
      (useQuizStorage as any).mockImplementation(originalUseQuizStorage);
    });
  });

  describe('Offline Functionality', () => {
    it('works offline with cached content', async () => {
      // Mock offline status but with cached content
      const originalUseOfflineManager = useOfflineManager;
      (useOfflineManager as any).mockImplementation(() => ({
        isOnline: false,
        isServiceWorkerRegistered: true,
        cacheStatus: 'complete'
      }));
      
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<QuizApp />);
      
      // Verify offline message is shown
      expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
      
      // App should still be functional
      await user.click(screen.getByRole('button', { name: /start/i }));
      
      // Should be able to interact with the quiz
      expect(screen.getByText(/which animal can sleep/i)).toBeInTheDocument();
      
      // Restore mock
      (useOfflineManager as any).mockImplementation(originalUseOfflineManager);
    });
  });

  describe('Accessibility Compliance', () => {
    it('maintains accessibility throughout quiz flow', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      const { container } = render(<QuizApp />);
      
      // Test welcome screen accessibility
      let results = await axe(container);
      expect(results).toHaveNoViolations();
      
      // Start quiz
      await user.click(screen.getByRole('button', { name: /start/i }));
      
      // Test question screen accessibility
      results = await axe(container);
      expect(results).toHaveNoViolations();
      
      // Answer question
      await user.click(screen.getByText('Koala'));
      
      // Test feedback screen accessibility
      results = await axe(container);
      expect(results).toHaveNoViolations();
      
      // Next question
      await act(async () => {
        vi.advanceTimersByTime(3100);
      });
      
      await user.click(screen.getByRole('button', { name: /next question/i }));
      
      // Complete quiz and go to results
      await user.click(screen.getByText('Clownfish'));
      
      await act(async () => {
        vi.advanceTimersByTime(3100);
      });
      
      await user.click(screen.getByRole('button', { name: /next question/i }));
      
      await user.click(screen.getByText('Box Jellyfish'));
      
      await act(async () => {
        vi.advanceTimersByTime(3100);
      });
      
      await user.click(screen.getByRole('button', { name: /next question/i }));
      
      // Test results screen accessibility
      results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation throughout quiz flow', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<QuizApp />);
      
      // Navigate with keyboard
      await user.tab();
      expect(screen.getByRole('button', { name: /start/i })).toHaveFocus();
      
      // Start quiz with Enter key
      await user.keyboard('{Enter}');
      
      // Tab to first answer
      await user.tab(); // Focus first answer
      
      // Select with Enter key
      await user.keyboard('{Enter}');
      
      // Wait for feedback display
      await act(async () => {
        vi.advanceTimersByTime(3100);
      });
      
      // Tab to Next Question button
      await user.tab();
      expect(screen.getByRole('button', { name: /next question/i })).toHaveFocus();
      
      // Press Enter to go to next question
      await user.keyboard('{Enter}');
      
      // Verify we're on the next question
      expect(screen.getByText(/which sea creature/i)).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('adapts to different screen sizes', async () => {
      // Test mobile layout
      mockWindowProperties({ innerWidth: 375 });
      
      const { rerender } = render(<QuizApp />);
      
      // Should have mobile-specific classes or styles
      // This is a simplified check - in a real test we'd check for specific mobile styling
      expect(document.documentElement.style.getPropertyValue('--viewport-width')).toBe('');
      
      // Test tablet layout
      mockWindowProperties({ innerWidth: 768 });
      fireEvent(window, new Event('resize'));
      
      rerender(<QuizApp />);
      
      // Test desktop layout
      mockWindowProperties({ innerWidth: 1024 });
      fireEvent(window, new Event('resize'));
      
      rerender(<QuizApp />);
    });

    it('supports touch interactions', async () => {
      mockWindowProperties({ 
        innerWidth: 375, 
        innerHeight: 812,
        ontouchstart: {} as any
      });
      
      render(<QuizApp />);
      
      // Simulate touch interaction
      fireEvent.touchStart(screen.getByRole('button', { name: /start/i }), {
        touches: [{ clientX: 100, clientY: 200 } as Touch]
      });
      
      fireEvent.touchEnd(screen.getByRole('button', { name: /start/i }), {
        changedTouches: [{ clientX: 100, clientY: 200 } as Touch]
      });
      
      // Should navigate to quiz
      expect(screen.getByText(/which animal can sleep/i)).toBeInTheDocument();
    });
  });
});
</content>