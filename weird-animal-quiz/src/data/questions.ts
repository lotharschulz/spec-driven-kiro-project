/**
 * Static question repository with 9 curated animal questions
 * Implements requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.8
 */

import { Question, Difficulty } from '../types/quiz';

/**
 * Curated collection of weird animal quiz questions
 * 3 easy, 3 medium, 3 hard questions with scientific accuracy
 */
export const QUIZ_QUESTIONS: Question[] = [
  // EASY QUESTIONS (3)
  {
    id: 'easy-koala-sleep',
    difficulty: Difficulty.EASY,
    text: 'Which animal can sleep for up to 22 hours a day?',
    emojis: ['🐨', '😴'],
    answers: [
      { id: 'koala-correct', text: 'Koala', isCorrect: true },
      { id: 'koala-sloth', text: 'Sloth', isCorrect: false },
      { id: 'koala-panda', text: 'Panda', isCorrect: false },
      { id: 'koala-cat', text: 'Cat', isCorrect: false }
    ],
    explanation: 'Koalas sleep 18-22 hours daily to conserve energy for digesting eucalyptus leaves, which are low in nutrients and difficult to process.',
    funFact: 'Koalas have fingerprints that are almost identical to human fingerprints - so similar that they could potentially contaminate crime scenes!',
    category: 'behavior'
  },
  {
    id: 'easy-flamingo-color',
    difficulty: Difficulty.EASY,
    text: 'What makes flamingos pink?',
    emojis: ['🦩', '🍤'],
    answers: [
      { id: 'flamingo-carotenoids', text: 'Carotenoids from their diet', isCorrect: true },
      { id: 'flamingo-genetics', text: 'Natural genetic coloring', isCorrect: false },
      { id: 'flamingo-sunlight', text: 'Exposure to sunlight', isCorrect: false },
      { id: 'flamingo-age', text: 'They get pinker with age', isCorrect: false }
    ],
    explanation: 'Flamingos get their pink color from carotenoid pigments in the algae, shrimp, and other small organisms they eat. Without these foods, they would be white or gray.',
    funFact: 'Baby flamingos are born gray or white and only develop their pink color as they eat more carotenoid-rich foods. Zoo flamingos are often fed special diets to maintain their vibrant color!',
    category: 'physiology'
  },
  {
    id: 'easy-penguin-huddle',
    difficulty: Difficulty.EASY,
    text: 'How do emperor penguins stay warm in Antarctica?',
    emojis: ['🐧', '🧊'],
    answers: [
      { id: 'penguin-huddle', text: 'They huddle together in groups', isCorrect: true },
      { id: 'penguin-migrate', text: 'They migrate to warmer areas', isCorrect: false },
      { id: 'penguin-burrow', text: 'They burrow underground', isCorrect: false },
      { id: 'penguin-hibernate', text: 'They hibernate through winter', isCorrect: false }
    ],
    explanation: 'Emperor penguins form massive huddles of thousands of birds, rotating from the cold outside to the warm center. This can raise the temperature inside the huddle to 35°C (95°F).',
    funFact: 'In a penguin huddle, birds on the outside constantly move inward while those in the center gradually move outward - it\'s like a slow-motion mosh pit that saves lives!',
    category: 'behavior'
  },

  // MEDIUM QUESTIONS (3)
  {
    id: 'medium-octopus-arms',
    difficulty: Difficulty.MEDIUM,
    text: 'How many brains does an octopus have?',
    emojis: ['🐙', '🧠'],
    answers: [
      { id: 'octopus-nine', text: 'Nine brains', isCorrect: true },
      { id: 'octopus-one', text: 'One brain', isCorrect: false },
      { id: 'octopus-eight', text: 'Eight brains', isCorrect: false },
      { id: 'octopus-two', text: 'Two brains', isCorrect: false }
    ],
    explanation: 'Octopuses have nine brains: one central brain and eight smaller brains in each arm. Each arm can taste, touch, and even react to stimuli independently of the central brain.',
    funFact: 'An octopus arm that\'s been severed can still crawl around and react to stimuli for up to an hour because of its independent brain! The arms also have two-thirds of the octopus\'s neurons.',
    category: 'anatomy'
  },
  {
    id: 'medium-mantis-shrimp-punch',
    difficulty: Difficulty.MEDIUM,
    text: 'What is special about a mantis shrimp\'s punch?',
    emojis: ['🦐', '👊'],
    answers: [
      { id: 'mantis-bullet-speed', text: 'It moves as fast as a bullet', isCorrect: true },
      { id: 'mantis-electric', text: 'It delivers an electric shock', isCorrect: false },
      { id: 'mantis-poison', text: 'It injects deadly poison', isCorrect: false },
      { id: 'mantis-freeze', text: 'It can freeze its prey', isCorrect: false }
    ],
    explanation: 'A mantis shrimp\'s punch accelerates faster than a bullet from a gun, reaching speeds of 75 feet per second. The force is so powerful it can break aquarium glass.',
    funFact: 'The mantis shrimp\'s punch creates cavitation bubbles that collapse with such force they produce light and temperatures nearly as hot as the sun\'s surface - around 4,000°C!',
    category: 'behavior'
  },
  {
    id: 'medium-axolotl-regeneration',
    difficulty: Difficulty.MEDIUM,
    text: 'What amazing ability do axolotls have?',
    emojis: ['🦎', '✨'],
    answers: [
      { id: 'axolotl-regenerate', text: 'They can regenerate entire limbs and organs', isCorrect: true },
      { id: 'axolotl-invisible', text: 'They can become invisible', isCorrect: false },
      { id: 'axolotl-fly', text: 'They can glide through the air', isCorrect: false },
      { id: 'axolotl-time', text: 'They can slow down time perception', isCorrect: false }
    ],
    explanation: 'Axolotls can regenerate entire limbs, parts of their heart, brain, and even portions of their spinal cord. The regenerated parts are perfectly functional and leave no scars.',
    funFact: 'Unlike other salamanders, axolotls remain aquatic their entire lives and keep their juvenile features - a condition called neoteny. They\'re basically the Peter Pan of the amphibian world!',
    category: 'physiology'
  },

  // HARD QUESTIONS (3)
  {
    id: 'hard-tardigrade-survival',
    difficulty: Difficulty.HARD,
    text: 'What extreme condition can tardigrades (water bears) survive that no other animal can?',
    emojis: ['🐻', '🚀'],
    answers: [
      { id: 'tardigrade-space', text: 'The vacuum of outer space', isCorrect: true },
      { id: 'tardigrade-lava', text: 'Direct contact with lava', isCorrect: false },
      { id: 'tardigrade-acid', text: 'Swimming in pure acid', isCorrect: false },
      { id: 'tardigrade-lightning', text: 'Being struck by lightning', isCorrect: false }
    ],
    explanation: 'Tardigrades can survive in the vacuum of space, withstanding cosmic radiation and extreme temperatures. They enter a state called cryptobiosis, essentially becoming immortal until conditions improve.',
    funFact: 'Tardigrades have survived all five mass extinction events on Earth and can live for up to 30 years without food or water. They\'re literally the most indestructible animals on the planet!',
    category: 'survival'
  },
  {
    id: 'hard-vampire-bat-sharing',
    difficulty: Difficulty.HARD,
    text: 'What surprising social behavior do vampire bats exhibit?',
    emojis: ['🦇', '💉'],
    answers: [
      { id: 'vampire-share', text: 'They share blood with hungry colony members', isCorrect: true },
      { id: 'vampire-adopt', text: 'They adopt orphaned bat pups', isCorrect: false },
      { id: 'vampire-teach', text: 'They teach young bats to hunt', isCorrect: false },
      { id: 'vampire-nests', text: 'They build communal nests together', isCorrect: false }
    ],
    explanation: 'Vampire bats practice reciprocal altruism - they regurgitate blood to feed hungry colony members who failed to find food. This behavior is based on social relationships and past favors.',
    funFact: 'Vampire bats can die if they don\'t feed for just 2-3 days, so this blood-sharing behavior is literally life-saving. They even keep track of who has helped them before - it\'s like a blood bank with a credit system!',
    category: 'behavior'
  },
  {
    id: 'hard-pistol-shrimp-bubble',
    difficulty: Difficulty.HARD,
    text: 'What happens when a pistol shrimp snaps its claw?',
    emojis: ['🦐', '💥'],
    answers: [
      { id: 'pistol-light', text: 'It creates a bubble that produces light and sound louder than a gunshot', isCorrect: true },
      { id: 'pistol-quake', text: 'It creates mini earthquakes on the ocean floor', isCorrect: false },
      { id: 'pistol-electric', text: 'It generates a powerful electric field', isCorrect: false },
      { id: 'pistol-time', text: 'It briefly distorts time around the claw', isCorrect: false }
    ],
    explanation: 'The pistol shrimp\'s claw snap creates a cavitation bubble that collapses with such force it produces sonoluminescence - a flash of light - and a sound reaching 218 decibels, louder than a gunshot.',
    funFact: 'The collapsing bubble briefly reaches temperatures of about 5,000K (nearly as hot as the sun\'s surface) and the sound is so loud it can interfere with submarine sonar systems!',
    category: 'physics'
  }
];

/**
 * Get all questions organized by difficulty
 */
export function getQuestionsByDifficulty() {
  return {
    easy: QUIZ_QUESTIONS.filter(q => q.difficulty === Difficulty.EASY),
    medium: QUIZ_QUESTIONS.filter(q => q.difficulty === Difficulty.MEDIUM),
    hard: QUIZ_QUESTIONS.filter(q => q.difficulty === Difficulty.HARD)
  };
}

/**
 * Get total question count by difficulty
 */
export function getQuestionCounts() {
  const byDifficulty = getQuestionsByDifficulty();
  return {
    easy: byDifficulty.easy.length,
    medium: byDifficulty.medium.length,
    hard: byDifficulty.hard.length,
    total: QUIZ_QUESTIONS.length
  };
}