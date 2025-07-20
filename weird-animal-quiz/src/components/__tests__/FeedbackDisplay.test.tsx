/**
 * FeedbackDisplay Component Tests
 * Tests feedback timing, animations, and user interaction flow
 * Implements requirements: 2.3, 2.4, 2.5, 2.6, 2.9, 3.4, 3.8, 3.9
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FeedbackDisplay } from '../FeedbackDisplay';
import type { Question, Answer } from '../../types/quiz';
import { Difficulty } from '../../types/quiz';
import styles from '../FeedbackDisplay.module.css';

// Mock question data
const mockQuestion: Question = {
  id: 'test-question',
  difficulty: Difficulty.EASY,
  text: 'Test question about animals?',
  emojis: ['🐨', '😴'],
  answers: [
    { id: 'correct', text: 'Correct Answer', isCorrect: true },
    { id: 'wrong1', text: 'Wrong Answer 1', isCorrect: false },
    { id: 'wrong2', text: 'Wrong Answer 2', isCorrect: false },
    { id: 'wrong3', text: 'Wrong Answer 3', isCorrect: false }
  ],
  explanation: 'This is the detailed explanation of why the answer is correct.',
  funFact: 'Here is a fascinating fun fact about the topic that will amaze users.',
  category: 'behavior'
};

const correctAnswer: Answer = mockQuestion.answers[0];
const wrongAnswer: Answer = mockQuestion.answers[1];

// Mock props
const defaultProps = {
  question: mockQuestion,
  selectedAnswer: correctAnswer,
  isCorrect: true,
  onNext: vi.fn(),
  show: true,
  minReadingTime: 3 // Shorter time for testing
};

// Mock timers
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('FeedbackDisplay Component', () => {
  describe('Rendering and Visibility', () => {
    it('renders when show prop is true', () => {
      render(<FeedbackDisplay {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Correct!')).toBeInTheDocument();
    });

    it('does not render when show prop is false', () => {
      render(<FeedbackDisplay {...defaultProps} show={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows correct feedback for correct answer', () => {
      render(<FeedbackDisplay {...defaultProps} />);
      
      expect(screen.getByText('Correct!')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
      expect(screen.getByText('Your answer:')).toBeInTheDocument();
      expect(screen.getByText('Correct Answer')).toBeInTheDocument();
    });

    it('shows incorrect feedback for wrong answer', () => {
      render(
        <FeedbackDisplay 
          {...defaultProps} 
          selectedAnswer={wrongAnswer}
          isCorrect={false}
        />
      );
      
      expect(screen.getByText('Incorrect')).toBeInTheDocument();
      expect(screen.getByText('✗')).toBeInTheDocument();
      expect(screen.getByText('Your answer:')).toBeInTheDocument();
      expect(screen.getByText('Wrong Answer 1')).toBeInTheDocument();
      expect(screen.getByText('Correct answer:')).toBeInTheDocument();
      expect(screen.getByText('Correct Answer')).toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('displays explanation section with proper content', () => {
      render(<FeedbackDisplay {...defaultProps} />);
      
      expect(screen.getByText('Explanation')).toBeInTheDocument();
      expect(screen.getByText(mockQuestion.explanation)).toBeInTheDocument();
      expect(screen.getByText('📚')).toBeInTheDocument();
    });

    it('displays fun fact section with proper content', () => {
      render(<FeedbackDisplay {...defaultProps} />);
      
      expect(screen.getByText('Fun Fact')).toBeInTheDocument();
      expect(screen.getByText(mockQuestion.funFact)).toBeInTheDocument();
      expect(screen.getByText('🤓')).toBeInTheDocument();
    });

    it('shows celebration animation for correct answers', async () => {
      render(<FeedbackDisplay {...defaultProps} />);
      
      // Wait for component to become visible
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      // Check for confetti elements using CSS module class
      const confettiContainer = document.querySelector(`.${styles.celebrationOverlay}`);
      expect(confettiContainer).toBeInTheDocument();
    });

    it('does not show celebration animation for incorrect answers', async () => {
      render(
        <FeedbackDisplay 
          {...defaultProps} 
          selectedAnswer={wrongAnswer}
          isCorrect={false}
        />
      );
      
      // Wait for component to render
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      const confettiContainer = document.querySelector(`.${styles.celebrationOverlay}`);
      expect(confettiContainer).not.toBeInTheDocument();
    });
  });

  describe('Timer and Reading Time', () => {
    it('shows reading timer with correct initial time', () => {
      render(<FeedbackDisplay {...defaultProps} minReadingTime={5} />);
      
      expect(screen.getByText('Please read for 5 more seconds')).toBeInTheDocument();
    });

    it('disables Next button during reading time', () => {
      render(<FeedbackDisplay {...defaultProps} minReadingTime={5} />);
      
      const nextButton = screen.getByRole('button', { name: /wait 5s/i });
      expect(nextButton).toBeDisabled();
    });

    it('updates timer countdown correctly', async () => {
      render(<FeedbackDisplay {...defaultProps} minReadingTime={3} />);
      
      // Wait for initial render and timer setup
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      expect(screen.getByText('Please read for 3 more seconds')).toBeInTheDocument();
      
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Please read for 2 more seconds')).toBeInTheDocument();
      });
      
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Please read for 1 more second')).toBeInTheDocument();
      });
    });

    it('enables Next button after reading time expires', async () => {
      render(<FeedbackDisplay {...defaultProps} minReadingTime={2} />);
      
      // Wait for initial render
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      // Initially disabled
      expect(screen.getByRole('button', { name: /wait 2s/i })).toBeDisabled();
      
      // Advance timer past reading time
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });
      
      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next question/i });
        expect(nextButton).toBeEnabled();
      });
    });

    it('shows progress bar that fills over time', async () => {
      render(<FeedbackDisplay {...defaultProps} minReadingTime={4} />);
      
      // Wait for component to render
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      const progressBar = document.querySelector(`.${styles.timerProgress}`);
      expect(progressBar).toBeInTheDocument();
      
      // Initially at 0%
      expect(progressBar).toHaveStyle('width: 0%');
      
      // After 1 second, should be 25%
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(progressBar).toHaveStyle('width: 25%');
      });
      
      // After 2 seconds, should be 50%
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(progressBar).toHaveStyle('width: 50%');
      });
    });
  });

  describe('User Interactions', () => {
    it('calls onNext when Next button is clicked after reading time', async () => {
      const onNextMock = vi.fn();
      render(
        <FeedbackDisplay 
          {...defaultProps} 
          onNext={onNextMock}
          minReadingTime={1}
        />
      );
      
      // Wait for initial render and reading time to expire
      await act(async () => {
        vi.advanceTimersByTime(1100);
      });
      
      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next question/i });
        expect(nextButton).toBeEnabled();
      });
      
      fireEvent.click(screen.getByRole('button', { name: /next question/i }));
      
      // Should call onNext after fade out animation
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(onNextMock).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call onNext when button is clicked during reading time', () => {
      const onNextMock = vi.fn();
      render(
        <FeedbackDisplay 
          {...defaultProps} 
          onNext={onNextMock}
          minReadingTime={5}
        />
      );
      
      const nextButton = screen.getByRole('button', { name: /wait 5s/i });
      fireEvent.click(nextButton);
      
      expect(onNextMock).not.toHaveBeenCalled();
    });

    it('handles keyboard navigation properly', async () => {
      render(<FeedbackDisplay {...defaultProps} minReadingTime={1} />);
      
      // Wait for reading time
      await act(async () => {
        vi.advanceTimersByTime(1100);
      });
      
      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next question/i });
        expect(nextButton).toBeEnabled();
        
        // Should be focusable
        nextButton.focus();
        expect(nextButton).toHaveFocus();
      });
    });
  });

  describe('Animations and Transitions', () => {
    it('applies correct CSS classes for animations', async () => {
      render(<FeedbackDisplay {...defaultProps} />);
      
      const overlay = screen.getByRole('dialog').parentElement;
      
      // Should start without visible class
      expect(overlay).not.toHaveClass(styles.visible);
      
      // Should become visible after delay
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(overlay).toHaveClass(styles.visible);
      });
    });

    it('applies correct styling for correct answers', async () => {
      render(<FeedbackDisplay {...defaultProps} />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      const container = document.querySelector(`.${styles.feedbackContainer}`);
      expect(container).toHaveClass(styles.correct);
    });

    it('applies correct styling for incorrect answers', async () => {
      render(
        <FeedbackDisplay 
          {...defaultProps} 
          selectedAnswer={wrongAnswer}
          isCorrect={false}
        />
      );
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      const container = document.querySelector(`.${styles.feedbackContainer}`);
      expect(container).toHaveClass(styles.incorrect);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<FeedbackDisplay {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'feedback-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'feedback-content');
    });

    it('has proper heading structure', () => {
      render(<FeedbackDisplay {...defaultProps} />);
      
      // Main title should be h2
      expect(screen.getByRole('heading', { level: 2, name: 'Correct!' })).toBeInTheDocument();
      
      // Section titles should be h3
      expect(screen.getByRole('heading', { level: 3, name: /explanation/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /fun fact/i })).toBeInTheDocument();
    });

    it('provides proper button descriptions when disabled', () => {
      render(<FeedbackDisplay {...defaultProps} minReadingTime={5} />);
      
      const nextButton = screen.getByRole('button', { name: /wait 5s/i });
      expect(nextButton).toHaveAttribute('aria-describedby');
    });

    it('hides decorative elements from screen readers', async () => {
      render(<FeedbackDisplay {...defaultProps} />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      const confetti = document.querySelector(`.${styles.celebrationOverlay}`);
      expect(confetti).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('handles zero reading time correctly', async () => {
      render(<FeedbackDisplay {...defaultProps} minReadingTime={0} />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next question/i });
        expect(nextButton).toBeEnabled();
      });
    });

    it('handles very long reading times', () => {
      render(<FeedbackDisplay {...defaultProps} minReadingTime={300} />);
      
      expect(screen.getByText('Please read for 300 more seconds')).toBeInTheDocument();
    });

    it('handles missing correct answer gracefully', () => {
      const questionWithoutCorrectAnswer = {
        ...mockQuestion,
        answers: mockQuestion.answers.map(a => ({ ...a, isCorrect: false }))
      };
      
      render(
        <FeedbackDisplay 
          {...defaultProps}
          question={questionWithoutCorrectAnswer}
          selectedAnswer={wrongAnswer}
          isCorrect={false}
        />
      );
      
      // Should not crash and should not show correct answer section
      expect(screen.queryByText('Correct answer:')).not.toBeInTheDocument();
    });

    it('resets state when show prop changes', async () => {
      const { rerender } = render(<FeedbackDisplay {...defaultProps} minReadingTime={5} />);
      
      // Initially showing with timer
      expect(screen.getByText('Please read for 5 more seconds')).toBeInTheDocument();
      
      // Hide component
      rerender(<FeedbackDisplay {...defaultProps} show={false} minReadingTime={5} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      
      // Show again - should reset timer
      rerender(<FeedbackDisplay {...defaultProps} show={true} minReadingTime={5} />);
      expect(screen.getByText('Please read for 5 more seconds')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('cleans up timers when component unmounts', () => {
      const { unmount } = render(<FeedbackDisplay {...defaultProps} minReadingTime={10} />);
      
      // Verify timer is running
      expect(screen.getByText('Please read for 10 more seconds')).toBeInTheDocument();
      
      // Unmount component
      unmount();
      
      // Advance time - should not cause any errors
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      
      // No errors should occur
    });

    it('does not create multiple timers when props change', async () => {
      const { rerender } = render(<FeedbackDisplay {...defaultProps} minReadingTime={5} />);
      
      // Wait for initial render
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      // Change props multiple times quickly
      rerender(<FeedbackDisplay {...defaultProps} minReadingTime={5} show={true} />);
      rerender(<FeedbackDisplay {...defaultProps} minReadingTime={5} show={true} />);
      rerender(<FeedbackDisplay {...defaultProps} minReadingTime={5} show={true} />);
      
      // Should still work correctly
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Please read for 4 more seconds')).toBeInTheDocument();
      });
    });
  });
});