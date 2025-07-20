/**
 * Countdown Timer Component with Visual Warnings
 * Implements requirements: 2.1, 2.2, 2.8
 */

import React, { useEffect, useRef } from 'react';
import { useQuiz } from '../contexts/QuizContext';
import styles from './Timer.module.css';

export interface TimerProps {
  duration?: number; // Duration in seconds, defaults to 30
  onTimeUp?: () => void; // Callback when timer reaches zero
}

export const Timer: React.FC<TimerProps> = ({ 
  duration = 30, 
  onTimeUp 
}) => {
  const { state, updateTimer, getTimeWarningLevel } = useQuiz();
  const intervalRef = useRef<number | null>(null);

  // Start/stop timer based on pause state
  useEffect(() => {
    if (!state.isPaused && state.timeRemaining > 0) {
      intervalRef.current = window.setInterval(() => {
        updateTimer(state.timeRemaining - 1);
      }, 1000); // Update every second
    } else if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [state.isPaused, state.timeRemaining, updateTimer]);

  // Call onTimeUp when timer reaches zero
  useEffect(() => {
    if (state.timeRemaining === 0) {
      onTimeUp?.();
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [state.timeRemaining, onTimeUp]);

  const warningLevel = getTimeWarningLevel();
  const percentage = (state.timeRemaining / duration) * 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const formatTime = (seconds: number): string => {
    return seconds.toString().padStart(2, '0');
  };

  return (
    <div className={`${styles.timer} ${styles[warningLevel]}`}>
      <div className={styles.timerContainer}>
        <svg className={styles.timerSvg} width="100" height="100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            className={styles.timerBackground}
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            className={`${styles.timerProgress} ${styles[`progress${warningLevel.charAt(0).toUpperCase() + warningLevel.slice(1)}`]}`}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transform: 'rotate(-90deg)',
              transformOrigin: '50px 50px'
            }}
          />
        </svg>
        
        <div className={styles.timerText}>
          <span className={styles.timeValue}>
            {formatTime(state.timeRemaining)}
          </span>
          <span className={styles.timeLabel}>sec</span>
        </div>
      </div>
      
      {/* Warning message */}
      {warningLevel === 'warning' && (
        <div className={styles.warningMessage}>
          Hurry up!
        </div>
      )}
      
      {warningLevel === 'danger' && (
        <div className={styles.dangerMessage}>
          Time's almost up!
        </div>
      )}
      
      {/* Paused indicator */}
      {state.isPaused && (
        <div className={styles.pausedIndicator}>
          ⏸️ Paused
        </div>
      )}
    </div>
  );
};

export default Timer;