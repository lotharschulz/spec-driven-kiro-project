import React from 'react';
import styles from './Container.module.css';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({ children, className = '' }) => (
  <div className={`${styles.container} ${className}`.trim()}>
    {children}
  </div>
);
