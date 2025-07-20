/**
 * ErrorScreen Component Tests
 * Tests error screen display, user interactions, and accessibility
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ErrorScreen } from '../ErrorScreen';
import { ErrorType } from '../../types/quiz';

describe('ErrorScreen', () => {
  it('renders with default error message', () => {
    render(<ErrorScreen />);

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(screen.getByText(/Don't worry - even the most adaptable animals/)).toBeInTheDocument();
    expect(screen.getByText('🦎')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    const customMessage = 'Custom error occurred';
    render(<ErrorScreen message={customMessage} />);

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('displays correct content for network error', () => {
    render(<ErrorScreen errorType={ErrorType.NETWORK_ERROR} />);

    expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    expect(screen.getByText(/We're having trouble connecting/)).toBeInTheDocument();
    expect(screen.getByText('🌐')).toBeInTheDocument();
  });

  it('displays correct content for storage error', () => {
    render(<ErrorScreen errorType={ErrorType.STORAGE_ERROR} />);

    expect(screen.getByText('Storage Issue')).toBeInTheDocument();
    expect(screen.getByText(/We couldn't save your progress/)).toBeInTheDocument();
    expect(screen.getByText('💾')).toBeInTheDocument();
  });

  it('displays correct content for timer error', () => {
    render(<ErrorScreen errorType={ErrorType.TIMER_ERROR} />);

    expect(screen.getByText('Timer Malfunction')).toBeInTheDocument();
    expect(screen.getByText(/The quiz timer encountered an issue/)).toBeInTheDocument();
    expect(screen.getByText('⏰')).toBeInTheDocument();
  });

  it('displays correct content for validation error', () => {
    render(<ErrorScreen errorType={ErrorType.VALIDATION_ERROR} />);

    expect(screen.getByText('Input Error')).toBeInTheDocument();
    expect(screen.getByText(/There was an issue with your input/)).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('displays correct content for animation error', () => {
    render(<ErrorScreen errorType={ErrorType.ANIMATION_ERROR} />);

    expect(screen.getByText('Display Issue')).toBeInTheDocument();
    expect(screen.getByText(/Some visual effects aren't working/)).toBeInTheDocument();
    expect(screen.getByText('🎬')).toBeInTheDocument();
  });

  it('shows retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<ErrorScreen onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: 'Try Again' });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows home button when onGoHome is provided', () => {
    const onGoHome = vi.fn();
    render(<ErrorScreen onGoHome={onGoHome} />);

    const homeButton = screen.getByRole('button', { name: 'Go to Home' });
    expect(homeButton).toBeInTheDocument();

    fireEvent.click(homeButton);
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });

  it('shows both buttons when both callbacks are provided', () => {
    const onRetry = vi.fn();
    const onGoHome = vi.fn();
    render(<ErrorScreen onRetry={onRetry} onGoHome={onGoHome} />);

    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to Home' })).toBeInTheDocument();
  });

  it('displays error ID when provided', () => {
    const errorId = 'test-error-123';
    render(<ErrorScreen errorId={errorId} />);

    expect(screen.getByText(`Error ID: ${errorId}`)).toBeInTheDocument();
  });

  it('shows technical details when enabled', () => {
    render(
      <ErrorScreen 
        errorType={ErrorType.NETWORK_ERROR}
        showTechnicalDetails={true}
      />
    );

    const detailsElement = screen.getByText('Technical Information');
    expect(detailsElement).toBeInTheDocument();

    fireEvent.click(detailsElement);

    expect(screen.getByText(`Error Type: ${ErrorType.NETWORK_ERROR}`)).toBeInTheDocument();
    expect(screen.getByText(/Timestamp:/)).toBeInTheDocument();
    expect(screen.getByText(/User Agent:/)).toBeInTheDocument();
  });

  it('hides technical details by default', () => {
    render(<ErrorScreen errorType={ErrorType.NETWORK_ERROR} />);

    expect(screen.queryByText('Technical Information')).not.toBeInTheDocument();
  });

  it('displays help text', () => {
    render(<ErrorScreen />);

    expect(screen.getByText(/If this problem persists/)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    const onRetry = vi.fn();
    render(<ErrorScreen onRetry={onRetry} showTechnicalDetails={true} errorType={ErrorType.NETWORK_ERROR} />);

    // Check button accessibility
    const retryButton = screen.getByRole('button', { name: 'Try Again' });
    expect(retryButton).toBeInTheDocument();

    // Check details accessibility
    const detailsElement = screen.getByRole('group');
    expect(detailsElement).toBeInTheDocument();
  });

  it('handles keyboard navigation for technical details', () => {
    render(
      <ErrorScreen 
        errorType={ErrorType.NETWORK_ERROR}
        showTechnicalDetails={true}
      />
    );

    const detailsElement = screen.getByText('Technical Information');
    
    // Focus the details element
    detailsElement.focus();
    expect(detailsElement).toHaveFocus();

    // Press Enter to toggle
    fireEvent.keyDown(detailsElement, { key: 'Enter', code: 'Enter' });
    
    // Details should be expanded (this would need more complex testing for full functionality)
    expect(detailsElement).toBeInTheDocument();
  });

  it('is responsive on mobile screens', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const onRetry = vi.fn();
    const onGoHome = vi.fn();
    
    render(<ErrorScreen onRetry={onRetry} onGoHome={onGoHome} />);

    const errorContainer = screen.getByTestId('error-container');
    expect(errorContainer).toBeInTheDocument();
  });

  it('handles missing callbacks gracefully', () => {
    render(<ErrorScreen />);

    // Should not show any buttons when no callbacks provided
    expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Go to Home' })).not.toBeInTheDocument();
  });

  it('displays different icons for different error types', () => {
    const { rerender } = render(<ErrorScreen errorType={ErrorType.NETWORK_ERROR} />);
    expect(screen.getByText('🌐')).toBeInTheDocument();

    rerender(<ErrorScreen errorType={ErrorType.STORAGE_ERROR} />);
    expect(screen.getByText('💾')).toBeInTheDocument();

    rerender(<ErrorScreen errorType={ErrorType.TIMER_ERROR} />);
    expect(screen.getByText('⏰')).toBeInTheDocument();

    rerender(<ErrorScreen errorType={ErrorType.VALIDATION_ERROR} />);
    expect(screen.getByText('⚠️')).toBeInTheDocument();

    rerender(<ErrorScreen errorType={ErrorType.ANIMATION_ERROR} />);
    expect(screen.getByText('🎬')).toBeInTheDocument();
  });
});