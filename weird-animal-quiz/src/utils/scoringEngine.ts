/**
 * Scoring Engine for the Weird Animal Quiz
 * Implements requirements: 3.5, 3.6
 * 
 * Provides difficulty-based scoring with hint penalties and comprehensive results calculation
 */

import { UserResponse, Question, QuizResults, DifficultyBreakdown, Difficulty } from '../types/quiz';

// Scoring configuration
export const SCORING_CONFIG = {
  // Base points per difficulty level
  POINTS: {
    [Difficulty.EASY]: 10,
    [Difficulty.MEDIUM]: 20,
    [Difficulty.HARD]: 30
  },
  // Hint usage penalty (percentage of points deducted)
  HINT_PENALTY: 0.5, // 50% penalty for using a hint
  // Time bonus thresholds (seconds remaining)
  TIME_BONUS: {
    EXCELLENT: 20, // 20+ seconds remaining
    GOOD: 10,      // 10+ seconds remaining
    BONUS_MULTIPLIER: 0.2 // 20% bonus for fast answers
  }
} as const;

/**
 * Calculate the total quiz score based on user responses and questions
 */
export function calculateQuizScore(
  userResponses: UserResponse[],
  questions: Question[]
): QuizResults {
  // Create question lookup map for efficiency
  const questionMap = new Map(questions.map(q => [q.id, q]));
  
  let totalScore = 0;
  let correctAnswers = 0;
  let totalTime = 0;
  let hintsUsed = 0;
  
  // Initialize difficulty breakdown
  const difficultyBreakdown: DifficultyBreakdown = {
    easy: { correct: 0, total: 0, percentage: 0 },
    medium: { correct: 0, total: 0, percentage: 0 },
    hard: { correct: 0, total: 0, percentage: 0 }
  };

  // Process each user response
  for (const response of userResponses) {
    const question = questionMap.get(response.questionId);
    
    // Add to total time spent regardless of question existence
    totalTime += response.timeSpent;
    
    // Count hints used regardless of question existence
    if (response.hintUsed) {
      hintsUsed++;
    }
    
    if (!question) continue;

    // Update difficulty breakdown totals
    difficultyBreakdown[question.difficulty].total++;

    // Only calculate score for correct answers
    if (response.isCorrect) {
      correctAnswers++;
      difficultyBreakdown[question.difficulty].correct++;
      
      // Calculate base score for this question
      let questionScore = SCORING_CONFIG.POINTS[question.difficulty];
      
      // Apply hint penalty if hint was used
      if (response.hintUsed) {
        questionScore *= (1 - SCORING_CONFIG.HINT_PENALTY);
      }
      
      // Apply time bonus for fast answers
      const timeRemaining = 30 - response.timeSpent; // Assuming 30 second timer
      if (timeRemaining >= SCORING_CONFIG.TIME_BONUS.EXCELLENT) {
        questionScore *= (1 + SCORING_CONFIG.TIME_BONUS.BONUS_MULTIPLIER);
      } else if (timeRemaining >= SCORING_CONFIG.TIME_BONUS.GOOD) {
        questionScore *= (1 + SCORING_CONFIG.TIME_BONUS.BONUS_MULTIPLIER * 0.5);
      }
      
      totalScore += Math.round(questionScore);
    }
  }

  // Calculate difficulty percentages
  Object.keys(difficultyBreakdown).forEach(difficulty => {
    const breakdown = difficultyBreakdown[difficulty as keyof DifficultyBreakdown];
    breakdown.percentage = breakdown.total > 0 
      ? Math.round((breakdown.correct / breakdown.total) * 100)
      : 0;
  });

  // Calculate overall percentage
  const totalQuestions = userResponses.length;
  const percentage = totalQuestions > 0 
    ? Math.round((correctAnswers / totalQuestions) * 100)
    : 0;

  return {
    totalScore,
    percentage,
    correctAnswers,
    totalQuestions,
    timeSpent: totalTime,
    difficultyBreakdown,
    hintsUsed
  };
}

/**
 * Calculate the maximum possible score for a set of questions
 */
export function calculateMaxScore(questions: Question[]): number {
  return questions.reduce((total, question) => {
    const basePoints = SCORING_CONFIG.POINTS[question.difficulty];
    // Max score includes time bonus
    const maxQuestionScore = basePoints * (1 + SCORING_CONFIG.TIME_BONUS.BONUS_MULTIPLIER);
    return total + Math.round(maxQuestionScore);
  }, 0);
}

/**
 * Get performance feedback based on score percentage
 */
export function getPerformanceFeedback(percentage: number): {
  level: 'excellent' | 'good' | 'average' | 'needs-improvement';
  message: string;
  emoji: string;
} {
  if (percentage >= 90) {
    return {
      level: 'excellent',
      message: 'Outstanding! You\'re a true animal expert! 🌟',
      emoji: '🏆'
    };
  } else if (percentage >= 75) {
    return {
      level: 'good',
      message: 'Great job! You know your weird animal facts! 👏',
      emoji: '🎉'
    };
  } else if (percentage >= 60) {
    return {
      level: 'average',
      message: 'Not bad! Keep exploring the animal kingdom! 🔍',
      emoji: '👍'
    };
  } else {
    return {
      level: 'needs-improvement',
      message: 'Keep learning! The animal world has many surprises! 📚',
      emoji: '💪'
    };
  }
}

/**
 * Calculate score breakdown by difficulty level
 */
export function getScoreByDifficulty(
  userResponses: UserResponse[],
  questions: Question[]
): Record<Difficulty, { score: number; maxScore: number; percentage: number }> {
  const questionMap = new Map(questions.map(q => [q.id, q]));
  
  const breakdown = {
    [Difficulty.EASY]: { score: 0, maxScore: 0, percentage: 0 },
    [Difficulty.MEDIUM]: { score: 0, maxScore: 0, percentage: 0 },
    [Difficulty.HARD]: { score: 0, maxScore: 0, percentage: 0 }
  };

  // Calculate max scores for each difficulty
  questions.forEach(question => {
    const basePoints = SCORING_CONFIG.POINTS[question.difficulty];
    const maxQuestionScore = basePoints * (1 + SCORING_CONFIG.TIME_BONUS.BONUS_MULTIPLIER);
    breakdown[question.difficulty].maxScore += Math.round(maxQuestionScore);
  });

  // Calculate actual scores
  userResponses.forEach(response => {
    const question = questionMap.get(response.questionId);
    if (!question || !response.isCorrect) return;

    let questionScore = SCORING_CONFIG.POINTS[question.difficulty];
    
    // Apply hint penalty
    if (response.hintUsed) {
      questionScore *= (1 - SCORING_CONFIG.HINT_PENALTY);
    }
    
    // Apply time bonus
    const timeRemaining = 30 - response.timeSpent;
    if (timeRemaining >= SCORING_CONFIG.TIME_BONUS.EXCELLENT) {
      questionScore *= (1 + SCORING_CONFIG.TIME_BONUS.BONUS_MULTIPLIER);
    } else if (timeRemaining >= SCORING_CONFIG.TIME_BONUS.GOOD) {
      questionScore *= (1 + SCORING_CONFIG.TIME_BONUS.BONUS_MULTIPLIER * 0.5);
    }
    
    breakdown[question.difficulty].score += Math.round(questionScore);
  });

  // Calculate percentages
  Object.keys(breakdown).forEach(difficulty => {
    const diff = breakdown[difficulty as Difficulty];
    diff.percentage = diff.maxScore > 0 
      ? Math.round((diff.score / diff.maxScore) * 100)
      : 0;
  });

  return breakdown;
}

/**
 * Generate detailed performance analysis
 */
export interface PerformanceAnalysis {
  overallGrade: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

export function generatePerformanceAnalysis(
  results: QuizResults,
  questions: Question[]
): PerformanceAnalysis {
  const { difficultyBreakdown, percentage, hintsUsed } = results;
  const strengths: string[] = [];
  const improvements: string[] = [];
  const recommendations: string[] = [];

  // Analyze performance by difficulty
  if (difficultyBreakdown.easy.percentage >= 80) {
    strengths.push('Strong foundation with basic animal facts');
  } else if (difficultyBreakdown.easy.percentage < 60) {
    improvements.push('Review fundamental animal behaviors and characteristics');
  }

  if (difficultyBreakdown.medium.percentage >= 70) {
    strengths.push('Good understanding of complex animal adaptations');
  } else if (difficultyBreakdown.medium.percentage < 50) {
    improvements.push('Study more about unique animal abilities and anatomy');
  }

  if (difficultyBreakdown.hard.percentage >= 60) {
    strengths.push('Excellent knowledge of rare and extreme animal phenomena');
  } else if (difficultyBreakdown.hard.percentage < 40) {
    improvements.push('Explore more about extraordinary animal survival mechanisms');
  }

  // Analyze hint usage
  if (results.totalQuestions > 0) {
    const hintUsageRate = (hintsUsed / results.totalQuestions) * 100;
    if (hintUsageRate <= 20) {
      strengths.push('Great confidence in your animal knowledge');
    } else if (hintUsageRate >= 60) {
      improvements.push('Try to rely less on hints to build confidence');
    }
  } else {
    // No questions answered, still show confidence for no hints used
    if (hintsUsed === 0) {
      strengths.push('Great confidence in your animal knowledge');
    }
  }

  // Generate recommendations
  if (percentage >= 90) {
    recommendations.push('Consider exploring advanced zoology or marine biology topics');
    recommendations.push('Share your knowledge by teaching others about animals');
  } else if (percentage >= 70) {
    recommendations.push('Watch more nature documentaries to expand your knowledge');
    recommendations.push('Try the quiz again focusing on your weaker difficulty levels');
  } else {
    recommendations.push('Start with easier animal facts and build up gradually');
    recommendations.push('Use educational resources like National Geographic Kids');
  }

  // Determine overall grade
  let overallGrade: string;
  if (percentage >= 90) overallGrade = 'A+';
  else if (percentage >= 85) overallGrade = 'A';
  else if (percentage >= 80) overallGrade = 'B+';
  else if (percentage >= 75) overallGrade = 'B';
  else if (percentage >= 70) overallGrade = 'C+';
  else if (percentage >= 65) overallGrade = 'C';
  else if (percentage >= 60) overallGrade = 'D+';
  else if (percentage >= 55) overallGrade = 'D';
  else overallGrade = 'F';

  return {
    overallGrade,
    strengths,
    improvements,
    recommendations
  };
}