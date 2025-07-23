/**
 * Answer Feedback and Explanation Display Component
 * Implements requirements: 2.3, 2.4, 2.5, 2.6, 2.9, 3.4, 3.8, 3.9
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import Typography from './Typography';
import type { Question, Answer } from '../types/quiz';
import { 
  useReducedMotion, 
  ANIMATION_VARIANTS, 
  TRANSITIONS, 
  ANIMATION_DURATIONS,
  CelebrationAnimations
} from '../utils/animationSystem';
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

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({
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

  // Check for reduced motion preference
  const prefersReducedMotion = useReducedMotion();
  
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

  // Animation variants for feedback components
  const feedbackVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: ANIMATION_DURATIONS.FEEDBACK,
        ease: "easeOut" 
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { 
        duration: ANIMATION_DURATIONS.FEEDBACK / 2 
      }
    }
  };
  
  // Staggered children animation for content sections
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  // Icon animation variants
  const iconVariants = isCorrect ? 
    ANIMATION_VARIANTS.CORRECT_ANSWER : 
    ANIMATION_VARIANTS.INCORRECT_ANSWER;
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          className={styles.feedbackOverlay}
          role="dialog"
          aria-labelledby="feedback-title"
          aria-describedby="feedback-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className={`${styles.feedbackContainer} ${isCorrect ? styles.correct : styles.incorrect}`}
            variants={feedbackVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Feedback Header with Animation */}
            <motion.div 
              className={styles.feedbackHeader}
              variants={containerVariants}
            >
              <motion.div 
                className={styles.feedbackIcon}
                variants={iconVariants}
              >
                {isCorrect ? (
                  <motion.div 
                    className={styles.successIcon}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 10 
                    }}
                  >
                    <span className={styles.checkmark}>✓</span>
                  </motion.div>
                ) : (
                  <motion.div 
                    className={styles.errorIcon}
                    animate={{ 
                      x: [0, -5, 5, -5, 0],
                      transition: { duration: 0.4 }
                    }}
                  >
                    <span className={styles.xmark}>✗</span>
                  </motion.div>
                )}
              </motion.div>
              
              <motion.div
                variants={feedbackVariants}
              >
                <Typography 
                  variant="h2" 
                  id="feedback-title"
                  className={styles.feedbackTitle}
                >
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </Typography>
              </motion.div>
            </motion.div>

            {/* Answer Information */}
            <motion.div 
              className={styles.answerInfo}
              variants={feedbackVariants}
            >
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
                <motion.div 
                  className={styles.correctAnswer}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <Typography variant="body1" className={styles.answerLabel}>
                    Correct answer:
                  </Typography>
                  <Typography variant="body1" className={`${styles.answerText} ${styles.correctText}`}>
                    {correctAnswer.text}
                  </Typography>
                </motion.div>
              )}
            </motion.div>

            {/* Explanation Section */}
            <motion.div 
              className={styles.explanationSection}
              variants={feedbackVariants}
              transition={{ delay: 0.2 }}
            >
              <motion.div 
                className={styles.explanation}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <Typography variant="h3" className={styles.sectionTitle}>
                  <motion.span 
                    className={styles.sectionIcon}
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    📚
                  </motion.span>
                  Explanation
                </Typography>
                <Typography variant="body1" className={styles.explanationText}>
                  {question.explanation}
                </Typography>
              </motion.div>

              <motion.div 
                className={styles.funFact}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <Typography variant="h3" className={styles.sectionTitle}>
                  <motion.span 
                    className={styles.sectionIcon}
                    animate={{ rotate: [0, 10, -10, 10, 0] }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    🤓
                  </motion.span>
                  Fun Fact
                </Typography>
                <Typography variant="body1" className={styles.funFactText}>
                  {question.funFact}
                </Typography>
              </motion.div>
            </motion.div>

            {/* Next Button with Timer */}
            <motion.div 
              className={styles.nextSection}
              variants={feedbackVariants}
              transition={{ delay: 0.5 }}
            >
              {!canProceed && (
                <div className={styles.readingTimer}>
                  <Typography variant="caption" className={styles.timerText}>
                    Please read for {timeRemaining} more second{timeRemaining !== 1 ? 's' : ''}
                  </Typography>
                  <div className={styles.timerBar}>
                    <motion.div 
                      className={styles.timerProgress}
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${((minReadingTime - timeRemaining) / minReadingTime) * 100}%` 
                      }}
                      transition={{ 
                        duration: 1, 
                        ease: "linear" 
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
            </motion.div>

            {/* Celebration Animation for Correct Answers */}
            {isCorrect && !prefersReducedMotion && (
              <motion.div 
                className={styles.celebrationOverlay} 
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.confetti}>
                  {Array.from({ length: prefersReducedMotion ? 5 : 20 }, (_, i) => (
                    <motion.div 
                      key={i} 
                      className={styles.confettiPiece}
                      initial={{ 
                        y: -20, 
                        opacity: 1,
                        backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`
                      }}
                      animate={{ 
                        y: '100vh', 
                        rotate: 360,
                        opacity: 0
                      }}
                      transition={{ 
                        duration: Math.random() * 3 + 2,
                        delay: Math.random() * 2,
                        ease: "easeIn"
                      }}
                      style={{
                        left: `${Math.random() * 100}%`,
                        width: `${Math.random() * 0.5 + 0.5}rem`,
                        height: `${Math.random() * 0.5 + 0.5}rem`,
                      }}
                    />
                  ))}
                </div>
                
                {/* Star burst effect */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.5, 0], opacity: [0, 0.7, 0] }}
                  transition={{ duration: 0.7 }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
                    borderRadius: '50%',
                  }}
                />
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackDisplay;