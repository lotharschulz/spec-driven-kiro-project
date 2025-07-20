/**
 * Accessibility Settings Component
 * Provides user controls for accessibility preferences
 * Requirements: 4.5, 4.6, 4.9
 */

import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Typography } from './Typography';
import { VisualAccessibility, type AccessibilityPreferences } from '../utils/accessibility';
import styles from './AccessibilitySettings.module.css';

export interface AccessibilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  isOpen,
  onClose
}) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    reducedMotion: false,
    highContrast: false,
    fontSize: 'normal',
    screenReader: false
  });

  // Load preferences on mount
  useEffect(() => {
    const loadedPreferences = VisualAccessibility.loadPreferences();
    setPreferences(loadedPreferences);
  }, []);

  // Apply preferences when they change
  useEffect(() => {
    VisualAccessibility.applyPreferences(preferences);
  }, [preferences]);

  const handleToggleHighContrast = () => {
    const newValue = !preferences.highContrast;
    setPreferences(prev => ({ ...prev, highContrast: newValue }));
    
    if (newValue) {
      VisualAccessibility.enableHighContrast();
    } else {
      VisualAccessibility.disableHighContrast();
    }
  };

  const handleToggleLargeText = () => {
    const newFontSize = preferences.fontSize === 'large' ? 'normal' : 'large';
    setPreferences(prev => ({ ...prev, fontSize: newFontSize }));
    
    if (newFontSize === 'large') {
      VisualAccessibility.enableLargeText();
    } else {
      VisualAccessibility.disableLargeText();
    }
  };

  const handleToggleReducedMotion = () => {
    const newValue = !preferences.reducedMotion;
    setPreferences(prev => ({ ...prev, reducedMotion: newValue }));
    
    if (newValue) {
      VisualAccessibility.enableReducedMotion();
    } else {
      VisualAccessibility.disableReducedMotion();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-title"
      onKeyDown={handleKeyDown}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <Typography
            variant="h3"
            id="accessibility-title"
            className={styles.title}
          >
            Accessibility Settings
          </Typography>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close accessibility settings"
            className={styles.closeButton}
          >
            ✕
          </Button>
        </header>

        <div className={styles.content}>
          <Typography
            variant="body1"
            className={styles.description}
          >
            Customize your experience with these accessibility options:
          </Typography>

          <div className={styles.settingsGrid}>
            {/* High Contrast */}
            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <Typography
                  variant="h4"
                  className={styles.settingTitle}
                  id="high-contrast-label"
                >
                  High Contrast Mode
                </Typography>
                <Typography
                  variant="body2"
                  color="gray-600"
                  className={styles.settingDescription}
                >
                  Increases contrast for better visibility
                </Typography>
              </div>
              
              <Button
                variant={preferences.highContrast ? 'success' : 'secondary'}
                size="md"
                onClick={handleToggleHighContrast}
                aria-labelledby="high-contrast-label"
                aria-checked={preferences.highContrast}
                role="switch"
              >
                {preferences.highContrast ? 'On' : 'Off'}
              </Button>
            </div>

            {/* Large Text */}
            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <Typography
                  variant="h4"
                  className={styles.settingTitle}
                  id="large-text-label"
                >
                  Large Text
                </Typography>
                <Typography
                  variant="body2"
                  color="gray-600"
                  className={styles.settingDescription}
                >
                  Increases font size for easier reading
                </Typography>
              </div>
              
              <Button
                variant={preferences.fontSize === 'large' ? 'success' : 'secondary'}
                size="md"
                onClick={handleToggleLargeText}
                aria-labelledby="large-text-label"
                aria-checked={preferences.fontSize === 'large'}
                role="switch"
              >
                {preferences.fontSize === 'large' ? 'On' : 'Off'}
              </Button>
            </div>

            {/* Reduced Motion */}
            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <Typography
                  variant="h4"
                  className={styles.settingTitle}
                  id="reduced-motion-label"
                >
                  Reduced Motion
                </Typography>
                <Typography
                  variant="body2"
                  color="gray-600"
                  className={styles.settingDescription}
                >
                  Minimizes animations and transitions
                </Typography>
              </div>
              
              <Button
                variant={preferences.reducedMotion ? 'success' : 'secondary'}
                size="md"
                onClick={handleToggleReducedMotion}
                aria-labelledby="reduced-motion-label"
                aria-checked={preferences.reducedMotion}
                role="switch"
              >
                {preferences.reducedMotion ? 'On' : 'Off'}
              </Button>
            </div>
          </div>

          {/* Keyboard Navigation Help */}
          <div className={styles.helpSection}>
            <Typography
              variant="h4"
              className={styles.helpTitle}
            >
              Keyboard Navigation
            </Typography>
            
            <ul className={styles.helpList}>
              <li>
                <Typography variant="body2">
                  <strong>Tab:</strong> Navigate between interactive elements
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Enter/Space:</strong> Activate buttons and select answers
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Arrow Keys:</strong> Navigate between answer options
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Escape:</strong> Close dialogs and return to previous screen
                </Typography>
              </li>
            </ul>
          </div>
        </div>

        <footer className={styles.footer}>
          <Button
            variant="primary"
            size="lg"
            onClick={onClose}
            fullWidth
          >
            Save Settings
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default AccessibilitySettings;