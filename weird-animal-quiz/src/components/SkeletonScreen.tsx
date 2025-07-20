import React from 'react';
import styles from './SkeletonScreen.module.css';

export interface SkeletonScreenProps {
  /** Type of skeleton to display */
  type?: 'question' | 'results' | 'welcome' | 'generic';
  /** Custom className */
  className?: string;
}

/**
 * Skeleton screen component for loading states
 * Provides visual placeholder while content loads
 */
const SkeletonScreen: React.FC<SkeletonScreenProps> = ({
  type = 'generic',
  className = ''
}) => {
  const containerClasses = [
    styles.skeleton,
    styles[type],
    className
  ].filter(Boolean).join(' ');

  const renderQuestionSkeleton = () => (
    <div className={styles.questionSkeleton}>
      <div className={styles.header}>
        <div className={styles.skeletonLine} style={{ width: '30%' }}></div>
        <div className={styles.skeletonCircle}></div>
      </div>
      <div className={styles.content}>
        <div className={styles.skeletonLine} style={{ width: '90%' }}></div>
        <div className={styles.skeletonLine} style={{ width: '75%' }}></div>
      </div>
      <div className={styles.answers}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={styles.skeletonButton}></div>
        ))}
      </div>
    </div>
  );

  const renderResultsSkeleton = () => (
    <div className={styles.resultsSkeleton}>
      <div className={styles.skeletonLine} style={{ width: '60%', height: '2rem' }}></div>
      <div className={styles.scoreSection}>
        <div className={styles.skeletonCircle} style={{ width: '80px', height: '80px' }}></div>
        <div className={styles.skeletonLine} style={{ width: '40%' }}></div>
      </div>
      <div className={styles.breakdown}>
        {[1, 2, 3].map(i => (
          <div key={i} className={styles.skeletonLine} style={{ width: '70%' }}></div>
        ))}
      </div>
    </div>
  );

  const renderWelcomeSkeleton = () => (
    <div className={styles.welcomeSkeleton}>
      <div className={styles.hero}>
        <div className={styles.skeletonLine} style={{ width: '80%', height: '3rem' }}></div>
        <div className={styles.skeletonLine} style={{ width: '60%' }}></div>
      </div>
      <div className={styles.features}>
        {[1, 2, 3].map(i => (
          <div key={i} className={styles.featureItem}>
            <div className={styles.skeletonCircle}></div>
            <div className={styles.skeletonLine} style={{ width: '80%' }}></div>
          </div>
        ))}
      </div>
      <div className={styles.skeletonButton} style={{ width: '200px', height: '48px' }}></div>
    </div>
  );

  const renderGenericSkeleton = () => (
    <div className={styles.genericSkeleton}>
      <div className={styles.skeletonLine} style={{ width: '70%', height: '1.5rem' }}></div>
      <div className={styles.skeletonLine} style={{ width: '90%' }}></div>
      <div className={styles.skeletonLine} style={{ width: '60%' }}></div>
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'question':
        return renderQuestionSkeleton();
      case 'results':
        return renderResultsSkeleton();
      case 'welcome':
        return renderWelcomeSkeleton();
      default:
        return renderGenericSkeleton();
    }
  };

  return (
    <div className={containerClasses} aria-label="Loading content">
      {renderSkeleton()}
    </div>
  );
};

export default SkeletonScreen;