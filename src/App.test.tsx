import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn russian heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/learn russian/i);
  expect(headingElement).toBeInTheDocument();
});