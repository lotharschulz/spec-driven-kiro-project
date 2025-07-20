/**
 * Example Component - Demonstrates the Design System
 * Shows how to use the core UI components together
 */

import React from 'react';
import { Button, Card, Typography } from './index';
import styles from './Example.module.css';

export const Example: React.FC = () => {
  return (
    <div className={styles.container}>
      <Typography variant="h1" color="forest-dark" align="center" gutterBottom>
        🦎 Weird Animal Quiz
      </Typography>
      
      <Typography variant="body1" color="gray-600" align="center" gutterBottom>
        Test your knowledge of the most bizarre creatures on Earth!
      </Typography>

      <div className={styles.grid}>
        <Card variant="elevated" padding="lg" interactive>
          <Typography variant="h3" color="forest-medium" gutterBottom>
            🌿 Easy Level
          </Typography>
          <Typography variant="body2" color="gray-600" gutterBottom>
            Perfect for beginners who love nature documentaries
          </Typography>
          <Button variant="success" size="lg" fullWidth>
            Start Easy Quiz
          </Button>
        </Card>

        <Card variant="outlined" padding="lg" interactive>
          <Typography variant="h3" color="sunset-medium" gutterBottom>
            🔥 Medium Level
          </Typography>
          <Typography variant="body2" color="gray-600" gutterBottom>
            For those who think they know their animal facts
          </Typography>
          <Button variant="warning" size="lg" fullWidth>
            Try Medium Quiz
          </Button>
        </Card>

        <Card variant="default" padding="lg" interactive>
          <Typography variant="h3" color="error" gutterBottom>
            💀 Hard Level
          </Typography>
          <Typography variant="body2" color="gray-600" gutterBottom>
            Only for true animal behavior experts
          </Typography>
          <Button variant="error" size="lg" fullWidth>
            Challenge Yourself
          </Button>
        </Card>
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" size="md" leftIcon={<span>📊</span>}>
          View Stats
        </Button>
        <Button variant="ghost" size="md" rightIcon={<span>⚙️</span>}>
          Settings
        </Button>
      </div>

      <Card variant="flat" padding="md">
        <Typography variant="overline" color="gray-500" gutterBottom>
          Features
        </Typography>
        <ul className={styles.featureList}>
          <li>
            <Typography variant="body2" color="gray-700">
              🎯 Touch-friendly design with 44px minimum targets
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="gray-700">
              🌈 Nature-inspired color palette with WCAG AA compliance
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="gray-700">
              📱 Mobile-first responsive design
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="gray-700">
              ♿ Full accessibility support with screen readers
            </Typography>
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default Example;