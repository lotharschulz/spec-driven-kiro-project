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

const QuizFlow: React.FC = () => {
  const { state, dispatch } = useQuiz();
  const currentQ = state.questions[state.currentQuestionIndex];

  React.useEffect(() => {
    if (state.questions.length === 0) {
      dispatch({ type: 'SET_QUESTIONS', questions: demoQuestions });
    }
  }, [state.questions.length, dispatch]);

  if (!currentQ) return <div>Loading...</div>;

  const handleTimeUp = () => {
    if (!state.paused && !state.isComplete) {
      dispatch({ type: 'ANSWER_QUESTION', answerId: null as any, timeTaken: QUESTION_TIME });
    }
  };

  const handleAnswer = (answerId: string, timeTaken: number) => {
    if (!state.paused) {
      dispatch({ type: 'ANSWER_QUESTION', answerId, timeTaken });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Timer
          duration={QUESTION_TIME}
          onTimeUp={handleTimeUp}
          paused={state.paused}
        />
      </div>
      <div>
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
                background: '#fff',
                color: '#2D5016',
                cursor: 'pointer',
              }}
              onClick={() => handleAnswer(a.id, QUESTION_TIME)}
              disabled={state.paused}
            >
              {a.text}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <span>Question {state.currentQuestionIndex + 1} of {state.questions.length}</span>
          <span style={{ marginLeft: 16 }}>Difficulty: {currentQ.difficulty}</span>
        </div>
        {state.paused && !state.isComplete && (
          <button
            style={{ marginTop: 24, padding: '12px 24px', fontSize: 18 }}
            onClick={() => dispatch({ type: 'NEXT_QUESTION' })}
          >
            Next Question
          </button>
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
