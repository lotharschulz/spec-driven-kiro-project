import React from 'react';
import styles from './Typography.module.css';

type TypographyVariant = 'h1' | 'h2' | 'p';

interface TypographyProps {
  variant?: TypographyVariant;
  children: React.ReactNode;
  className?: string;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'p',
  children,
  className = '',
}) => {
  const Tag = variant as keyof JSX.IntrinsicElements;
  return (
    <Tag className={`${styles.root} ${styles[variant]} ${className}`.trim()}>
      {children}
    </Tag>
  );
};
