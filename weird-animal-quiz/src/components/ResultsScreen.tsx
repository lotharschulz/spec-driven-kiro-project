import React from 'react';
import { Button } from './ui/Button';
import { useQuiz } from '../state/QuizContext';
import styles from './ResultsScreen.module.css';

import { QuizState, Difficulty, UserAnswer, Question } from '../state/QuizContext';
import { demoQuestions } from './QuizContainer';

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
// Skeleton loader for Suspense fallback
export const ResultsScreenSkeleton: React.FC = () => (
  <div className={styles.root} aria-busy="true" aria-label="Loading results...">
    <div className={styles.title} style={{ opacity: 0.5, background: '#e0e0e0', borderRadius: 8, height: 32, width: 160, margin: '0 auto 16px' }} />
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e0e0e0', opacity: 0.5 }} />
    </div>
    <div style={{ height: 24, width: 220, background: '#e0e0e0', borderRadius: 6, margin: '8px auto' }} />
    <div style={{ height: 18, width: 180, background: '#e0e0e0', borderRadius: 6, margin: '8px auto' }} />
    <div style={{ height: 18, width: 180, background: '#e0e0e0', borderRadius: 6, margin: '8px auto' }} />
    <div style={{ height: 40, width: 120, background: '#e0e0e0', borderRadius: 20, margin: '24px auto' }} />
    <div style={{ height: 32, width: 200, background: '#e0e0e0', borderRadius: 12, margin: '16px auto' }} />
  </div>
);


export const ResultsScreen: React.FC<{ onPlayAgain: () => void }> = ({ onPlayAgain }) => {
  const { state, dispatch } = useQuiz();
  const results = calculateResults(state);
  const highScore = results.percentage >= 80;

  // Retry by difficulty handler
  const handleRetryDifficulty = (difficulty: Difficulty) => {
    const filteredQuestions = demoQuestions.filter((q: Question) => q.difficulty === difficulty);
    dispatch({ type: 'RETRY_DIFFICULTY', questions: filteredQuestions });
  };

  return (
    <section className={styles.root} role="region" aria-labelledby="results-title">
      <h2 id="results-title" className={styles.title}>Quiz Results</h2>
      {highScore && <div className={styles.celebrate} aria-label="High score celebration" role="img">🎉</div>}
      <div className={styles.score} aria-live="polite">
        <strong>Score:</strong> {results.score} / {results.maxScore} ({results.percentage}%)
      </div>
      <div className={styles.stats}>
        <strong>Total Time:</strong> {results.totalTime}s<br />
        <strong>Hint Penalty:</strong> -{results.hintPenalty}
      </div>
      <div className={styles.breakdown}>
        <strong>Breakdown:</strong><br />
        <span aria-label="Easy score">Easy: {results.breakdown.easy}</span> |{' '}
        <span aria-label="Medium score">Medium: {results.breakdown.medium}</span> |{' '}
        <span aria-label="Hard score">Hard: {results.breakdown.hard}</span>
      </div>
      <Button className={styles.playAgainBtn} onClick={onPlayAgain} aria-label="Play the quiz again">Play Again</Button>
      <nav style={{ marginTop: '1em', textAlign: 'center' }} aria-label="Retry quiz by difficulty">
        <strong>Retry by Difficulty:</strong><br />
        <Button className={styles.playAgainBtn} onClick={() => handleRetryDifficulty('easy')} aria-label="Retry easy questions">Easy</Button>{' '}
        <Button className={styles.playAgainBtn} onClick={() => handleRetryDifficulty('medium')} aria-label="Retry medium questions">Medium</Button>{' '}
        <Button className={styles.playAgainBtn} onClick={() => handleRetryDifficulty('hard')} aria-label="Retry hard questions">Hard</Button>
      </nav>
    </section>
  );
};
