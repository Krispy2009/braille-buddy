import React from "react";
import type { Course } from "../../courses";
import { CardFace, cardInWords } from "./CardDeck";
import "./Cards.css";

type CardCarouselProps = {
  course: Course;
  /** The entries to flick through, by their print form. */
  letters: string[];
  index: number;
  /** Asked for when a swipe or a key brings another card to the middle. */
  onIndex: (index: number) => void;
  /** What the carousel is called, for screen readers. */
  label: string;
  /** Said after the current card. */
  note?: string;
};

/** Less motion in Settings, or asked for by the system. */
const reducedMotion = () =>
  document.documentElement.dataset.motion === "less" ||
  Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

/** The slide whose middle is nearest the middle of the scroller. */
const centredSlide = (track: HTMLElement): number => {
  const middle = track.scrollLeft + track.clientWidth / 2;
  let nearest = 0;
  let distance = Infinity;
  Array.from(track.children).forEach((child, position) => {
    const slide = child as HTMLElement;
    const away = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - middle);
    if (away < distance) {
      distance = away;
      nearest = position;
    }
  });
  return nearest;
};

/**
 * The cards in a row, one in the middle and its neighbours peeking in at
 * the sides. A finger flicks them along (a native scroller that snaps, so
 * the flick feels like any other), the arrow keys turn them while the row
 * has focus, and the screen's own buttons set `index`: whichever turns the
 * card, the others follow.
 *
 * Screen readers get the carousel pattern: a region with one slide in it,
 * the current one (the others are hidden), and a polite line that says the
 * new card when it changes. Focus never moves with it.
 */
export const CardCarousel = ({
  course,
  letters,
  index,
  onIndex,
  label,
  note,
}: CardCarouselProps) => {
  const track = React.useRef<HTMLDivElement>(null);
  // The card a scroll of ours is heading for. Until it gets there, the
  // cards it passes on the way don't count as turns.
  const heading = React.useRef<number | null>(null);
  // Said once the card has changed, not when the screen opens: the heading
  // that takes focus then, and the slide, already say it.
  const [announced, setAnnounced] = React.useState(false);
  const [said, setSaid] = React.useState(index);
  if (said !== index) {
    setSaid(index);
    setAnnounced(true);
  }

  React.useEffect(() => {
    const row = track.current;
    if (!row || centredSlide(row) === index) return;
    const slide = row.children[index] as HTMLElement | undefined;
    if (!slide) return;
    heading.current = index;
    const left = slide.offsetLeft + slide.offsetWidth / 2 - row.clientWidth / 2;
    row.scrollTo?.({ left, behavior: reducedMotion() ? "instant" : "smooth" });
  }, [index]);

  const onScroll = () => {
    const row = track.current;
    if (!row) return;
    const centred = centredSlide(row);
    if (heading.current !== null) {
      if (centred !== heading.current) return;
      heading.current = null;
    }
    if (centred !== index) onIndex(centred);
  };

  // A finger, a wheel or a key takes over from a scroll of ours.
  const takeOver = () => (heading.current = null);

  // However a scroll ended (ours cut short, say), the card in the middle
  // is the current one.
  const onScrollEnd = () => {
    takeOver();
    onScroll();
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
              ? letters.length - 1
              : null;
    if (to === null) return;
    // The row would scroll a little on its own: the card turns instead.
    event.preventDefault();
    takeOver();
    onIndex(Math.min(Math.max(to, 0), letters.length - 1));
  };

  const current = letters[index];

  return (
    <div className="card-carousel">
      {/* Focusable, so a keyboard can reach the row and scroll it. */}
      <div
        ref={track}
        className="carousel-track"
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        onScroll={onScroll}
        onScrollEnd={onScrollEnd}
        onKeyDown={onKeyDown}
        onPointerDown={takeOver}
        onTouchStart={takeOver}
        onWheel={takeOver}
      >
        {letters.map((letter, position) => {
          const shown = position === index;
          return (
            <div
              key={`${letter}-${position}`}
              className="carousel-slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${position + 1} of ${letters.length}`}
              aria-hidden={!shown || undefined}
              data-current={shown || undefined}
            >
              <div className="flash-card">
                <CardFace course={course} letter={letter} index={position} total={letters.length} />
                {shown && (
                  <span className="sr-only">
                    {cardInWords(course, letter)}
                    {note && ` ${note}`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="sr-only" role="status">
        {announced &&
          `Card ${index + 1} of ${letters.length}: ${cardInWords(course, current)}${
            note ? ` ${note}` : ""
          }`}
      </p>
    </div>
  );
};
