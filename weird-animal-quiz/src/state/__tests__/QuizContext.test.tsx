import React from 'react';
import { render, act } from '@testing-library/react';
import { QuizProvider, useQuiz, Question } from '../QuizContext';

describe('QuizContext', () => {
  const questions: Question[] = [
    { id: '1', text: 'Q1', answers: [], difficulty: 'easy', emojis: [], explanation: '' },
    { id: '2', text: 'Q2', answers: [], difficulty: 'medium', emojis: [], explanation: '' },
  ];

  const TestComponent = () => {
    const { state, dispatch } = useQuiz();
    return (
      <div>
        <span data-testid="index">{state.currentQuestionIndex}</span>
        <button onClick={() => dispatch({ type: 'SET_QUESTIONS', questions })}>set</button>
        <button onClick={() => dispatch({ type: 'NEXT_QUESTION' })}>next</button>
        <button onClick={() => dispatch({ type: 'PAUSE' })}>pause</button>
        <button onClick={() => dispatch({ type: 'RESUME' })}>resume</button>
      </div>
    );
  };

  it('sets questions and navigates', () => {
    const { getByText, getByTestId } = render(
      <QuizProvider>
        <TestComponent />
      </QuizProvider>
    );
    act(() => getByText('set').click());
    expect(getByTestId('index').textContent).toBe('0');
    act(() => getByText('next').click());
    expect(getByTestId('index').textContent).toBe('1');
    act(() => getByText('pause').click());
    act(() => getByText('resume').click());
  });
});
