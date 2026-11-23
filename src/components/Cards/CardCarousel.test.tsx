import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { getCourse } from "../../courses";
import { CardCarousel } from "./CardCarousel";

const LETTERS = ["a", "b", "c", "d"];

/** The screen keeps the index, as the lesson intro does. */
const Harness = () => {
  const [index, setIndex] = React.useState(0);
  return (
    <>
      <CardCarousel
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

const carousel = () => screen.getByRole("region", { name: "New cards" });
const current = () => within(carousel()).getByRole("group");
const status = () => screen.getByRole("status");

/**
 * jsdom lays nothing out: give the row a phone's geometry, 380px wide with
 * 180px cards 200px apart, the first one centred.
 */
const layOut = () => {
  const row = carousel();
  within(row)
    .getAllByRole("group", { hidden: true })
    .forEach((slide, position) => {
      Object.defineProperty(slide, "offsetLeft", { value: 100 + position * 200 });
      Object.defineProperty(slide, "offsetWidth", { value: 180 });
    });
  Object.defineProperty(row, "clientWidth", { value: 380 });
  Object.defineProperty(row, "scrollLeft", { value: 0, writable: true });
  return row;
};

const scrollTo = vi.fn();

beforeEach(() => {
  scrollTo.mockClear();
  HTMLElement.prototype.scrollTo = scrollTo;
});

afterEach(() => {
  delete (HTMLElement.prototype as Partial<HTMLElement>).scrollTo;
  delete document.documentElement.dataset.motion;
  delete (window as Partial<Window>).matchMedia;
});

test("follows the carousel pattern: a region of slides, only the current one exposed", () => {
  render(<Harness />);
  const row = carousel();
  expect(row).toHaveAttribute("aria-roledescription", "carousel");
  expect(row).toHaveAttribute("tabindex", "0");
  const slides = within(row).getAllByRole("group", { hidden: true });
  expect(slides).toHaveLength(4);
  slides.forEach((slide, position) => {
    expect(slide).toHaveAttribute("aria-roledescription", "slide");
    expect(slide).toHaveAttribute("aria-label", `${position + 1} of 4`);
  });
  expect(within(row).getAllByRole("group")).toEqual([slides[0]]);
  expect(slides.slice(1).every((slide) => slide.getAttribute("aria-hidden") === "true")).toBe(
    true
  );
  expect(current()).toHaveTextContent("a, dot 1.");
  // Nothing is announced until the card changes.
  expect(status()).toBeEmptyDOMElement();
});

test("the arrow keys, Home and End turn the cards while the row has focus", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  carousel().focus();
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
  // Focus stays on the row.
  expect(carousel()).toHaveFocus();
});

test("a button outside turns the card and scrolls it to the middle", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  layOut();
  await user.click(screen.getByRole("button", { name: "Next card" }));
  expect(current()).toHaveAccessibleName("2 of 4");
  // The second card's middle (300 + 90) minus half the row (190).
  expect(scrollTo).toHaveBeenCalledWith({ left: 200, behavior: "smooth" });
});

test("less motion scrolls straight there, from Settings or from the system", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  layOut();
  document.documentElement.dataset.motion = "less";
  await user.click(screen.getByRole("button", { name: "Next card" }));
  expect(scrollTo).toHaveBeenLastCalledWith({ left: 200, behavior: "instant" });

  document.documentElement.dataset.motion = "full";
  window.matchMedia = ((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)",
  })) as typeof window.matchMedia;
  await user.click(screen.getByRole("button", { name: "Next card" }));
  expect(scrollTo).toHaveBeenLastCalledWith({ left: 400, behavior: "instant" });
});

test("a swipe turns the card to whichever one ends up in the middle", () => {
  render(<Harness />);
  const row = layOut();
  fireEvent.pointerDown(row);
  row.scrollLeft = 120;
  fireEvent.scroll(row);
  expect(current()).toHaveAccessibleName("2 of 4");
  expect(status()).toHaveTextContent("Card 2 of 4: b");
  row.scrollLeft = 400;
  fireEvent.scroll(row);
  expect(current()).toHaveAccessibleName("3 of 4");
  // The swipe already put it there: no scroll on top of it.
  expect(scrollTo).not.toHaveBeenCalled();
});

test("the cards a button's scroll passes on its way don't count as turns", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const row = layOut();
  row.focus();
  await user.keyboard("{End}");
  expect(scrollTo).toHaveBeenLastCalledWith({ left: 600, behavior: "smooth" });
  // On its way past the second and third cards.
  row.scrollLeft = 200;
  fireEvent.scroll(row);
  row.scrollLeft = 400;
  fireEvent.scroll(row);
  expect(current()).toHaveAccessibleName("4 of 4");
  row.scrollLeft = 600;
  fireEvent.scroll(row);
  expect(current()).toHaveAccessibleName("4 of 4");

  // Cut short, it settles on the card in the middle.
  await user.keyboard("{Home}");
  row.scrollLeft = 400;
  fireEvent.scroll(row);
  expect(current()).toHaveAccessibleName("1 of 4");
  fireEvent(row, new Event("scrollend"));
  expect(current()).toHaveAccessibleName("3 of 4");
});
