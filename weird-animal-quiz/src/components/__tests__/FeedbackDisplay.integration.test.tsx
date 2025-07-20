/**
 * FeedbackDisplay Integration Tests
 * Simple tests to verify core functionality works
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FeedbackDisplay } from '../FeedbackDisplay';
import type { Question, Answer } from '../../types/quiz';
import { Difficulty } from '../../types/quiz';

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

// Mock timers
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('FeedbackDisplay Integration Tests', () => {
  it('renders and displays correct feedback', async () => {
    const onNextMock = vi.fn();
    
    render(
      <FeedbackDisplay
        question={mockQuestion}
        selectedAnswer={correctAnswer}
        isCorrect={true}
        onNext={onNextMock}
        show={true}
        minReadingTime={1}
      />
    );

    // Should show the dialog
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Should show correct feedback
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
    
    // Should show content
    expect(screen.getByText('Explanation')).toBeInTheDocument();
    expect(screen.getByText('Fun Fact')).toBeInTheDocument();
    expect(screen.getByText(mockQuestion.explanation)).toBeInTheDocument();
    expect(screen.getByText(mockQuestion.funFact)).toBeInTheDocument();
  });

  it('renders and displays incorrect feedback', async () => {
    const onNextMock = vi.fn();
    
    render(
      <FeedbackDisplay
        question={mockQuestion}
        selectedAnswer={wrongAnswer}
        isCorrect={false}
        onNext={onNextMock}
        show={true}
        minReadingTime={1}
      />
    );

    // Should show the dialog
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Should show incorrect feedback
    expect(screen.getByText('Incorrect')).toBeInTheDocument();
    expect(screen.getByText('✗')).toBeInTheDocument();
    
    // Should show both selected and correct answers
    expect(screen.getByText('Your answer:')).toBeInTheDocument();
    expect(screen.getByText('Wrong Answer 1')).toBeInTheDocument();
    expect(screen.getByText('Correct answer:')).toBeInTheDocument();
    expect(screen.getByText('Correct Answer')).toBeInTheDocument();
  });

  it('handles zero reading time correctly', async () => {
    const onNextMock = vi.fn();
    
    render(
      <FeedbackDisplay
        question={mockQuestion}
        selectedAnswer={correctAnswer}
        isCorrect={true}
        onNext={onNextMock}
        show={true}
        minReadingTime={0}
      />
    );

    // Wait for component to render
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Button should be enabled immediately
    const nextButton = screen.getByRole('button', { name: /next question/i });
    expect(nextButton).toBeEnabled();
  });

  it('enables button after reading time and calls onNext', async () => {
    const onNextMock = vi.fn();
    
    render(
      <FeedbackDisplay
        question={mockQuestion}
        selectedAnswer={correctAnswer}
        isCorrect={true}
        onNext={onNextMock}
        show={true}
        minReadingTime={1}
      />
    );

    // Initially disabled
    expect(screen.getByRole('button', { name: /wait 1s/i })).toBeDisabled();

    // Wait for reading time
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    // Should be enabled
    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /next question/i });
      expect(nextButton).toBeEnabled();
    });

    // Click and verify callback
    fireEvent.click(screen.getByRole('button', { name: /next question/i }));
    
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(onNextMock).toHaveBeenCalledTimes(1);
  });

  it('does not render when show is false', () => {
    render(
      <FeedbackDisplay
        question={mockQuestion}
        selectedAnswer={correctAnswer}
        isCorrect={true}
        onNext={vi.fn()}
        show={false}
        minReadingTime={1}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});