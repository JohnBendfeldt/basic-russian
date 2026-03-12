import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  test('renders Basic Russian heading', () => {
    render(<App />);
    const headingElement = screen.getByRole('heading', { name: /basic russian/i, level: 1 });
    expect(headingElement).toBeInTheDocument();
  });
});
