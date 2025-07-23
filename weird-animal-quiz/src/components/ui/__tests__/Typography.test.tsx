import React from 'react';
import { render, screen } from '@testing-library/react';
import { Typography } from '../Typography';

describe('Typography', () => {
  it('renders as h1, h2, and p', () => {
    render(
      <>
        <Typography variant="h1">Heading 1</Typography>
        <Typography variant="h2">Heading 2</Typography>
        <Typography>Paragraph</Typography>
      </>
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Heading 1');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Heading 2');
    expect(screen.getByText('Paragraph')).toBeInTheDocument();
  });
});
