# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three groups, none ranked above the others:

- **Sighted family and friends** of someone blind (parents, partners, siblings, friends) who want to learn the braille code so they can read and write it with that person.
- **Curious self-learners** who want a free, casual daily habit, the way people use a language-learning app.
- **Blind and low-vision learners**, including people losing their sight, who use a screen reader or magnification to learn the code before or alongside practice on real embossed braille.

**Children use it too.** Kids (for example the siblings or classmates of a blind child) must be able to use it on their own, not only with an adult.

The Greek course is meant mainly for learners in **Greece and Cyprus**.

## Product Purpose

Braille Buddy teaches the dot patterns of the braille alphabet in English and Greek: which dots make which letter, number or punctuation mark. It does **not** teach reading by touch, and it says so plainly (issue #27): on Home until a first lesson is done, and always on the Accessibility page. Learning to read by touch needs real embossed braille, ideally with a braille teacher or a local blindness organisation.

Success means a learner comes back day after day, works through a course a few letters at a time, and can recognise and write every letter's dots.

## Positioning

Neighbouring products are Braillito (paid, phone-first, tap the dots, 38 languages) and Braille Wordle (a daily English five-letter puzzle). Braille Buddy stands apart on:

- **Free.** Paid for by subtle, accessible ads (#62), with an optional ad-free Buddy Plus (#63). Never a paywall on learning.
- **Brailler-key typing.** Six-key chord entry on F D S / J K L, like a Perkins brailler, alongside tapping dots.
- **Greek done properly.** All 24 letters plus the 8 single-cell letter pairs, checked against sources (see `docs/braille-sources.md`).
- **Web and keyboard first**, installable and fully offline.
- **Accessibility that is tested with blind players and published** (#54), not just claimed.

## Operating Context

- Played in the browser on phones (from 320px wide) and computers, or installed as an app; works offline after the first visit.
- Input by mouse, touch, keyboard keys 1–6, or six-key chords; used with screen readers, voice control, large text and high contrast.
- Short daily sessions: Home shows the next card, the daily streak and points. Sections are Explore (a free six-dot cell), Cards (the whole deck), Lessons (the course path), and a daily braille puzzle ("Braille of the day").
- No account needed. Optional sign-in by emailed 6-digit code syncs progress through Supabase; settings, theme and course stay on each device.

## Capabilities and Constraints

- Courses are data files in `src/courses/` (English: 26 letters; Greek: 24 letters + ου, αι, ει, οι, ευ, αυ, υι, ηυ; plus numbers and punctuation). A new language is one JSON file, no code changes.
- Lessons: two question types (name a letter and raise its dots; see a cell and pick from four letters). Every letter right twice (a miss never takes a right answer away) unlocks the next lesson. Points, a daily streak, missed letters come back more often. **No timers.**
- Progress is local-first in localStorage; account sync merges it (`src/account/merge.ts`).
- Settings: tap one big cell or use six brailler keys; three themes (Paper, Ink, High vis) that follow the system colour scheme and contrast until chosen; key letters, less motion and bigger text switches; keyboard shortcuts can be turned off (WCAG 2.1.4).
- Stack: React 19, TypeScript, Vite, styled-components, Vitest; static assets on Cloudflare Workers; hand-written service worker.
- **The interface is English only for now**, even for the Greek course; translating it (#34) is undecided. Greek text is marked up with its language.
- **Decided:** free, funded by ads plus an optional Buddy Plus. Cookie consent (#59) comes before any analytics or ads.
- **Open:** teacher features such as shareable lesson links (#55), contracted braille (grade 2, #58), a server-checked leaderboard (#43), sound effects (#42).

## Brand Commitments

- Name: **Braille Buddy**. Tagline in use: "Raise the dots, see the letter."
- Voice: plain, friendly and honest. Short sentences, no hype. It states limits openly (teaches dot patterns, not touch reading; the accessibility page marks untested screen readers "Not tested yet").

## Evidence on Hand

- Braille source check for every letter, pair, number and punctuation mark: `docs/braille-sources.md`. Confidence is "matches secondary sources, independently consistent"; the Greek chapter of World Braille Usage has not been read, and ηυ's teaching status is still to be checked with KEAT or the Cyprus School for the Blind.
- Accessibility page content (including what the app teaches): `src/components/Accessibility/content.ts`. Goal WCAG 2.2 AA, **not independently audited**, screen reader test table all "Not tested yet".
- **None yet:** user testimonials, player numbers, test results with blind players, teacher or organisation endorsements. Do not invent them.

## Product Principles

1. **Honest about what it teaches.** Dot patterns, not touch reading; never overclaim braille skill or accessibility.
2. **Accessible to everyone in the room.** A blind learner on a screen reader, a sighted parent on a phone, and a child on their own each get a complete experience; none is the "alternative" mode.
3. **Calm practice, not pressure.** No timers, gentle repetition, streaks and points that reward coming back rather than speed.
4. **Free to learn.** Money never gates learning; ads stay subtle and accessible.
5. **Correct braille first.** Every cell is sourced; doubt is written down, not hidden.

## Accessibility & Inclusion

- Target: **WCAG 2.2 AA**. Not yet audited; real screen reader testing with blind players is a goal (#54).
- Full keyboard and screen reader support: dots are toggle buttons with pressed state, results announced in a status region, focus moves to the next step, Greek letters announced by name.
- Respect system colour scheme, contrast and reduced motion settings; bigger text option; works at 320px and with large text; large touch targets.
- Children use it independently, so wording stays simple and instructions short.
