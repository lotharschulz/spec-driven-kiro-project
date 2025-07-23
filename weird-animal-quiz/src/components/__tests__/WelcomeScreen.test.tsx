import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WelcomeScreen } from '../WelcomeScreen';

describe('WelcomeScreen', () => {
  it('renders hero, overview, and start button', () => {
    const onStartQuiz = jest.fn();
    render(<WelcomeScreen onStartQuiz={onStartQuiz} />);
    expect(screen.getByText(/Weird Animal Quiz/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start the quiz/i })).toBeInTheDocument();
    expect(screen.getByText(/Test your knowledge/i)).toBeInTheDocument();
  });

  it('calls onStartQuiz when start button is clicked', () => {
    const onStartQuiz = jest.fn();
    render(<WelcomeScreen onStartQuiz={onStartQuiz} />);
    fireEvent.click(screen.getByRole('button', { name: /start the quiz/i }));
    expect(onStartQuiz).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<WelcomeScreen onStartQuiz={() => {}} loading />);
    expect(screen.getByRole('button')).toHaveTextContent(/loading/i);
  });

  it('renders accessibility options if provided', () => {
    render(<WelcomeScreen onStartQuiz={() => {}} accessibilityOptions={<span>Accessibility</span>} />);
    expect(screen.getByText(/Accessibility/)).toBeInTheDocument();
  });
});
