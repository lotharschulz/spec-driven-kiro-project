import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import styles from './FeedbackDisplay.module.css';

interface FeedbackDisplayProps {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  funFact?: string;
  onNext: () => void;
  minReadTime?: number; // seconds
}

export const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({
  isCorrect,
  correctAnswer,
  explanation,
  funFact,
  onNext,
  minReadTime = 3,
}) => {
  const [canProceed, setCanProceed] = React.useState(false);
  React.useEffect(() => {
    setCanProceed(false);
    const timer = setTimeout(() => setCanProceed(true), minReadTime * 1000);
    return () => clearTimeout(timer);
  }, [minReadTime]);

  return (
    <motion.div
      className={styles.feedback}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      role="region"
      aria-live="polite"
    >
      <div className={isCorrect ? styles.correct : styles.incorrect}>
        {isCorrect ? (
          <span aria-label="Correct" role="img" className={styles.icon}>✅</span>
        ) : (
          <span aria-label="Incorrect" role="img" className={styles.icon}>❌</span>
        )}
        <span className={styles.status}>
          {isCorrect ? 'Correct!' : 'Incorrect'}
        </span>
      </div>
      {!isCorrect && (
        <div className={styles.correctAnswer}>
          Correct answer: <strong>{correctAnswer}</strong>
        </div>
      )}
      <div className={styles.explanation}>{explanation}</div>
      {funFact && <div className={styles.funFact}>{funFact}</div>}
      <Button
        onClick={onNext}
        disabled={!canProceed}
        aria-disabled={!canProceed}
        className={styles.nextBtn}
      >
        Next Question
      </Button>
    </motion.div>
  );
};
