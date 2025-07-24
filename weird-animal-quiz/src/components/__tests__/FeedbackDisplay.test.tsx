import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FeedbackDisplay } from '../FeedbackDisplay';

describe('FeedbackDisplay', () => {
  it('shows correct feedback and disables Next for minReadTime', () => {
    jest.useFakeTimers();
    const onNext = jest.fn();
    render(
      <FeedbackDisplay
        isCorrect={true}
        correctAnswer="Cheetah"
        explanation="Cheetahs are the fastest land animals."
        funFact="They can reach 70 mph!"
        onNext={onNext}
        minReadTime={2}
      />
    );
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(screen.getByText('Cheetahs are the fastest land animals.')).toBeInTheDocument();
    expect(screen.getByText('They can reach 70 mph!')).toBeInTheDocument();
    const nextBtn = screen.getByRole('button', { name: /next question/i });
    expect(nextBtn).toBeDisabled();
    act(() => { jest.advanceTimersByTime(2000); });
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);
    expect(onNext).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('shows incorrect feedback and correct answer', () => {
    render(
      <FeedbackDisplay
        isCorrect={false}
        correctAnswer="Cheetah"
        explanation="Cheetahs are the fastest land animals."
        onNext={() => {}}
      />
    );
    expect(screen.getByText('Incorrect')).toBeInTheDocument();
    expect(screen.getByText(/Correct answer:/)).toBeInTheDocument();
    expect(screen.getByText('Cheetah')).toBeInTheDocument();
  });
});
