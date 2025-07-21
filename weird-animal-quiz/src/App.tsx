import { useState, useEffect, Suspense, lazy } from 'react';
import { QuizProvider } from './contexts/QuizContext';
import { ErrorBoundary, AccessibilitySettings, Button } from './components';
import { useQuizStorage } from './hooks/useQuizStorage';
import { useMobileOptimization } from './hooks/useMobileOptimization';
import { Difficulty } from './types/quiz';
// LoadingSpinner imported via components index
import SkeletonScreen from './components/SkeletonScreen';
import PageTransition from './components/PageTransition';
import { 
  PerformanceMonitor, 
  ResourceOptimizer, 
  MemoryOptimizer,
  BundleOptimizer 
} from './utils/performanceOptimizer';
import { useOfflineManager } from './utils/offlineManager';
import { 
  VisualAccessibility, 
  TouchTargetValidator, 
  FocusManager 
} from './utils/accessibility';
import { injectAnimationKeyframes } from './utils/animationSystem';
import './App.css';

// Create lazy loaders with preloading capability
const welcomeLoader = BundleOptimizer.createLazyLoader(() => import('./components/WelcomeScreen'));
const resultsLoader = BundleOptimizer.createLazyLoader(() => import('./components/ResultsScreen'));

// Lazy load components with performance monitoring
const WelcomeScreen = lazy(() => 
  PerformanceMonitor.measureAsync('WelcomeScreen-load', () => welcomeLoader.load())
);
const ResultsScreen = lazy(() => 
  PerformanceMonitor.measureAsync('ResultsScreen-load', () => resultsLoader.load())
);

// Storage-aware App component wrapper
function AppWithStorage() {
  return (
    <ErrorBoundary>
      <QuizProvider>
        <App />
      </QuizProvider>
    </ErrorBoundary>
  );
}

function App() {
  const [gameState, setGameState] = useState<'welcome' | 'quiz' | 'results'>('welcome');
  const [isPreloading, setIsPreloading] = useState(true);
  const [showAccessibilitySettings, setShowAccessibilitySettings] = useState(false);
  const storage = useQuizStorage();
  const offlineState = useOfflineManager();
  
  // Add mobile optimization hook
  const { 
    ref: mobileRef,
    deviceInfo,
    currentBreakpoint,
    mobileClasses,
    triggerHapticFeedback
  } = useMobileOptimization({
    enableThumbNavigation: true,
    enableTouchFeedback: true,
    optimizePerformance: true
  });

  // Performance monitoring and preloading
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Measure app initialization time
        await PerformanceMonitor.measureAsync('app-initialization', async () => {
          // Preload critical components based on likely user flow
          await Promise.all([
            welcomeLoader.preload(), // Always preload welcome screen
            ResourceOptimizer.preloadComponent(() => import('./components/Timer')),
            ResourceOptimizer.preloadComponent(() => import('./components/ProgressTracker'))
          ]);

          // Preload results screen after longer delay
          setTimeout(() => {
            resultsLoader.preload();
          }, 500);
        });

        setIsPreloading(false);

        // Log performance report in development
        if (process.env.NODE_ENV === 'development') {
          setTimeout(() => {
            PerformanceMonitor.logReport();
          }, 2000);
        }
      } catch (error) {
        console.error('App initialization failed:', error);
        setIsPreloading(false);
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      MemoryOptimizer.cleanup();
    };
  }, []);

  // Load user preferences on app start
  useEffect(() => {
    // Load and apply accessibility preferences
    const preferences = VisualAccessibility.loadPreferences();
    VisualAccessibility.applyPreferences(preferences);

    // Inject animation keyframes
    injectAnimationKeyframes();

    // Check for saved progress
    const hasProgress = storage.loadProgress();
    if (hasProgress) {
      console.log('Found saved progress, user can resume quiz');
      // In a full implementation, we would show a "Resume Quiz" option
    }

    // Validate touch targets in development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        TouchTargetValidator.logTouchTargetValidation();
      }, 1000);
    }

    // Announce app load to screen readers
    FocusManager.announceToScreenReader(
      'Weird Animal Quiz application loaded. Use Tab to navigate and Enter to activate buttons.',
      'polite'
    );
  }, [storage]);

  const handleStartQuiz = () => {
    setGameState('quiz');
  };

  const handlePlayAgain = () => {
    // Clear any saved progress when starting fresh
    storage.clearProgress();
    setGameState('welcome');
  };

  const handleRetryDifficulty = (difficulty: Difficulty) => {
    // For now, just restart the quiz - this would be enhanced to filter by difficulty
    console.log(`Retrying difficulty: ${difficulty}`);
    storage.clearProgress();
    setGameState('welcome');
  };

  // Display storage info for debugging (would be removed in production)
  const storageInfo = storage.storageInfo;
  const storageAvailable = storage.isStorageAvailable;

  // Show preloading state
  if (isPreloading) {
    return (
      <div className="app">
        <SkeletonScreen type="welcome" />
      </div>
    );
  }

  // Create class names string from mobile classes
  const mobileClassNames = Object.keys(mobileClasses)
    .filter(key => mobileClasses[key])
    .join(' ');

  // Handle button click with haptic feedback
  const handleAccessibilityClick = () => {
    triggerHapticFeedback.selection();
    setShowAccessibilitySettings(true);
  };

  return (
    <div 
      ref={mobileRef} 
      className={`app ${mobileClassNames}`}
      data-breakpoint={currentBreakpoint}
      data-device-type={deviceInfo.isMobile ? 'mobile' : deviceInfo.isTablet ? 'tablet' : 'desktop'}
    >
      {/* Skip link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Accessibility Settings Button - positioned for thumb navigation */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleAccessibilityClick}
        aria-label="Open accessibility settings"
        className={deviceInfo.isMobile ? "secondary-action" : ""}
        style={{
          position: 'fixed',
          top: deviceInfo.isMobile ? 'auto' : '10px',
          bottom: deviceInfo.isMobile ? '10px' : 'auto',
          left: deviceInfo.isMobile ? 'auto' : '10px',
          right: deviceInfo.isMobile ? '10px' : 'auto',
          zIndex: 999,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          minWidth: '44px',
          minHeight: '44px'
        }}
      >
        ⚙️ A11y
      </Button>

      {/* Development indicators */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          position: 'fixed', 
          top: 10, 
          right: 10, 
          background: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: '8px', 
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          Storage: {storageAvailable ? 'Available' : 'Unavailable'}<br/>
          Used: {Math.round(storageInfo.percentage)}%<br/>
          Online: {offlineState.isOnline ? 'Yes' : 'No'}<br/>
          SW: {offlineState.isServiceWorkerRegistered ? 'Active' : 'Inactive'}<br/>
          Cache: {offlineState.cacheStatus}<br/>
          Device: {deviceInfo.isMobile ? 'Mobile' : deviceInfo.isTablet ? 'Tablet' : 'Desktop'}<br/>
          Breakpoint: {currentBreakpoint}
        </div>
      )}

      {/* Offline indicator */}
      {!offlineState.isOnline && (
        <div 
          className="safe-area-inset-top"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: '#f59e0b',
            color: 'white',
            padding: '8px',
            textAlign: 'center',
            fontSize: '14px',
            zIndex: 999
          }}
        >
          You're offline. Some features may be limited.
        </div>
      )}

      <main 
        id="main-content" 
        className={`
          ${deviceInfo.isMobile ? 'mobile-container' : 
            deviceInfo.isTablet ? 'tablet-container' : 'desktop-container'}
          ${currentBreakpoint === 'mobile' ? 'mobile-320' : ''}
        `}
      >
        <Suspense fallback={
          <SkeletonScreen 
            type={gameState === 'welcome' ? 'welcome' : 
                  gameState === 'results' ? 'results' : 'question'} 
          />
        }>
          <PageTransition pageKey={gameState} direction="up">
            {gameState === 'welcome' && (
              <WelcomeScreen onStartQuiz={handleStartQuiz} />
            )}
            {gameState === 'quiz' && (
              <div>Quiz Component Coming Soon...</div>
            )}
            {gameState === 'results' && (
              <ResultsScreen 
                onPlayAgain={handlePlayAgain}
                onRetryDifficulty={handleRetryDifficulty}
              />
            )}
          </PageTransition>
        </Suspense>
      </main>

      {/* Accessibility Settings Modal */}
      <AccessibilitySettings
        isOpen={showAccessibilitySettings}
        onClose={() => {
          triggerHapticFeedback.selection();
          setShowAccessibilitySettings(false);
        }}
      />
    </div>
  );
}

export default AppWithStorage;
