import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('renders the braille cell', () => {
  render(<App />);
  expect(screen.getByText(/braille cell/i)).toBeInTheDocument();
});

test('translates clicked dots to English and Greek letters', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByText('1'));
  await user.click(screen.getByText('4'));
  await user.click(screen.getByText('5'));

  expect(screen.getByText('d')).toBeInTheDocument();
  expect(screen.getByText('δ')).toBeInTheDocument();
});

test('keyboard toggles dots and Escape clears the cell', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.keyboard('1');
  expect(screen.getByText('a')).toBeInTheDocument();
  expect(screen.getByText('α')).toBeInTheDocument();

  await user.keyboard('{Escape}');
  expect(screen.queryByText('a')).not.toBeInTheDocument();
});
