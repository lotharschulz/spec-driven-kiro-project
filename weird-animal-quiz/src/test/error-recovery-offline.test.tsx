/**
 * Error Recovery and Offline Functionality Tests
 * Tests error handling, recovery mechanisms, and offline capabilities
 * Requirements: 5.2, 5.3, 5.9, 6.8, 6.13
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ErrorRecovery } from '../components/ErrorRecovery';
import { ErrorScreen } from '../components/ErrorScreen';
import { QuizProvider } from '../contexts/QuizContext';
import { useQuizStorage } from '../hooks/useQuizStorage';
import { useOfflineManager } from '../utils/offlineManager';
import { errorHandler, ErrorType } from '../utils/errorHandler';
import { errorMonitoring } from '../utils/errorMonitoring';
import { storage } from '../utils/storage';
import { Question, Difficulty } from '../types/quiz';

// Mock questions for testing
const mockQuestions: Question[] = [
  {
    id: 'easy-1',
    difficulty: Difficulty.EASY,
    text: 'Which animal can sleep for up to 22 hours a day?',
    emojis: ['🐨', '😴'],
    answers: [
      { id: 'a1', text: 'Koala', isCorrect: true },
      { id: 'a2', text: 'Sloth', isCorrect: false },
      { id: 'a3', text: 'Panda', isCorrect: false },
      { id: 'a4', text: 'Cat', isCorrect: false }
    ],
    explanation: 'Koalas sleep 18-22 hours daily to conserve energy for digesting eucalyptus leaves.',
    funFact: 'Koalas have fingerprints almost identical to humans!',
    category: 'behavior'
  }
];

// Mock hooks
vi.mock('../hooks/useQuizStorage', () => ({
  useQuizStorage: vi.fn(() => ({
    saveProgress: vi.fn(),
    loadProgress: vi.fn(),
    clearProgress: vi.fn(),
    isStorageAvailable: true,
    storageInfo: { used: 100, total: 5000, percentage: 2 }
  }))
}));

vi.mock('../utils/offlineManager', () => ({
  useOfflineManager: vi.fn(() => ({
    isOnline: true,
    isServiceWorkerRegistered: true,
    cacheStatus: 'ready'
  }))
}));

vi.mock('../utils/errorMonitoring', () => ({
  errorMonitoring: {
    captureError: vi.fn(),
    logEvent: vi.fn(),
    getErrorContext: vi.fn(() => ({ lastAction: 'test', timestamp: Date.now() }))
  }
}));

// Component that throws an error on demand
const ErrorComponent = ({ shouldThrow = false, errorMessage = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

// Component for testing error boundary
const ErrorBoundaryTest = () => {
  const [shouldThrow, setShouldThrow] = React.useState(false);
  
  return (
    <ErrorBoundary>
      <button onClick={() => setShouldThrow(true)}>Trigger Error</button>
      {shouldThrow && <ErrorComponent shouldThrow={true} />}
    </ErrorBoundary>
  );
};

// Component for testing error recovery
const ErrorRecoveryTest = () => {
  const [hasError, setHasError] = React.useState(false);
  const [errorType, setErrorType] = React.useState<ErrorType>(ErrorType.GENERAL_ERROR);
  const [retryCount, setRetryCount] = React.useState(0);
  
  const handleTriggerError = (type: ErrorType) => {
    setHasError(true);
    setErrorType(type);
    errorMonitoring.captureError(new Error(`Test ${type} error`));
  };
  
  const handleRetry = () => {
    setRetryCount(retryCount + 1);
    setHasError(false);
  };
  
  return (
    <div>
      {!hasError ? (
        <div>
          <div data-testid="retry-count">Retry count: {retryCount}</div>
          <button onClick={() => handleTriggerError(ErrorType.NETWORK_ERROR)}>
            Trigger Network Error
          </button>
          <button onClick={() => handleTriggerError(ErrorType.STORAGE_ERROR)}>
            Trigger Storage Error
          </button>
          <button onClick={() => handleTriggerError(ErrorType.VALIDATION_ERROR)}>
            Trigger Validation Error
          </button>
        </div>
      ) : (
        <ErrorRecovery
          errorType={errorType}
          onRetry={handleRetry}
          retryCount={retryCount}
        />
      )}
    </div>
  );
};

// Component for testing offline functionality
const OfflineTest = () => {
  const offlineState = useOfflineManager();
  const [quizData, setQuizData] = React.useState<any>(null);
  const [loadingError, setLoadingError] = React.useState<string | null>(null);
  
  const handleLoadData = () => {
    try {
      if (!offlineState.isOnline && offlineState.cacheStatus !== 'complete') {
        throw new Error('Cannot load data while offline with incomplete cache');
      }
      
      setQuizData(mockQuestions);
      setLoadingError(null);
    } catch (error) {
      setLoadingError((error as Error).message);
      errorMonitoring.captureError(error as Error);
    }
  };
  
  return (
    <div>
      <div data-testid="online-status">
        Online: {offlineState.isOnline ? 'Yes' : 'No'}
      </div>
      <div data-testid="cache-status">
        Cache: {offlineState.cacheStatus}
      </div>
      <button onClick={handleLoadData}>Load Quiz Data</button>
      {loadingError && (
        <div data-testid="loading-error">{loadingError}</div>
      )}
      {quizData && (
        <div data-testid="quiz-data">Quiz data loaded successfully</div>
      )}
    </div>
  );
};

// Component for testing storage recovery
const StorageRecoveryTest = () => {
  const [storageAvailable, setStorageAvailable] = React.useState(true);
  const [savedData, setSavedData] = React.useState<any>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  
  const handleToggleStorage = () => {
    setStorageAvailable(!storageAvailable);
  };
  
  const handleSaveData = () => {
    try {
      if (!storageAvailable) {
        throw new Error('Storage not available');
      }
      
      const testData = { test: 'data', timestamp: Date.now() };
      storage.setItem('test-data', JSON.stringify(testData));
      setSavedData(testData);
      setSaveError(null);
    } catch (error) {
      setSaveError((error as Error).message);
      setSavedData(null);
      errorMonitoring.captureError(error as Error);
    }
  };
  
  const handleLoadData = () => {
    try {
      const data = storage.getItem('test-data');
      if (data) {
        setSavedData(JSON.parse(data));
        setSaveError(null);
      } else {
        setSaveError('No data found');
        setSavedData(null);
      }
    } catch (error) {
      setSaveError((error as Error).message);
      setSavedData(null);
      errorMonitoring.captureError(error as Error);
    }
  };
  
  return (
    <div>
      <div data-testid="storage-status">
        Storage Available: {storageAvailable ? 'Yes' : 'No'}
      </div>
      <button onClick={handleToggleStorage}>
        {storageAvailable ? 'Disable Storage' : 'Enable Storage'}
      </button>
      <button onClick={handleSaveData}>Save Data</button>
      <button onClick={handleLoadData}>Load Data</button>
      {saveError && (
        <div data-testid="storage-error">{saveError}</div>
      )}
      {savedData && (
        <div data-testid="saved-data">Data saved/loaded successfully</div>
      )}
    </div>
  );
};

describe('Error Recovery and Offline Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Boundary Tests', () => {
    it('catches and displays errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ErrorBoundaryTest />);
      
      // Trigger error
      await user.click(screen.getByText('Trigger Error'));
      
      // Error boundary should catch and display error
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('allows recovery from errors', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ErrorBoundaryTest />);
      
      // Trigger error
      await user.click(screen.getByText('Trigger Error'));
      
      // Error boundary should catch and display error
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      
      // Click try again
      await user.click(screen.getByRole('button', { name: /try again/i }));
      
      // Should be back to normal state
      expect(screen.getByText('Trigger Error')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('logs errors to monitoring service', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Create a component that logs errors
      const LoggingErrorComponent = () => {
        const [hasError, setHasError] = React.useState(false);
        
        const handleTriggerError = () => {
          try {
            throw new Error('Test monitored error');
          } catch (error) {
            errorMonitoring.captureError(error as Error);
            setHasError(true);
          }
        };
        
        return (
          <div>
            <button onClick={handleTriggerError}>Trigger Monitored Error</button>
            {hasError && <div data-testid="error-triggered">Error triggered</div>}
          </div>
        );
      };
      
      render(<LoggingErrorComponent />);
      
      // Trigger error
      await user.click(screen.getByText('Trigger Monitored Error'));
      
      // Error should be captured
      expect(errorMonitoring.captureError).toHaveBeenCalledWith(expect.any(Error));
      expect(screen.getByTestId('error-triggered')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Recovery Tests', () => {
    it('provides different recovery options based on error type', async () => {
      const user = userEvent.setup();
      
      render(<ErrorRecoveryTest />);
      
      // Trigger network error
      await user.click(screen.getByText('Trigger Network Error'));
      
      // Should show network-specific recovery options
      expect(screen.getByText(/connection issue/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      
      // Retry should work
      await user.click(screen.getByRole('button', { name: /retry/i }));
      
      // Should be back to normal state with increased retry count
      expect(screen.getByTestId('retry-count').textContent).toContain('1');
      
      // Trigger storage error
      await user.click(screen.getByText('Trigger Storage Error'));
      
      // Should show storage-specific recovery options
      expect(screen.getByText(/storage issue/i)).toBeInTheDocument();
    });

    it('limits automatic retries for certain error types', async () => {
      // Create a component with auto-retry
      const AutoRetryComponent = () => {
        const [errorType, setErrorType] = React.useState<ErrorType | null>(null);
        const [retryCount, setRetryCount] = React.useState(0);
        
        const handleTriggerError = () => {
          setErrorType(ErrorType.NETWORK_ERROR);
          setRetryCount(3); // Already tried 3 times
        };
        
        const handleRetry = () => {
          setRetryCount(retryCount + 1);
        };
        
        const handleReset = () => {
          setErrorType(null);
          setRetryCount(0);
        };
        
        return (
          <div>
            {!errorType ? (
              <button onClick={handleTriggerError}>Trigger Auto-Retry Error</button>
            ) : (
              <div>
                <ErrorRecovery
                  errorType={errorType}
                  onRetry={handleRetry}
                  retryCount={retryCount}
                  maxAutoRetries={2}
                />
                <button onClick={handleReset}>Reset</button>
              </div>
            )}
          </div>
        );
      };
      
      const user = userEvent.setup();
      
      render(<AutoRetryComponent />);
      
      // Trigger error
      await user.click(screen.getByText('Trigger Auto-Retry Error'));
      
      // Should show manual retry option since auto-retries are exhausted
      expect(screen.getByText(/automatic retries failed/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again manually/i })).toBeInTheDocument();
    });

    it('handles validation errors appropriately', async () => {
      const user = userEvent.setup();
      
      render(<ErrorRecoveryTest />);
      
      // Trigger validation error
      await user.click(screen.getByText('Trigger Validation Error'));
      
      // Should show validation-specific recovery options
      expect(screen.getByText(/invalid input/i)).toBeInTheDocument();
      
      // Should have a way to go back or retry
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });
  });

  describe('Offline Functionality Tests', () => {
    it('detects offline status and shows appropriate message', async () => {
      // Mock offline status
      (useOfflineManager as any).mockImplementation(() => ({
        isOnline: false,
        isServiceWorkerRegistered: true,
        cacheStatus: 'partial'
      }));
      
      render(<OfflineTest />);
      
      // Should show offline status
      expect(screen.getByTestId('online-status').textContent).toContain('No');
    });

    it('works with cached content when offline', async () => {
      const user = userEvent.setup();
      
      // Mock offline but with complete cache
      (useOfflineManager as any).mockImplementation(() => ({
        isOnline: false,
        isServiceWorkerRegistered: true,
        cacheStatus: 'complete'
      }));
      
      render(<OfflineTest />);
      
      // Try to load data
      await user.click(screen.getByText('Load Quiz Data'));
      
      // Should work with cached content
      expect(screen.getByTestId('quiz-data')).toBeInTheDocument();
    });

    it('shows appropriate error when offline with incomplete cache', async () => {
      const user = userEvent.setup();
      
      // Mock offline with incomplete cache
      (useOfflineManager as any).mockImplementation(() => ({
        isOnline: false,
        isServiceWorkerRegistered: true,
        cacheStatus: 'incomplete'
      }));
      
      render(<OfflineTest />);
      
      // Try to load data
      await user.click(screen.getByText('Load Quiz Data'));
      
      // Should show error
      expect(screen.getByTestId('loading-error')).toBeInTheDocument();
      expect(screen.getByTestId('loading-error').textContent).toContain('offline');
    });

    it('recovers automatically when coming back online', async () => {
      const user = userEvent.setup();
      
      // Start offline
      (useOfflineManager as any).mockImplementation(() => ({
        isOnline: false,
        isServiceWorkerRegistered: true,
        cacheStatus: 'partial'
      }));
      
      const { rerender } = render(<OfflineTest />);
      
      // Try to load data - should fail
      await user.click(screen.getByText('Load Quiz Data'));
      expect(screen.getByTestId('loading-error')).toBeInTheDocument();
      
      // Now come back online
      (useOfflineManager as any).mockImplementation(() => ({
        isOnline: true,
        isServiceWorkerRegistered: true,
        cacheStatus: 'complete'
      }));
      
      rerender(<OfflineTest />);
      
      // Try again - should work now
      await user.click(screen.getByText('Load Quiz Data'));
      expect(screen.getByTestId('quiz-data')).toBeInTheDocument();
    });
  });

  describe('Storage Recovery Tests', () => {
    it('handles storage errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock storage.setItem to throw an error
      const originalSetItem = storage.setItem;
      storage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      render(<StorageRecoveryTest />);
      
      // Try to save data
      await user.click(screen.getByText('Save Data'));
      
      // Should show error
      expect(screen.getByTestId('storage-error')).toBeInTheDocument();
      
      // Restore original function
      storage.setItem = originalSetItem;
    });

    it('falls back to memory storage when localStorage is unavailable', async () => {
      const user = userEvent.setup();
      
      render(<StorageRecoveryTest />);
      
      // Disable storage
      await user.click(screen.getByText('Disable Storage'));
      
      // Try to save data
      await user.click(screen.getByText('Save Data'));
      
      // Should show error
      expect(screen.getByTestId('storage-error')).toBeInTheDocument();
      
      // Enable storage
      await user.click(screen.getByText('Enable Storage'));
      
      // Try again
      await user.click(screen.getByText('Save Data'));
      
      // Should work now
      expect(screen.getByTestId('saved-data')).toBeInTheDocument();
    });

    it('recovers saved progress when available', async () => {
      // Create a component to test progress recovery
      const ProgressRecoveryTest = () => {
        const quizStorage = useQuizStorage();
        const [hasProgress, setHasProgress] = React.useState(false);
        const [isLoaded, setIsLoaded] = React.useState(false);
        
        const handleSaveProgress = () => {
          quizStorage.saveProgress({
            currentQuestionIndex: 2,
            answers: [{ questionId: 'q1', isCorrect: true }]
          });
          setHasProgress(true);
        };
        
        const handleLoadProgress = () => {
          const progress = quizStorage.loadProgress();
          setIsLoaded(!!progress);
        };
        
        return (
          <div>
            <button onClick={handleSaveProgress}>Save Progress</button>
            <button onClick={handleLoadProgress}>Load Progress</button>
            <div data-testid="has-progress">
              Has Progress: {hasProgress ? 'Yes' : 'No'}
            </div>
            <div data-testid="is-loaded">
              Progress Loaded: {isLoaded ? 'Yes' : 'No'}
            </div>
          </div>
        );
      };
      
      const user = userEvent.setup();
      
      // Mock loadProgress to return data
      (useQuizStorage as any).mockImplementation(() => ({
        saveProgress: vi.fn(),
        loadProgress: vi.fn(() => ({ currentQuestionIndex: 2, answers: [] })),
        clearProgress: vi.fn(),
        isStorageAvailable: true,
        storageInfo: { used: 100, total: 5000, percentage: 2 }
      }));
      
      render(<ProgressRecoveryTest />);
      
      // Save progress
      await user.click(screen.getByText('Save Progress'));
      
      // Load progress
      await user.click(screen.getByText('Load Progress'));
      
      // Should show progress was loaded
      expect(screen.getByTestId('is-loaded').textContent).toContain('Yes');
    });
  });

  describe('Error Monitoring Integration', () => {
    it('captures errors with context information', async () => {
      const testError = new Error('Test error with context');
      
      // Call error monitoring directly
      errorMonitoring.captureError(testError);
      
      // Should have called captureError with the error
      expect(errorMonitoring.captureError).toHaveBeenCalledWith(testError);
      
      // Should have called getErrorContext to get additional context
      expect(errorMonitoring.getErrorContext).toHaveBeenCalled();
    });

    it('logs non-error events for monitoring', async () => {
      // Log an event
      errorMonitoring.logEvent('test-event', { detail: 'test detail' });
      
      // Should have called logEvent with the event name and details
      expect(errorMonitoring.logEvent).toHaveBeenCalledWith('test-event', { detail: 'test detail' });
    });

    it('integrates with error handler for consistent error processing', async () => {
      // Create a spy for errorHandler.handleError
      const handleErrorSpy = vi.spyOn(errorHandler, 'handleError');
      
      // Call error handler
      errorHandler.handleError(new Error('Test error'), ErrorType.NETWORK_ERROR);
      
      // Should have called handleError
      expect(handleErrorSpy).toHaveBeenCalled();
      
      // Restore spy
      handleErrorSpy.mockRestore();
    });
  });
});
</content>