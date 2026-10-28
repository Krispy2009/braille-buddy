import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('renders the braille cell', () => {
  render(<App />);
  expect(
    screen.getByRole('heading', { level: 1, name: 'Braille Buddy' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('group', { name: /braille cell/i })
  ).toBeInTheDocument();
});

test('translates clicked dots to English and Greek letters', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: 'Dot 1' }));
  await user.click(screen.getByRole('button', { name: 'Dot 4' }));
  await user.click(screen.getByRole('button', { name: 'Dot 5' }));

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

test('Backspace and the clear button reset the cell', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.keyboard('1');
  expect(screen.getByText('a')).toBeInTheDocument();
  await user.keyboard('{Backspace}');
  expect(screen.queryByText('a')).not.toBeInTheDocument();

  await user.keyboard('1');
  expect(screen.getByText('a')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Clear' }));
  expect(screen.queryByText('a')).not.toBeInTheDocument();
});

test('dots are toggle buttons that expose their pressed state', async () => {
  const user = userEvent.setup();
  render(<App />);

  const dot1 = screen.getByRole('button', { name: 'Dot 1' });
  expect(dot1).toHaveAttribute('aria-pressed', 'false');
  await user.click(dot1);
  expect(dot1).toHaveAttribute('aria-pressed', 'true');
});

test('announces the result in a status region', async () => {
  const user = userEvent.setup();
  render(<App />);

  const status = screen.getByRole('status');
  expect(status).toHaveTextContent('Cell is empty.');

  await user.keyboard('145');
  expect(status).toHaveTextContent('Dots 1, 4, 5 raised. English: d. Greek: delta.');

  await user.keyboard('{Backspace}');
  expect(status).toHaveTextContent('Cell is empty.');
});

test('marks the Greek result as Greek text', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.keyboard('1');
  expect(screen.getByText('α').closest('[lang]')).toHaveAttribute('lang', 'el');
});

test('ignores number keys pressed with a modifier', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.keyboard('{Control>}1{/Control}');
  expect(screen.getByRole('button', { name: 'Dot 1' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
});

test('switches theme from the theme radios and remembers the choice', async () => {
  const user = userEvent.setup();
  render(<App />);

  const group = screen.getByRole('group', { name: 'Color theme' });
  expect(group).toBeInTheDocument();

  await user.click(screen.getByRole('radio', { name: 'Dark' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(localStorage.getItem('theme')).toBe('dark');

  await user.click(screen.getByRole('radio', { name: 'High visibility' }));
  expect(document.documentElement.dataset.theme).toBe('high-visibility');
  expect(screen.getByRole('radio', { name: 'High visibility' })).toBeChecked();
});

test('announces Greek letters and diphthongs by name', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.keyboard('146');
  expect(screen.getByRole('status')).toHaveTextContent(
    'Dots 1, 4, 6 raised. English: no letter. Greek: epsilon iota.'
  );
  expect(screen.getByText('ει')).toHaveAttribute('aria-hidden', 'true');
  expect(screen.getByText('epsilon iota')).toBeInTheDocument();
});
