/**
 * Comprehensive Accessibility Tests
 * Tests accessibility compliance across all user flows
 * Requirements: 4.5, 4.6, 4.9
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QuizProvider } from '../contexts/QuizContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import WelcomeScreen from '../components/WelcomeScreen';
import QuestionCard from '../components/QuestionCard';
import FeedbackDisplay from '../components/FeedbackDisplay';
import ResultsScreen from '../components/ResultsScreen';
import Timer from '../components/Timer';
import AccessibilitySettings from '../components/AccessibilitySettings';
import { VisualAccessibility, FocusManager, AriaLabels } from '../utils/accessibility';
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
  }
];

// Create a complete quiz app for accessibility testing
const AccessibleQuizApp = () => {
  const [currentScreen, setCurrentScreen] = React.useState<'welcome' | 'quiz' | 'feedback' | 'results'>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [selectedAnswer, setSelectedAnswer] = React.useState<any>(null);
  const [isCorrect, setIsCorrect] = React.useState(false);
  const [hintsUsed, setHintsUsed] = React.useState<string[]>([]);
  const [showAccessibilitySettings, setShowAccessibilitySettings] = React.useState(false);
  const [accessibilityPreferences, setAccessibilityPreferences] = React.useState({
    highContrast: false,
    largeText: false,
    reducedMotion: false
  });

  // Announce screen changes to screen readers
  React.useEffect(() => {
    let message = '';
    switch (currentScreen) {
      case 'welcome':
        message = 'Welcome to the Weird Animal Quiz. Press tab to navigate and enter to select.';
        break;
      case 'quiz':
        message = `Question ${currentQuestionIndex + 1} of ${mockQuestions.length}. Use arrow keys to navigate answers and enter to select.`;
        break;
      case 'feedback':
        message = `${isCorrect ? 'Correct!' : 'Incorrect.'} ${mockQuestions[currentQuestionIndex].explanation}`;
        break;
      case 'results':
        message = 'Quiz complete. Your results are displayed. Press tab to navigate options.';
        break;
    }
    
    FocusManager.announceToScreenReader(message, 'assertive');
  }, [currentScreen, currentQuestionIndex, isCorrect]);

  // Apply accessibility preferences
  React.useEffect(() => {
    if (accessibilityPreferences.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    if (accessibilityPreferences.largeText) {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }
    
    if (accessibilityPreferences.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }, [accessibilityPreferences]);

  const handleStartQuiz = () => {
    setCurrentScreen('quiz');
  };

  const handleAnswer = (answerId: string) => {
    const currentQuestion = mockQuestions[currentQuestionIndex];
    const answer = currentQuestion.answers.find(a => a.id === answerId);
    setSelectedAnswer(answer);
    setIsCorrect(answer?.isCorrect || false);
    setCurrentScreen('feedback');
  };

  const handleHintUsed = () => {
    const currentQuestion = mockQuestions[currentQuestionIndex];
    setHintsUsed([...hintsUsed, currentQuestion.id]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentScreen('quiz');
    } else {
      setCurrentScreen('results');
    }
  };

  const handlePlayAgain = () => {
    setCurrentQuestionIndex(0);
    setHintsUsed([]);
    setCurrentScreen('welcome');
  };

  const handleAccessibilityToggle = () => {
    setShowAccessibilitySettings(!showAccessibilitySettings);
  };

  const handleAccessibilityChange = (preferences: any) => {
    setAccessibilityPreferences(preferences);
  };

  const currentQuestion = mockQuestions[currentQuestionIndex];

  return (
    <ErrorBoundary>
      <div className="quiz-app" role="application" aria-label="Weird Animal Quiz">
        {/* Skip link for keyboard navigation */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        
        <header role="banner">
          <h1>Weird Animal Quiz</h1>
          <button 
            onClick={handleAccessibilityToggle}
            aria-label="Accessibility settings"
            aria-expanded={showAccessibilitySettings}
          >
            Accessibility
          </button>
        </header>
        
        <main id="main-content">
          {currentScreen === 'welcome' && (
            <WelcomeScreen onStartQuiz={handleStartQuiz} />
          )}
          
          {currentScreen === 'quiz' && (
            <QuestionCard
              question={currentQuestion}
              onAnswer={handleAnswer}
              onHintUsed={handleHintUsed}
              timeRemaining={30}
              hintAvailable={!hintsUsed.includes(currentQuestion.id)}
              difficulty={currentQuestion.difficulty}
            />
          )}
          
          {currentScreen === 'feedback' && (
            <FeedbackDisplay
              question={currentQuestion}
              selectedAnswer={selectedAnswer}
              isCorrect={isCorrect}
              onNext={handleNextQuestion}
              show={true}
              minReadingTime={3}
            />
          )}
          
          {currentScreen === 'results' && (
            <ResultsScreen
              onPlayAgain={handlePlayAgain}
              onRetryDifficulty={() => handlePlayAgain()}
            />
          )}
        </main>
        
        <AccessibilitySettings
          isOpen={showAccessibilitySettings}
          onClose={() => setShowAccessibilitySettings(false)}
          onChange={handleAccessibilityChange}
          preferences={accessibilityPreferences}
        />
        
        <footer role="contentinfo">
          <p>© 2025 Weird Animal Quiz</p>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

describe('Comprehensive Accessibility Tests', () => {
  // Mock timers for testing time-based functionality
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
    
    // Clean up accessibility classes
    document.documentElement.classList.remove('high-contrast');
    document.documentElement.classList.remove('large-text');
    document.documentElement.classList.remove('reduced-motion');
  });

  describe('Complete User Flow Accessibility', () => {
    it('maintains accessibility throughout the entire quiz flow', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      const { container } = render(
        <QuizProvider>
          <AccessibleQuizApp />
        </QuizProvider>
      );
      
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
      
      // Wait for minimum reading time
      await act(async () => {
        vi.advanceTimersByTime(3100);
      });
      
      // Next question
      await user.click(screen.getByRole('button', { name: /next question/i }));
      
      // Test second question accessibility
      results = await axe(container);
      expect(results).toHaveNoViolations();
      
      // Answer second question
      await user.click(screen.getByText('Clownfish'));
      
      // Test feedback screen accessibility
      results = await axe(container);
      expect(results).toHaveNoViolations();
      
      // Wait for minimum reading time
      await act(async () => {
        vi.advanceTimersByTime(3100);
      });
      
      // Go to results
      await user.click(screen.getByRole('button', { name: /next question/i }));
      
      // Test results screen accessibility
      results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains keyboard navigation throughout the entire quiz flow', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <QuizProvider>
          <AccessibleQuizApp />
        </QuizProvider>
      );
      
      // Navigate to start button with keyboard
      await user.tab(); // Skip link
      await user.tab(); // Accessibility button
      await user.tab(); // Start button
      
      // Verify focus is on start button
      expect(screen.getByRole('button', { name: /start/i })).toHaveFocus();
      
      // Start quiz with Enter key
      await user.keyboard('{Enter}');
      
      // Navigate to hint button
      await user.tab(); // First focusable element in quiz
      
      // Navigate to first answer
      await user.tab();
      
      // Verify focus is on first answer
      expect(screen.getByText('Koala').closest('input')).toHaveFocus();
      
      // Select with Space key
      await user.keyboard(' ');
      
      // Wait for minimum reading time
      await act(async () => {
        vi.advanceTimersByTime(3100);
      });
      
      // Tab to Next Question button
      await user.tab();
      
      // Verify focus is on Next Question button
      expect(screen.getByRole('button', { name: /next question/i })).toHaveFocus();
      
      // Press Enter to go to next question
      await user.keyboard('{Enter}');
      
      // Verify we're on the next question
      expect(screen.getByText(/which sea creature/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility Settings Integration', () => {
    it('applies high contrast mode correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <QuizProvider>
          <AccessibleQuizApp />
        </QuizProvider>
      );
      
      // Open accessibility settings
      await user.click(screen.getByRole('button', { name: /accessibility/i }));
      
      // Find and click high contrast toggle
      const highContrastToggle = screen.getByLabelText(/high contrast/i);
      await user.click(highContrastToggle);
      
      // Verify high contrast class is applied
      expect(document.documentElement).toHaveClass('high-contrast');
      
      // Close settings
      await user.click(screen.getByRole('button', { name: /close/i }));
      
      // High contrast should still be applied
      expect(document.documentElement).toHaveClass('high-contrast');
    });

    it('applies large text mode correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <QuizProvider>
          <AccessibleQuizApp />
        </QuizProvider>
      );
      
      // Open accessibility settings
      await user.click(screen.getByRole('button', { name: /accessibility/i }));
      
      // Find and click large text toggle
      const largeTextToggle = screen.getByLabelText(/large text/i);
      await user.click(largeTextToggle);
      
      // Verify large text class is applied
      expect(document.documentElement).toHaveClass('large-text');
    });

    it('applies reduced motion mode correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <QuizProvider>
          <AccessibleQuizApp />
        </QuizProvider>
      );
      
      // Open accessibility settings
      await user.click(screen.getByRole('button', { name: /accessibility/i }));
      
      // Find and click reduced motion toggle
      const reducedMotionToggle = screen.getByLabelText(/reduced motion/i);
      await user.click(reducedMotionToggle);
      
      // Verify reduced motion class is applied
      expect(document.documentElement).toHaveClass('reduced-motion');
    });

    it('maintains accessibility in all accessibility modes', async () => {
      const user = userEvent.setup();
      
      const { container } = render(
        <QuizProvider>
          <AccessibleQuizApp />
        </QuizProvider>
      );
      
      // Open accessibility settings
      await user.click(screen.getByRole('button', { name: /accessibility/i }));
      
      // Enable all accessibility features
      await user.click(screen.getByLabelText(/high contrast/i));
      await user.click(screen.getByLabelText(/large text/i));
      await user.click(screen.getByLabelText(/reduced motion/i));
      
      // Close settings
      await user.click(screen.getByRole('button', { name: /close/i }));
      
      // Test accessibility with all features enabled
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Screen Reader Announcements', () => {
    it('announces screen changes appropriately', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const announceSpy = vi.spyOn(FocusManager, 'announceToScreenReader');
      
      render(
        <QuizProvider>
          <AccessibleQuizApp />
        </QuizProvider>
      );
      
      // Should announce welcome screen
      expect(announceSpy).toHaveBeenCalledWith(
        expect.stringContaining('Welcome to the Weird Animal Quiz'),
        'assertive'
      );
      
      // Start quiz
      await user.click(screen.getByRole('button', { name: /start/i }));
      
      // Should announce question screen
      expect(announceSpy).toHaveBeenCalledWith(
        expect.stringContaining('Question 1 of'),
        'assertive'
      );
      
      // Answer question
      await user.click(screen.getByText('Koala'));
      
      // Should announce feedback
      expect(announceSpy).toHaveBeenCalledWith(
        expect.stringContaining('Correct!'),
        'assertive'
      );
      
      // Wait for minimum reading time
      await act(async () => {
        vi.advanceTimersByTime(3100);
      });
      
      // Next question
      await user.click(screen.getByRole('button', { name: /next question/i }));
      
      // Should announce next question
      expect(announceSpy).toHaveBeenCalledWith(
        expect.stringContaining('Question 2 of'),
        'assertive'
      );
      
      announceSpy.mockRestore();
    });

    it('provides appropriate ARIA labels for interactive elements', () => {
      render(
        <QuizProvider>
          <AccessibleQuizApp />
        </QuizProvider>
      );
      
      // Check for skip link
      expect(screen.getByText('Skip to main content')).toHaveAttribute('href', '#main-content');
      
      // Check for application role
      expect(screen.getByRole('application')).toHaveAttribute('aria-label', 'Weird Animal Quiz');
      
      // Check for banner role
      expect(screen.getByRole('banner')).toBeInTheDocument();
      
      // Check for main content
      expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
      
      // Check for contentinfo role (footer)
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('maintains focus when showing/hiding accessibility settings', async () => {
      const user = userEvent.setup();
      
      render(
        <QuizProvider>
          <AccessibleQuizApp />
        </QuizProvider>
      );
      
      // Store the active element
      const initialActiveElement = document.activeElement;
      
      // Open accessibility settings
      await user.click(screen.getByRole('button', { name: /accessibility/i }));
      
      // Focus should be trapped in the modal
      expect(document.activeElement).not.toBe(initialActiveElement);
      
      // Close settings
      await user.click(screen.getByRole('button', { name: /close/i }));
      
      // Focus should return to the button that opened the modal
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /accessibility/i }));
    });

    it('properly manages focus during quiz progression', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <QuizProvider>
          <AccessibleQuizApp />
        </QuizProvider>
      );
      
      // Start quiz
      await user.click(screen.getByRole('button', { name: /start/i }));
      
      // Focus should be managed - first interactive element should be focusable
      await user.tab();
      expect(document.activeElement).not.toBe(document.body);
      
      // Answer question
      await user.click(screen.getByText('Koala'));
      
      // Wait for minimum reading time
      await act(async () => {
        vi.advanceTimersByTime(3100);
      });
      
      // Focus should be on the Next button in feedback
      await user.tab();
      expect(screen.getByRole('button', { name: /next question/i })).toHaveFocus();
    });
  });

  describe('Error States Accessibility', () => {
    it('maintains accessibility during error states', async () => {
      // Create a component that can trigger errors
      const ErrorStateComponent = () => {
        const [hasError, setHasError] = React.useState(false);
        
        if (hasError) {
          return (
            <div role="alert" aria-live="assertive">
              <h2>Something went wrong</h2>
              <p>We encountered an error. Please try again.</p>
              <button onClick={() => setHasError(false)}>Try Again</button>
            </div>
          );
        }
        
        return (
          <div>
            <button onClick={() => setHasError(true)}>Trigger Error</button>
          </div>
        );
      };
      
      const user = userEvent.setup();
      
      const { container } = render(<ErrorStateComponent />);
      
      // Trigger error
      await user.click(screen.getByText('Trigger Error'));
      
      // Error state should be accessible
      const results = await axe(container);
      expect(results).toHaveNoViolations();
      
      // Error message should have appropriate ARIA attributes
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('Mobile Accessibility', () => {
    it('maintains touch target sizes for mobile accessibility', () => {
      render(
        <QuizProvider>
          <AccessibleQuizApp />
        </QuizProvider>
      );
      
      // All buttons should have minimum touch target size
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight) || 0;
        const minWidth = parseInt(styles.minWidth) || 0;
        const height = parseInt(styles.height) || 0;
        const width = parseInt(styles.width) || 0;
        
        // Either explicit size or min size should meet requirements
        const effectiveHeight = Math.max(minHeight, height);
        const effectiveWidth = Math.max(minWidth, width);
        
        // Should meet WCAG touch target size requirements (44x44px)
        expect(effectiveHeight >= 44 || effectiveWidth >= 44).toBeTruthy();
      });
    });
  });

  describe('Hint System Accessibility', () => {
    it('provides accessible hint functionality', async () => {
      const user = userEvent.setup();
      
      render(
        <QuizProvider>
          <AccessibleQuizApp />
        </QuizProvider>
      );
      
      // Start quiz
      await user.click(screen.getByRole('button', { name: /start/i }));
      
      // Hint button should be accessible
      const hintButton = screen.getByRole('button', { name: /hint/i });
      expect(hintButton).toHaveAccessibleName();
      
      // Use hint
      await user.click(hintButton);
      
      // Hint button should be disabled but still have accessible name
      expect(hintButton).toBeDisabled();
      expect(hintButton).toHaveAccessibleName();
    });
  });

  describe('Timer Accessibility', () => {
    it('provides accessible timer information', async () => {
      render(
        <QuizProvider>
          <AccessibleQuizApp />
        </QuizProvider>
      );
      
      // Start quiz
      fireEvent.click(screen.getByRole('button', { name: /start/i }));
      
      // Timer should have appropriate role
      expect(screen.getByRole('timer')).toBeInTheDocument();
      
      // Timer should have accessible name
      expect(screen.getByRole('timer')).toHaveAccessibleName();
    });

    it('announces time warnings appropriately', async () => {
      const announceSpy = vi.spyOn(FocusManager, 'announceToScreenReader');
      
      // Create a component with exposed timer warnings for testing
      const TimerWarningTest = () => {
        const [warningLevel, setWarningLevel] = React.useState<'normal' | 'warning' | 'danger'>('normal');
        
        React.useEffect(() => {
          if (warningLevel === 'warning') {
            FocusManager.announceToScreenReader('Warning: 10 seconds remaining', 'assertive');
          } else if (warningLevel === 'danger') {
            FocusManager.announceToScreenReader('Danger: 5 seconds remaining', 'assertive');
          }
        }, [warningLevel]);
        
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
      
      render(
        <QuizProvider>
          <TimerWarningTest />
        </QuizProvider>
      );
      
      // Advance to warning level (10 seconds remaining)
      await act(async () => {
        vi.advanceTimersByTime(20000);
      });
      
      // Should announce warning
      expect(announceSpy).toHaveBeenCalledWith(
        'Warning: 10 seconds remaining',
        'assertive'
      );
      
      // Advance to danger level (5 seconds remaining)
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      
      // Should announce danger
      expect(announceSpy).toHaveBeenCalledWith(
        'Danger: 5 seconds remaining',
        'assertive'
      );
      
      announceSpy.mockRestore();
    });
  });
});
</content>