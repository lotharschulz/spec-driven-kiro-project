/**
 * Hint System Integration Tests
 * Tests hint system integration with scoring and state management
 * Requirements: 3.1, 3.2, 3.5, 3.6
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QuizProvider, useQuiz, QuizActionType } from '../contexts/QuizContext';
import QuestionCard from '../components/QuestionCard';
import ResultsScreen from '../components/ResultsScreen';
import { Question, Difficulty, QuizResults } from '../types/quiz';
import { calculateQuizScore } from '../utils/scoringEngine';
import { getHint } from '../utils/hintSystem';

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

// Mock the hint system
vi.mock('../utils/hintSystem', () => ({
  getHint: vi.fn((question) => ({
    type: 'elimination',
    content: 'It\'s definitely not a Sloth.',
    eliminatedAnswerId: 'a2'
  }))
}));

// Create a component for testing hint integration
const HintIntegrationTest = () => {
  const quiz = useQuiz();
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [showResults, setShowResults] = React.useState(false);
  const [quizResults, setQuizResults] = React.useState<QuizResults | null>(null);
  
  React.useEffect(() => {
    // Initialize quiz with mock questions
    quiz.initializeQuiz(mockQuestions);
  }, [quiz]);
  
  const handleAnswer = (answerId: string) => {
    quiz.submitAnswer(answerId, 15); // 15 seconds spent
    
    // Move to next question or show results
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeout(() => {
        quiz.nextQuestion();
      }, 100);
    } else {
      const results = quiz.calculateResults();
      setQuizResults(results);
      setShowResults(true);
    }
  };
  
  const handleHintUsed = () => {
    const currentQuestion = mockQuestions[currentQuestionIndex];
    quiz.useHint(currentQuestion.id);
  };
  
  const currentQuestion = mockQuestions[currentQuestionIndex];
  
  if (showResults && quizResults) {
    return (
      <ResultsScreen
        results={quizResults}
        onPlayAgain={() => {}}
        onRetryDifficulty={() => {}}
      />
    );
  }
  
  return (
    <div>
      <QuestionCard
        question={currentQuestion}
        onAnswer={handleAnswer}
        onHintUsed={handleHintUsed}
        timeRemaining={30}
        hintAvailable={quiz.isHintAvailable(currentQuestion.id)}
        difficulty={currentQuestion.difficulty}
      />
      <div data-testid="hints-used">Hints used: {quiz.state.hintsUsed.length}</div>
      <div data-testid="current-question">Question: {currentQuestionIndex + 1}</div>
    </div>
  );
};

// Create a component for testing hint scoring
const HintScoringTest = () => {
  const [hintsUsed, setHintsUsed] = React.useState<string[]>([]);
  const [userAnswers, setUserAnswers] = React.useState<any[]>([]);
  const [showResults, setShowResults] = React.useState(false);
  
  const handleUseHint = (questionId: string) => {
    setHintsUsed([...hintsUsed, questionId]);
  };
  
  const handleAnswer = (questionId: string, answerId: string, isCorrect: boolean) => {
    setUserAnswers([
      ...userAnswers,
      {
        questionId,
        selectedAnswerId: answerId,
        isCorrect,
        timeSpent: 15,
        hintUsed: hintsUsed.includes(questionId)
      }
    ]);
  };
  
  const handleCalculateResults = () => {
    setShowResults(true);
  };
  
  const results = calculateQuizScore(userAnswers, mockQuestions);
  
  return (
    <div>
      {!showResults ? (
        <div>
          <button 
            onClick={() => handleUseHint('easy-1')}
            data-testid="use-hint-1"
          >
            Use Hint 1
          </button>
          <button 
            onClick={() => handleAnswer('easy-1', 'a1', true)}
            data-testid="answer-1"
          >
            Answer 1 Correctly
          </button>
          <button 
            onClick={() => handleUseHint('medium-1')}
            data-testid="use-hint-2"
          >
            Use Hint 2
          </button>
          <button 
            onClick={() => handleAnswer('medium-1', 'b1', true)}
            data-testid="answer-2"
          >
            Answer 2 Correctly
          </button>
          <button 
            onClick={handleCalculateResults}
            data-testid="calculate-results"
          >
            Calculate Results
          </button>
          <div data-testid="hints-used">Hints used: {hintsUsed.length}</div>
          <div data-testid="answers-submitted">Answers: {userAnswers.length}</div>
        </div>
      ) : (
        <div>
          <h2>Results</h2>
          <div data-testid="total-score">Total Score: {results.totalScore}</div>
          <div data-testid="percentage">Percentage: {results.percentage}%</div>
          <div data-testid="hints-used-count">Hints Used: {results.hintsUsed}</div>
          <div data-testid="hint-penalty">
            Hint Penalty: {results.hintsUsed * 5}%
          </div>
        </div>
      )}
    </div>
  );
};

describe('Hint System Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides hints when requested', async () => {
    const user = userEvent.setup();
    
    render(
      <QuizProvider>
        <HintIntegrationTest />
      </QuizProvider>
    );
    
    // Use hint
    await user.click(screen.getByRole('button', { name: /hint/i }));
    
    // Verify hint was used
    expect(screen.getByTestId('hints-used').textContent).toContain('1');
    
    // Verify getHint was called with the correct question
    expect(getHint).toHaveBeenCalledWith(mockQuestions[0]);
  });

  it('disables hint button after use for current question', async () => {
    const user = userEvent.setup();
    
    render(
      <QuizProvider>
        <HintIntegrationTest />
      </QuizProvider>
    );
    
    // Hint button should be enabled initially
    expect(screen.getByRole('button', { name: /hint/i })).toBeEnabled();
    
    // Use hint
    await user.click(screen.getByRole('button', { name: /hint/i }));
    
    // Hint button should be disabled after use
    expect(screen.getByRole('button', { name: /hint/i })).toBeDisabled();
  });

  it('tracks hint usage across multiple questions', async () => {
    const user = userEvent.setup();
    
    render(
      <QuizProvider>
        <HintIntegrationTest />
      </QuizProvider>
    );
    
    // Use hint on first question
    await user.click(screen.getByRole('button', { name: /hint/i }));
    
    // Answer first question
    await user.click(screen.getByText('Koala'));
    
    // Wait for question transition
    await waitFor(() => {
      expect(screen.getByTestId('current-question').textContent).toContain('2');
    });
    
    // Hint button should be enabled for second question
    expect(screen.getByRole('button', { name: /hint/i })).toBeEnabled();
    
    // Use hint on second question
    await user.click(screen.getByRole('button', { name: /hint/i }));
    
    // Verify two hints were used total
    expect(screen.getByTestId('hints-used').textContent).toContain('2');
  });

  it('applies hint penalty in scoring', async () => {
    const user = userEvent.setup();
    
    render(<HintScoringTest />);
    
    // Answer first question with hint
    await user.click(screen.getByTestId('use-hint-1'));
    await user.click(screen.getByTestId('answer-1'));
    
    // Answer second question without hint
    await user.click(screen.getByTestId('answer-2'));
    
    // Calculate results
    await user.click(screen.getByTestId('calculate-results'));
    
    // Verify hint penalty is applied
    expect(screen.getByTestId('hints-used-count').textContent).toContain('1');
    expect(screen.getByTestId('hint-penalty').textContent).toContain('5%');
    
    // Score should be affected by hint usage
    const percentage = parseFloat(screen.getByTestId('percentage').textContent!.match(/[\d.]+/)![0]);
    expect(percentage).toBeLessThan(100); // Should be less than 100% due to hint penalty
  });

  it('integrates with quiz state management', async () => {
    // Create a component to test direct state management
    const StateManagementTest = () => {
      const quiz = useQuiz();
      
      React.useEffect(() => {
        // Initialize quiz
        quiz.initializeQuiz(mockQuestions);
      }, [quiz]);
      
      const handleDispatchUseHint = () => {
        quiz.dispatch({
          type: QuizActionType.USE_HINT,
          payload: { questionId: mockQuestions[0].id }
        });
      };
      
      return (
        <div>
          <button onClick={handleDispatchUseHint} data-testid="dispatch-hint">
            Dispatch Hint Action
          </button>
          <div data-testid="hints-state">
            {JSON.stringify(quiz.state.hintsUsed)}
          </div>
        </div>
      );
    };
    
    const user = userEvent.setup();
    
    render(
      <QuizProvider>
        <StateManagementTest />
      </QuizProvider>
    );
    
    // Dispatch hint action
    await user.click(screen.getByTestId('dispatch-hint'));
    
    // Verify state was updated
    expect(screen.getByTestId('hints-state').textContent).toContain(mockQuestions[0].id);
  });

  it('provides different hint types based on question', async () => {
    // Mock different hint types
    (getHint as any).mockImplementationOnce(() => ({
      type: 'elimination',
      content: 'It\'s definitely not a Sloth.',
      eliminatedAnswerId: 'a2'
    })).mockImplementationOnce(() => ({
      type: 'clue',
      content: 'This animal is found in Australia.'
    }));
    
    const user = userEvent.setup();
    
    render(
      <QuizProvider>
        <HintIntegrationTest />
      </QuizProvider>
    );
    
    // Use hint on first question
    await user.click(screen.getByRole('button', { name: /hint/i }));
    
    // Verify first hint type was used
    expect(getHint).toHaveBeenCalledTimes(1);
    
    // Answer first question
    await user.click(screen.getByText('Koala'));
    
    // Wait for question transition
    await waitFor(() => {
      expect(screen.getByTestId('current-question').textContent).toContain('2');
    });
    
    // Use hint on second question
    await user.click(screen.getByRole('button', { name: /hint/i }));
    
    // Verify second hint type was used
    expect(getHint).toHaveBeenCalledTimes(2);
  });

  it('calculates correct score with multiple hints used', async () => {
    const user = userEvent.setup();
    
    render(<HintScoringTest />);
    
    // Use hints for both questions
    await user.click(screen.getByTestId('use-hint-1'));
    await user.click(screen.getByTestId('answer-1'));
    await user.click(screen.getByTestId('use-hint-2'));
    await user.click(screen.getByTestId('answer-2'));
    
    // Calculate results
    await user.click(screen.getByTestId('calculate-results'));
    
    // Verify hint count and penalty
    expect(screen.getByTestId('hints-used-count').textContent).toContain('2');
    expect(screen.getByTestId('hint-penalty').textContent).toContain('10%');
    
    // Score should be affected by multiple hint usage
    const percentage = parseFloat(screen.getByTestId('percentage').textContent!.match(/[\d.]+/)![0]);
    expect(percentage).toBeLessThan(95); // Should be significantly less than 100% due to multiple hint penalties
  });

  it('handles hint usage with incorrect answers', async () => {
    // Create a component for testing incorrect answers with hints
    const IncorrectAnswerTest = () => {
      const [hintsUsed, setHintsUsed] = React.useState<string[]>([]);
      const [userAnswers, setUserAnswers] = React.useState<any[]>([]);
      const [showResults, setShowResults] = React.useState(false);
      
      const handleUseHint = (questionId: string) => {
        setHintsUsed([...hintsUsed, questionId]);
      };
      
      const handleAnswer = (questionId: string, answerId: string, isCorrect: boolean) => {
        setUserAnswers([
          ...userAnswers,
          {
            questionId,
            selectedAnswerId: answerId,
            isCorrect,
            timeSpent: 15,
            hintUsed: hintsUsed.includes(questionId)
          }
        ]);
      };
      
      const handleCalculateResults = () => {
        setShowResults(true);
      };
      
      const results = calculateQuizScore(userAnswers, mockQuestions);
      
      return (
        <div>
          {!showResults ? (
            <div>
              <button onClick={() => handleUseHint('easy-1')}>Use Hint 1</button>
              <button onClick={() => handleAnswer('easy-1', 'a2', false)}>Answer 1 Incorrectly</button>
              <button onClick={handleCalculateResults}>Calculate Results</button>
            </div>
          ) : (
            <div>
              <div data-testid="total-score">Total Score: {results.totalScore}</div>
              <div data-testid="percentage">Percentage: {results.percentage}%</div>
              <div data-testid="hints-used-count">Hints Used: {results.hintsUsed}</div>
              <div data-testid="correct-answers">Correct Answers: {results.correctAnswers}</div>
            </div>
          )}
        </div>
      );
    };
    
    const user = userEvent.setup();
    
    render(<IncorrectAnswerTest />);
    
    // Use hint but answer incorrectly
    await user.click(screen.getByText('Use Hint 1'));
    await user.click(screen.getByText('Answer 1 Incorrectly'));
    await user.click(screen.getByText('Calculate Results'));
    
    // Verify score reflects both hint usage and incorrect answer
    expect(screen.getByTestId('hints-used-count').textContent).toContain('1');
    expect(screen.getByTestId('correct-answers').textContent).toContain('0');
    expect(screen.getByTestId('percentage').textContent).toContain('0%');
  });
});
</content>