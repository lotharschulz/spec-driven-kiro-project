/**
 * Results Screen Component
 * Comprehensive score display with performance visualization and retry options
 * Requirements: 3.6, 3.7, 5.6
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuiz } from '../contexts/QuizContext';
import { Difficulty, type QuizResults } from '../types/quiz';
import { getPerformanceFeedback, generatePerformanceAnalysis, type PerformanceAnalysis } from '../utils/scoringEngine';
import Button from './Button';
import Card from './Card';
import Typography from './Typography';
import styles from './ResultsScreen.module.css';

export interface ResultsScreenProps {
  onPlayAgain: () => void;
  onRetryDifficulty: (difficulty: Difficulty) => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({
  onPlayAgain,
  onRetryDifficulty
}) => {
  const { calculateResults, state } = useQuiz();
  const [results, setResults] = useState<QuizResults | null>(null);
  const [performanceAnalysis, setPerformanceAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const quizResults = calculateResults();
    setResults(quizResults);
    
    const analysis = generatePerformanceAnalysis(quizResults, state.questions);
    setPerformanceAnalysis(analysis);

    // Show celebration animation for high scores
    if (quizResults.percentage >= 80) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [calculateResults, state.questions]);

  if (!results || !performanceAnalysis) {
    return (
      <div className={styles.loading}>
        <Typography variant="h3">Calculating your results...</Typography>
      </div>
    );
  }

  const performanceFeedback = getPerformanceFeedback(results.percentage);
  const totalTimeMinutes = Math.floor(results.timeSpent / 60);
  const totalTimeSeconds = results.timeSpent % 60;

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className={styles.celebration}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.celebrationEmojis}>
              🎉 🏆 🌟 🎊 ✨
            </div>
            <Typography variant="h2" color="sunset-dark" className={styles.celebrationText}>
              Outstanding Performance!
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className={styles.scoreCircle}>
          <motion.div
            className={styles.scoreValue}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5, type: 'spring' }}
          >
            <Typography variant="h1" color="forest-dark">
              {results.percentage}%
            </Typography>
            <Typography variant="body2" color="gray-600">
              {results.correctAnswers}/{results.totalQuestions} correct
            </Typography>
          </motion.div>
        </div>
        
        <div className={styles.performanceFeedback}>
          <Typography variant="h2" className={styles.feedbackEmoji}>
            {performanceFeedback.emoji}
          </Typography>
          <Typography variant="h3" color="forest-dark" align="center">
            Grade: {performanceAnalysis.overallGrade}
          </Typography>
          <Typography variant="body1" color="gray-700" align="center">
            {performanceFeedback.message}
          </Typography>
        </div>
      </motion.div>

      {/* Score Breakdown */}
      <motion.div
        className={styles.breakdown}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card variant="elevated" padding="lg">
          <Typography variant="h4" color="forest-dark" gutterBottom>
            Performance Breakdown
          </Typography>
          
          <div className={styles.difficultyBreakdown}>
            {Object.entries(results.difficultyBreakdown).map(([difficulty, breakdown]) => (
              <motion.div
                key={difficulty}
                className={styles.difficultyItem}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + Object.keys(results.difficultyBreakdown).indexOf(difficulty) * 0.1 }}
              >
                <div className={styles.difficultyHeader}>
                  <Typography variant="h6" color="gray-800" className={styles.difficultyLabel}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </Typography>
                  <Typography variant="body2" color="gray-600">
                    {breakdown.correct}/{breakdown.total}
                  </Typography>
                </div>
                
                <div className={styles.progressBar}>
                  <motion.div
                    className={`${styles.progressFill} ${styles[`progress-${difficulty}`]}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${breakdown.percentage}%` }}
                    transition={{ delay: 0.8 + Object.keys(results.difficultyBreakdown).indexOf(difficulty) * 0.1, duration: 0.8 }}
                  />
                </div>
                
                <Typography variant="body2" color="gray-600" className={styles.percentage}>
                  {breakdown.percentage}%
                </Typography>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Statistics */}
      <motion.div
        className={styles.statistics}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <div className={styles.statsGrid}>
          <Card variant="outlined" padding="md" className={styles.statCard}>
            <Typography variant="h5" color="ocean-dark" align="center">
              {results.totalScore}
            </Typography>
            <Typography variant="caption" color="gray-600" align="center">
              Total Score
            </Typography>
          </Card>
          
          <Card variant="outlined" padding="md" className={styles.statCard}>
            <Typography variant="h5" color="sunset-dark" align="center">
              {totalTimeMinutes}:{totalTimeSeconds.toString().padStart(2, '0')}
            </Typography>
            <Typography variant="caption" color="gray-600" align="center">
              Time Taken
            </Typography>
          </Card>
          
          <Card variant="outlined" padding="md" className={styles.statCard}>
            <Typography variant="h5" color="forest-medium" align="center">
              {results.hintsUsed}
            </Typography>
            <Typography variant="caption" color="gray-600" align="center">
              Hints Used
            </Typography>
          </Card>
        </div>
      </motion.div>

      {/* Performance Analysis */}
      <motion.div
        className={styles.analysis}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <Card variant="elevated" padding="lg">
          <Typography variant="h4" color="forest-dark" gutterBottom>
            Your Performance Analysis
          </Typography>
          
          {performanceAnalysis.strengths.length > 0 && (
            <div className={styles.analysisSection}>
              <Typography variant="h6" color="success" gutterBottom>
                🌟 Strengths
              </Typography>
              <ul className={styles.analysisList}>
                {performanceAnalysis.strengths.map((strength, index) => (
                  <li key={index}>
                    <Typography variant="body2" color="gray-700">
                      {strength}
                    </Typography>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {performanceAnalysis.improvements.length > 0 && (
            <div className={styles.analysisSection}>
              <Typography variant="h6" color="warning" gutterBottom>
                💡 Areas for Improvement
              </Typography>
              <ul className={styles.analysisList}>
                {performanceAnalysis.improvements.map((improvement, index) => (
                  <li key={index}>
                    <Typography variant="body2" color="gray-700">
                      {improvement}
                    </Typography>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {performanceAnalysis.recommendations.length > 0 && (
            <div className={styles.analysisSection}>
              <Typography variant="h6" color="info" gutterBottom>
                📚 Recommendations
              </Typography>
              <ul className={styles.analysisList}>
                {performanceAnalysis.recommendations.map((recommendation, index) => (
                  <li key={index}>
                    <Typography variant="body2" color="gray-700">
                      {recommendation}
                    </Typography>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className={styles.actions}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.5 }}
      >
        <div className={styles.primaryActions}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onPlayAgain}
            leftIcon="🔄"
          >
            Play Again
          </Button>
        </div>
        
        <div className={styles.retryActions}>
          <Typography variant="h6" color="gray-700" align="center" gutterBottom>
            Want to improve? Try specific difficulty levels:
          </Typography>
          
          <div className={styles.retryButtons}>
            {Object.entries(results.difficultyBreakdown).map(([difficulty, breakdown]) => {
              const shouldShowRetry = breakdown.percentage < 100;
              
              if (!shouldShowRetry) return null;
              
              return (
                <Button
                  key={difficulty}
                  variant="secondary"
                  size="md"
                  onClick={() => onRetryDifficulty(difficulty as Difficulty)}
                  className={styles.retryButton}
                >
                  Retry {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  <span className={styles.retryScore}>
                    ({breakdown.percentage}%)
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResultsScreen;