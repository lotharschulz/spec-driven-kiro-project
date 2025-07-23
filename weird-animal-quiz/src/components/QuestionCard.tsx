import React from 'react';
import styles from './QuestionCard.module.css';
import { Button } from './ui/Button';

export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  emojis: string[];
  answers: Answer[];
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
}

interface QuestionCardProps {
  question: Question;
  selectedAnswerId?: string;
  onAnswer: (answerId: string) => void;
  onHintUsed: () => void;
  hintAvailable: boolean;
  showFeedback?: boolean;
  correctAnswerId?: string;
  progress: { current: number; total: number };
  difficulty: 'easy' | 'medium' | 'hard';
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedAnswerId,
  onAnswer,
  onHintUsed,
  hintAvailable,
  showFeedback = false,
  correctAnswerId,
  progress,
  difficulty,
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.emojis} aria-hidden="true">{question.emojis.join(' ')}</div>
      <div className={`${styles.difficulty} ${styles[`difficulty-${difficulty}`]}`}>{difficulty.toUpperCase()}</div>
      <div className={styles.question}>{question.text}</div>
      <div className={styles.answers}>
        {question.answers.map((a) => {
          let btnClass = styles.answerBtn;
          if (showFeedback) {
            if (a.id === correctAnswerId) btnClass += ' ' + styles.correct;
            else if (a.id === selectedAnswerId) btnClass += ' ' + styles.incorrect;
          } else if (selectedAnswerId === a.id) {
            btnClass += ' ' + styles.selected;
          }
          return (
            <button
              key={a.id}
              className={btnClass}
              onClick={() => onAnswer(a.id)}
              disabled={!!selectedAnswerId || showFeedback}
              aria-pressed={selectedAnswerId === a.id}
            >
              {a.text}
            </button>
          );
        })}
      </div>
      <Button
        className={styles.hintBtn}
        onClick={onHintUsed}
        disabled={!hintAvailable}
        aria-disabled={!hintAvailable}
      >
        {hintAvailable ? 'Use Hint' : 'Hint Used'}
      </Button>
      <div className={styles.progress}>
        Question {progress.current} of {progress.total}
      </div>
    </div>
  );
};
