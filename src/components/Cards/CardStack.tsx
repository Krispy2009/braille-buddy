import React from "react";
import type { Course } from "../../courses";
import { CardFace, cardInWords } from "./CardDeck";
import "./Cards.css";

type CardStackProps = {
  course: Course;
  /** The entries to flick through, by their print form. */
  letters: string[];
  index: number;
  /** Asked for when a flick or a key turns the card. */
  onIndex: (index: number) => void;
  /** What the stack is called, for screen readers. */
  label: string;
  /** Said after the current card. */
  note?: string;
};

/** Less motion in Settings, or asked for by the system. */
const reducedMotion = () =>
  document.documentElement.dataset.motion === "less" ||
  Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

/** Where a card sits, by how far it is from the current one. */
const position = (away: number) =>
  away < 0 ? "gone" : away === 0 ? "front" : away === 1 ? "back-1" : away === 2 ? "back-2" : "deep";

/**
 * How far the front card has to travel, as a share of its width, to turn;
 * and how fast a shorter flick has to be, in pixels a millisecond.
 */
const TURN_DISTANCE = 0.3;
const TURN_SPEED = 0.5;

type Drag = {
  pointer: number;
  from: number;
  dx: number;
  /** The last few moves, for the speed at the end. */
  samples: { x: number; t: number }[];
};

const clampTilt = (degrees: number) => Math.max(-15, Math.min(15, degrees));

const transform = (x: number, y: number, r: number) =>
  `translate(${x}px, ${y}px) rotate(${r}deg) scale(1)`;

/**
 * The cards in a stack, like Home's deck: the current one in front and the
 * next two tilted behind it. A finger flicks the front card away to the
 * left and the next one rises; flicking right brings the card before back
 * over the top. The arrow keys, Home and End turn the cards while the stack
 * has focus, and the screen's own buttons set `index`: whichever turns the
 * card, the others follow, with the same movement. With less motion, the
 * cards change places at once.
 *
 * Screen readers get the carousel pattern: a region with one slide in it,
 * the front card (the others are hidden and inert), and a polite line that
 * says the new card when it changes. Focus never moves with it.
 */
export const CardStack = ({ course, letters, index, onIndex, label, note }: CardStackProps) => {
  const cards = React.useRef<(HTMLDivElement | null)[]>([]);
  const drag = React.useRef<Drag | null>(null);
  const last = letters.length - 1;
  // Said once the card has changed, not when the screen opens: the heading
  // that takes focus then, and the slide, already say it.
  const [announced, setAnnounced] = React.useState(false);
  const [said, setSaid] = React.useState(index);
  if (said !== index) {
    setSaid(index);
    setAnnounced(true);
  }

  const go = (to: number) => {
    const next = Math.min(Math.max(to, 0), last);
    if (next !== index) onIndex(next);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const to =
      event.key === "ArrowRight"
        ? index + 1
        : event.key === "ArrowLeft"
          ? index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (to === null) return;
    // Handled here, so the screen's own arrow keys leave it alone.
    event.preventDefault();
    go(to);
  };

  // ---- Dragging -------------------------------------------------------------
  // While a finger holds the front card, the cards are moved here, outside
  // React: on letting go they are handed back to their places in the CSS,
  // which animates them there.

  /** Past either end, the card pulls back like a rubber band. */
  const rubber = (dx: number, width: number) => {
    const reach = width * 0.18;
    return (reach * dx) / (Math.abs(dx) + reach);
  };

  const follow = (dx: number) => {
    const front = cards.current[index];
    if (!front) return;
    const width = front.offsetWidth;
    const before = index > 0 ? cards.current[index - 1] : null;
    if (dx <= 0 || !before) {
      if (before) {
        delete before.dataset.dragging;
        before.style.transform = "";
      }
      const x = dx <= 0 && index < last ? dx : rubber(dx, width);
      front.style.transform = transform(x, dx <= 0 ? Math.abs(x) * 0.04 : 0, clampTilt(x / 20));
      return;
    }
    // Right: the card before comes back in from the left, over the top.
    front.style.transform = "";
    const em = width / 13.75;
    const goneX = -(document.documentElement.clientWidth / 2 + width * 1.1);
    const left = 1 - Math.min(1, dx / width);
    before.dataset.dragging = "";
    before.style.transform = transform(goneX * left, 1.5 * em * left, -18 * left);
  };

  /** Hands every card back to the CSS. */
  const release = () => {
    cards.current.forEach((card) => {
      if (!card) return;
      delete card.dataset.dragging;
      card.style.transform = "";
    });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const front = cards.current[index];
    if (!front?.contains(event.target as Node) || event.button > 0 || drag.current) return;
    drag.current = {
      pointer: event.pointerId,
      from: event.clientX,
      dx: 0,
      samples: [{ x: event.clientX, t: event.timeStamp }],
    };
    front.setPointerCapture?.(event.pointerId);
    front.dataset.dragging = "";
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const held = drag.current;
    if (!held || event.pointerId !== held.pointer) return;
    held.dx = event.clientX - held.from;
    held.samples.push({ x: event.clientX, t: event.timeStamp });
    if (held.samples.length > 6) held.samples.shift();
    // With less motion the cards stay put under the finger, and change
    // places at once when it lets go (the CSS has no transitions then).
    if (!reducedMotion()) follow(held.dx);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const held = drag.current;
    if (!held || event.pointerId !== held.pointer) return;
    drag.current = null;
    const width = cards.current[index]?.offsetWidth ?? 0;
    release();
    const { dx, samples } = held;
    const first = samples[0];
    const end = samples[samples.length - 1];
    const speed = end.t > first.t ? (end.x - first.x) / (end.t - first.t) : 0;
    const far = Math.abs(dx) > width * TURN_DISTANCE;
    const flick =
      Math.abs(speed) > TURN_SPEED && Math.abs(dx) > 12 && Math.sign(speed) === Math.sign(dx);
    if (far || flick) go(index + (dx < 0 ? 1 : -1));
  };

  // Scrolling the page instead, or anything else that takes the finger
  // away: the cards go back where they were.
  const onPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current || event.pointerId !== drag.current.pointer) return;
    drag.current = null;
    release();
  };

  const current = letters[index];

  return (
    <div className="card-stack">
      <div
        className="stack-deck"
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onPointerCancel}
      >
        {letters.map((letter, at) => {
          const away = at - index;
          const front = away === 0;
          return (
            <div
              key={`${letter}-${at}`}
              ref={(card) => {
                cards.current[at] = card;
              }}
              className="flash-card stack-card"
              data-pos={position(away)}
              style={{ zIndex: away < 0 ? 20 + away : 10 - away }}
              role={front ? "group" : undefined}
              aria-roledescription={front ? "slide" : undefined}
              aria-label={front ? `${at + 1} of ${letters.length}` : undefined}
              aria-hidden={!front || undefined}
              inert={!front}
            >
              <CardFace course={course} letter={letter} index={at} total={letters.length} />
              {front && (
                <span className="sr-only">
                  {cardInWords(course, letter)}
                  {note && ` ${note}`}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {/* Where you are in the stack. Only to look at: the line below says it. */}
      {last > 0 && (
        <div className="stack-pager" aria-hidden="true">
          {letters.map((letter, at) => (
            <span key={`${letter}-${at}`} data-current={at === index || undefined} />
          ))}
        </div>
      )}
      <p className="sr-only" role="status">
        {announced &&
          `Card ${index + 1} of ${letters.length}: ${cardInWords(course, current)}${
            note ? ` ${note}` : ""
          }`}
      </p>
    </div>
  );
};
