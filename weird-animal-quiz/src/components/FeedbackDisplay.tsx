/**
 * Answer Feedback and Explanation Display Component
 * Implements requirements: 2.3, 2.4, 2.5, 2.6, 2.9, 3.4, 3.8, 3.9
 */

import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Typography } from './Typography';
import type { Question, Answer } from '../types/quiz';
import styles from './FeedbackDisplay.module.css';

export interface FeedbackDisplayProps {
  /** The current question being answered */
  question: Question;
  /** The answer selected by the user */
  selectedAnswer: Answer;
  /** Whether the selected answer is correct */
  isCorrect: boolean;
  /** Callback when user clicks Next Question */
  onNext: () => void;
  /** Whether to show the component (for animation control) */
  show?: boolean;
  /** Minimum reading time in seconds before enabling Next button */
  minReadingTime?: number;
}

export const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({
  question,
  selectedAnswer,
  isCorrect,
  onNext,
  show = true,
  minReadingTime = 20 // Default 20 seconds (within 15-25 second requirement)
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(minReadingTime);

  // Find the correct answer for display
  const correctAnswer = question.answers.find(answer => answer.isCorrect);

  // Handle component visibility and animation
  useEffect(() => {
    if (show) {
      // Small delay to ensure smooth animation
      const showTimer = setTimeout(() => {
        setIsVisible(true);
      }, 50);

      return () => clearTimeout(showTimer);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  // Handle minimum reading time countdown
  useEffect(() => {
    if (!show) return;

    setCanProceed(false);
    setTimeRemaining(minReadingTime);

    if (minReadingTime <= 0) {
      setCanProceed(true);
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setCanProceed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [show, minReadingTime]);

  // Handle Next button click
  const handleNext = () => {
    if (!canProceed) return;
    
    // Fade out animation before proceeding
    setIsVisible(false);
    setTimeout(() => {
      onNext();
    }, 300);
  };

  if (!show) return null;

  return (
    <div 
      className={`${styles.feedbackOverlay} ${isVisible ? styles.visible : ''}`}
      role="dialog"
      aria-labelledby="feedback-title"
      aria-describedby="feedback-content"
    >
      <div className={`${styles.feedbackContainer} ${isCorrect ? styles.correct : styles.incorrect}`}>
        
        {/* Feedback Header with Animation */}
        <div className={styles.feedbackHeader}>
          <div className={`${styles.feedbackIcon} ${isVisible ? styles.iconAnimated : ''}`}>
            {isCorrect ? (
              <div className={styles.successIcon}>
                <span className={styles.checkmark}>✓</span>
              </div>
            ) : (
              <div className={styles.errorIcon}>
                <span className={styles.xmark}>✗</span>
              </div>
            )}
          </div>
          
          <Typography 
            variant="h2" 
            id="feedback-title"
            className={`${styles.feedbackTitle} ${isVisible ? styles.titleAnimated : ''}`}
          >
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </Typography>
        </div>

        {/* Answer Information */}
        <div className={`${styles.answerInfo} ${isVisible ? styles.contentAnimated : ''}`}>
          <div className={styles.selectedAnswer}>
            <Typography variant="body1" className={styles.answerLabel}>
              Your answer:
            </Typography>
            <Typography 
              variant="body1" 
              className={`${styles.answerText} ${isCorrect ? styles.correctText : styles.incorrectText}`}
            >
              {selectedAnswer.text}
            </Typography>
          </div>

          {!isCorrect && correctAnswer && (
            <div className={styles.correctAnswer}>
              <Typography variant="body1" className={styles.answerLabel}>
                Correct answer:
              </Typography>
              <Typography variant="body1" className={`${styles.answerText} ${styles.correctText}`}>
                {correctAnswer.text}
              </Typography>
            </div>
          )}
        </div>

        {/* Explanation Section */}
        <div className={`${styles.explanationSection} ${isVisible ? styles.contentAnimated : ''}`}>
          <div className={styles.explanation}>
            <Typography variant="h3" className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📚</span>
              Explanation
            </Typography>
            <Typography variant="body1" className={styles.explanationText}>
              {question.explanation}
            </Typography>
          </div>

          <div className={styles.funFact}>
            <Typography variant="h3" className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🤓</span>
              Fun Fact
            </Typography>
            <Typography variant="body1" className={styles.funFactText}>
              {question.funFact}
            </Typography>
          </div>
        </div>

        {/* Next Button with Timer */}
        <div className={`${styles.nextSection} ${isVisible ? styles.contentAnimated : ''}`}>
          {!canProceed && (
            <div className={styles.readingTimer}>
              <Typography variant="caption" className={styles.timerText}>
                Please read for {timeRemaining} more second{timeRemaining !== 1 ? 's' : ''}
              </Typography>
              <div className={styles.timerBar}>
                <div 
                  className={styles.timerProgress}
                  style={{ 
                    width: `${((minReadingTime - timeRemaining) / minReadingTime) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}
          
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleNext}
            disabled={!canProceed}
            className={`${styles.nextButton} ${canProceed ? styles.nextEnabled : styles.nextDisabled}`}
            aria-describedby={!canProceed ? "reading-timer" : undefined}
          >
            {canProceed ? 'Next Question' : `Wait ${timeRemaining}s`}
          </Button>
        </div>

        {/* Celebration Animation for Correct Answers */}
        {isCorrect && isVisible && (
          <div className={styles.celebrationOverlay} aria-hidden="true">
            <div className={styles.confetti}>
              {Array.from({ length: 20 }, (_, i) => (
                <div 
                  key={i} 
                  className={styles.confettiPiece}
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackDisplay;