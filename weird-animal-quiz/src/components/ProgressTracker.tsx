/**
 * Progress Tracker Component
 * Implements requirements: 2.7 - progress tracking and question navigation logic
 */

import React from 'react';
import { useQuiz } from '../contexts/QuizContext';
import { Difficulty } from '../types/quiz';
import styles from './ProgressTracker.module.css';

export interface ProgressTrackerProps {
  showDifficulty?: boolean;
  showPercentage?: boolean;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  showDifficulty = true,
  showPercentage = false
}) => {
  const { state, getCurrentQuestion, getProgress } = useQuiz();
  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();

  const getDifficultyColor = (difficulty: Difficulty): string => {
    switch (difficulty) {
      case Difficulty.EASY:
        return '#4a7c59'; // Forest green
      case Difficulty.MEDIUM:
        return '#fb923c'; // Sunset orange
      case Difficulty.HARD:
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const getDifficultyLabel = (difficulty: Difficulty): string => {
    switch (difficulty) {
      case Difficulty.EASY:
        return 'Easy';
      case Difficulty.MEDIUM:
        return 'Medium';
      case Difficulty.HARD:
        return 'Hard';
      default:
        return '';
    }
  };

  return (
    <div className={styles.progressTracker}>
      {/* Question counter */}
      <div className={styles.questionCounter}>
        <span className={styles.currentQuestion}>
          Question {progress.current}
        </span>
        <span className={styles.totalQuestions}>
          of {progress.total}
        </span>
      </div>

      {/* Progress bar */}
      <div className={styles.progressBarContainer}>
        <div 
          className={styles.progressBar}
          style={{ width: `${progress.percentage}%` }}
          role="progressbar"
          aria-valuenow={progress.percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Quiz progress: ${progress.percentage}% complete`}
        />
        <div className={styles.progressBackground} />
      </div>

      {/* Difficulty indicator */}
      {showDifficulty && currentQuestion && (
        <div className={styles.difficultyIndicator}>
          <div 
            className={styles.difficultyBadge}
            style={{ 
              backgroundColor: getDifficultyColor(currentQuestion.difficulty),
              color: '#ffffff'
            }}
          >
            {getDifficultyLabel(currentQuestion.difficulty)}
          </div>
        </div>
      )}

      {/* Percentage display */}
      {showPercentage && (
        <div className={styles.percentageDisplay}>
          {progress.percentage}%
        </div>
      )}

      {/* Question dots indicator */}
      <div className={styles.dotsContainer}>
        {state.questions.map((question, index) => {
          const isCompleted = index < state.currentQuestionIndex;
          const isCurrent = index === state.currentQuestionIndex;
          const userAnswer = state.userAnswers.find(a => a.questionId === question.id);
          const isCorrect = userAnswer?.isCorrect;

          return (
            <div
              key={question.id}
              className={`
                ${styles.dot}
                ${isCurrent ? styles.current : ''}
                ${isCompleted ? styles.completed : ''}
                ${isCompleted && isCorrect ? styles.correct : ''}
                ${isCompleted && !isCorrect ? styles.incorrect : ''}
              `}
              style={{
                backgroundColor: isCurrent 
                  ? getDifficultyColor(question.difficulty)
                  : undefined
              }}
              title={`Question ${index + 1} - ${getDifficultyLabel(question.difficulty)}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ProgressTracker;