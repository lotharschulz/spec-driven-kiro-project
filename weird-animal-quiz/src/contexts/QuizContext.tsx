/**
 * Quiz State Management using React Context and useReducer
 * Implements requirements: 2.1, 2.2, 2.3, 2.7, 2.8
 */

import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { QuizState, Question, UserResponse, QuizResults } from '../types/quiz';
import { calculateQuizScore, getPerformanceFeedback, generatePerformanceAnalysis } from '../utils/scoringEngine';

// Action types for quiz state management
export enum QuizActionType {
  INITIALIZE_QUIZ = 'INITIALIZE_QUIZ',
  START_TIMER = 'START_TIMER',
  PAUSE_TIMER = 'PAUSE_TIMER',
  RESUME_TIMER = 'RESUME_TIMER',
  UPDATE_TIMER = 'UPDATE_TIMER',
  SUBMIT_ANSWER = 'SUBMIT_ANSWER',
  SHOW_FEEDBACK = 'SHOW_FEEDBACK',
  HIDE_FEEDBACK = 'HIDE_FEEDBACK',
  NEXT_QUESTION = 'NEXT_QUESTION',
  USE_HINT = 'USE_HINT',
  COMPLETE_QUIZ = 'COMPLETE_QUIZ',
  RESET_QUIZ = 'RESET_QUIZ'
}

// Action interfaces
export interface QuizAction {
  type: QuizActionType;
  payload?: any;
}

export interface InitializeQuizAction extends QuizAction {
  type: QuizActionType.INITIALIZE_QUIZ;
  payload: {
    questions: Question[];
  };
}

export interface UpdateTimerAction extends QuizAction {
  type: QuizActionType.UPDATE_TIMER;
  payload: {
    timeRemaining: number;
  };
}

export interface SubmitAnswerAction extends QuizAction {
  type: QuizActionType.SUBMIT_ANSWER;
  payload: {
    selectedAnswerId: string;
    timeSpent: number;
  };
}

export interface UseHintAction extends QuizAction {
  type: QuizActionType.USE_HINT;
  payload: {
    questionId: string;
  };
}

// Initial quiz state
const initialQuizState: QuizState = {
  currentQuestionIndex: 0,
  questions: [],
  userAnswers: [],
  timeRemaining: 30, // 30 seconds per question
  hintsUsed: [],
  quizStartTime: new Date(),
  quizEndTime: undefined,
  isComplete: false,
  isPaused: false,
  showingFeedback: false
};

// Quiz reducer function
export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case QuizActionType.INITIALIZE_QUIZ: {
      const { questions } = (action as InitializeQuizAction).payload;
      return {
        ...initialQuizState,
        questions,
        quizStartTime: new Date()
      };
    }

    case QuizActionType.START_TIMER:
      return {
        ...state,
        isPaused: false,
        timeRemaining: 30 // Reset timer for new question
      };

    case QuizActionType.PAUSE_TIMER:
      return {
        ...state,
        isPaused: true
      };

    case QuizActionType.RESUME_TIMER:
      return {
        ...state,
        isPaused: false
      };

    case QuizActionType.UPDATE_TIMER: {
      const { timeRemaining } = (action as UpdateTimerAction).payload;
      return {
        ...state,
        timeRemaining: Math.max(0, timeRemaining)
      };
    }

    case QuizActionType.SUBMIT_ANSWER: {
      const { selectedAnswerId, timeSpent } = (action as SubmitAnswerAction).payload;
      const currentQuestion = state.questions[state.currentQuestionIndex];
      
      if (!currentQuestion) return state;

      const selectedAnswer = currentQuestion.answers.find(a => a.id === selectedAnswerId);
      const isCorrect = selectedAnswer?.isCorrect || false;
      const hintUsed = state.hintsUsed.includes(currentQuestion.id);

      const userResponse: UserResponse = {
        questionId: currentQuestion.id,
        selectedAnswerId,
        isCorrect,
        timeSpent,
        hintUsed,
        timestamp: new Date()
      };

      return {
        ...state,
        userAnswers: [...state.userAnswers, userResponse],
        isPaused: true, // Pause timer during feedback
        showingFeedback: true
      };
    }

    case QuizActionType.SHOW_FEEDBACK:
      return {
        ...state,
        showingFeedback: true,
        isPaused: true
      };

    case QuizActionType.HIDE_FEEDBACK:
      return {
        ...state,
        showingFeedback: false
      };

    case QuizActionType.NEXT_QUESTION: {
      const nextIndex = state.currentQuestionIndex + 1;
      const isLastQuestion = nextIndex >= state.questions.length;

      if (isLastQuestion) {
        return {
          ...state,
          isComplete: true,
          quizEndTime: new Date(),
          isPaused: true,
          showingFeedback: false
        };
      }

      return {
        ...state,
        currentQuestionIndex: nextIndex,
        timeRemaining: 30, // Reset timer for next question
        isPaused: false,
        showingFeedback: false
      };
    }

    case QuizActionType.USE_HINT: {
      const { questionId } = (action as UseHintAction).payload;
      
      if (state.hintsUsed.includes(questionId)) {
        return state; // Hint already used for this question
      }

      return {
        ...state,
        hintsUsed: [...state.hintsUsed, questionId]
      };
    }

    case QuizActionType.COMPLETE_QUIZ:
      return {
        ...state,
        isComplete: true,
        quizEndTime: new Date(),
        isPaused: true
      };

    case QuizActionType.RESET_QUIZ:
      return {
        ...initialQuizState,
        quizStartTime: new Date(),
        showingFeedback: false
      };

    default:
      return state;
  }
}

// Context interfaces
export interface QuizContextType {
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
  // Helper functions
  initializeQuiz: (questions: Question[]) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  updateTimer: (timeRemaining: number) => void;
  submitAnswer: (selectedAnswerId: string, timeSpent: number) => void;
  showFeedback: () => void;
  hideFeedback: () => void;
  nextQuestion: () => void;
  useHint: (questionId: string) => void;
  completeQuiz: () => void;
  resetQuiz: () => void;
  // Computed properties
  getCurrentQuestion: () => Question | null;
  getProgress: () => { current: number; total: number; percentage: number };
  isHintAvailable: (questionId: string) => boolean;
  getTimeWarningLevel: () => 'normal' | 'warning' | 'danger';
  // Scoring functions
  calculateResults: () => QuizResults;
  getPerformanceFeedback: (percentage: number) => { level: string; message: string; emoji: string };
  getPerformanceAnalysis: (results: QuizResults) => any;
}

// Create context
const QuizContext = createContext<QuizContextType | undefined>(undefined);

// Provider component
export interface QuizProviderProps {
  children: ReactNode;
}

export const QuizProvider: React.FC<QuizProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(quizReducer, initialQuizState);

  // Helper functions
  const initializeQuiz = (questions: Question[]) => {
    dispatch({
      type: QuizActionType.INITIALIZE_QUIZ,
      payload: { questions }
    });
  };

  const startTimer = () => {
    dispatch({ type: QuizActionType.START_TIMER });
  };

  const pauseTimer = () => {
    dispatch({ type: QuizActionType.PAUSE_TIMER });
  };

  const resumeTimer = () => {
    dispatch({ type: QuizActionType.RESUME_TIMER });
  };

  const updateTimer = (timeRemaining: number) => {
    dispatch({
      type: QuizActionType.UPDATE_TIMER,
      payload: { timeRemaining }
    });
  };

  const submitAnswer = (selectedAnswerId: string, timeSpent: number) => {
    dispatch({
      type: QuizActionType.SUBMIT_ANSWER,
      payload: { selectedAnswerId, timeSpent }
    });
  };

  const showFeedback = () => {
    dispatch({ type: QuizActionType.SHOW_FEEDBACK });
  };

  const hideFeedback = () => {
    dispatch({ type: QuizActionType.HIDE_FEEDBACK });
  };

  const nextQuestion = () => {
    dispatch({ type: QuizActionType.NEXT_QUESTION });
  };

  const useHint = (questionId: string) => {
    dispatch({
      type: QuizActionType.USE_HINT,
      payload: { questionId }
    });
  };

  const completeQuiz = () => {
    dispatch({ type: QuizActionType.COMPLETE_QUIZ });
  };

  const resetQuiz = () => {
    dispatch({ type: QuizActionType.RESET_QUIZ });
  };

  // Computed properties
  const getCurrentQuestion = (): Question | null => {
    return state.questions[state.currentQuestionIndex] || null;
  };

  const getProgress = () => {
    const current = state.currentQuestionIndex + 1;
    const total = state.questions.length;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    
    return { current, total, percentage };
  };

  const isHintAvailable = (questionId: string): boolean => {
    return !state.hintsUsed.includes(questionId);
  };

  const getTimeWarningLevel = (): 'normal' | 'warning' | 'danger' => {
    if (state.timeRemaining <= 5) return 'danger';
    if (state.timeRemaining <= 10) return 'warning';
    return 'normal';
  };

  // Scoring functions
  const calculateResults = (): QuizResults => {
    return calculateQuizScore(state.userAnswers, state.questions);
  };

  const getPerformanceFeedbackWrapper = (percentage: number) => {
    return getPerformanceFeedback(percentage);
  };

  const getPerformanceAnalysisWrapper = (results: QuizResults) => {
    return generatePerformanceAnalysis(results, state.questions);
  };

  const contextValue: QuizContextType = {
    state,
    dispatch,
    initializeQuiz,
    startTimer,
    pauseTimer,
    resumeTimer,
    updateTimer,
    submitAnswer,
    showFeedback,
    hideFeedback,
    nextQuestion,
    useHint,
    completeQuiz,
    resetQuiz,
    getCurrentQuestion,
    getProgress,
    isHintAvailable,
    getTimeWarningLevel,
    calculateResults,
    getPerformanceFeedback: getPerformanceFeedbackWrapper,
    getPerformanceAnalysis: getPerformanceAnalysisWrapper
  };

  return (
    <QuizContext.Provider value={contextValue}>
      {children}
    </QuizContext.Provider>
  );
};

// Custom hook to use quiz context
export const useQuiz = (): QuizContextType => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};