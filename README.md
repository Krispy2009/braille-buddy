# Braille Buddy

> Raise the dots, see the letter. A small, accessible way to learn the braille alphabet in English and Greek.

**[Try it live →](https://braille-buddy.krispytech.workers.dev/)**

## What it does

Two modes:

- **Explore:** a six-dot braille cell you can click or type on. Raise dots and the matching English and Greek letters appear straight away.
- **Practice:** pick a course (English or Greek) and work through its lessons, a handful of letters at a time. Either the game names a letter and you raise its dots, or it shows a cell (and says which dots are raised) and you pick the letter from four choices. Get every letter in a lesson right twice in a row and the next lesson opens. Right answers earn points, playing each day keeps a daily streak, and letters you miss come up more often. No timers, and your progress is saved in your browser.

- **English:** all 26 letters
- **Greek:** the 24 letters, plus 8 common letter pairs (ου, αι, ει, οι, ευ, αυ, υι, ηυ)

## Accessibility

Built to work with a keyboard and a screen reader, not just a mouse:

- **Keyboard:** keys <kbd>1</kbd>–<kbd>6</kbd> toggle the dots, <kbd>Escape</kbd> or <kbd>Backspace</kbd> clears the cell, <kbd>Enter</kbd> checks a practice answer and moves on to the next question
- **Chord typing:** focus the braille keyboard, then hold <kbd>F</kbd> <kbd>D</kbd> <kbd>S</kbd> (dots 1 2 3) and <kbd>J</kbd> <kbd>K</kbd> <kbd>L</kbd> (dots 4 5 6) together, like a Perkins brailler, and let go to write a whole letter. It only listens while focused, so single-letter keys never fire by accident. On touch-only phones it is tucked behind "Typing on a keyboard?"
- **Phones:** works from 320px wide, with large touch targets, and copes with large text
- **Dots are toggle buttons** that expose their pressed state
- **Results are announced** in a status region, and practice moves focus to the next step so you never lose your place. Greek letters are announced by name ("epsilon iota"), so they make sense even when no Greek voice is installed
- **Announcements are worded** so screen readers pause between sentences instead of running them together
- **Three themes:** light, dark and high-visibility. It follows your system's colour scheme and contrast setting, and remembers your choice
- **Greek text is marked up** with its language

Braille Buddy teaches the dot patterns. Reading braille by touch takes practice on real embossed braille.

## Install it and play offline

Braille Buddy can be installed from the browser (Install app, or Add to Home Screen on iOS) and works fully offline once it has been opened online once. A hand-written service worker (`src/pwa/sw.js`), generated at build time with the exact file list, caches each deploy as one version. An update is picked up the next time the app is opened online, and an open page is never reloaded.

## Adding a language

Each language is one file in `src/courses/`: its letters with their dots, an optional spoken name for screen readers, and its lessons. Copy `english.json`, change it, and the new course appears in Explore and Practice with no code changes. `npm test` checks every course file. The sources the current tables were checked against are in [docs/braille-sources.md](docs/braille-sources.md).

## Tech

React 19 · TypeScript · Vite · Vitest and Testing Library · static assets on Cloudflare Workers

## Run it locally

Needs Node 26 (see `.nvmrc`).

```
nvm use
npm install
npm start
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Other commands

- `npm test` runs the tests
- `npm run lint` checks the code with ESLint
- `npm run build` creates a production build in `build/`

## Deploying

The production build in `build/` is served as static assets by Cloudflare Workers (see `wrangler.jsonc`), e.g. `npm run build && npx wrangler deploy`.

## Feedback

Spotted a wrong letter or an accessibility problem? Please open an issue.
