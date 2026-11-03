# Braille Buddy

> Raise the dots, see the letter. A small, accessible way to learn the braille alphabet in English and Greek.

**[Try it live →](https://braille-buddy.krispy2009.workers.dev/)**

## What it does

A six-dot braille cell you can click or type on. Raise dots and the matching English and Greek letters appear straight away.

- **English:** all 26 letters
- **Greek:** the 24 letters, plus 8 common letter pairs (ου, αι, ει, οι, ευ, αυ, υι, ηυ)

## Accessibility

Built to work with a keyboard and a screen reader, not just a mouse:

- **Keyboard:** keys <kbd>1</kbd>–<kbd>6</kbd> toggle the dots, <kbd>Escape</kbd> or <kbd>Backspace</kbd> clears the cell
- **Dots are toggle buttons** that expose their pressed state
- **Results are announced** in a status region. Greek letters are announced by name ("epsilon iota"), so they make sense even when no Greek voice is installed
- **Announcements are worded** so screen readers pause between sentences instead of running them together
- **Three themes:** light, dark and high-visibility. It follows your system's colour scheme and contrast setting, and remembers your choice
- **Greek text is marked up** with its language

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
