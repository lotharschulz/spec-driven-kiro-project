import React from 'react';
import { render, screen } from '@testing-library/react';
import { Container } from '../Container';

describe('Container', () => {
  it('renders children', () => {
    render(
      <Container>
        <div data-testid="child">Child</div>
      </Container>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
