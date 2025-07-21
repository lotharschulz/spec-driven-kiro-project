/**
 * Timer Integration Tests
 * Tests timer functionality with question progression and feedback display
 * Requirements: 2.1, 2.2, 2.3, 2.7, 2.8
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QuizProvider } from '../contexts/QuizContext';
import Timer from '../components/Timer';
import QuestionCard from '../components/QuestionCard';
import FeedbackDisplay from '../components/FeedbackDisplay';
import { Question, Difficulty } from '../types/quiz';

// Mock question for testing
const mockQuestion: Question = {
  id: 'test-question',
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
};

// Create a component for testing timer integration
const TimerIntegrationTest = () => {
  const [timeRemaining, setTimeRemaining] = React.useState(30);
  const [isPaused, setIsPaused] = React.useState(false);
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [selectedAnswer, setSelectedAnswer] = React.useState<any>(null);
  const [isCorrect, setIsCorrect] = React.useState(false);
  const [isTimeUp, setIsTimeUp] = React.useState(false);
  
  const handleTimerUpdate = (time: number) => {
    setTimeRemaining(time);
  };
  
  const handleTimeUp = () => {
    setIsTimeUp(true);
    setIsPaused(true);
    setShowFeedback(true);
    // Auto-select first answer when time is up (simulating auto-submission)
    setSelectedAnswer(mockQuestion.answers[0]);
    setIsCorrect(false);
  };
  
  const handleAnswer = (answerId: string) => {
    const answer = mockQuestion.answers.find(a => a.id === answerId);
    setSelectedAnswer(answer);
    setIsCorrect(answer?.isCorrect || false);
    setIsPaused(true);
    setShowFeedback(true);
  };
  
  const handleNextQuestion = () => {
    setShowFeedback(false);
    setIsPaused(false);
    setTimeRemaining(30);
    setIsTimeUp(false);
  };
  
  return (
    <div>
      <div data-testid="timer-display">
        <Timer 
          duration={30} 
          onTimeUp={handleTimeUp} 
          paused={isPaused}
          onUpdate={handleTimerUpdate}
        />
        <span data-testid="time-remaining">{timeRemaining}</span>
        <span data-testid="timer-paused">{isPaused ? 'Paused' : 'Running'}</span>
        <span data-testid="time-up">{isTimeUp ? 'Time Up' : 'Time Remaining'}</span>
      </div>
      
      {!showFeedback && (
        <QuestionCard
          question={mockQuestion}
          onAnswer={handleAnswer}
          onHintUsed={() => {}}
          timeRemaining={timeRemaining}
          hintAvailable={true}
          difficulty="easy"
        />
      )}
      
      {showFeedback && (
        <FeedbackDisplay
          question={mockQuestion}
          selectedAnswer={selectedAnswer}
          isCorrect={isCorrect}
          onNext={handleNextQuestion}
          show={showFeedback}
          minReadingTime={3}
        />
      )}
    </div>
  );
};

describe('Timer Integration Tests', () => {
  // Mock timers for testing time-based functionality
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('starts timer when question is displayed', () => {
    render(
      <QuizProvider>
        <TimerIntegrationTest />
      </QuizProvider>
    );
    
    // Timer should be running initially
    expect(screen.getByTestId('timer-paused').textContent).toBe('Running');
    expect(screen.getByTestId('time-remaining').textContent).toBe('30');
  });

  it('updates timer display as time passes', async () => {
    render(
      <QuizProvider>
        <TimerIntegrationTest />
      </QuizProvider>
    );
    
    // Advance time by 5 seconds
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    
    // Timer should show decreased time
    expect(screen.getByTestId('time-remaining').textContent).toBe('25');
  });

  it('pauses timer when answer is submitted', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    render(
      <QuizProvider>
        <TimerIntegrationTest />
      </QuizProvider>
    );
    
    // Answer the question
    await user.click(screen.getByText('Koala'));
    
    // Timer should be paused
    expect(screen.getByTestId('timer-paused').textContent).toBe('Paused');
    
    // Advance time by 5 seconds
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    
    // Time should not have changed while paused
    const timeAfterPause = screen.getByTestId('time-remaining').textContent;
    
    // Advance more time
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    
    // Time should still be the same
    expect(screen.getByTestId('time-remaining').textContent).toBe(timeAfterPause);
  });

  it('resumes timer when moving to next question', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    render(
      <QuizProvider>
        <TimerIntegrationTest />
      </QuizProvider>
    );
    
    // Answer the question
    await user.click(screen.getByText('Koala'));
    
    // Timer should be paused
    expect(screen.getByTestId('timer-paused').textContent).toBe('Paused');
    
    // Wait for minimum reading time
    await act(async () => {
      vi.advanceTimersByTime(3100);
    });
    
    // Move to next question
    await user.click(screen.getByRole('button', { name: /next question/i }));
    
    // Timer should be running again
    expect(screen.getByTestId('timer-paused').textContent).toBe('Running');
    
    // Timer should be reset to 30 seconds
    expect(screen.getByTestId('time-remaining').textContent).toBe('30');
  });

  it('auto-submits when timer reaches zero', async () => {
    render(
      <QuizProvider>
        <TimerIntegrationTest />
      </QuizProvider>
    );
    
    // Advance time to zero
    await act(async () => {
      vi.advanceTimersByTime(30000);
    });
    
    // Time up flag should be set
    expect(screen.getByTestId('time-up').textContent).toBe('Time Up');
    
    // Feedback should be shown
    expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
    
    // Timer should be paused
    expect(screen.getByTestId('timer-paused').textContent).toBe('Paused');
  });

  it('provides visual warnings as timer runs low', async () => {
    // Create a component with exposed timer warnings for testing
    const TimerWarningTest = () => {
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
    
    render(
      <QuizProvider>
        <TimerWarningTest />
      </QuizProvider>
    );
    
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

  it('maintains timer state during feedback display', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    render(
      <QuizProvider>
        <TimerIntegrationTest />
      </QuizProvider>
    );
    
    // Advance time by 10 seconds
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    
    // Record current time
    const timeBeforeAnswer = screen.getByTestId('time-remaining').textContent;
    
    // Answer the question
    await user.click(screen.getByText('Koala'));
    
    // Timer should be paused during feedback
    expect(screen.getByTestId('timer-paused').textContent).toBe('Paused');
    
    // Time should not change during feedback
    expect(screen.getByTestId('time-remaining').textContent).toBe(timeBeforeAnswer);
    
    // Wait for minimum reading time
    await act(async () => {
      vi.advanceTimersByTime(3100);
    });
    
    // Move to next question
    await user.click(screen.getByRole('button', { name: /next question/i }));
    
    // Timer should be reset for next question
    expect(screen.getByTestId('time-remaining').textContent).toBe('30');
  });

  it('enforces minimum reading time for feedback', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    render(
      <QuizProvider>
        <TimerIntegrationTest />
      </QuizProvider>
    );
    
    // Answer the question
    await user.click(screen.getByText('Koala'));
    
    // Next button should be disabled initially
    expect(screen.getByRole('button', { name: /wait 3s/i })).toBeDisabled();
    
    // Advance time by 1 second (not enough)
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    
    // Button should still be disabled
    expect(screen.getByRole('button', { name: /wait 2s/i })).toBeDisabled();
    
    // Advance time to complete minimum reading time
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });
    
    // Button should now be enabled
    expect(screen.getByRole('button', { name: /next question/i })).toBeEnabled();
  });
});
</content>