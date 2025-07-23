import React, { useEffect, useRef } from 'react';

interface TimerProps {
  duration: number; // seconds
  onTimeUp: () => void;
  paused: boolean;
  warningThreshold?: number; // seconds left to trigger warning (default: 10)
  onTick?: (secondsLeft: number) => void;
}

export const Timer: React.FC<TimerProps> = ({
  duration,
  onTimeUp,
  paused,
  warningThreshold = 10,
  onTick,
}) => {
  const [secondsLeft, setSecondsLeft] = React.useState(duration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, onTimeUp]);

  useEffect(() => {
    if (onTick) onTick(secondsLeft);
  }, [secondsLeft, onTick]);

  useEffect(() => {
    setSecondsLeft(duration);
  }, [duration]);

  let color = '#4A7C59'; // default green
  if (secondsLeft <= warningThreshold && secondsLeft > 0) color = '#EA580C'; // orange
  if (secondsLeft <= 3 && secondsLeft > 0) color = '#B91C1C'; // red

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 24,
      fontWeight: 'bold',
      color,
      minWidth: 60,
      transition: 'color 0.3s',
    }}
      aria-live="polite"
      aria-label={`Time left: ${secondsLeft} seconds`}
    >
      {secondsLeft}s
    </div>
  );
};
