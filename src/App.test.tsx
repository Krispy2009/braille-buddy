import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { COURSES } from './courses';
import { dayKey } from './game/progress';
import type { DotEntry } from './game/settings';

// Each test starts as a new player: Tap the cell, English, no progress.
beforeEach(() => localStorage.clear());

const chooseEntry = (dotEntry: DotEntry) =>
  localStorage.setItem(
    'braille-buddy:settings',
    JSON.stringify({ version: 1, dotEntry })
  );

/** Opens Explore from Home, as a player would. */
const renderExplore = async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Explore the cell' }));
  return user;
};

const KEY_LETTERS = ['F', 'D', 'S', 'J', 'K', 'L'];
/** The button that raises a dot: a brailler key, or a dot of the cell. */
const dotButton = (dotEntry: DotEntry, dot: number) =>
  screen.getByRole('button', {
    name: dotEntry === 'keys' ? `Dot ${dot}, key ${KEY_LETTERS[dot - 1]}` : `Dot ${dot}`,
  });

test('Brailler keys mode has the keys and a read-only cell', async () => {
  chooseEntry('keys');
  await renderExplore();
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

test('a new player gets the tappable braille cell', async () => {
  await renderExplore();
  expect(
    screen.getByRole('group', { name: /braille cell/i })
  ).toBeInTheDocument();
  expect(screen.queryByRole('application', { name: 'Brailler keys' })).not.toBeInTheDocument();
  expect(screen.getByRole('application', { name: 'Braille keyboard' })).toBeInTheDocument();
});

describe.each(['keys', 'cell'] as const)('Explore with %s', (dotEntry) => {
  beforeEach(() => chooseEntry(dotEntry));

  test('translates clicked dots to English and Greek letters', async () => {
    const user = await renderExplore();

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
    const user = await renderExplore();

    const dot1 = dotButton(dotEntry, 1);
    expect(dot1).toHaveAttribute('aria-pressed', 'false');
    await user.click(dot1);
    expect(dot1).toHaveAttribute('aria-pressed', 'true');
    await user.click(dot1);
    expect(dot1).toHaveAttribute('aria-pressed', 'false');
  });
});

test('keyboard toggles dots and Escape clears the cell', async () => {
  const user = await renderExplore();

  await user.keyboard('1');
  expect(screen.getByText('a')).toBeInTheDocument();
  expect(screen.getByText('α')).toBeInTheDocument();

  await user.keyboard('{Escape}');
  expect(screen.queryByText('a')).not.toBeInTheDocument();
});

test('Backspace and the clear button reset the cell', async () => {
  const user = await renderExplore();

  await user.keyboard('1');
  expect(screen.getByText('a')).toBeInTheDocument();
  await user.keyboard('{Backspace}');
  expect(screen.queryByText('a')).not.toBeInTheDocument();

  await user.keyboard('1');
  expect(screen.getByText('a')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Clear dots' }));
  expect(screen.queryByText('a')).not.toBeInTheDocument();
});

test('announces the result in a status region', async () => {
  const user = await renderExplore();

  const status = screen.getByRole('status');
  expect(status).toHaveTextContent('Cell is empty.');

  await user.keyboard('145');
  expect(status).toHaveTextContent('Dots 1, 4, 5 raised. d in English. delta in Greek.');

  await user.keyboard('{Backspace}');
  expect(status).toHaveTextContent('Cell is empty.');
});

test('marks the Greek result as Greek text', async () => {
  const user = await renderExplore();

  await user.keyboard('1');
  expect(screen.getByText('α').closest('[lang]')).toHaveAttribute('lang', 'el');
});

test('ignores number keys pressed with a modifier', async () => {
  const user = await renderExplore();

  await user.keyboard('{Control>}1{/Control}');
  expect(dotButton('cell', 1)).toHaveAttribute(
    'aria-pressed',
    'false'
  );
});

test('switches theme from the theme cards in Settings and remembers the choice', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Settings' }));

  const group = screen.getByRole('group', { name: 'Theme' });
  expect(within(group).getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual([
    'light',
    'dark',
    'high-visibility',
  ]);

  await user.click(screen.getByRole('radio', { name: 'Ink' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(localStorage.getItem('theme')).toBe('dark');

  await user.click(screen.getByRole('radio', { name: 'High vis' }));
  expect(document.documentElement.dataset.theme).toBe('high-visibility');
  expect(screen.getByRole('radio', { name: 'High vis' })).toBeChecked();
});

test('announces Greek letters and diphthongs by name', async () => {
  const user = await renderExplore();

  await user.keyboard('146');
  expect(screen.getByRole('status')).toHaveTextContent(
    'Dots 1, 4, 6 raised. No English letter. epsilon iota in Greek.'
  );
  expect(screen.getByText('ει')).toHaveAttribute('aria-hidden', 'true');
  expect(screen.getByText('epsilon iota')).toBeInTheDocument();
});

test('shows one result for every course, in Explore and in the status', async () => {
  const user = await renderExplore();

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
  const user = await renderExplore();

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
  const user = await renderExplore();

  await user.click(dotButton('keys', 1));
  await user.keyboard('{f>}{j>}{k>}{/k}{/j}{/f}');
  expect(screen.getByRole('status')).toHaveTextContent(
    'Dots 1, 4, 5 raised. d in English. delta in Greek.'
  );
  // The chord replaces the cell, as on a brailler.
  expect(dotButton('keys', 1)).toHaveAttribute('aria-pressed', 'true');
});

test('types a whole letter as a chord in the braille keyboard', async () => {
  const user = await renderExplore();

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

describe('Home and the screens it opens', () => {
  const today = () => dayKey(new Date());
  const saveProgress = (data: object) =>
    localStorage.setItem(
      'braille-buddy:progress',
      JSON.stringify({
        version: 1,
        points: 0,
        streak: 0,
        bestStreak: 0,
        lastPlayed: null,
        letters: {},
        completedLessons: {},
        ...data,
      })
    );

  test('a new player sees the deck: the next card, the day, the points and one action', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Braille Buddy' })).toBeInTheDocument();
    expect(screen.getByText('day 0 · 0 pts')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Daily streak 0 days, 0 points')).toBeInTheDocument();
    expect(screen.getByText('English · 0 of 26 letters learnt')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Card 1: a, dot 1.' })).toBeInTheDocument();
    expect(screen.getByText(/new cards to press today/)).toHaveTextContent(
      'Five new cards to press today: a, b, c, d, e.'
    );
    expect(screen.getByRole('button', { name: 'Press new cards' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lessons' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explore the cell' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    // No tab row, no settings and no live region on Home.
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('shows the saved streak and points, and the next lesson after a finished one', () => {
    saveProgress({
      points: 120,
      streak: 4,
      bestStreak: 4,
      lastPlayed: today(),
      completedLessons: { english: ['a-e'] },
      letters: {
        'english:f': { correct: 2, wrong: 0, box: 2 },
        'english:g': { correct: 0, wrong: 1, box: 0 },
      },
    });
    render(<App />);
    expect(screen.getByText('day 4 · 120 pts')).toBeInTheDocument();
    expect(screen.getByText('Daily streak 4 days, 120 points')).toBeInTheDocument();
    expect(screen.getByText('English · 1 of 26 letters learnt')).toBeInTheDocument();
    // f is learnt, so the next card is g, seen once already.
    expect(screen.getByRole('img', { name: 'Card 7: g, dots 1, 2, 4 and 5.' })).toHaveTextContent(
      'practise'
    );
    expect(screen.getByText(/new cards to press today/)).toHaveTextContent(
      'Four new cards to press today: g, h, i, j.'
    );
  });

  test('Press new cards opens the next lesson; the way back passes the lesson list', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Press new cards' }));
    const heading = screen.getByRole('heading', { level: 2, name: 'English: Letters a to e' });
    expect(heading).toHaveFocus();
    expect(screen.getByRole('heading', { level: 3 })).toHaveAccessibleName(
      'Write the letter a in braille'
    );
    // The name stays the page's first heading, out of sight.
    expect(screen.getByRole('heading', { level: 1, name: 'Braille Buddy' })).toHaveClass('sr-only');
    // Points, streak and settings stay off the question screen.
    expect(screen.queryByText(/pts/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Settings' })).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Back to lessons' }));
    expect(screen.getByRole('button', { name: 'Start Letters a to e' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Home' }));
    expect(screen.getByRole('button', { name: 'Lessons' })).toHaveFocus();
    vi.restoreAllMocks();
  });

  test('Lessons opens the lesson list with focus on its heading', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Lessons' }));
    expect(screen.getByRole('heading', { level: 2, name: 'English lessons' })).toHaveFocus();
    expect(screen.getByText('Total points')).toBeInTheDocument();
  });

  test('when every lesson is done, Home offers to mix them all', async () => {
    saveProgress({ completedLessons: { english: ['a-e', 'f-j', 'k-o', 'p-t', 'u-z'] } });
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText(/Every card in English is pressed/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Practise everything' }));
    expect(
      screen.getByRole('heading', { level: 2, name: 'English: Everything so far' })
    ).toHaveFocus();
  });

  test('Greek cards are marked as Greek and named for screen readers', () => {
    localStorage.setItem('braille-buddy:practice-language', 'greek');
    render(<App />);
    expect(screen.getByRole('img', { name: 'Card 1: alpha, dot 1.' })).toBeInTheDocument();
    const today = screen.getByText(/new cards to press today/);
    expect(within(today).getByText('β')).toHaveAttribute('lang', 'el');
    expect(today).toHaveTextContent(/alpha/);
  });

  test('Explore opens with focus on its heading and goes back to Home', async () => {
    const user = await renderExplore();
    expect(screen.getByRole('heading', { level: 2, name: 'Raise dots, see the letter' })).toHaveFocus();
    expect(screen.getAllByRole('status')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Home' }));
    expect(screen.getByRole('button', { name: 'Explore the cell' })).toHaveFocus();
  });

  test('the gear opens Settings and Back returns to it', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Settings' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveFocus();
  });

  test('number keys do nothing on Home', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard('1{Enter}');
    expect(screen.getByRole('button', { name: 'Press new cards' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
