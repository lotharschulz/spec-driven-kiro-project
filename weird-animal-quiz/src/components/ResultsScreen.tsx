import React from 'react';
import { Button } from './ui/Button';
import { useQuiz } from '../state/QuizContext';
import styles from './ResultsScreen.module.css';

import { QuizState, Difficulty, UserAnswer, Question } from '../state/QuizContext';

interface Results {
  score: number;
  maxScore: number;
  breakdown: Record<Difficulty, number>;
  hintPenalty: number;
  totalTime: number;
  percentage: number;
}

function calculateResults(state: QuizState): Results {
  const { answers, questions } = state;
  let score = 0;
  let maxScore = 0;
  let breakdown: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  let hintPenalty = 0;
  let totalTime = 0;
  questions.forEach((q: Question) => {
    maxScore += q.difficulty === 'easy' ? 1 : q.difficulty === 'medium' ? 2 : 3;
  });
  answers.forEach((a: UserAnswer) => {
    const q = questions.find((qq: Question) => qq.id === a.questionId);
    if (!q) return;
    if (a.answerId && q.answers.find((ans) => ans.id === a.answerId && ans.isCorrect)) {
      const pts = q.difficulty === 'easy' ? 1 : q.difficulty === 'medium' ? 2 : 3;
      score += pts;
      breakdown[q.difficulty] += pts;
    }
    if (a.hintUsed) hintPenalty += 1;
    totalTime += a.timeTaken;
  });
  return {
    score,
    maxScore,
    breakdown,
    hintPenalty,
    totalTime,
    percentage: maxScore ? Math.round((score / maxScore) * 100) : 0,
  };
}

export const ResultsScreen: React.FC<{ onPlayAgain: () => void }> = ({ onPlayAgain }) => {
  const { state } = useQuiz();
  const results = calculateResults(state);
  const highScore = results.percentage >= 80;

  return (
    <div className={styles.root}>
      <div className={styles.title}>Quiz Results</div>
      {highScore && <div className={styles.celebrate}>🎉</div>}
      <div className={styles.score}>
        <strong>Score:</strong> {results.score} / {results.maxScore} ({results.percentage}%)
      </div>
      <div className={styles.stats}>
        <strong>Total Time:</strong> {results.totalTime}s<br />
        <strong>Hint Penalty:</strong> -{results.hintPenalty}
      </div>
      <div className={styles.breakdown}>
        <strong>Breakdown:</strong><br />
        Easy: {results.breakdown.easy} | Medium: {results.breakdown.medium} | Hard: {results.breakdown.hard}
      </div>
      <Button className={styles.playAgainBtn} onClick={onPlayAgain}>Play Again</Button>
      {/* TODO: Add retry by difficulty options */}
    </div>
  );
};
