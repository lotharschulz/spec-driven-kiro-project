import React from 'react';
import { QuizContainer } from './components/QuizContainer';

const App: React.FC = () => {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 16 }}>
      <h1 style={{ textAlign: 'center', color: '#2D5016' }}>Weird Animal Quiz</h1>
      <QuizContainer />
    </div>
  );
};

export default App;
