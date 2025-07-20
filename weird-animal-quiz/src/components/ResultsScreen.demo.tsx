/**
 * ResultsScreen Demo Component
 * Demonstrates the ResultsScreen with sample data
 */

import React from 'react';
import { QuizProvider } from '../contexts/QuizContext';
import ResultsScreen from './ResultsScreen';
import { Difficulty } from '../types/quiz';

const ResultsScreenDemo: React.FC = () => {
  const handlePlayAgain = () => {
    console.log('Play Again clicked');
  };

  const handleRetryDifficulty = (difficulty: Difficulty) => {
    console.log(`Retry difficulty: ${difficulty}`);
  };

  return (
    <QuizProvider>
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <ResultsScreen 
          onPlayAgain={handlePlayAgain}
          onRetryDifficulty={handleRetryDifficulty}
        />
      </div>
    </QuizProvider>
  );
};

export default ResultsScreenDemo;