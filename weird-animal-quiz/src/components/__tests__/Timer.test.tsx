import React from 'react';
import { render, act } from '@testing-library/react';
import { Timer } from '../Timer';

describe('Timer', () => {
  jest.useFakeTimers();
  it('counts down and triggers onTimeUp', () => {
    const onTimeUp = jest.fn();
    const { getByText } = render(
      <Timer duration={3} onTimeUp={onTimeUp} paused={false} />
    );
    expect(getByText('3s')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(getByText('2s')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(onTimeUp).toHaveBeenCalled();
  });

  it('pauses and resumes', () => {
    const onTimeUp = jest.fn();
    const { getByText, rerender } = render(
      <Timer duration={3} onTimeUp={onTimeUp} paused={false} />
    );
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    rerender(<Timer duration={3} onTimeUp={onTimeUp} paused={true} />);
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(getByText('2s')).toBeInTheDocument();
    rerender(<Timer duration={3} onTimeUp={onTimeUp} paused={false} />);
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(onTimeUp).toHaveBeenCalled();
  });
});
