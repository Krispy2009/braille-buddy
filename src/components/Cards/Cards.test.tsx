import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { getCourse } from "../../courses";
import { Cards } from "./Cards";

const Harness = ({ letter }: { letter?: string }) => {
  const [language, setLanguage] = React.useState("english");
  return (
    <Cards
      course={getCourse(language)}
      letter={letter}
      onLanguageChange={setLanguage}
      onHome={() => {}}
    />
  );
};

const card = () => screen.getByRole("status");

test("flicks through the alphabet card by card", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  expect(screen.getByRole("heading", { level: 2 })).toHaveFocus();
  expect(card()).toHaveTextContent("Card 1 of 47: a, dot 1.");
  expect(screen.getByRole("button", { name: "Previous card" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Next card" }));
  expect(card()).toHaveTextContent("Card 2 of 47: b, dots 1 and 2.");
});

test("an arrow key turns the card, and a letter in the index jumps to it", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.click(screen.getByRole("button", { name: "z" }));
  expect(card()).toHaveTextContent("Card 26 of 47: z");
  expect(screen.getByRole("button", { name: "z" })).toHaveAttribute("aria-current", "true");
  await user.keyboard("{ArrowLeft}");
  expect(card()).toHaveTextContent("Card 25 of 47: y");
});

test("opens on the card it was given", () => {
  render(<Harness letter="g" />);
  expect(card()).toHaveTextContent("Card 7 of 47: g, dots 1, 2, 4 and 5.");
});

test("the same deck in Greek", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.click(screen.getByRole("button", { name: "Greek" }));
  expect(card()).toHaveTextContent(/Card 1 of \d+: alpha, dot 1\./);
});

test("typing a letter or digit opens its card", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.keyboard("m");
  expect(card()).toHaveTextContent("Card 13 of 47: m");
  expect(screen.getByRole("button", { name: "m" })).toHaveAttribute("aria-current", "true");
  await user.keyboard("T");
  expect(card()).toHaveTextContent("Card 20 of 47: t");
  await user.keyboard("7");
  expect(card()).toHaveTextContent(/of 47: number 7/);
});

test("typing Greek letters works, accents and final sigma included", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.click(screen.getByRole("button", { name: "Greek" }));
  await user.keyboard("β");
  expect(card()).toHaveTextContent(/: beta,/);
  await user.keyboard("ά");
  expect(card()).toHaveTextContent(/: alpha,/);
  await user.keyboard("ς");
  expect(card()).toHaveTextContent(/: sigma,/);
});

test("keys with a modifier are left to the browser", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.keyboard("{Control>}m{/Control}");
  expect(card()).toHaveTextContent("Card 1 of 47");
});
