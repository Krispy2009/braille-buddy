import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { COURSES } from './courses';
import type { DotEntry } from './game/settings';

// Each test starts as a new player: Tap the cell, English, no progress.
beforeEach(() => localStorage.clear());

const chooseEntry = (dotEntry: DotEntry) =>
  localStorage.setItem(
    'braille-buddy:settings',
    JSON.stringify({ version: 1, dotEntry })
  );

const KEY_LETTERS = ['F', 'D', 'S', 'J', 'K', 'L'];
/** The button that raises a dot: a brailler key, or a dot of the cell. */
const dotButton = (dotEntry: DotEntry, dot: number) =>
  screen.getByRole('button', {
    name: dotEntry === 'keys' ? `Dot ${dot}, key ${KEY_LETTERS[dot - 1]}` : `Dot ${dot}`,
  });

test('Brailler keys mode has the keys and a read-only cell', () => {
  chooseEntry('keys');
  render(<App />);
  expect(
    screen.getByRole('heading', { level: 1, name: 'Braille Buddy' })
  ).toBeInTheDocument();
  const keys = screen.getByRole('application', { name: 'Brailler keys' });
  expect(within(keys).getAllByRole('button')).toHaveLength(6);
  expect(
    screen.queryByRole('group', { name: /braille cell/i })
  ).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Dot 1' })).not.toBeInTheDocument();
  expect(document.querySelector('.cell')).toHaveAttribute('aria-hidden', 'true');
});

test('a new player gets the tappable braille cell', () => {
  render(<App />);
  expect(
    screen.getByRole('group', { name: /braille cell/i })
  ).toBeInTheDocument();
  expect(screen.queryByRole('application', { name: 'Brailler keys' })).not.toBeInTheDocument();
  expect(screen.getByRole('application', { name: 'Braille keyboard' })).toBeInTheDocument();
});

describe.each(['keys', 'cell'] as const)('Explore with %s', (dotEntry) => {
  beforeEach(() => chooseEntry(dotEntry));

  test('translates clicked dots to English and Greek letters', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(dotButton(dotEntry, 1));
    await user.click(dotButton(dotEntry, 4));
    await user.click(dotButton(dotEntry, 5));

    expect(screen.getByText('d')).toBeInTheDocument();
    expect(screen.getByText('δ')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Dots 1, 4, 5 raised. d in English. delta in Greek.'
    );
  });

  test('dots are toggle buttons that expose their pressed state', async () => {
    const user = userEvent.setup();
    render(<App />);

    const dot1 = dotButton(dotEntry, 1);
    expect(dot1).toHaveAttribute('aria-pressed', 'false');
    await user.click(dot1);
    expect(dot1).toHaveAttribute('aria-pressed', 'true');
    await user.click(dot1);
    expect(dot1).toHaveAttribute('aria-pressed', 'false');
  });
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

test('announces the result in a status region', async () => {
  const user = userEvent.setup();
  render(<App />);

  const status = screen.getByRole('status');
  expect(status).toHaveTextContent('Cell is empty.');

  await user.keyboard('145');
  expect(status).toHaveTextContent('Dots 1, 4, 5 raised. d in English. delta in Greek.');

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
  expect(dotButton('cell', 1)).toHaveAttribute(
    'aria-pressed',
    'false'
  );
});

test('switches theme from the theme radios and remembers the choice', async () => {
  const user = userEvent.setup();
  render(<App />);

  const group = screen.getByRole('group', { name: 'Color theme' });
  expect(group).toBeInTheDocument();

  await user.click(screen.getByRole('radio', { name: 'Ink' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(localStorage.getItem('theme')).toBe('dark');

  await user.click(screen.getByRole('radio', { name: 'High vis' }));
  expect(document.documentElement.dataset.theme).toBe('high-visibility');
  expect(screen.getByRole('radio', { name: 'High vis' })).toBeChecked();
});

test('announces Greek letters and diphthongs by name', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.keyboard('146');
  expect(screen.getByRole('status')).toHaveTextContent(
    'Dots 1, 4, 6 raised. No English letter. epsilon iota in Greek.'
  );
  expect(screen.getByText('ει')).toHaveAttribute('aria-hidden', 'true');
  expect(screen.getByText('epsilon iota')).toBeInTheDocument();
});

test('shows one result for every course, in Explore and in the status', async () => {
  const user = userEvent.setup();
  render(<App />);

  const results = screen.getByLabelText('Translation');
  expect(
    within(results).getAllByRole('term').map((term) => term.textContent)
  ).toEqual(COURSES.map((course) => course.name));

  await user.keyboard('1');
  for (const course of COURSES) {
    expect(screen.getByRole('status')).toHaveTextContent(` in ${course.name}.`);
  }
});

test('never ends an announcement sentence on a single letter', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.keyboard('2456');
  const text = screen.getByRole('status').textContent ?? '';
  expect(text).toBe('Dots 2, 4, 5, 6 raised. w in English. No Greek letter.');
  expect(text).not.toMatch(/(^|\s)\S\./);
});

test('footer credits and links to kristi.cy', () => {
  render(<App />);

  const footer = screen.getByRole('contentinfo');
  expect(footer).toHaveTextContent('made with');
  expect(screen.getByRole('link', { name: 'kristi.cy' })).toHaveAttribute(
    'href',
    'https://kristi.cy'
  );
});

test('footer says honestly what the app can and cannot teach', () => {
  render(<App />);
  expect(screen.getByRole('contentinfo')).toHaveTextContent(
    'Reading braille by touch takes practice on real embossed braille.'
  );
});

test('types a whole letter as a chord in the brailler keys', async () => {
  chooseEntry('keys');
  const user = userEvent.setup();
  render(<App />);

  await user.click(dotButton('keys', 1));
  await user.keyboard('{f>}{j>}{k>}{/k}{/j}{/f}');
  expect(screen.getByRole('status')).toHaveTextContent(
    'Dots 1, 4, 5 raised. d in English. delta in Greek.'
  );
  // The chord replaces the cell, as on a brailler.
  expect(dotButton('keys', 1)).toHaveAttribute('aria-pressed', 'true');
});

test('types a whole letter as a chord in the braille keyboard', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('application', { name: 'Braille keyboard' }));
  await user.keyboard('{f>}{j>}{k>}{/k}{/j}{/f}');
  expect(screen.getByRole('status')).toHaveTextContent(
    'Dots 1, 4, 5 raised. d in English. delta in Greek.'
  );
  // Each dot is set once, not toggled by the old key handler as well.
  expect(screen.getByRole('button', { name: 'Dot 1' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

describe('mode tabs', () => {
  test('switch between Explore and Practice', async () => {
    const user = userEvent.setup();
    render(<App />);

    const explore = screen.getByRole('tab', { name: 'Explore' });
    const practice = screen.getByRole('tab', { name: 'Practice' });
    expect(screen.getByRole('tablist', { name: 'Mode' })).toBeInTheDocument();
    expect(explore).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Explore' })).toBeInTheDocument();

    await user.click(practice);
    expect(practice).toHaveAttribute('aria-selected', 'true');
    expect(explore).toHaveAttribute('aria-selected', 'false');
    const panel = screen.getByRole('tabpanel', { name: 'Practice' });
    expect(
      within(panel).getByRole('heading', { level: 2, name: 'English lessons' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('tabpanel', { name: 'Explore' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start Letters a to e' }));
    expect(panel).toHaveTextContent(/write the letter|which letter has/i);
    // Only one live region on the page at a time.
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  test('arrow keys, Home and End move between tabs with one tab stop', async () => {
    const user = userEvent.setup();
    render(<App />);

    const explore = screen.getByRole('tab', { name: 'Explore' });
    const practice = screen.getByRole('tab', { name: 'Practice' });
    const settings = screen.getByRole('tab', { name: 'Settings' });
    expect(explore).toHaveAttribute('tabindex', '0');
    expect(practice).toHaveAttribute('tabindex', '-1');
    expect(settings).toHaveAttribute('tabindex', '-1');

    await user.click(explore);
    await user.keyboard('{ArrowRight}');
    expect(practice).toHaveFocus();
    expect(practice).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowRight}');
    expect(settings).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(explore).toHaveFocus();
    await user.keyboard('{End}');
    expect(settings).toHaveFocus();
    await user.keyboard('{Home}');
    expect(explore).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowLeft}');
    expect(settings).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    await user.tab();
    expect(screen.getByRole('tabpanel', { name: 'Practice' })).toHaveFocus();
  });

  test('Enter on a tab does not answer the practice question', async () => {
    const user = userEvent.setup();
    render(<App />);

    const practice = screen.getByRole('tab', { name: 'Practice' });
    await user.click(practice);
    await user.click(screen.getByRole('button', { name: 'Start Letters a to e' }));
    await user.click(practice);
    await user.keyboard('{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('');
  });
});
