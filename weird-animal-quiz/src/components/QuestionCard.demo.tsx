/**
 * QuestionCard Component Demo
 * Shows how to use the QuestionCard component with different states
 */

import React, { useState } from 'react';
import { QuizProvider } from '../contexts/QuizContext';
import { QuestionCard } from './QuestionCard';
import { Question, Difficulty } from '../types/quiz';

const demoQuestion: Question = {
  id: 'demo-question',
  difficulty: Difficulty.MEDIUM,
  text: 'Which animal can sleep for up to 22 hours a day?',
  emojis: ['🐨', '😴'],
  answers: [
    { id: 'answer-1', text: 'Koala', isCorrect: true },
    { id: 'answer-2', text: 'Sloth', isCorrect: false },
    { id: 'answer-3', text: 'Panda', isCorrect: false },
    { id: 'answer-4', text: 'Cat', isCorrect: false }
  ],
  explanation: 'Koalas sleep 18-22 hours daily to conserve energy for digesting eucalyptus leaves, which are low in nutrients and difficult to process.',
  funFact: 'Koalas have fingerprints that are almost identical to human fingerprints - so similar that they could potentially contaminate crime scenes!',
  category: 'behavior'
};

export const QuestionCardDemo: React.FC = () => {
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  const handleAnswer = (answerId: string) => {
    setSelectedAnswerId(answerId);
    setShowFeedback(true);
  };

  const handleHintUsed = () => {
    setHintUsed(true);
  };

  const resetDemo = () => {
    setSelectedAnswerId(null);
    setShowFeedback(false);
    setHintUsed(false);
  };

  const isCorrect = selectedAnswerId === 'answer-1';

  return (
    <QuizProvider>
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>QuestionCard Component Demo</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <button onClick={resetDemo} style={{ marginRight: '10px' }}>
            Reset Demo
          </button>
          <span>
            Status: {showFeedback ? (isCorrect ? 'Correct!' : 'Incorrect') : 'Waiting for answer...'}
          </span>
        </div>

        <QuestionCard
          question={demoQuestion}
          onAnswer={handleAnswer}
          onHintUsed={handleHintUsed}
          showFeedback={showFeedback}
          selectedAnswerId={selectedAnswerId || undefined}
          isCorrect={isCorrect}
        />

        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h3>Component Features Demonstrated:</h3>
          <ul>
            <li>✅ Difficulty level indicator (Medium)</li>
            <li>✅ Question text with emojis</li>
            <li>✅ Touch-optimized answer buttons (A, B, C, D)</li>
            <li>✅ Timer integration with color-coded warnings</li>
            <li>✅ Progress tracker</li>
            <li>✅ Hint system</li>
            <li>✅ Visual feedback animations</li>
            <li>✅ Answer feedback with explanations</li>
            <li>✅ Mobile-first responsive design</li>
            <li>✅ Accessibility features (ARIA labels, keyboard navigation)</li>
          </ul>
        </div>
      </div>
    </QuizProvider>
  );
};

export default QuestionCardDemo;