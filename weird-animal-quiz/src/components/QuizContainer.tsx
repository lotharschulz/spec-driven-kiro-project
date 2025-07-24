import React, { Suspense } from 'react';
import { Timer } from './Timer';
import { QuizProvider, useQuiz, Question } from '../state/QuizContext';

// Dummy questions for demonstration (replace with real data)
const demoQuestions: Question[] = [
  // Easy questions
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
  {
    id: 'q6',
    text: 'Which animal can run on water for short distances? 🦎💦',
    answers: [
      { id: 'a1', text: 'Basilisk Lizard', isCorrect: true },
      { id: 'a2', text: 'Duck', isCorrect: false },
      { id: 'a3', text: 'Otter', isCorrect: false },
      { id: 'a4', text: 'Platypus', isCorrect: false },
    ],
    difficulty: 'easy',
    emojis: ['🦎', '💦'],
    explanation: 'Basilisk lizards are known as "Jesus lizards" for their ability to run on water.',
  },
  {
    id: 'q7',
    text: 'Which animal can change its color to blend in with its surroundings? 🦎🌈',
    answers: [
      { id: 'a1', text: 'Chameleon', isCorrect: true },
      { id: 'a2', text: 'Parrot', isCorrect: false },
      { id: 'a3', text: 'Tiger', isCorrect: false },
      { id: 'a4', text: 'Rabbit', isCorrect: false },
    ],
    difficulty: 'easy',
    emojis: ['🦎', '🌈'],
    explanation: 'Chameleons are famous for their ability to change color for camouflage.',
  },
  {
    id: 'q8',
    text: 'Which animal is known for its black-and-white stripes? 🦓',
    answers: [
      { id: 'a1', text: 'Zebra', isCorrect: true },
      { id: 'a2', text: 'Tiger', isCorrect: false },
      { id: 'a3', text: 'Skunk', isCorrect: false },
      { id: 'a4', text: 'Penguin', isCorrect: false },
    ],
    difficulty: 'easy',
    emojis: ['🦓'],
    explanation: 'Zebras are easily recognized by their unique black-and-white stripes.',
  },
  {
    id: 'q9',
    text: 'Which animal is the only mammal capable of true flight? 🦇',
    answers: [
      { id: 'a1', text: 'Bat', isCorrect: true },
      { id: 'a2', text: 'Flying Squirrel', isCorrect: false },
      { id: 'a3', text: 'Sugar Glider', isCorrect: false },
      { id: 'a4', text: 'Owl', isCorrect: false },
    ],
    difficulty: 'easy',
    emojis: ['🦇'],
    explanation: 'Bats are the only mammals capable of sustained flight.',
  },
  {
    id: 'q10',
    text: 'Which animal is famous for its slow movement and hanging from trees? 🦥',
    answers: [
      { id: 'a1', text: 'Sloth', isCorrect: true },
      { id: 'a2', text: 'Koala', isCorrect: false },
      { id: 'a3', text: 'Monkey', isCorrect: false },
      { id: 'a4', text: 'Lemur', isCorrect: false },
    ],
    difficulty: 'easy',
    emojis: ['🦥'],
    explanation: 'Sloths are known for their slow movement and tree-dwelling lifestyle.',
  },
  // Medium questions
  {
    id: 'q2',
    text: 'Which animal has the longest pregnancy of any land mammal? 🐘⏳',
    answers: [
      { id: 'a1', text: 'Elephant', isCorrect: true },
      { id: 'a2', text: 'Giraffe', isCorrect: false },
      { id: 'a3', text: 'Horse', isCorrect: false },
      { id: 'a4', text: 'Whale', isCorrect: false },
    ],
    difficulty: 'medium',
    emojis: ['🐘', '⏳'],
    explanation: 'Elephants are pregnant for about 22 months, the longest of any land mammal.',
  },
  {
    id: 'q4',
    text: 'Which animal has transparent skin and can see its own heart beating? 🦑👀',
    answers: [
      { id: 'a1', text: 'Glass Frog', isCorrect: true },
      { id: 'a2', text: 'Axolotl', isCorrect: false },
      { id: 'a3', text: 'Jellyfish', isCorrect: false },
      { id: 'a4', text: 'Squid', isCorrect: false },
    ],
    difficulty: 'medium',
    emojis: ['🦑', '👀'],
    explanation: 'Glass frogs have translucent skin, making their organs visible.',
  },
  {
    id: 'q11',
    text: 'Which animal can rotate its head almost 270 degrees? 🦉',
    answers: [
      { id: 'a1', text: 'Owl', isCorrect: true },
      { id: 'a2', text: 'Eagle', isCorrect: false },
      { id: 'a3', text: 'Cat', isCorrect: false },
      { id: 'a4', text: 'Dog', isCorrect: false },
    ],
    difficulty: 'medium',
    emojis: ['🦉'],
    explanation: 'Owls can rotate their heads up to 270 degrees to look around.',
  },
  {
    id: 'q12',
    text: 'Which animal can regrow a lost limb? 🦑',
    answers: [
      { id: 'a1', text: 'Octopus', isCorrect: true },
      { id: 'a2', text: 'Crab', isCorrect: false },
      { id: 'a3', text: 'Lizard', isCorrect: false },
      { id: 'a4', text: 'Starfish', isCorrect: false },
    ],
    difficulty: 'medium',
    emojis: ['🦑'],
    explanation: 'Octopuses can regrow lost arms.',
  },
  {
    id: 'q13',
    text: 'Which animal can sleep with one half of its brain at a time? 🐬',
    answers: [
      { id: 'a1', text: 'Dolphin', isCorrect: true },
      { id: 'a2', text: 'Shark', isCorrect: false },
      { id: 'a3', text: 'Seal', isCorrect: false },
      { id: 'a4', text: 'Otter', isCorrect: false },
    ],
    difficulty: 'medium',
    emojis: ['🐬'],
    explanation: 'Dolphins sleep with one half of their brain at a time to stay alert.',
  },
  {
    id: 'q14',
    text: 'Which animal can jump up to 100 times its own body length? 🦗',
    answers: [
      { id: 'a1', text: 'Flea', isCorrect: true },
      { id: 'a2', text: 'Grasshopper', isCorrect: false },
      { id: 'a3', text: 'Kangaroo', isCorrect: false },
      { id: 'a4', text: 'Rabbit', isCorrect: false },
    ],
    difficulty: 'medium',
    emojis: ['🦗'],
    explanation: 'Fleas can jump up to 100 times their body length.',
  },
  // Hard questions
  {
    id: 'q3',
    text: 'Which animal can survive being frozen solid and thawed out alive? 🐸❄️',
    answers: [
      { id: 'a1', text: 'Wood Frog', isCorrect: true },
      { id: 'a2', text: 'Penguin', isCorrect: false },
      { id: 'a3', text: 'Polar Bear', isCorrect: false },
      { id: 'a4', text: 'Salamander', isCorrect: false },
    ],
    difficulty: 'hard',
    emojis: ['🐸', '❄️'],
    explanation: 'Wood frogs can survive being frozen for weeks, then thaw and resume normal life.',
  },
  {
    id: 'q5',
    text: 'Which animal can regrow its entire head if it gets cut off? 🪱🔄',
    answers: [
      { id: 'a1', text: 'Flatworm', isCorrect: true },
      { id: 'a2', text: 'Starfish', isCorrect: false },
      { id: 'a3', text: 'Octopus', isCorrect: false },
      { id: 'a4', text: 'Crab', isCorrect: false },
    ],
    difficulty: 'hard',
    emojis: ['🪱', '🔄'],
    explanation: 'Flatworms can regenerate their heads and even their brains.',
  },
  {
    id: 'q15',
    text: 'Which animal can live without its head for weeks? 🪳',
    answers: [
      { id: 'a1', text: 'Cockroach', isCorrect: true },
      { id: 'a2', text: 'Spider', isCorrect: false },
      { id: 'a3', text: 'Ant', isCorrect: false },
      { id: 'a4', text: 'Centipede', isCorrect: false },
    ],
    difficulty: 'hard',
    emojis: ['🪳'],
    explanation: 'Cockroaches can survive for weeks without their heads.',
  },
  {
    id: 'q16',
    text: 'Which animal can hold its breath for up to 2 hours underwater? �',
    answers: [
      { id: 'a1', text: 'Turtle', isCorrect: true },
      { id: 'a2', text: 'Seal', isCorrect: false },
      { id: 'a3', text: 'Whale', isCorrect: false },
      { id: 'a4', text: 'Otter', isCorrect: false },
    ],
    difficulty: 'hard',
    emojis: ['🐢'],
    explanation: 'Some turtles can hold their breath for up to 2 hours underwater.',
  },
  {
    id: 'q17',
    text: 'Which animal can taste with its feet? 🦋',
    answers: [
      { id: 'a1', text: 'Butterfly', isCorrect: true },
      { id: 'a2', text: 'Ant', isCorrect: false },
      { id: 'a3', text: 'Bee', isCorrect: false },
      { id: 'a4', text: 'Spider', isCorrect: false },
    ],
    difficulty: 'hard',
    emojis: ['�'],
    explanation: 'Butterflies taste with their feet to find food.',
  },
  {
    id: 'q18',
    text: 'Which animal can mimic human speech and sounds? 🦜',
    answers: [
      { id: 'a1', text: 'Parrot', isCorrect: true },
      { id: 'a2', text: 'Crow', isCorrect: false },
      { id: 'a3', text: 'Dog', isCorrect: false },
      { id: 'a4', text: 'Cat', isCorrect: false },
    ],
    difficulty: 'hard',
    emojis: ['🦜'],
    explanation: 'Parrots are known for their ability to mimic human speech and sounds.',
  },
];

const QUESTION_TIME = 30;


import { ResultsScreenSkeleton } from './ResultsScreen';
const FeedbackDisplay = React.lazy(() => import('./FeedbackDisplay').then(m => ({ default: m.FeedbackDisplay })));
const ResultsScreen = React.lazy(() => import('./ResultsScreen').then(m => ({ default: m.ResultsScreen })));

const QuizFlow: React.FC = () => {
  const { state, dispatch } = useQuiz();
  const currentQ = state.questions[state.currentQuestionIndex];
  const [selectedAnswer, setSelectedAnswer] = React.useState<string | null>(null);
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [feedbackKey, setFeedbackKey] = React.useState(0); // for remounting FeedbackDisplay
  const [timeTaken, setTimeTaken] = React.useState(0);
  const [category, setCategory] = React.useState<'easy' | 'medium' | 'hard' | null>(null);
  const [started, setStarted] = React.useState(false);
  const [highContrast, setHighContrast] = React.useState(false);

  React.useEffect(() => {
    if (state.questions.length === 0 && category) {
      dispatch({ type: 'SET_QUESTIONS', questions: demoQuestions.filter(q => q.difficulty === category) });
    }
  }, [state.questions.length, dispatch, category]);

  React.useEffect(() => {
    // Reset feedback state on new question
    setSelectedAnswer(null);
    setShowFeedback(false);
    setFeedbackKey((k) => k + 1);
    setTimeTaken(0);
  }, [state.currentQuestionIndex]);

  // Start screen: choose category (must be after all hooks)
  if (!started) {
    return (
      <div style={{ textAlign: 'center', marginTop: 48 }}>
        <h2>Welcome to the Weird Animal Quiz!</h2>
        <p>Choose a difficulty category to begin:</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <button style={{ padding: '16px 32px', fontSize: 18, borderRadius: 12, background: highContrast ? '#000' : '#4A7C59', color: highContrast ? '#FFD700' : '#fff', border: 'none', cursor: 'pointer' }} onClick={() => { setCategory('easy'); setStarted(true); dispatch({ type: 'SET_QUESTIONS', questions: demoQuestions.filter(q => q.difficulty === 'easy') }); }}>Easy</button>
          <button style={{ padding: '16px 32px', fontSize: 18, borderRadius: 12, background: highContrast ? '#000' : '#EA580C', color: highContrast ? '#FFD700' : '#fff', border: 'none', cursor: 'pointer' }} onClick={() => { setCategory('medium'); setStarted(true); dispatch({ type: 'SET_QUESTIONS', questions: demoQuestions.filter(q => q.difficulty === 'medium') }); }}>Medium</button>
          <button style={{ padding: '16px 32px', fontSize: 18, borderRadius: 12, background: highContrast ? '#000' : '#2D5016', color: highContrast ? '#FFD700' : '#fff', border: 'none', cursor: 'pointer' }} onClick={() => { setCategory('hard'); setStarted(true); dispatch({ type: 'SET_QUESTIONS', questions: demoQuestions.filter(q => q.difficulty === 'hard') }); }}>Hard</button>
        </div>
        <div style={{ marginTop: 32 }}>
          <button
            style={{ padding: '8px 24px', fontSize: 16, borderRadius: 8, background: highContrast ? '#FFD700' : '#eee', color: highContrast ? '#000' : '#333', border: '2px solid #4A7C59', cursor: 'pointer' }}
            onClick={() => setHighContrast(hc => !hc)}
            aria-pressed={highContrast}
          >
            {highContrast ? 'Disable High Contrast' : 'Enable High Contrast'}
          </button>
        </div>
      </div>
    );
  }

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

  if (state.isComplete) {
    return (
      <Suspense fallback={<ResultsScreenSkeleton />}>
        <ResultsScreen onPlayAgain={() => { setStarted(false); setCategory(null); dispatch({ type: 'RESET' }); }} />
      </Suspense>
    );
  }
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
            <div style={{ margin: '16px 0' }} role="radiogroup" aria-label="Answer choices">
              {currentQ.answers.map((a, idx) => (
                <button
                  key={a.id}
                  ref={el => {
                    // Focus first button on mount for keyboard navigation
                    if (el && idx === 0 && !selectedAnswer && !showFeedback) {
                      el.focus();
                    }
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    margin: '8px 0',
                    padding: '16px',
                    fontSize: 18,
                    borderRadius: 12,
                    border: highContrast ? '3px solid #FFD700' : '2px solid #4A7C59',
                    background: selectedAnswer === a.id ? (a.isCorrect ? (highContrast ? '#000' : '#4A7C59') : (highContrast ? '#FFD700' : '#EA580C')) : (highContrast ? '#222' : '#fff'),
                    color: selectedAnswer === a.id ? (highContrast ? '#FFD700' : '#fff') : (highContrast ? '#FFD700' : '#2D5016'),
                    cursor: 'pointer',
                    transition: 'background 0.3s, color 0.3s, border 0.3s',
                    outline: 'none',
                  }}
                  onClick={() => handleAnswer(a.id, QUESTION_TIME - timeTaken)}
                  onKeyDown={e => {
                    if (!userAnswered && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                      e.preventDefault();
                      const btns = Array.from(document.querySelectorAll('[role="radio"]'));
                      const currentIdx = btns.findIndex(b => b === e.currentTarget);
                      let nextIdx = currentIdx + (e.key === 'ArrowDown' ? 1 : -1);
                      if (nextIdx < 0) nextIdx = btns.length - 1;
                      if (nextIdx >= btns.length) nextIdx = 0;
                      (btns[nextIdx] as HTMLElement).focus();
                    }
                  }}
                  role="radio"
                  aria-checked={selectedAnswer === a.id}
                  tabIndex={selectedAnswer === null ? 0 : selectedAnswer === a.id ? 0 : -1}
                  disabled={userAnswered}
                  aria-pressed={selectedAnswer === a.id}
                  onFocus={e => {
                    e.currentTarget.style.boxShadow = highContrast ? '0 0 0 4px #FFD700' : '0 0 0 4px #4A7C59';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
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
          <Suspense fallback={<div style={{ textAlign: 'center', padding: 32, color: '#4A7C59', fontSize: 18 }}>Loading feedback…</div>}>
            <FeedbackDisplay
              key={feedbackKey}
              isCorrect={!!isCorrect}
              correctAnswer={correctAnswerText}
              explanation={currentQ.explanation}
              onNext={handleNext}
              minReadTime={3}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};



export const QuizContainer: React.FC = () => {
  return (
    <QuizProvider>
      <QuizFlow />
    </QuizProvider>
  );
};
