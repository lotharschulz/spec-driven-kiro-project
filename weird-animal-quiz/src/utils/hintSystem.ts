/**
 * Hint System Utilities
 * Implements requirements: 3.1, 3.2
 * Provides hint logic to either eliminate wrong answers or provide clues
 */

import type { Question, Answer } from '../types/quiz';

export enum HintType {
  ELIMINATE_WRONG_ANSWER = 'eliminate_wrong_answer',
  PROVIDE_CLUE = 'provide_clue'
}

export interface HintResult {
  type: HintType;
  eliminatedAnswerId?: string;
  clue?: string;
  message: string;
}

/**
 * Generate a hint for a given question
 * Randomly chooses between eliminating a wrong answer or providing a clue
 */
export function generateHint(question: Question): HintResult {
  // Randomly choose hint type (50/50 chance)
  const hintType = Math.random() < 0.5 ? HintType.ELIMINATE_WRONG_ANSWER : HintType.PROVIDE_CLUE;
  
  if (hintType === HintType.ELIMINATE_WRONG_ANSWER) {
    return eliminateWrongAnswer(question);
  } else {
    return provideClue(question);
  }
}

/**
 * Eliminate one wrong answer from the question
 */
function eliminateWrongAnswer(question: Question): HintResult {
  const wrongAnswers = question.answers.filter(answer => !answer.isCorrect);
  
  if (wrongAnswers.length === 0) {
    // Fallback to clue if no wrong answers (shouldn't happen in normal quiz)
    return provideClue(question);
  }
  
  // Randomly select one wrong answer to eliminate
  const randomIndex = Math.floor(Math.random() * wrongAnswers.length);
  const eliminatedAnswer = wrongAnswers[randomIndex];
  
  return {
    type: HintType.ELIMINATE_WRONG_ANSWER,
    eliminatedAnswerId: eliminatedAnswer.id,
    message: `One wrong answer has been eliminated for you! ❌`
  };
}

/**
 * Provide a helpful clue based on the question content
 */
function provideClue(question: Question): HintResult {
  const clues = generateClueForQuestion(question);
  
  return {
    type: HintType.PROVIDE_CLUE,
    clue: clues,
    message: `Here's a helpful clue: 💡`
  };
}

/**
 * Generate contextual clues based on question content and category
 */
function generateClueForQuestion(question: Question): string {
  const questionText = question.text.toLowerCase();
  const category = question.category.toLowerCase();
  
  // Generate clues based on question patterns and categories
  if (questionText.includes('sleep') || questionText.includes('hours')) {
    return "Think about which animals are known for being extremely sleepy or inactive.";
  }
  
  if (questionText.includes('heart') || questionText.includes('beats')) {
    return "Smaller animals typically have faster heart rates than larger ones.";
  }
  
  if (questionText.includes('speed') || questionText.includes('fast') || questionText.includes('mph')) {
    return "Consider the animal's body structure and hunting or survival needs.";
  }
  
  if (questionText.includes('tongue') || questionText.includes('long')) {
    return "Think about animals that need to reach food in hard-to-access places.";
  }
  
  if (questionText.includes('blood') || questionText.includes('blue')) {
    return "Consider animals that live in extreme environments or have unique circulatory systems.";
  }
  
  if (questionText.includes('eggs') || questionText.includes('lay')) {
    return "Think about unusual reproductive strategies in the animal kingdom.";
  }
  
  if (questionText.includes('backwards') || questionText.includes('reverse')) {
    return "Consider animals with unique locomotion or anatomical features.";
  }
  
  if (questionText.includes('change color') || questionText.includes('camouflage')) {
    return "Think about animals that use color-changing for communication or protection.";
  }
  
  if (questionText.includes('teeth') || questionText.includes('bite')) {
    return "Consider the animal's diet and feeding habits.";
  }
  
  // Category-based clues
  if (category.includes('behavior')) {
    return "Focus on the animal's daily habits and survival behaviors.";
  }
  
  if (category.includes('anatomy') || category.includes('physiology')) {
    return "Think about unique body structures and how they help the animal survive.";
  }
  
  if (category.includes('adaptation')) {
    return "Consider how this trait helps the animal in its natural environment.";
  }
  
  // Default clue
  return "Think about what makes this animal unique in the natural world.";
}

/**
 * Check if a hint has been used for a specific question
 */
export function isHintUsed(questionId: string, hintsUsed: string[]): boolean {
  return hintsUsed.includes(questionId);
}

/**
 * Validate hint result to ensure it's properly formed
 */
export function validateHintResult(hint: HintResult, question: Question): boolean {
  if (!hint.message) return false;
  
  if (hint.type === HintType.ELIMINATE_WRONG_ANSWER) {
    if (!hint.eliminatedAnswerId) return false;
    
    // Check if the eliminated answer exists and is actually wrong
    const eliminatedAnswer = question.answers.find(a => a.id === hint.eliminatedAnswerId);
    return eliminatedAnswer !== undefined && !eliminatedAnswer.isCorrect;
  }
  
  if (hint.type === HintType.PROVIDE_CLUE) {
    return hint.clue !== undefined && hint.clue.length > 0;
  }
  
  return false;
}