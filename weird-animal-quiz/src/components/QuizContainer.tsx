import React from 'react';
import { Timer } from './Timer';
import { QuizProvider, useQuiz, Question } from '../state/QuizContext';

// Dummy questions for demonstration (replace with real data)
const demoQuestions: Question[] = [
  {
    id: 'q1',
    text: 'Which animal can sleep for up to three years at a time? 🐌🌧️',
    answers: [
      { id: 'a1', text: 'Snail', isCorrect: true },
      { id: 'a2', text: 'Bat', isCorrect: false },
      { id: 'a3', text: 'Frog', isCorrect: false },
      { id: 'a4', text: 'Sloth', isCorrect: false },
    ],
    difficulty: 'easy',
    emojis: ['🐌', '🌧️'],
    explanation: 'Some snails can hibernate for up to three years in extreme conditions!',
  },
  // ...add more questions for real quiz
];

const QUESTION_TIME = 30;


import { FeedbackDisplay } from './FeedbackDisplay';

const QuizFlow: React.FC = () => {
  const { state, dispatch } = useQuiz();
  const currentQ = state.questions[state.currentQuestionIndex];
  const [selectedAnswer, setSelectedAnswer] = React.useState<string | null>(null);
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [feedbackKey, setFeedbackKey] = React.useState(0); // for remounting FeedbackDisplay
  const [timeTaken, setTimeTaken] = React.useState(0);

  React.useEffect(() => {
    if (state.questions.length === 0) {
      dispatch({ type: 'SET_QUESTIONS', questions: demoQuestions });
    }
  }, [state.questions.length, dispatch]);

  React.useEffect(() => {
    // Reset feedback state on new question
    setSelectedAnswer(null);
    setShowFeedback(false);
    setFeedbackKey((k) => k + 1);
    setTimeTaken(0);
  }, [state.currentQuestionIndex]);

  if (!currentQ) return <div>Loading...</div>;

  const handleTimeUp = () => {
    if (!state.paused && !state.isComplete && !showFeedback) {
      setSelectedAnswer(null);
      setTimeTaken(QUESTION_TIME);
      setShowFeedback(true);
      dispatch({ type: 'ANSWER_QUESTION', answerId: null as any, timeTaken: QUESTION_TIME });
    }
  };

  const handleAnswer = (answerId: string, timeSpent: number) => {
    if (!state.paused && !showFeedback) {
      setSelectedAnswer(answerId);
      setTimeTaken(timeSpent);
      setShowFeedback(true);
      dispatch({ type: 'ANSWER_QUESTION', answerId, timeTaken: timeSpent });
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setTimeTaken(0);
    dispatch({ type: 'NEXT_QUESTION' });
  };

  // Timer is paused during feedback
  const timerPaused = state.paused || showFeedback;

  // Feedback logic
  const userAnswered = selectedAnswer !== null || showFeedback;
  const correctAnswerObj = currentQ.answers.find((a) => a.isCorrect);
  const correctAnswerText = correctAnswerObj ? correctAnswerObj.text : '';
  const isCorrect = selectedAnswer && correctAnswerObj && selectedAnswer === correctAnswerObj.id;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Timer
          duration={QUESTION_TIME}
          onTimeUp={handleTimeUp}
          paused={timerPaused}
        />
      </div>
      <div>
        {!showFeedback ? (
          <>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>{currentQ.text}</div>
            <div style={{ margin: '16px 0' }}>
              {currentQ.answers.map((a) => (
                <button
                  key={a.id}
                  style={{
                    display: 'block',
                    width: '100%',
                    margin: '8px 0',
                    padding: '16px',
                    fontSize: 18,
                    borderRadius: 12,
                    border: '2px solid #4A7C59',
                    background: selectedAnswer === a.id ? (a.isCorrect ? '#4A7C59' : '#EA580C') : '#fff',
                    color: selectedAnswer === a.id ? '#fff' : '#2D5016',
                    cursor: 'pointer',
                    transition: 'background 0.3s, color 0.3s',
                  }}
                  onClick={() => handleAnswer(a.id, QUESTION_TIME - timeTaken)}
                  disabled={userAnswered}
                  aria-pressed={selectedAnswer === a.id}
                >
                  {a.text}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <span>Question {state.currentQuestionIndex + 1} of {state.questions.length}</span>
              <span style={{ marginLeft: 16 }}>Difficulty: {currentQ.difficulty}</span>
            </div>
          </>
        ) : (
          <FeedbackDisplay
            key={feedbackKey}
            isCorrect={!!isCorrect}
            correctAnswer={correctAnswerText}
            explanation={currentQ.explanation}
            onNext={handleNext}
            minReadTime={3}
          />
        )}
        {state.isComplete && <div>Quiz Complete!</div>}
      </div>
    </div>
  );
};

export const QuizContainer: React.FC = () => (
  <QuizProvider>
    <QuizFlow />
  </QuizProvider>
);
