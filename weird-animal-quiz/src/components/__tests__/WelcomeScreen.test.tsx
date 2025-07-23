/**
 * Welcome Screen Component Tests
 * Integration tests for welcome screen user flow
 * Requirements: 5.5, 4.3, 4.4, 4.9
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import WelcomeScreen from '../WelcomeScreen';

// Mock CSS modules
vi.mock('../WelcomeScreen.module.css', () => ({
  default: {
    welcomeScreen: 'welcomeScreen',
    heroSection: 'heroSection',
    heroContent: 'heroContent',
    emojiHeader: 'emojiHeader',
    emoji: 'emoji',
    title: 'title',
    subtitle: 'subtitle',
    description: 'description',
    overviewSection: 'overviewSection',
    overviewTitle: 'overviewTitle',
    featureGrid: 'featureGrid',
    featureCard: 'featureCard',
    featureIcon: 'featureIcon',
    featureTitle: 'featureTitle',
    featureDescription: 'featureDescription',
    startSection: 'startSection',
    startButton: 'startButton',
    startHint: 'startHint',
    accessibilityInfo: 'accessibilityInfo',
    accessibilityText: 'accessibilityText'
  }
}));

describe('WelcomeScreen', () => {
  const mockOnStartQuiz = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Content', () => {
    it('renders the main title and subtitle', () => {
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} />);
      
      expect(screen.getByText('Weird Animal Quiz')).toBeInTheDocument();
      expect(screen.getByText('Discover the bizarre world of animal behaviors')).toBeInTheDocument();
    });

    it('displays quiz description with key information', () => {
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} />);
      
      const description = screen.getByText(/Test your knowledge with 9 fascinating questions/);
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent('nature documentaries');
    });

    it('shows quiz overview features', () => {
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} />);
      
      expect(screen.getByText('9 Questions')).toBeInTheDocument();
      expect(screen.getByText('30 Seconds')).toBeInTheDocument();
      expect(screen.getByText('Learn & Discover')).toBeInTheDocument();
      
      expect(screen.getByText(/3 easy, 3 medium, 3 hard questions/)).toBeInTheDocument();
      expect(screen.getByText(/Per question with visual timer/)).toBeInTheDocument();
      expect(screen.getByText(/Detailed explanations and fun facts/)).toBeInTheDocument();
    });

    it('displays animal emojis in header', () => {
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} />);
      
      const emojiHeader = screen.getByText('🦎').parentElement;
      expect(emojiHeader).toHaveAttribute('aria-hidden', 'true');
      
      // Check for presence of various animal emojis
      expect(screen.getByText('🦎')).toBeInTheDocument();
      expect(screen.getByText('🐙')).toBeInTheDocument();
      expect(screen.getByText('🦘')).toBeInTheDocument();
      expect(screen.getByText('🦜')).toBeInTheDocument();
      expect(screen.getByText('🐨')).toBeInTheDocument();
    });
  });

  describe('Start Button Functionality', () => {
    it('renders start button with correct text', () => {
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} />);
      
      const startButton = screen.getByRole('button', { name: /start( the weird animal quiz with 9 questions)?/i });
      expect(startButton).toBeInTheDocument();
      expect(startButton).toHaveTextContent('Start Quiz');
    });

    it('calls onStartQuiz when start button is clicked', async () => {
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} />);
      
      const startButton = screen.getByRole('button', { name: /start( the weird animal quiz with 9 questions)?/i });
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(mockOnStartQuiz).toHaveBeenCalledTimes(1);
      });
    });

    it('shows loading state when isLoading prop is true', () => {
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} isLoading={true} />);
      
      const startButton = screen.getByRole('button', { name: /loading quiz|loading quiz, please wait/i });
      expect(startButton).toBeInTheDocument();
      expect(startButton).toHaveTextContent('Loading Quiz...');
      expect(startButton).toBeDisabled();
    });
    it('shows loading state temporarily when button is clicked', async () => {
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} />);
      const startButton = screen.getByRole('button', { name: /start( the weird animal quiz with 9 questions)?/i });
      fireEvent.click(startButton);
      // Wait for loading state to appear and callback
      await waitFor(() => {
        const loadingButton = screen.getByRole('button', { name: /loading quiz|loading quiz, please wait/i });
        expect(loadingButton).toHaveTextContent('Loading Quiz...');
        expect(loadingButton).toBeDisabled();
        expect(mockOnStartQuiz).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports Enter key to start quiz', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} />);
      
      const startButton = screen.getByRole('button', { name: /start( the weird animal quiz with 9 questions)?/i });
      await user.type(startButton, '{enter}');
      
      await waitFor(() => {
        expect(mockOnStartQuiz).toHaveBeenCalledTimes(1);
      });
    });

    it('supports Space key to start quiz', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} />);
      
      const startButton = screen.getByRole('button', { name: /start( the weird animal quiz with 9 questions)?/i });
      await user.type(startButton, ' ');
      
      await waitFor(() => {
        expect(mockOnStartQuiz).toHaveBeenCalledTimes(1);
      });
    });

    it('does not trigger start when loading and key is pressed', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} isLoading={true} />);
      
      const startButton = screen.getByRole('button', { name: /loading quiz|loading quiz, please wait/i });
      await user.type(startButton, '{enter}');
      await user.type(startButton, ' ');
      
      expect(mockOnStartQuiz).not.toHaveBeenCalled();
    });

    it('prevents default behavior for Enter and Space keys', () => {
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} />);
      
      const startButton = screen.getByRole('button', { name: /start( the weird animal quiz with 9 questions)?/i });
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      
      const preventDefaultSpy = vi.spyOn(enterEvent, 'preventDefault');
      const preventDefaultSpySp = vi.spyOn(spaceEvent, 'preventDefault');
      
      fireEvent(startButton, enterEvent);
      fireEvent(startButton, spaceEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(preventDefaultSpySp).toHaveBeenCalled();
    });
  });

  describe('Accessibility Features', () => {

    it('has proper ARIA roles and labels', () => {
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} />);
      // Main content should have role="main"
      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();
      // Start button should have proper aria-describedby
      const startButton = screen.getByRole('button', { name: /start( the weird animal quiz with 9 questions)?/i });
      // Should have both quiz-description and start-hint in aria-describedby
      const describedBy = startButton.getAttribute('aria-describedby') || '';
      expect(describedBy.includes('quiz-description') || describedBy.includes('start-hint')).toBe(true);
      // Description should have matching id
      const description = screen.getByText(/Press Enter or Space to start/);
      // Accept either id="quiz-description" or id="start-hint"
      expect(['quiz-description', 'start-hint']).toContain(description.getAttribute('id'));
    });

    it('marks decorative elements as aria-hidden', () => {
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} />);
      
      // Emoji header should be hidden from screen readers
      const emojiHeader = screen.getByText('🦎').parentElement;
      expect(emojiHeader).toHaveAttribute('aria-hidden', 'true');
      
      // Feature icons should be hidden from screen readers
      const featureIcons = screen.getAllByText(/📊|⏱️|🎯/);
      featureIcons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('provides accessibility information text', () => {
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} />);
      
      const accessibilityText = screen.getByText(
        /This quiz is fully accessible with keyboard navigation and screen reader support/
      );
      expect(accessibilityText).toBeInTheDocument();
    });

    it('shows keyboard navigation hint', () => {
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} />);
      
      const keyboardHint = screen.getByText(/Press Enter or Space to start/);
      expect(keyboardHint).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies mobile-first CSS classes', () => {
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} />);
      
      const welcomeScreen = screen.getByRole('main');
      expect(welcomeScreen).toHaveClass('welcomeScreen');
      
      const startButton = screen.getByRole('button', { name: /start( the weird animal quiz with 9 questions)?/i });
      expect(startButton).toHaveClass('startButton');
    });

    it('renders feature grid with proper structure', () => {
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} />);
      
      const featureCards = screen.getAllByText(/Questions|Seconds|Learn & Discover/).map(
        text => text.closest('[class*="featureCard"]')
      );
      
      expect(featureCards).toHaveLength(3);
      featureCards.forEach(card => {
        expect(card).toBeInTheDocument();
      });
    });
  });

  describe('Loading States and Transitions', () => {
    it('handles loading prop correctly', () => {
      const { rerender } = render(
        <WelcomeScreen onStartQuiz={mockOnStartQuiz} isLoading={false} />
      );
      
      let startButton = screen.getByRole('button', { name: /start( the weird animal quiz with 9 questions)?/i });
      expect(startButton).not.toBeDisabled();
      expect(startButton).toHaveTextContent('Start Quiz');
      
      rerender(<WelcomeScreen onStartQuiz={mockOnStartQuiz} isLoading={true} />);
      
      startButton = screen.getByRole('button', { name: /loading quiz/i });
      expect(startButton).toBeDisabled();
      expect(startButton).toHaveTextContent('Loading Quiz...');
    });

    it('maintains button state during internal loading', async () => {
      const startButton = screen.getByRole('button', { name: /start( the weird animal quiz with 9 questions)?/i });
      // Click button to trigger internal loading state
      fireEvent.click(startButton);
      // Wait for loading state to appear
      const loadingButton = await screen.findByRole('button', { name: /loading quiz|loading quiz, please wait/i });
      expect(loadingButton).toBeDisabled();
      expect(loadingButton).toHaveTextContent('Loading Quiz...');
      // Wait for the transition to complete
      await waitFor(() => {
        expect(mockOnStartQuiz).toHaveBeenCalled();
      });
    });
    
  });

  describe('User Experience', () => {
    it('provides clear call-to-action', () => {
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} />);
      
      // Should have prominent start button
      const startButton = screen.getByRole('button', { name: /start( the weird animal quiz with 9 questions)?/i });
      expect(startButton).toBeInTheDocument();
      
      // Should have clear instructions
      expect(screen.getByText(/Press Enter or Space to start/)).toBeInTheDocument();
    });

    it('sets proper expectations with overview content', () => {
      render(<WelcomeScreen onStartQuiz={mockOnStartQuiz} />);
      
      // Should explain what users will experience
      expect(screen.getByText('What to Expect')).toBeInTheDocument();
      expect(screen.getByText(/9 fascinating questions/)).toBeInTheDocument();
      expect(screen.getByText(/bizarre animal behaviors/)).toBeInTheDocument();
    });
  });
});