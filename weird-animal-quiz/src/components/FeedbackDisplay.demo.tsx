/**
 * FeedbackDisplay Demo Component
 * For testing and demonstrating the feedback system
 */

import React, { useState } from 'react';
import { FeedbackDisplay } from './FeedbackDisplay';
import { Button } from './Button';
import type { Question } from '../types/quiz';
import { Difficulty } from '../types/quiz';

const demoQuestion: Question = {
  id: 'demo-question',
  difficulty: Difficulty.EASY,
  text: 'Which animal can sleep for up to 22 hours a day?',
  emojis: ['🐨', '😴'],
  answers: [
    { id: 'correct', text: 'Koala', isCorrect: true },
    { id: 'wrong1', text: 'Sloth', isCorrect: false },
    { id: 'wrong2', text: 'Panda', isCorrect: false },
    { id: 'wrong3', text: 'Cat', isCorrect: false }
  ],
  explanation: 'Koalas sleep 18-22 hours daily to conserve energy for digesting eucalyptus leaves, which are low in nutrients and difficult to process.',
  funFact: 'Koalas have fingerprints that are almost identical to human fingerprints - so similar that they could potentially contaminate crime scenes!',
  category: 'behavior'
};

export const FeedbackDisplayDemo: React.FC = () => {
  const [showCorrect, setShowCorrect] = useState(false);
  const [showIncorrect, setShowIncorrect] = useState(false);

  const handleNext = () => {
    setShowCorrect(false);
    setShowIncorrect(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>FeedbackDisplay Demo</h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <Button 
          onClick={() => setShowCorrect(true)}
          variant="success"
        >
          Show Correct Feedback
        </Button>
        
        <Button 
          onClick={() => setShowIncorrect(true)}
          variant="error"
        >
          Show Incorrect Feedback
        </Button>
      </div>

      {showCorrect && (
        <FeedbackDisplay
          question={demoQuestion}
          selectedAnswer={demoQuestion.answers[0]} // Correct answer
          isCorrect={true}
          onNext={handleNext}
          show={showCorrect}
          minReadingTime={3}
        />
      )}

      {showIncorrect && (
        <FeedbackDisplay
          question={demoQuestion}
          selectedAnswer={demoQuestion.answers[1]} // Wrong answer
          isCorrect={false}
          onNext={handleNext}
          show={showIncorrect}
          minReadingTime={3}
        />
      )}
    </div>
  );
};

export default FeedbackDisplayDemo;