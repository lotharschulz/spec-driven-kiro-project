/**
 * QuestionCard Component Tests
 * Tests for question display and user interaction handling
 * Requirements: 1.2, 1.7, 2.7, 3.3, 3.4, 4.6
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { QuizProvider } from '../../contexts/QuizContext';
import { QuestionCard } from '../QuestionCard';
import { Question, Difficulty } from '../../types/quiz';

// Mock question data
const mockQuestion: Question = {
  id: 'test-question-1',
  difficulty: Difficulty.MEDIUM,
  text: 'Which animal can sleep for up to 22 hours a day?',
  emojis: ['🐨', '😴'],
  answers: [
    { id: 'answer-1', text: 'Koala', isCorrect: true },
    { id: 'answer-2', text: 'Sloth', isCorrect: false },
    { id: 'answer-3', text: 'Panda', isCorrect: false },
    { id: 'answer-4', text: 'Cat', isCorrect: false }
  ],
  explanation: 'Koalas sleep 18-22 hours daily to conserve energy for digesting eucalyptus leaves.',
  funFact: 'Koalas have fingerprints almost identical to humans!',
  category: 'behavior'
};

const mockEasyQuestion: Question = {
  ...mockQuestion,
  id: 'easy-question',
  difficulty: Difficulty.EASY
};

const mockHardQuestion: Question = {
  ...mockQuestion,
  id: 'hard-question',
  difficulty: Difficulty.HARD
};

// Test wrapper with QuizProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QuizProvider>
    {children}
  </QuizProvider>
);

describe('QuestionCard Component', () => {
  const mockOnAnswer = vi.fn();
  const mockOnHintUsed = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders question text correctly', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      expect(screen.getByText(mockQuestion.text)).toBeInTheDocument();
    });

    it('displays all answer options', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      mockQuestion.answers.forEach(answer => {
        expect(screen.getByText(answer.text)).toBeInTheDocument();
      });
    });

    it('shows emojis for the question', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      mockQuestion.emojis.forEach(emoji => {
        expect(screen.getByText(emoji)).toBeInTheDocument();
      });
    });

    it('displays progress tracker', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      // Progress tracker should be present (checking for question counter)
      expect(screen.getByText(/Question/)).toBeInTheDocument();
    });

    it('displays timer component', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      // Timer should be present (checking for seconds label)
      expect(screen.getByText('sec')).toBeInTheDocument();
    });
  });

  describe('Difficulty Level Indicators', () => {
    it('displays easy difficulty correctly', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockEasyQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Easy')).toBeInTheDocument();
    });

    it('displays medium difficulty correctly', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('displays hard difficulty correctly', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockHardQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Hard')).toBeInTheDocument();
    });
  });

  describe('Answer Selection', () => {
    it('calls onAnswer when an answer is selected', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      const firstAnswer = screen.getByText('Koala');
      await user.click(firstAnswer);

      // Wait for the animation delay
      await waitFor(() => {
        expect(mockOnAnswer).toHaveBeenCalledWith('answer-1');
      }, { timeout: 500 });
    });

    it('prevents multiple answer selections', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      const firstAnswer = screen.getByText('Koala');
      const secondAnswer = screen.getByText('Sloth');
      
      await user.click(firstAnswer);
      await user.click(secondAnswer);

      // Should only be called once
      await waitFor(() => {
        expect(mockOnAnswer).toHaveBeenCalledTimes(1);
        expect(mockOnAnswer).toHaveBeenCalledWith('answer-1');
      }, { timeout: 500 });
    });

    it('shows visual feedback when answer is selected', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      const firstAnswer = screen.getByText('Koala');
      await user.click(firstAnswer);

      // Check for visual feedback (checkmark or X)
      await waitFor(() => {
        expect(screen.getByText('✓')).toBeInTheDocument();
      });
    });

    it('displays answer letters (A, B, C, D)', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('D')).toBeInTheDocument();
    });
  });

  describe('Hint System', () => {
    it('displays hint button when hint is available', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Use Hint')).toBeInTheDocument();
      expect(screen.getByText('💡')).toBeInTheDocument();
    });

    it('calls onHintUsed when hint button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      const hintButton = screen.getByText('Use Hint');
      await user.click(hintButton);

      expect(mockOnHintUsed).toHaveBeenCalled();
    });

    it('shows hint display after hint is used', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      const hintButton = screen.getByText('Use Hint');
      await user.click(hintButton);

      // Should show hint message and change button text
      await waitFor(() => {
        expect(screen.getByText('Hint Used')).toBeInTheDocument();
        expect(screen.getByText('Hint used for this question')).toBeInTheDocument();
      });
    });

    it('displays hint message when eliminate wrong answer hint is generated', async () => {
      // Mock Math.random to force eliminate wrong answer hint
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0.3);

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      const hintButton = screen.getByText('Use Hint');
      await user.click(hintButton);

      await waitFor(() => {
        expect(screen.getByText(/One wrong answer has been eliminated/)).toBeInTheDocument();
      });

      // Restore Math.random
      Math.random = originalRandom;
    });

    it('displays hint clue when provide clue hint is generated', async () => {
      // Mock Math.random to force provide clue hint
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0.7);

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      const hintButton = screen.getByText('Use Hint');
      await user.click(hintButton);

      await waitFor(() => {
        expect(screen.getByText(/Here's a helpful clue/)).toBeInTheDocument();
        expect(screen.getByText(/sleepy/)).toBeInTheDocument();
      });

      // Restore Math.random
      Math.random = originalRandom;
    });

    it('eliminates wrong answer when eliminate hint is used', async () => {
      // Mock Math.random to force eliminate wrong answer hint
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0.3);

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      const hintButton = screen.getByText('Use Hint');
      await user.click(hintButton);

      await waitFor(() => {
        // One of the wrong answers should be eliminated (have ❌ icon)
        expect(screen.getByText('❌')).toBeInTheDocument();
      });

      // Restore Math.random
      Math.random = originalRandom;
    });

    it('disables eliminated answers from selection', async () => {
      // Mock Math.random to force eliminate wrong answer hint
      const originalRandom = Math.random;
      Math.random = vi.fn()
        .mockReturnValueOnce(0.3) // Force eliminate hint
        .mockReturnValueOnce(0); // Force first wrong answer to be eliminated

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      const hintButton = screen.getByText('Use Hint');
      await user.click(hintButton);

      await waitFor(() => {
        // Find the eliminated answer button (should be disabled)
        const eliminatedButton = screen.getByLabelText(/eliminated by hint/);
        expect(eliminatedButton).toBeDisabled();
      });

      // Restore Math.random
      Math.random = originalRandom;
    });

    it('prevents hint usage when already used', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      const hintButton = screen.getByText('Use Hint');
      
      // Use hint first time
      await user.click(hintButton);
      
      await waitFor(() => {
        expect(screen.getByText('Hint Used')).toBeInTheDocument();
      });

      // Try to use hint again - should not call onHintUsed again
      const usedHintButton = screen.getByText('Hint Used');
      await user.click(usedHintButton);

      // Should only be called once
      expect(mockOnHintUsed).toHaveBeenCalledTimes(1);
    });

    it('resets hint state when question changes', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      // Use hint
      const hintButton = screen.getByText('Use Hint');
      await user.click(hintButton);

      await waitFor(() => {
        expect(screen.getByText('Hint Used')).toBeInTheDocument();
      });

      // Change question
      const newQuestion = { ...mockQuestion, id: 'new-question', text: 'New question?' };
      
      rerender(
        <TestWrapper>
          <QuestionCard
            question={newQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      // Hint should be available again for new question
      expect(screen.getByText('Use Hint')).toBeInTheDocument();
    });

    it('has proper accessibility for hint button', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      const hintButton = screen.getByRole('button', { name: /Use Hint/ });
      expect(hintButton).toBeInTheDocument();
      expect(hintButton).not.toBeDisabled();
    });

    it('shows proper visual indication when hint is used', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      const hintButton = screen.getByText('Use Hint');
      await user.click(hintButton);

      await waitFor(() => {
        // Check for hint used indicator text
        expect(screen.getByText('Hint used for this question')).toBeInTheDocument();
        
        // Check that button shows used state
        expect(screen.getByText('Hint Used')).toBeInTheDocument();
      });
    });
  });

  describe('Feedback Display', () => {
    it('shows feedback section when showFeedback is true', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
            showFeedback={true}
            selectedAnswerId="answer-1"
            isCorrect={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Correct!')).toBeInTheDocument();
      expect(screen.getByText('Explanation:')).toBeInTheDocument();
      expect(screen.getByText('Fun Fact:')).toBeInTheDocument();
      expect(screen.getByText(mockQuestion.explanation)).toBeInTheDocument();
      expect(screen.getByText(mockQuestion.funFact)).toBeInTheDocument();
    });

    it('shows incorrect feedback for wrong answers', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
            showFeedback={true}
            selectedAnswerId="answer-2"
            isCorrect={false}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Incorrect')).toBeInTheDocument();
      expect(screen.getByText(/Correct answer:/)).toBeInTheDocument();
      // Use getAllByText since "Koala" appears in both the answer button and feedback
      const koalaElements = screen.getAllByText('Koala');
      expect(koalaElements.length).toBeGreaterThan(0);
    });

    it('highlights correct answer when showing feedback', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
            showFeedback={true}
            selectedAnswerId="answer-2"
            isCorrect={false}
          />
        </TestWrapper>
      );

      // Find the correct answer button by its aria-label
      const correctAnswerButton = screen.getByLabelText('Answer option 1: Koala');
      expect(correctAnswerButton).toHaveClass('_success_4f0108');
    });
  });

  describe('Touch Optimization', () => {
    it('has proper touch target sizes for answer buttons', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      const answerButtons = screen.getAllByRole('button').filter(button => 
        mockQuestion.answers.some(answer => button.textContent?.includes(answer.text))
      );

      answerButtons.forEach(button => {
        // Check that buttons have the large size class (CSS module class)
        expect(button).toHaveClass('_lg_4f0108');
      });
    });

    it('has proper ARIA labels for answer options', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Answer option 1: Koala')).toBeInTheDocument();
      expect(screen.getByLabelText('Answer option 2: Sloth')).toBeInTheDocument();
      expect(screen.getByLabelText('Answer option 3: Panda')).toBeInTheDocument();
      expect(screen.getByLabelText('Answer option 4: Cat')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      // Question should be in a heading
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(mockQuestion.text);
      
      // Answer buttons should be buttons
      const answerButtons = screen.getAllByRole('button').filter(button => 
        mockQuestion.answers.some(answer => button.textContent?.includes(answer.text))
      );
      expect(answerButtons).toHaveLength(4);
    });

    it('has proper focus management', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      // Tab through answer buttons
      await user.tab();
      const firstButton = screen.getByText('Koala').closest('button');
      expect(firstButton).toHaveFocus();
    });

    it('has proper ARIA attributes for emojis', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      const emojiElements = screen.getAllByRole('img', { hidden: true });
      expect(emojiElements).toHaveLength(mockQuestion.emojis.length);
    });
  });

  describe('Visual Feedback Animations', () => {
    it('applies selected class when answer is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      const firstAnswer = screen.getByLabelText('Answer option 1: Koala');
      await user.click(firstAnswer);

      expect(firstAnswer).toHaveClass('_selected_c25f58');
    });

    it('shows feedback icons after answer selection', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      const correctAnswer = screen.getByText('Koala');
      await user.click(correctAnswer);

      await waitFor(() => {
        expect(screen.getByText('✓')).toBeInTheDocument();
      });
    });
  });

  describe('Timer Integration', () => {
    it('shows timer warning states', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      // Timer section should be present (using CSS module class)
      const timerSection = document.querySelector('._timerSection_c25f58');
      expect(timerSection).toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    it('resets selection when question changes', () => {
      const { rerender } = render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      // Change to a different question
      const newQuestion = { ...mockQuestion, id: 'new-question', text: 'New question?' };
      
      rerender(
        <TestWrapper>
          <QuestionCard
            question={newQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
          />
        </TestWrapper>
      );

      expect(screen.getByText('New question?')).toBeInTheDocument();
    });

    it('disables buttons when feedback is shown', () => {
      render(
        <TestWrapper>
          <QuestionCard
            question={mockQuestion}
            onAnswer={mockOnAnswer}
            onHintUsed={mockOnHintUsed}
            showFeedback={true}
            selectedAnswerId="answer-1"
            isCorrect={true}
          />
        </TestWrapper>
      );

      const answerButtons = screen.getAllByRole('button').filter(button => 
        mockQuestion.answers.some(answer => button.textContent?.includes(answer.text))
      );

      answerButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });
});