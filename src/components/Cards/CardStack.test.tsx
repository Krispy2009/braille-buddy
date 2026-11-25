import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { getCourse } from "../../courses";
import { CardStack } from "./CardStack";

const LETTERS = ["a", "b", "c", "d"];

/** The screen keeps the index, as the lesson intro does. */
const Harness = () => {
  const [index, setIndex] = React.useState(0);
  return (
    <>
      <CardStack
        course={getCourse("english")}
        letters={LETTERS}
        index={index}
        onIndex={setIndex}
        label="New cards"
      />
      <button type="button" onClick={() => setIndex(Math.min(index + 1, LETTERS.length - 1))}>
        Next card
      </button>
    </>
  );
};

const stack = () => screen.getByRole("region", { name: "New cards" });
const current = () => within(stack()).getByRole("group");
const status = () => screen.getByRole("status");
const cards = () => Array.from(stack().querySelectorAll<HTMLElement>(".stack-card"));
const pager = () => document.querySelector(".stack-pager")!;
const pagerAt = () =>
  Array.from(pager().children).findIndex((dot) => dot.hasAttribute("data-current"));

/** Drags the front card sideways by `dx` pixels, in `steps` moves. */
const drag = (dx: number, steps = 5) => {
  const front = current();
  const from = 200;
  fireEvent.pointerDown(front, { pointerId: 1, button: 0, clientX: from });
  for (let step = 1; step <= steps; step++) {
    fireEvent.pointerMove(front, { pointerId: 1, clientX: from + (dx * step) / steps });
  }
  return {
    front,
    release: () =>
      fireEvent.pointerUp(front, { pointerId: 1, button: 0, clientX: from + dx }),
  };
};

const offsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

beforeEach(() => {
  // jsdom lays nothing out: a phone's card, 180px wide.
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get: () => 180,
  });
});

afterEach(() => {
  if (offsetWidth) Object.defineProperty(HTMLElement.prototype, "offsetWidth", offsetWidth);
  delete document.documentElement.dataset.motion;
  delete (window as Partial<Window>).matchMedia;
});

test("follows the carousel pattern: a region with only the front card exposed", () => {
  render(<Harness />);
  const region = stack();
  expect(region).toHaveAttribute("aria-roledescription", "carousel");
  expect(region).toHaveAttribute("tabindex", "0");
  expect(cards()).toHaveLength(4);
  expect(within(region).getAllByRole("group")).toEqual([cards()[0]]);
  expect(cards()[0]).not.toHaveAttribute("inert");
  expect(current()).toHaveAttribute("aria-roledescription", "slide");
  expect(current()).toHaveAccessibleName("1 of 4");
  expect(current()).toHaveTextContent("a, dot 1.");
  cards()
    .slice(1)
    .forEach((card) => {
      expect(card).toHaveAttribute("aria-hidden", "true");
      expect(card).toHaveAttribute("inert");
      expect(card).not.toHaveAttribute("role");
    });
  // Every card is drawn whole, the ones behind too.
  expect(cards()[1]).toHaveTextContent("card 02");
  expect(cards().map((card) => card.dataset.pos)).toEqual(["front", "back-1", "back-2", "deep"]);
  // Nothing is announced until the card changes.
  expect(status()).toBeEmptyDOMElement();
});

test("the dots under the stack show where you are, and only to look at", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  expect(pager()).toHaveAttribute("aria-hidden", "true");
  expect(pager().children).toHaveLength(4);
  expect(pagerAt()).toBe(0);
  await user.click(screen.getByRole("button", { name: "Next card" }));
  expect(pagerAt()).toBe(1);
});

test("the arrow keys, Home and End turn the cards while the stack has focus", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  stack().focus();
  await user.keyboard("{ArrowRight}");
  expect(current()).toHaveAccessibleName("2 of 4");
  expect(status()).toHaveTextContent("Card 2 of 4: b, dots 1 and 2.");
  await user.keyboard("{End}");
  expect(current()).toHaveAccessibleName("4 of 4");
  // No further than the last card.
  await user.keyboard("{ArrowRight}");
  expect(current()).toHaveAccessibleName("4 of 4");
  await user.keyboard("{ArrowLeft}");
  expect(current()).toHaveAccessibleName("3 of 4");
  await user.keyboard("{Home}");
  expect(current()).toHaveAccessibleName("1 of 4");
  // Focus stays on the stack.
  expect(stack()).toHaveFocus();
});

test("a button outside turns the card, and the cards move up the stack", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.click(screen.getByRole("button", { name: "Next card" }));
  expect(current()).toHaveAccessibleName("2 of 4");
  expect(status()).toHaveTextContent("Card 2 of 4: b, dots 1 and 2.");
  expect(cards().map((card) => card.dataset.pos)).toEqual(["gone", "front", "back-1", "back-2"]);
});

test("a drag past a third of the card flicks it away; back the other way", () => {
  render(<Harness />);
  const { front, release } = drag(-80);
  // The card follows the finger, tilting.
  expect(front.style.transform).toBe("translate(-80px, 3.2px) rotate(-4deg) scale(1)");
  release();
  expect(current()).toHaveAccessibleName("2 of 4");
  expect(status()).toHaveTextContent("Card 2 of 4: b, dots 1 and 2.");
  expect(pagerAt()).toBe(1);
  // Handed back to the CSS, which animates it to its place.
  expect(cards().every((card) => card.style.transform === "")).toBe(true);
  expect(cards()[0].dataset.pos).toBe("gone");

  // Right: the card before comes back in over the top.
  const back = drag(90);
  expect(cards()[0]).toHaveAttribute("data-dragging");
  expect(cards()[0].style.transform).not.toBe("");
  back.release();
  expect(current()).toHaveAccessibleName("1 of 4");
  expect(cards()[0]).not.toHaveAttribute("data-dragging");
});

test("a short drag, or one the browser takes over, puts the card back", () => {
  render(<Harness />);
  const { front, release } = drag(-10);
  release();
  expect(current()).toHaveAccessibleName("1 of 4");
  expect(front.style.transform).toBe("");
  expect(status()).toBeEmptyDOMElement();

  // Scrolling the page instead cancels it, however far it went.
  drag(-120);
  fireEvent.pointerCancel(current(), { pointerId: 1 });
  expect(current()).toHaveAccessibleName("1 of 4");
  expect(cards()[0].style.transform).toBe("");
  // A pointer up after that is not a turn.
  fireEvent.pointerUp(current(), { pointerId: 1, clientX: 80 });
  expect(current()).toHaveAccessibleName("1 of 4");
});

test("at either end the card pulls back instead of turning", () => {
  render(<Harness />);
  const { front, release } = drag(150);
  // Rubber band: far less than the finger moved.
  const moved = Number(/translate\(([\d.]+)px/.exec(front.style.transform)?.[1]);
  expect(moved).toBeGreaterThan(0);
  expect(moved).toBeLessThan(40);
  release();
  expect(current()).toHaveAccessibleName("1 of 4");
});

test("less motion: the cards stay put under the finger and change at once", () => {
  render(<Harness />);
  document.documentElement.dataset.motion = "less";
  const first = drag(-80);
  expect(first.front.style.transform).toBe("");
  first.release();
  expect(current()).toHaveAccessibleName("2 of 4");

  document.documentElement.dataset.motion = "full";
  window.matchMedia = ((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)",
  })) as typeof window.matchMedia;
  const second = drag(-80);
  expect(second.front.style.transform).toBe("");
  second.release();
  expect(current()).toHaveAccessibleName("3 of 4");
});
