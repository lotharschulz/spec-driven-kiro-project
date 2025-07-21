/**
 * Question Display Component with Touch-Optimized Answer Selection
 * Implements requirements: 1.2, 1.7, 2.7, 3.1, 3.2, 3.3, 3.4, 4.3, 4.4, 4.6, 4.8
 */

import React, { useState, useEffect, useRef } from 'react';
import { useQuiz } from '../contexts/QuizContext';
import type { Question } from '../types/quiz';
import { Difficulty } from '../types/quiz';
import { Button } from './Button';
import { Timer } from './Timer';
import { ProgressTracker } from './ProgressTracker';
import { FeedbackDisplay } from './FeedbackDisplay';
import { generateHint, HintType, type HintResult } from '../utils/hintSystem';
import { 
  FocusManager, 
  AriaLabels, 
  KeyboardNavigation, 
  ScreenReaderUtils 
} from '../utils/accessibility';
import { 
  HapticFeedback, 
  MobileLayoutOptimizer, 
  MobileDetector,
  SwipeGestureHandler,
  ResponsiveBreakpoints
} from '../utils/mobileUtils';
import styles from './QuestionCard.module.css';

export interface QuestionCardProps {
  question: Question;
  onAnswer: (answerId: string) => void;
  onHintUsed: () => void;
  showFeedback?: boolean;
  selectedAnswerId?: string;
  isCorrect?: boolean;
  timeRemaining?: number;
  hintAvailable?: boolean;
  difficulty?: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onAnswer,
  onHintUsed,
  showFeedback = false,
  selectedAnswerId,
  isCorrect,
  timeRemaining = 30,
  hintAvailable = true,
  difficulty = 'easy'
}) => {
  const { state, isHintAvailable, getTimeWarningLevel, nextQuestion } = useQuiz();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const [currentHint, setCurrentHint] = useState<HintResult | null>(null);
  const [eliminatedAnswers, setEliminatedAnswers] = useState<string[]>([]);
  const [focusedAnswerIndex, setFocusedAnswerIndex] = useState<number>(-1);
  const [swipeGestureHandler, setSwipeGestureHandler] = useState<SwipeGestureHandler | null>(null);
  
  const questionRef = useRef<HTMLDivElement>(null);
  const answerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  const isHintAvailableForQuestion = isHintAvailable(question.id);
  const timeWarningLevel = getTimeWarningLevel();
  
  // Get the last user answer for this question
  const lastAnswer = state.userAnswers[state.userAnswers.length - 1];
  const selectedAnswerObj = lastAnswer ? question.answers.find(a => a.id === lastAnswer.selectedAnswerId) : null;

  // Handle answer selection with visual feedback and haptic feedback
  const handleAnswerSelect = async (answerId: string, answerIndex?: number) => {
    if (showFeedback || selectedAnswer) return; // Prevent multiple selections

    setSelectedAnswer(answerId);
    setShowAnswerFeedback(true);
    
    // Trigger haptic feedback for answer selection
    if (MobileDetector.isTouchDevice()) {
      try {
        await HapticFeedback.selection();
      } catch (error) {
        console.debug('Haptic feedback not available:', error);
      }
    }
    
    // Announce selection to screen readers
    const answer = question.answers.find(a => a.id === answerId);
    if (answer) {
      FocusManager.announceToScreenReader(
        `Selected answer ${String.fromCharCode(65 + (answerIndex || 0))}: ${answer.text}`,
        'assertive'
      );
    }
    
    // Trigger answer submission after brief animation
    setTimeout(() => {
      onAnswer(answerId);
    }, 300);
  };

  // Handle hint usage with haptic feedback
  const handleHintClick = async () => {
    if (!isHintAvailableForQuestion || currentHint) return;
    
    // Trigger haptic feedback for hint usage
    if (MobileDetector.isTouchDevice()) {
      try {
        await HapticFeedback.light();
      } catch (error) {
        console.debug('Haptic feedback not available:', error);
      }
    }
    
    // Generate hint for current question
    const hint = generateHint(question);
    setCurrentHint(hint);
    
    // If hint eliminates an answer, add it to eliminated list
    if (hint.type === HintType.ELIMINATE_WRONG_ANSWER && hint.eliminatedAnswerId) {
      setEliminatedAnswers(prev => [...prev, hint.eliminatedAnswerId!]);
      
      // Announce elimination to screen readers
      const eliminatedAnswer = question.answers.find(a => a.id === hint.eliminatedAnswerId);
      if (eliminatedAnswer) {
        const answerIndex = question.answers.findIndex(a => a.id === hint.eliminatedAnswerId);
        FocusManager.announceToScreenReader(
          `Hint used. Answer ${String.fromCharCode(65 + answerIndex)} has been eliminated: ${eliminatedAnswer.text}`,
          'assertive'
        );
      }
    } else {
      // Announce hint message
      FocusManager.announceToScreenReader(`Hint: ${hint.message}`, 'assertive');
    }
    
    // Notify parent component that hint was used
    onHintUsed();
  };

  // Handle keyboard navigation for answers
  const handleAnswerKeyDown = (event: React.KeyboardEvent, answerIndex: number) => {
    KeyboardNavigation.handleArrowNavigation(
      event,
      answerIndex,
      question.answers.length,
      (newIndex) => {
        setFocusedAnswerIndex(newIndex);
        answerRefs.current[newIndex]?.focus();
      }
    );
    
    // Handle Enter/Space for selection
    KeyboardNavigation.handleActivation(event, () => {
      const answerId = question.answers[answerIndex].id;
      handleAnswerSelect(answerId, answerIndex);
    });
  };

  // Mobile optimization and gesture setup
  useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement) return;

    // Apply mobile optimizations
    MobileLayoutOptimizer.optimizeForThumbNavigation(cardElement);
    MobileLayoutOptimizer.optimizeTouchTargets(cardElement);

    // Setup swipe gestures for mobile devices
    if (MobileDetector.isTouchDevice() && !showFeedback) {
      const gestureHandler = new SwipeGestureHandler(
        cardElement,
        {
          onSwipeLeft: () => {
            // Swipe left to go to next question (if feedback is showing)
            if (state.showingFeedback) {
              nextQuestion();
            }
          },
          onSwipeRight: () => {
            // Swipe right could be used for previous question in future
            console.debug('Swipe right detected');
          }
        },
        { threshold: 100 }
      );
      
      setSwipeGestureHandler(gestureHandler);
      
      return () => {
        gestureHandler.destroy();
      };
    }
  }, [showFeedback, state.showingFeedback, nextQuestion]);

  // Reset selection and hint state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setShowAnswerFeedback(false);
    setCurrentHint(null);
    setEliminatedAnswers([]);
    setFocusedAnswerIndex(-1);
    
    // Announce new question to screen readers
    const questionNumber = state.currentQuestionIndex + 1;
    const totalQuestions = state.questions.length;
    const difficultyLabel = getDifficultyLabel(question.difficulty);
    
    FocusManager.announceToScreenReader(
      `Question ${questionNumber} of ${totalQuestions}. Difficulty: ${difficultyLabel}. ${question.text}`,
      'assertive'
    );
    
    // Focus on question text for screen readers
    if (questionRef.current) {
      questionRef.current.focus();
    }
  }, [question.id, state.currentQuestionIndex, state.questions.length]);

  const getDifficultyColor = (difficulty: Difficulty): string => {
    switch (difficulty) {
      case Difficulty.EASY:
        return 'var(--color-forest-medium)';
      case Difficulty.MEDIUM:
        return 'var(--color-sunset-medium)';
      case Difficulty.HARD:
        return 'var(--color-error)';
      default:
        return 'var(--color-gray-500)';
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

  const getAnswerButtonVariant = (answerId: string) => {
    // Check if answer is eliminated by hint
    if (eliminatedAnswers.includes(answerId)) {
      return 'ghost';
    }
    
    if (!showFeedback && !showAnswerFeedback) return 'secondary';
    
    if (selectedAnswerId === answerId || selectedAnswer === answerId) {
      const answer = question.answers.find(a => a.id === answerId);
      return answer?.isCorrect ? 'success' : 'error';
    }
    
    // Highlight correct answer when showing feedback
    if (showFeedback) {
      const answer = question.answers.find(a => a.id === answerId);
      if (answer?.isCorrect) return 'success';
    }
    
    return 'ghost';
  };

  const isAnswerDisabled = (answerId: string) => {
    return eliminatedAnswers.includes(answerId) || showFeedback || showAnswerFeedback;
  };

  const deviceInfo = MobileDetector.getDeviceInfo();
  const currentBreakpoint = ResponsiveBreakpoints.getCurrentBreakpoint();

  return (
    <div 
      className={`${styles.questionCard} ${deviceInfo.isMobile ? 'mobile-container' : ''} ${currentBreakpoint === 'mobile' ? 'safe-area-inset-bottom' : ''}`} 
      role="main" 
      aria-labelledby="current-question"
      ref={cardRef}
      tabIndex={-1}
    >
      <div ref={questionRef} tabIndex={-1}>
        {/* Progress Tracker */}
        <div className={styles.progressSection} role="banner">
          <ProgressTracker showDifficulty={true} />
        </div>

        {/* Timer Section */}
        <div 
          className={`${styles.timerSection} ${styles[timeWarningLevel]}`}
          role="timer"
          aria-live="polite"
          aria-label={AriaLabels.timer(state.timeRemaining || 30, timeWarningLevel)}
        >
          <Timer duration={30} />
        </div>

        {/* Question Header */}
        <header className={styles.questionHeader}>
          <div className={styles.difficultyBadge}>
            <div 
              className={styles.difficultyIndicator}
              style={{ backgroundColor: getDifficultyColor(question.difficulty) }}
              role="status"
              aria-label={`Difficulty level: ${getDifficultyLabel(question.difficulty)}`}
            >
              {getDifficultyLabel(question.difficulty)}
            </div>
          </div>
          
          <div className={styles.emojis} role="presentation" aria-hidden="true">
            {question.emojis.map((emoji, index) => (
              <span key={index} className={styles.emoji} role="img" aria-hidden="true">
                {emoji}
              </span>
            ))}
          </div>
        </header>

        {/* Question Text */}
        <section className={styles.questionContent}>
          <h1 
            className={styles.questionText}
            id="current-question"
            tabIndex={-1}
          >
            {question.text}
          </h1>
        </section>

        {/* Answer Options */}
        <section 
          className={styles.answersSection}
          role="group"
          aria-labelledby="answers-heading"
        >
          <h2 id="answers-heading" className="sr-only">
            Answer Options - Use arrow keys to navigate, Enter or Space to select
          </h2>
          
          <div 
            className={styles.answersGrid}
            role="radiogroup"
            aria-labelledby="current-question"
            aria-required="true"
            aria-describedby="answer-instructions"
          >
            {question.answers.map((answer, index) => {
              const isSelected = selectedAnswer === answer.id || selectedAnswerId === answer.id;
              const variant = getAnswerButtonVariant(answer.id);
              const isEliminated = eliminatedAnswers.includes(answer.id);
              const disabled = isAnswerDisabled(answer.id);
              
              return (
                <Button
                  key={answer.id}
                  ref={(el) => (answerRefs.current[index] = el)}
                  variant={variant}
                  size="lg"
                  fullWidth
                  className={`${styles.answerButton} ${isSelected ? styles.selected : ''} ${isEliminated ? styles.eliminated : ''}`}
                  onClick={() => handleAnswerSelect(answer.id, index)}
                  onKeyDown={(e) => handleAnswerKeyDown(e, index)}
                  disabled={disabled}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={AriaLabels.answerButton(
                    String.fromCharCode(65 + index),
                    answer.text,
                    index,
                    question.answers.length,
                    isSelected,
                    isSelected ? answer.isCorrect : undefined,
                    isEliminated
                  )}
                  aria-describedby={isEliminated ? `eliminated-${index}` : undefined}
                >
                  <span className={styles.answerLetter} aria-hidden="true">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className={styles.answerText}>
                    {answer.text}
                  </span>
                  {isEliminated && (
                    <>
                      <span className={styles.eliminatedIcon} aria-hidden="true">
                        ❌
                      </span>
                      <span id={`eliminated-${index}`} className="sr-only">
                        This option has been eliminated by hint
                      </span>
                    </>
                  )}
                  {isSelected && showAnswerFeedback && (
                    <span className={styles.feedbackIcon} aria-hidden="true">
                      {question.answers.find(a => a.id === answer.id)?.isCorrect ? '✓' : '✗'}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
          
          <div id="answer-instructions" className="sr-only">
            Use arrow keys to navigate between answers, Enter or Space to select an answer
          </div>
        </section>

        {/* Hint Section */}
        <section className={styles.hintSection} aria-labelledby="hint-heading">
          <h3 id="hint-heading" className="sr-only">Hint</h3>
          
          <Button
            variant="ghost"
            size="md"
            onClick={handleHintClick}
            disabled={!isHintAvailableForQuestion || showFeedback || showAnswerFeedback || currentHint !== null}
            className={`${styles.hintButton} ${!isHintAvailableForQuestion || currentHint ? styles.hintUsed : ''}`}
            leftIcon={<span role="img" aria-label="hint">💡</span>}
            aria-label={AriaLabels.hintButton(isHintAvailableForQuestion, currentHint !== null)}
            aria-describedby="hint-status"
          >
            {isHintAvailableForQuestion && !currentHint ? 'Use Hint' : 'Hint Used'}
          </Button>
          
          <div id="hint-status" className={styles.hintUsedIndicator} role="status">
            {(!isHintAvailableForQuestion || currentHint) && (
              <span>
                {!isHintAvailableForQuestion ? 'Hint already used for this question' : 'Hint used for this question'}
              </span>
            )}
          </div>
          
          {/* Display current hint */}
          {currentHint && (
            <div 
              className={styles.hintDisplay}
              role="region"
              aria-labelledby="hint-content"
              aria-live="polite"
            >
              <h4 id="hint-content" className="sr-only">Hint Content</h4>
              <div className={styles.hintMessage} role="text">
                {currentHint.message}
              </div>
              {currentHint.clue && (
                <div className={styles.hintClue} role="text">
                  {currentHint.clue}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Feedback Display */}
        {state.showingFeedback && lastAnswer && selectedAnswerObj && (
          <FeedbackDisplay
            question={question}
            selectedAnswer={selectedAnswerObj}
            isCorrect={lastAnswer.isCorrect}
            onNext={nextQuestion}
            show={state.showingFeedback}
            minReadingTime={20}
          />
        )}
      </div>
    </div>
  );
};

export default QuestionCard;