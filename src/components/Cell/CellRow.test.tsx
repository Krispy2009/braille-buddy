import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CLEAR_CELL } from "../../game/braille";
import { CellRow } from "./CellRow";

const css = readFileSync(join(__dirname, "Cell.css"), "utf8");

describe("CellRow", () => {
  test("a read-only row says how many cells it holds, so they can scale to one line", () => {
    const { container } = render(
      <CellRow cells={[CLEAR_CELL, CLEAR_CELL, CLEAR_CELL, CLEAR_CELL, CLEAR_CELL]} size="medium" />
    );
    const row = container.querySelector(".cell-row") as HTMLElement;
    expect(row.style.getPropertyValue("--cells")).toBe("5");
    expect(row).toHaveClass("medium");
  });

  test("a row of buttons says how many cells it holds too", () => {
    render(<CellRow cells={[CLEAR_CELL, CLEAR_CELL]} onSelect={() => {}} />);
    expect(screen.getByRole("group").style.getPropertyValue("--cells")).toBe("2");
  });

  test("the row never wraps", () => {
    const rule = css.match(/\.cell-row \{[^}]*\}/)?.[0] ?? "";
    expect(rule).toContain("flex-wrap: nowrap");
    expect(css).not.toMatch(/flex-wrap:\s*wrap/);
  });
});
