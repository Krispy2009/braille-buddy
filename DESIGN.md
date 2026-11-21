---
name: Braille Buddy
description: Raise the dots, see the letter. The Press look: paper, ink and raised orange dots.
colors:
  raised-dot-orange: "#ff5a1f"
  press-paper: "#eceae4"
  ink: "#1a1a1a"
  pencil-grey: "#5a5650"
  key-edge-grey: "#a8a49a"
  paper-highlight: "#ffffff"
  paper-shade: "rgba(0, 0, 0, 0.18)"
  ink-theme-orange: "#ff7a45"
  ink-theme-night: "#17171a"
  ink-theme-surface: "#1f1f23"
  ink-theme-key: "#2a2a2e"
  ink-theme-pencil: "#a9a49a"
  brailler-black: "#000000"
  signage-yellow: "#ffd60a"
typography:
  display:
    fontFamily: "Commissioner, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(2.25rem, 11vw, 2.875rem)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  card-letter:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "6.5rem"
    fontWeight: 900
    lineHeight: 0.8
  card-letter-long:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "4rem"
    fontWeight: 900
    lineHeight: 0.8
  result-letter:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 900
    lineHeight: 1.1
  display-wide:
    fontFamily: "Commissioner, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  display-widest:
    fontFamily: "Commissioner, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "4.5rem"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  finish-letter:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 900
    lineHeight: 1
  finish-letter-wide:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 900
    lineHeight: 1
  stamp-done:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 900
    textTransform: "uppercase"
  headline:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  task:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  step:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 900
    lineHeight: 1.15
  section:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 900
  title:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 900
  option:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 900
  button:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 900
  body:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.4
  hint:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.3
  wordmark:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 900
    letterSpacing: "0.08em"
  label:
    fontFamily: "Fira Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  stat:
    fontFamily: "Fira Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 700
  code:
    fontFamily: "Fira Mono, ui-monospace, monospace"
    fontSize: "1.625rem"
    fontWeight: 700
  key-letter:
    fontFamily: "Fira Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
  dot-numeral-small:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 900
rounded:
  sliver: "3px"
  stamp: "0.375rem"
  tile: "0.5rem"
  chip: "0.6rem"
  small-plate: "0.75rem"
  key: "0.875rem"
  control: "1rem"
  card: "1.25rem"
  base: "1.75rem"
  plate: "1.875rem"
  pill: "999px"
  dot: "50%"
spacing:
  gap-sm: "0.625rem"
  gap-md: "0.875rem"
  gap-lg: "1rem"
  gutter: "1.375rem"
  gutter-wide: "2rem"
  page: "30rem"
  page-medium: "44rem"
  page-measure: "46rem"
  page-wide: "72rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.press-paper}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1.25rem"
    height: "3.75rem"
  button-key:
    backgroundColor: "{colors.press-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.key}"
    padding: "0.5rem 1.25rem"
    height: "3.5rem"
  button-outline:
    backgroundColor: "transparent"
    rounded: "{rounded.key}"
    padding: "0.25rem 1rem"
    height: "3.5rem"
  button-quiet:
    backgroundColor: "transparent"
    padding: "0 1rem"
    height: "2.75rem"
  button-round:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.dot}"
    size: "2.75rem"
  dot-raised:
    backgroundColor: "{colors.raised-dot-orange}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dot}"
    size: "clamp(44px, 21vw, 5.125rem)"
  dot-flat:
    backgroundColor: "{colors.press-paper}"
    textColor: "{colors.pencil-grey}"
    rounded: "{rounded.dot}"
    size: "clamp(44px, 21vw, 5.125rem)"
  cell-plate:
    backgroundColor: "{colors.press-paper}"
    rounded: "{rounded.plate}"
  brailler-key:
    backgroundColor: "{colors.press-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.key}"
    width: "clamp(44px, 13.4vw, 3.25rem)"
    height: "4.625rem"
  brailler-key-pressed:
    backgroundColor: "{colors.raised-dot-orange}"
    textColor: "{colors.ink}"
  letter-card:
    backgroundColor: "{colors.raised-dot-orange}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "1.125rem 1.25rem"
  choice:
    backgroundColor: "{colors.press-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.key}"
    height: "4.5rem"
  choice-right:
    backgroundColor: "{colors.raised-dot-orange}"
    textColor: "{colors.ink}"
  choice-wrong:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
  progress-track:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
  sheet-right:
    backgroundColor: "{colors.press-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.base}"
  sheet-wrong:
    backgroundColor: "{colors.press-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.base}"
  finish-card:
    backgroundColor: "{colors.raised-dot-orange}"
    textColor: "{colors.ink}"
    rounded: "{rounded.key}"
    width: "5rem"
  option-card:
    rounded: "{rounded.control}"
    padding: "0.875rem 1rem"
  option-card-selected:
    backgroundColor: "{colors.raised-dot-orange}"
    textColor: "{colors.ink}"
  input:
    backgroundColor: "{colors.press-paper}"
    rounded: "{rounded.control}"
    padding: "0 1rem"
    height: "3.5rem"
  brailler-base:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.press-paper}"
    rounded: "{rounded.base}"
---

# Design System: Braille Buddy

## Overview

**Creative North Star: "The Press"**

Every screen is a sheet of paper with something pressed into it or out of it. The six-dot cell is a plate embossed out of the page. A raised dot stands up from it in orange with a hard ink shadow. A flat dot is a dimple pressed in, with a dashed rim. At the bottom sits a black brailler base, modelled on a Perkins brailler, whose keys physically sink when pressed. Type is bold ink and lines are ink. The only colour is the orange of things that are raised, pressed or right.

The feel is **chunky and friendly**. Targets are big and rounded so a child can't miss them, weight comes first and mechanics second. The screen is calm and uncluttered: one centred column on a phone, one solid action at the bottom, no timers. The depth is real and readable, never ornament. Each state difference shows up in shape, rim, depth and colour together, so it holds for colour-blind players, in forced colours and in the flat High vis theme.

Three themes share one structure. **Paper** is warm grey paper and ink. **Ink** is a night version, with the brailler base a shade darker than the page. **High vis** is black on signage yellow, like tactile signage: flat, no soft shadows, thicker lines. The look must never drift toward a generic gamified app (gems, confetti, mascots, loud gradients), clinical or medical styling (pale blue, sterile portal forms), or soft neumorphism (grey on grey with soft shadows only and no ink lines).

**Key Characteristics:**
- One accent, Raised-Dot Orange, that always means raised, pressed, chosen or right.
- Ink outlines on everything (2px; 3px in High vis).
- Soft embossed shadows for surfaces you press into; hard offset ink shadows for things that are raised.
- A black brailler base anchors the bottom of the screen.
- Commissioner at 900 for anything you act on or read at a glance, Fira Mono for small typed labels.
- No state carried by colour alone.

## Colors

A warm paper-and-ink palette with one orange accent. Every colour is defined only in `src/theme/tokens.css` and used through its custom property (`--bg`, `--text`, `--accent` …), never as a raw value in a component.

### Primary
- **Raised-Dot Orange** (`--accent`): raised dots, pressed brailler keys, the front letter card, the next open lesson, the selected option, a right answer, the signed-in account button. Ink uses the lighter Ink-theme orange so it stays readable on the night page. Text on it is ink (`--on-accent`), never white.

### Neutral
- **Press Paper** (`--bg`, `--surface`, `--key`): the page, the cell plate and the brailler keys, all one material in Paper.
- **Ink** (`--text`, `--line`, `--base`): all type, every outline, hard shadows and the brailler base.
- **Pencil Grey** (`--text-soft`): eyebrows, hints, flat dot numbers, locked lessons. Never for anything the player must act on.
- **Key-Edge Grey** (`--key-edge`): the inset lower edge that gives a brailler key its height.
- **Paper Highlight / Paper Shade** (`--hi`, `--shade`): the light and dark halves of the soft embossed shadows. Both are transparent in High vis.
- **Ink theme**: Ink-theme night page, raised Ink-theme surface for plates, Ink-theme key grey, and Brailler Black for the base, which gets a 2px key-coloured top edge because it's barely darker than the page.
- **Signage Yellow** (High vis `--bg`): the whole page, with black for text, lines, accent and base, and yellow on black for the accent's text.

### Named Rules
**The One Meaning Rule.** Orange means raised, pressed, chosen or right, and nothing else. Don't use it for decoration, links, warnings or headings.

**The Tokens Only Rule.** Components reference the theme custom properties. A new colour goes into all three theme blocks in `tokens.css` first, or it doesn't ship.

**The Ink on Orange Rule.** Text on Raised-Dot Orange is always ink (`--on-accent`). White on orange fails contrast.

## Typography

**Display Font:** Commissioner (with system-ui, -apple-system, Segoe UI, Roboto, sans-serif)
**Label/Mono Font:** Fira Mono (with ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)

**Character:** Commissioner at heavy weights gives friendly, sturdy letterforms with full Greek support. Fira Mono reads like small text typed on a brailler label. Both are self-hosted, so the app looks the same offline, in only the Latin and Greek subsets and at only weights 500, 700 and 900.

### Hierarchy
- **Display** (900, clamp 2.25–2.875rem, line-height 0.95, -0.03em): the Home headline. Sized so "Every letter." fits a 320px phone on one line. Steps up to **Display Wide** (3.5rem) from 48rem and **Display Widest** (4.5rem) from 64rem.
- **Card Letter** (900, 6.5rem, line-height 0.8): the letter on a letter card. **Card Letter Long** (4rem) for long signs.
- **Result Letter** (900, 2.5rem, 1.1): a single letter shown as an answer: the Board result, answer choices from 48rem wide.
- **Finish Letter** (900, 2.75rem, 1; 3.5rem from 48rem): the letter on a finished lesson's dealt cards. **Stamp Done** (900, 1.75rem, uppercase): the big "LESSON DONE" stamp.
- **Headline** (900, 2rem, 1.1, -0.02em): screen titles in the frame. 2.25rem from 48rem wide.
- **Task** (900, 1.875rem, 1.1, -0.02em): the question or instruction in hand. 2.25rem from 48rem wide.
- **Step** (900, 1.5rem, 1.15): a step heading in the account flow, and the dot numbers on a full cell and on brailler keys.
- **Section** (900, 1.25rem): section headings inside a screen: Settings legends, page subheadings, dialog titles, the stamp, a lesson's letters.
- **Title** (900, 1.125rem): lesson titles.
- **Option** (900, 1.0625rem): option names, feedback lines, the Daily answer.
- **Button** (900, 1.1875rem): the primary action; secondary buttons use 700 at 1–1.125rem.
- **Body** (500, 1rem, 1.4): running text and feedback.
- **Hint** (500, 0.9375rem, 1.3): hints and notes in Pencil Grey, table text, theme names (at 700).
- **Wordmark** (900, 1rem, 0.08em, uppercase): "BRAILLE BUDDY" on Home, written normally in the markup so screen readers say the name.
- **Label** (Fira Mono 500, 0.875rem): the eyebrow above a task.
- **Stat** (Fira Mono 700, 0.8125rem): streak and points, lesson state, card corners.
- **Code** (Fira Mono 700, 1.625rem): the emailed sign-in code, with wide letter spacing.
- **Key Letter** (Fira Mono 700, 0.75rem): the chord letter on a brailler key and other tiny marks; dot numbers on small cells use the same size in Commissioner 900. **Dot Numeral Small** (900, 0.625rem): the dot numbers in the tiny lookup cells in Daily.

Text wraps `pretty` (paragraphs, list items, headings), so no line ends on one lonely word.

### Named Rules
**The Two Weights Rule.** Text is either 500 (reading) or 900 (acting and glancing). 700 is reserved for secondary buttons, stats and keyboard keys.

**The Typed Label Rule.** Mono only for small context: eyebrows, counts, dot numbers on keys, codes. Never for headings or body.

**The Rem Rule.** Sizes are in rem, so the Bigger text setting (125% on the root) scales everything, including page widths.

## Layout

A single centred column on a phone (`--page`, 30rem), with a 1.375rem gutter, filling the window height up to 56rem so the bottom action is never a screen away from what it belongs to. On Home the brailler base sticks to the bottom of the window until the page reaches it, so its one action is always in the first screen (its line reads "N new cards to learn today" until the player has played today, then "N new cards up next"); on short windows (under 700px) it drops its key row, and focus scrolls clear of it. Each screen runs top to bottom. First the **frame**: the way out (a round button) on the left, then progress. The way out returns to where the screen was opened from: a lesson started on Home closes to Home, one started from the list closes to the list. The way out is labelled "Close lesson"; the finished lesson's "Back to lessons" always goes to the list. Next a **prompt**: a mono eyebrow, then the task in heavy type. Then the content: a cell, choices or a card. Last the **action** at the bottom, which is one primary button, the brailler base, or a feedback sheet that bleeds to the column edges with rounded top corners.

Breakpoints are **container queries on `#root`** in rem, not media queries on the window, so Bigger text needs a wider window before a screen splits. From 48rem the gutter grows to 2rem and tasks get bigger. Screens with a task in hand stay a single, roomier column. Home and Lessons spread out at 48rem and 64rem (`--page-medium` 44rem, `--page-measure` 46rem for reading pages, `--page-wide` 72rem). DOM order never changes, so reading and Tab order match what's on screen.

Everything works from 320px wide. Cells and their dots shrink with the viewport, but a tappable dot or key never goes below 44px. A row of cells (a word, a number sign and digit) always stays on one line and scales down together.

## Elevation & Depth

Two kinds of depth with two meanings. **Soft embossing** is the plate: paired light and dark blurred shadows (`--hi` and `--shade`) make a surface you press into or that's pressed out of the page. The cell plate, flat dot dimples, answer choices and text inputs use it. **Hard offset ink shadows** mean raised: a solid unblurred shadow in `--line` stands under raised dots, letter cards, the selected option, the open lesson, a right answer and letter chips. Pressing moves the thing toward its shadow (translate 2–3px), and a pressed brailler key drops its shadow and sinks 5px. High vis is flat: both shadow kinds disappear and raised dots stand out by solid fill and solid rim alone.

### Shadow Vocabulary
- **Plate emboss** (`box-shadow: -8px -8px 16px var(--hi), 8px 8px 18px var(--shade)`): the full-size cell plate.
- **Choice emboss** (`box-shadow: -3px -3px 6px var(--hi), 3px 3px 6px var(--shade)`): unanswered answer choices and the Daily puzzle card (a container, so never a hard shadow).
- **Dimple** (`box-shadow: inset 4px 4px 8px var(--shade), inset -4px -4px 8px var(--hi)`): a flat dot pressed into the plate; text inputs use a 2px version.
- **Raised dot** (`box-shadow: 4px 5px 0 var(--line)`): a raised dot; 3px 4px on medium cells, 2px 2px on small.
- **Lifted card** (`box-shadow: 8px 10px 0 var(--line)`): the front letter card and flash cards.
- **Lifted control** (`box-shadow: 4px 4px 0 var(--line)` to `4px 5px 0`): the selected option, the open lesson; 3px 3px on letter chips and right choices.
- **Key height** (`box-shadow: inset -3px -4px 0 var(--key-edge), 0 5px 0 var(--key-edge)`): a brailler key at rest.
- **Primary lip** (`box-shadow: 0 5px 0 var(--accent)`): the orange lip under the primary button; 2px when pressed.
- **Sheet** (`box-shadow: 0 -8px 18px var(--shade)`): the feedback sheet rising from the bottom.

### Named Rules
**The Soft Is the Plate, Hard Is Raised Rule.** Blurred paired shadows only for surfaces you press into; a hard ink shadow only for something raised, chosen or right. Never blur a raised thing's shadow or harden a plate's.

**The Flat High Vis Rule.** In High vis, `--hi` and `--shade` are transparent and hard shadows are removed. Every state must still read from fill, rim and line weight alone.

## Shapes

Generously rounded, chunky forms with ink outlines. Radii grow with the object: 3px on the slivers inside the little Settings pictures, a 0.375rem rubber stamp and keyboard keys, 0.5rem tiles (theme preview screens, small key pictures), 0.6rem letter chips, 0.75rem small cell plates and chord-pad rows, 0.875rem keys and choices, 1rem buttons and option cards (`--radius`), 1.25rem letter cards, 1.75rem top corners on the brailler base and feedback sheet, 1.875rem on the full cell plate. Dots, round buttons and the account button are circles, and the progress track (when a lesson is too long for pips) is a pill. Every interactive shape carries a `--line-width` ink border (2px, 3px in High vis).

Rims carry meaning. **Solid** is raised or available, **dashed** is flat, locked or invalid. A flat dot has a dashed rim, a locked lesson a dashed border, an invalid input a thicker dashed edge, a wrong answer's sheet, choice and stamp a dashed rim. The letter cards on Home are fanned at 8° and −5° behind the front card, and a finished lesson's cards land within ±6°. The result stamp is rotated −4°, like a rubber stamp. Those are the only rotations.

## Components

### Buttons
Chunky and friendly: one solid action per screen, everything else quieter.
- **Primary:** an ink slab with Paper text (on the page), 3.75rem tall, full width at the bottom of the screen, 1rem radius, sitting on a 5px orange lip. On press it sinks 3px and the lip shrinks to 2px (90ms ease).
- **Key button:** the same action on the black base, styled as a big brailler key: key-coloured, 3.5rem tall, 0.875rem radius, inset key edge, sinks 3px on press.
- **Outline:** a 3.5rem bordered button in the current colour for a second choice, such as Lessons on the base.
- **Quiet:** underlined text (2px, 4px offset), 2.75rem tall, for anything else.
- **Round:** a 2.75rem outlined circle with an icon, for Back, Account and Settings in the frame. Filled orange when signed in.
- **Focus:** a 3px outline in `--focus` (the text colour; on the base, the base's text colour), offset 3px. Locked lessons stay focusable, marked `aria-disabled`.

### Braille Cell (signature)
The plate and its six dots in two columns of three, read 1 2 3 down the left and 4 5 6 down the right.
- **Plate:** Press Paper, ink border, 1.875rem radius, plate emboss. A medium size (3rem dots) for questions and a small size (1.625rem dots, no emboss) for previews and rows.
- **Raised dot:** a Raised-Dot Orange circle, solid ink rim, hard ink shadow, ink dot number at 900.
- **Flat dot:** a Press Paper dimple, dashed ink rim, inset shadow, Pencil Grey number.
- **Behaviour:** a toggle button exposing `aria-pressed`; it nudges 2px 3px toward its shadow on press. Read-only cells render the same dots as pictures, not buttons.
- **Cell row:** several cells read left to right that scale down together to stay on one line. The cell being written sits on a thick underline.

### Brailler Base and Keys (signature)
The black base at the bottom of Home and of a write question, 1.75rem top corners, bleeding to the column edges, with square bottom corners at every width (it rests on the window edge or the footer). It holds six keys in Perkins order (3 2 1, a gap, 4 5 6), each 4.625rem tall and at least 44px wide, Press Paper with an ink-on-base rim and a key-edge shadow giving it height. A **pressed key** turns orange, drops its shadow and sinks 5px, so pressed and not pressed differ in depth, shadow and colour. Each key shows its dot number at 900 and its chord letter (F D S / J K L) in mono, which the Key letters setting can hide. While focus is inside, a dashed outline shows that chord typing is listening. Pressed keys keep their sunk position even with Less motion on, because that's state, not animation.

### Letter Cards
An orange card, ink border, 1.25rem radius, lifted card shadow: mono corner labels, the letter in Card Letter type, and its dots embossed in ink beside it. On Home the front card sits on two fanned paper cards behind it and opens the deck. Its action is a small raised key at the bottom right: a paper pill with an ink rim and a 2px 3px hard ink shadow, pressed down with the card. In High vis the shadow goes.

### Answer Choices
Four in a row, 4.5rem tall, 0.875rem radius, letters at 2rem 900, embossed softly at rest. **Right** turns orange with a hard ink shadow; **wrong** lies flat, a dashed rim with no emboss and its letter still in ink; each gets a small mark in the corner so the result isn't carried by colour.

### Option Cards and Lesson Cards
Outlined rows at 1rem radius and 0.875rem × 1rem padding. The selected option, or the next open lesson, fills orange with ink text and a 4px hard shadow (no shadow in High vis, where the fill is black). This is **the one selected style**: course choices in Settings and the deck toggle in Cards (a look at another course's cards; it does not change the course) use it too. Theme cards are the exception: each shows a picture of its own theme, so the chosen one lifts on the shadow without filling (a doubled rim in High vis). A locked lesson has a dashed border and Pencil Grey text. Settings options use real radio and checkbox inputs, with the focus ring drawn on the whole card.

### Inputs / Fields
3.5rem tall, 1rem radius, ink border, the page colour with a 2px dimple inset, 1.125rem at 700. The emailed code field uses mono at 1.625rem with wide letter spacing. **Invalid** shows a thicker, dashed border, never only a colour change.

### Mastery Pips (lesson progress)
The frame's progress is the learning rule itself: one pip per letter of the lesson (up to 8), the letter in 900 above two small dots. Each right answer raises one dot, in a row or not; two raised is learnt. Flat dots are dashed rings in Pencil Grey; raised dots are Raised-Dot Orange with a solid ink rim and a 1.5px 2px hard shadow (flat in High vis). A wrong answer never lowers a dot: the pip stays as it was, and a learnt letter stays learnt. Once learnt, a letter is no longer asked in that lesson, so the lesson ends when the last pip fills. A mono count ("2/5") follows, hidden under Bigger text when space is short. Screen readers get one progressbar whose value text is "2 of 5 letters learnt. c needs one more right answer." Longer sets ("Everything so far") keep a pill bar with an ink outline and an orange fill.

### Feedback Sheet and Stamp
After an answer, a sheet rises from the bottom in the base's place with 1.75rem top corners, always on the page surface. **Right:** a solid ink border and an upward shade, a "GOT IT" stamp, and beside it the letter's pip with "One more for c" or "c learnt!" (the letter set as a letter chip, so a single letter never reads as a word), then the points typed small in mono ("**+10** points"). **Wrong:** a dashed ink border and no shade (flat, like everything dashed), a "NOT QUITE" stamp with a dashed rim, beside it the letter's pip, unchanged, with "Two more for c", "Still one more for c" or "c still learnt" (letter chip, weight 700, quieter than the right note), then the compare view ("You chose / You wrote" beside "Answer"); each label sets its letter as a small letter chip: the answer raised orange, the wrong choice flat with a dashed rim, as it lies in the choices. From 48rem, a miss's stamp and pip stack beside the compare cells, with Next question below. The sheet says each thing once: the stamp, the pip and the compare cells carry the result, so the sentence in words is in the live region only ("Not quite. Dot 1 makes the letter a in English. You raised dot 6. Your right answer still counts. Get the letter a right once more to learn it."). Hints before an answer ("Raise at least one dot") are shown and spoken. Neither is loud: a mistake is a quiet, teaching moment. The rubber stamp is a 3px border, 0.375rem radius, uppercase 900, rotated −4°.

### Lesson Finish (the loud moment)
Finishing a lesson is the loudest moment in the app, built only from Press parts. The heading becomes "You learnt 5 new letters"; the lesson's letters land in the room the question left as a row of raised orange cards (ink border, 0.875rem radius, 4px 5px hard shadow, each tilted within ±6°, the letter at 900 and its dots in ink, raised dots big and solid, flat ones thin rings). On the sheet a big "LESSON DONE" stamp (4px border, 1.75rem type) sits over typed totals (points, days in a row, the lesson now open), then Next lesson and two quiet ways out. Motion: the cards drop onto the deck (220ms, 35ms apart, from 1.5rem above at double tilt) and the stamp thunks down (200ms, 180ms in); everything is done by about 380ms and none of it plays under Less motion or `prefers-reduced-motion`. No confetti. The words are in the live region only: "Lesson done. You learnt a, b, c, d and e in this lesson, and Letters f to j is now open. You have 50 points."

## Do's and Don'ts

### Do:
- **Do** take every colour from the theme custom properties and check each new surface in Paper, Ink and High vis.
- **Do** show every state in at least two of fill, rim style (solid or dashed), depth and shape, never colour alone.
- **Do** keep tappable dots, keys and buttons at least 44px (2.75rem), and give each screen one solid primary action at the bottom.
- **Do** use a hard ink offset shadow for things that are raised, chosen or right, and soft paired shadows only for the plate and dimples.
- **Do** set sizes in rem and breakpoints as container queries on `#root`, so Bigger text reflows the layout.
- **Do** include a `forced-colors: active` fallback for any new control (ButtonText borders, Highlight for pressed).
- **Do** make press feedback a short sink toward the shadow (2–5px, 90–100ms ease), and turn all transitions off under Less motion.
- **Do** keep mistakes quiet and mastery loud: a wrong answer lies flat on paper with a dashed rim; the finished lesson gets the orange cards and the big stamp.

### Don't:
- **Don't** use Raised-Dot Orange for decoration, links, warnings or headings: it means raised, pressed, chosen or right.
- **Don't** put white text on orange; use ink (`--on-accent`).
- **Don't** drift toward a generic gamified app: no gems, confetti, mascots or loud gradients.
- **Don't** drift toward clinical or medical styling: no pale-blue, sterile portal or charity-form look.
- **Don't** drift toward soft neumorphism: never drop the ink outlines or rely on grey-on-grey soft shadows alone.
- **Don't** add timers, countdowns or anything that pressures speed.
- **Don't** add soft shadows or glows in High vis; it is flat, with thicker lines.
- **Don't** rotate things beyond the fanned cards and the stamp.
