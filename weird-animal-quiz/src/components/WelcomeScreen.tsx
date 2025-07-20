/**
 * Welcome Screen Component
 * Nature-inspired landing page with quiz overview and start functionality
 * Requirements: 5.5, 4.3, 4.4, 4.9
 */

import React, { useState, useEffect } from 'react';
import { Button, Typography } from './';
import { FocusManager, AriaLabels, VisualAccessibility } from '../utils/accessibility';
import styles from './WelcomeScreen.module.css';

export interface WelcomeScreenProps {
  onStartQuiz: () => void;
  isLoading?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartQuiz,
  isLoading = false
}) => {
  const [isStarting, setIsStarting] = useState(false);

  // Apply accessibility preferences on mount
  useEffect(() => {
    const preferences = VisualAccessibility.loadPreferences();
    VisualAccessibility.applyPreferences(preferences);
    
    // Announce page load to screen readers
    FocusManager.announceToScreenReader(
      'Welcome to the Weird Animal Quiz. This page contains quiz information and a start button.',
      'polite'
    );
  }, []);

  const handleStartQuiz = async () => {
    setIsStarting(true);
    
    // Announce quiz start to screen readers
    FocusManager.announceToScreenReader('Starting quiz...', 'assertive');
    
    // Add a small delay for smooth transition
    setTimeout(() => {
      onStartQuiz();
      setIsStarting(false);
    }, 300);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isLoading && !isStarting) {
        handleStartQuiz();
      }
    }
  };

  return (
    <div className={styles.welcomeScreen} role="main" aria-labelledby="welcome-title">
      {/* Skip link for keyboard navigation */}
      <a href="#start-button" className="skip-link">
        Skip to start quiz button
      </a>
      
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          {/* Animal Emojis Header */}
          <div className={styles.emojiHeader} aria-hidden="true" role="presentation">
            <span className={styles.emoji}>🦎</span>
            <span className={styles.emoji}>🐙</span>
            <span className={styles.emoji}>🦘</span>
            <span className={styles.emoji}>🦜</span>
            <span className={styles.emoji}>🐨</span>
          </div>

          {/* Main Title */}
          <Typography
            variant="h1"
            color="forest-dark"
            align="center"
            className={styles.title}
            id="welcome-title"
          >
            Weird Animal Quiz
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="h2"
            color="ocean-dark"
            align="center"
            className={styles.subtitle}
          >
            Discover the bizarre world of animal behaviors
          </Typography>

          {/* Description */}
          <Typography
            variant="body1"
            color="gray-700"
            align="center"
            className={styles.description}
            id="quiz-description"
          >
            Test your knowledge with 9 fascinating questions about the weirdest 
            animal facts from nature documentaries. From sleeping koalas to 
            color-changing octopi, prepare to be amazed!
          </Typography>
        </div>
      </div>

      {/* Quiz Overview Section */}
      <section className={styles.overviewSection} aria-labelledby="overview-title">
        <Typography
          variant="h2"
          color="forest-medium"
          align="center"
          className={styles.overviewTitle}
          id="overview-title"
        >
          What to Expect
        </Typography>

        <ul className={styles.featureGrid} aria-label="Quiz features">
          <li className={styles.featureCard}>
            <div className={styles.featureIcon} aria-hidden="true" role="presentation">
              📊
            </div>
            <Typography 
              variant="h3" 
              color="gray-800" 
              className={styles.featureTitle}
              id="feature-questions"
            >
              9 Questions
            </Typography>
            <Typography 
              variant="body2" 
              color="gray-600" 
              className={styles.featureDescription}
              aria-describedby="feature-questions"
            >
              3 easy, 3 medium, 3 hard questions about bizarre animal behaviors
            </Typography>
          </li>

          <li className={styles.featureCard}>
            <div className={styles.featureIcon} aria-hidden="true" role="presentation">
              ⏱️
            </div>
            <Typography 
              variant="h3" 
              color="gray-800" 
              className={styles.featureTitle}
              id="feature-timing"
            >
              30 Seconds
            </Typography>
            <Typography 
              variant="body2" 
              color="gray-600" 
              className={styles.featureDescription}
              aria-describedby="feature-timing"
            >
              Per question with visual timer and helpful hints available
            </Typography>
          </li>

          <li className={styles.featureCard}>
            <div className={styles.featureIcon} aria-hidden="true" role="presentation">
              🎯
            </div>
            <Typography 
              variant="h3" 
              color="gray-800" 
              className={styles.featureTitle}
              id="feature-learning"
            >
              Learn & Discover
            </Typography>
            <Typography 
              variant="body2" 
              color="gray-600" 
              className={styles.featureDescription}
              aria-describedby="feature-learning"
            >
              Detailed explanations and fun facts after each question
            </Typography>
          </li>
        </ul>
      </section>

      {/* Start Button Section */}
      <section className={styles.startSection} aria-labelledby="start-section-title">
        <h2 id="start-section-title" className="sr-only">Start Quiz</h2>
        
        <Button
          variant="primary"
          size="xl"
          fullWidth
          loading={isLoading || isStarting}
          onClick={handleStartQuiz}
          onKeyDown={handleKeyDown}
          className={styles.startButton}
          aria-describedby="quiz-description start-hint"
          aria-label={isLoading || isStarting ? 'Loading quiz, please wait' : 'Start the weird animal quiz with 9 questions'}
          id="start-button"
        >
          {isLoading || isStarting ? 'Loading Quiz...' : 'Start Quiz'}
        </Button>

        <Typography
          variant="caption"
          color="gray-500"
          align="center"
          className={styles.startHint}
          id="start-hint"
          role="note"
        >
          Press Enter or Space to start, or tap the button above
        </Typography>
      </section>

      {/* Accessibility Information */}
      <div className={styles.accessibilityInfo}>
        <Typography
          variant="caption"
          color="gray-500"
          align="center"
          className={styles.accessibilityText}
          role="note"
        >
          This quiz is fully accessible with keyboard navigation and screen reader support. 
          Use Tab to navigate, Enter or Space to activate buttons, and arrow keys to navigate answer options.
        </Typography>
      </div>
    </div>
  );
};

export default WelcomeScreen;