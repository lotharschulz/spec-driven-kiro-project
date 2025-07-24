import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QuizContainer } from './QuizContainer';

describe('QuizContainer Accessibility & Interaction', () => {
  beforeEach(async () => {
    await act(async () => {
      render(<QuizContainer />);
    });
  });

  it('renders start screen and allows category selection', async () => {
    expect(screen.getByText(/Welcome to the Weird Animal Quiz/i)).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByText('Easy'));
    });
    expect(screen.getByText(/Question 1 of/)).toBeInTheDocument();
  });

  it('renders answer choices as radio buttons with correct ARIA roles', async () => {
    await act(async () => {
      fireEvent.click(screen.getByText('Easy'));
    });
    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBeGreaterThan(0);
    radios.forEach(radio => {
      expect(radio).toHaveAttribute('aria-checked');
    });
  });

  it('allows keyboard navigation between answer choices', async () => {
    await act(async () => {
      fireEvent.click(screen.getByText('Easy'));
    });
    const radios = screen.getAllByRole('radio');
    radios[0].focus();
    expect(radios[0]).toHaveFocus();
    await act(async () => {
      fireEvent.keyDown(radios[0], { key: 'ArrowDown' });
    });
    expect(radios[1]).toHaveFocus();
    await act(async () => {
      fireEvent.keyDown(radios[1], { key: 'ArrowUp' });
    });
    expect(radios[0]).toHaveFocus();
  });

  it('selects an answer and shows feedback', async () => {
    await act(async () => {
      fireEvent.click(screen.getByText('Easy'));
    });
    const radios = screen.getAllByRole('radio');
    await act(async () => {
      fireEvent.click(radios[0]);
    });
    // Check for feedback content (Correct!/Incorrect!/Explanation)
    expect(screen.getByText(/Correct!/i)).toBeInTheDocument();
    expect(screen.getByText(/Some snails can hibernate for up to three years/i)).toBeInTheDocument();
  });
});
