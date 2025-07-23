import React from 'react';
import styles from './WelcomeScreen.module.css';
import { Button } from './ui/Button';
import { Typography } from './ui/Typography';

interface WelcomeScreenProps {
  onStartQuiz: () => void;
  loading?: boolean;
  accessibilityOptions?: React.ReactNode;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartQuiz,
  loading = false,
  accessibilityOptions,
}) => (
  <div>
    <div className={styles.hero}>
      <div className={styles.animals} aria-hidden="true">🦎🦉🦑🦘🦔🦦</div>
      <div className={styles.title}>Weird Animal Quiz</div>
      <div className={styles.subtitle}>9 questions • 3 difficulty levels • 100% fun facts</div>
      <div className={styles.overview}>
        Test your knowledge of the world’s strangest creatures!<br />
        Discover bizarre animal behaviors, unique adaptations, and shocking facts.<br />
        Mobile-first, secure, and accessible for everyone.
      </div>
      <Button
        onClick={onStartQuiz}
        disabled={loading}
        aria-label="Start the quiz"
        style={{ fontSize: 20, minWidth: 120, minHeight: 48, marginTop: 12 }}
      >
        {loading ? 'Loading…' : 'Start Quiz'}
      </Button>
      {accessibilityOptions && (
        <div className={styles.accessibility}>
          {accessibilityOptions}
        </div>
      )}
    </div>
    <Typography variant="p" style={{ textAlign: 'center', marginTop: 16, color: '#4A7C59' }}>
      Built for curious minds ages 13-17 • WCAG 2.1 AA accessible
    </Typography>
  </div>
);
