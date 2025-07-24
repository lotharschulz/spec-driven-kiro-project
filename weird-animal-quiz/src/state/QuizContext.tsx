import React, { createContext, useReducer, useContext, Dispatch } from 'react';

// Types
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  text: string;
  answers: { id: string; text: string; isCorrect: boolean }[];
  difficulty: Difficulty;
  emojis: string[];
  explanation: string;
}

export interface UserAnswer {
  questionId: string;
  answerId: string | null;
  hintUsed: boolean;
  timeTaken: number;
}

export interface QuizState {
  currentQuestionIndex: number;
  answers: UserAnswer[];
  isComplete: boolean;
  paused: boolean;
  questions: Question[];
}

export type QuizAction =
  | { type: 'ANSWER_QUESTION'; answerId: string | null; timeTaken: number }
  | { type: 'USE_HINT' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' }
  | { type: 'SET_QUESTIONS'; questions: Question[] };

const initialState: QuizState = {
  currentQuestionIndex: 0,
  answers: [],
  isComplete: false,
  paused: false,
  questions: [],
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'SET_QUESTIONS':
      return { ...initialState, questions: action.questions };
    case 'ANSWER_QUESTION': {
      const currentQ = state.questions[state.currentQuestionIndex];
      const updatedAnswers = [
        ...state.answers,
        {
          questionId: currentQ.id,
          answerId: action.answerId,
          hintUsed: false,
          timeTaken: action.timeTaken,
        },
      ];
      return { ...state, answers: updatedAnswers, paused: true };
    }
    case 'USE_HINT': {
      const updatedAnswers = [...state.answers];
      const idx = updatedAnswers.length - 1;
      if (idx >= 0) updatedAnswers[idx].hintUsed = true;
      return { ...state, answers: updatedAnswers };
    }
    case 'NEXT_QUESTION': {
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, isComplete: true, paused: true };
      }
      return { ...state, currentQuestionIndex: nextIndex, paused: false };
    }
    case 'PAUSE':
      return { ...state, paused: true };
    case 'RESUME':
      return { ...state, paused: false };
    case 'RESET':
      return { ...initialState, questions: state.questions };
    default:
      return state;
  }
}

const QuizContext = createContext<{
  state: QuizState;
  dispatch: Dispatch<QuizAction>;
}>({ state: initialState, dispatch: () => undefined });

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  return (
    <QuizContext.Provider value={{ state, dispatch }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => useContext(QuizContext);
