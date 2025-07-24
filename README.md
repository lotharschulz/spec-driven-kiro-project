# Weird Animal Quiz App

## Spec-Driven Kiro Project

> **⚠️ Test Project**: This is an experimental project testing Kiro IDE's spec-driven development approach. Currently work-in-progress and may be incomplete.

A hands-on exploration of [Kiro IDE's](https://kiro.dev) three-layer spec-driven development methodology:
- Requirements using EARS syntax
- Technical design blueprints  
- Implementation tasks for AI agents

### Background

This project accompanies my review and analysis of Kiro IDE. For the full context, methodology explanation, and lessons learned, read the blog post:

**📖 [Kiro IDE Review: Spec-Driven AI Development vs Traditional Coding Assistants](https://www.lotharschulz.info/2025/07/20/kiro-ide-review-spec-driven-ai-agent-development-vs-traditional-coding-assistants/)**

## Features
- Choose difficulty category (Easy, Medium, Hard) on start screen
- Strict category filtering for questions
- Accessible UI: ARIA roles, keyboard navigation, high contrast mode
- Animated feedback and results
- Offline support (service worker)
- Modern, mobile-friendly design

## Accessibility
- Keyboard navigation for answer choices (Arrow Up/Down)
- Radiogroup and radio roles for answer buttons
- High contrast mode toggle for visually impaired users
- Clear focus indicators on all interactive elements

## Usage
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm start
   ```
3. Run tests:
   ```bash
   npm test
   ```

## Project Structure
- `src/components/QuizContainer.tsx`: Main quiz logic and UI
- `src/components/QuizContainer.test.tsx`: Accessibility and interaction tests
- `src/state/QuizContext.tsx`: State management
- `src/service-worker.js`: Offline support


## License

[MIT](./LICENSE.md)
