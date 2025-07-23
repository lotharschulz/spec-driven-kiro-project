import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionCard, Question } from '../QuestionCard';

describe('QuestionCard', () => {
  const question: Question = {
    id: 'q1',
    text: 'Which animal is the fastest?',
    emojis: ['🐆', '🏃‍♂️'],
    answers: [
      { id: 'a1', text: 'Cheetah', isCorrect: true },
      { id: 'a2', text: 'Sloth', isCorrect: false },
      { id: 'a3', text: 'Tortoise', isCorrect: false },
      { id: 'a4', text: 'Rabbit', isCorrect: false },
    ],
    difficulty: 'easy',
    explanation: 'Cheetahs are the fastest land animals.',
  };
  const progress = { current: 1, total: 10 };

  it('renders question, emojis, answers, and progress', () => {
    render(
      <QuestionCard
        question={question}
        onAnswer={() => {}}
        onHintUsed={() => {}}
        hintAvailable={true}
        progress={progress}
        difficulty={question.difficulty}
      />
    );
    expect(screen.getByText('Which animal is the fastest?')).toBeInTheDocument();
    expect(screen.getByText('🐆 🏃‍♂️')).toBeInTheDocument();
    expect(screen.getByText('Cheetah')).toBeInTheDocument();
    expect(screen.getByText('Sloth')).toBeInTheDocument();
    expect(screen.getByText('Tortoise')).toBeInTheDocument();
    expect(screen.getByText('Rabbit')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
  });

  it('calls onAnswer when an answer is clicked', () => {
    const onAnswer = jest.fn();
    render(
      <QuestionCard
        question={question}
        onAnswer={onAnswer}
        onHintUsed={() => {}}
        hintAvailable={true}
        progress={progress}
        difficulty={question.difficulty}
      />
    );
    fireEvent.click(screen.getByText('Cheetah'));
    expect(onAnswer).toHaveBeenCalledWith('a1');
  });

  it('disables answer buttons after selection', () => {
    render(
      <QuestionCard
        question={question}
        selectedAnswerId="a2"
        onAnswer={() => {}}
        onHintUsed={() => {}}
        hintAvailable={true}
        progress={progress}
        difficulty={question.difficulty}
      />
    );
    expect(screen.getByText('Cheetah')).toBeDisabled();
    expect(screen.getByText('Sloth')).toBeDisabled();
  });

  it('shows correct/incorrect feedback when showFeedback is true', () => {
    render(
      <QuestionCard
        question={question}
        selectedAnswerId="a2"
        onAnswer={() => {}}
        onHintUsed={() => {}}
        hintAvailable={true}
        showFeedback={true}
        correctAnswerId="a1"
        progress={progress}
        difficulty={question.difficulty}
      />
    );
    const correctBtn = screen.getByText('Cheetah');
    const incorrectBtn = screen.getByText('Sloth');
    expect(correctBtn.className).toMatch(/correct/);
    expect(incorrectBtn.className).toMatch(/incorrect/);
  });

  it('calls onHintUsed when hint button is clicked', () => {
    const onHintUsed = jest.fn();
    render(
      <QuestionCard
        question={question}
        onAnswer={() => {}}
        onHintUsed={onHintUsed}
        hintAvailable={true}
        progress={progress}
        difficulty={question.difficulty}
      />
    );
    fireEvent.click(screen.getByText('Use Hint'));
    expect(onHintUsed).toHaveBeenCalled();
  });

  it('disables hint button when hint is not available', () => {
    render(
      <QuestionCard
        question={question}
        onAnswer={() => {}}
        onHintUsed={() => {}}
        hintAvailable={false}
        progress={progress}
        difficulty={question.difficulty}
      />
    );
    expect(screen.getByText('Hint Used')).toBeDisabled();
  });

  it('has accessible answer buttons', () => {
    render(
      <QuestionCard
        question={question}
        onAnswer={() => {}}
        onHintUsed={() => {}}
        hintAvailable={true}
        progress={progress}
        difficulty={question.difficulty}
      />
    );
    const btn = screen.getByText('Cheetah');
    expect(btn).toHaveAttribute('aria-pressed');
  });
});
