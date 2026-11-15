import { COURSES, entryCells, entryKind, getCourse } from ".";

test("ships English and Greek", () => {
  expect(COURSES.map((course) => course.id)).toEqual(["english", "greek"]);
  const letters = (id: string) =>
    getCourse(id).letters.filter((entry) => entryKind(entry) === "letter");
  expect(letters("english")).toHaveLength(26);
  expect(letters("greek")).toHaveLength(32);
});

test("getCourse throws on an unknown id", () => {
  expect(() => getCourse("klingon")).toThrow(/klingon/);
});

test("entryCells reads both the one-cell and the several-cell form", () => {
  expect(entryCells({ letter: "a", dots: [1] })).toEqual([[1]]);
  expect(
    entryCells({ letter: "7", kind: "number", cells: [[3, 4, 5, 6], [1, 2, 4, 5]] })
  ).toEqual([[3, 4, 5, 6], [1, 2, 4, 5]]);
});

const DIGIT_LETTERS = ["j", "a", "b", "c", "d", "e", "f", "g", "h", "i"];

// These run for every file in the folder, so a new course is checked as soon
// as it is added.
describe.each(COURSES.map((course) => [course.id, course] as const))(
  "course %s",
  (_, course) => {
    test("has an id, a name and a language tag", () => {
      expect(course.id).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(course.name).not.toBe("");
      expect(course.lang).toMatch(/^[a-z]{2,3}(-[A-Za-z0-9]+)*$/);
    });

    test("every entry has one form of valid cells, dots ascending, without repeats", () => {
      for (const entry of course.letters) {
        expect(entry.letter).not.toBe("");
        // One cell goes in `dots`, several in `cells`, never both.
        expect((entry.dots === undefined) !== (entry.cells === undefined)).toBe(true);
        if (entry.cells) expect(entry.cells.length).toBeGreaterThanOrEqual(2);
        for (const dots of entryCells(entry)) {
          expect(dots.length).toBeGreaterThan(0);
          expect(dots.every((dot) => Number.isInteger(dot) && dot >= 1 && dot <= 6)).toBe(true);
          expect(dots).toEqual([...new Set(dots)].sort((a, b) => a - b));
        }
      }
    });

    test("letters come first, and every number or sign has a spoken name", () => {
      const kinds = course.letters.map(entryKind);
      const firstOther = kinds.findIndex((kind) => kind !== "letter");
      if (firstOther >= 0) {
        expect(kinds.slice(firstOther)).not.toContain("letter");
      }
      for (const entry of course.letters) {
        if (entryKind(entry) !== "letter") expect(entry.spoken).toBeTruthy();
      }
    });

    test("no entry and no cell pattern appears twice", () => {
      const letters = course.letters.map((entry) => entry.letter);
      const patterns = course.letters.map((entry) =>
        entryCells(entry).map((dots) => dots.join()).join("|")
      );
      expect(new Set(letters).size).toBe(letters.length);
      expect(new Set(patterns).size).toBe(patterns.length);
    });

    test("numbers 1 to 0 are the number sign 3456 then the cells a to j", () => {
      const numbers = course.letters.filter((entry) => entryKind(entry) === "number");
      expect(numbers.map((entry) => entry.letter)).toEqual(
        ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]
      );
      expect(course.numberSign).toEqual([3, 4, 5, 6]);
      const english = getCourse("english").letters;
      for (const entry of numbers) {
        const [sign, digit] = entryCells(entry);
        expect(sign).toEqual(course.numberSign);
        const latin = english.find(
          (item) => item.letter === DIGIT_LETTERS[Number(entry.letter)]
        );
        expect(digit).toEqual(latin?.dots);
        expect(entry.spoken).toBe(`number ${entry.letter}`);
      }
    });

    test("teaches the common punctuation marks, one or more two-cell signs among them", () => {
      const marks = course.letters.filter((entry) => entryKind(entry) === "punctuation");
      const names = marks.map((entry) => entry.spoken);
      for (const name of [
        "full stop",
        "comma",
        "question mark",
        "exclamation mark",
        "apostrophe",
        "hyphen",
        "colon",
      ]) {
        expect(names).toContain(name);
      }
      expect(marks.some((entry) => entry.cells)).toBe(true);
    });

    test("lessons cover every entry exactly once", () => {
      const taught = course.lessons.flatMap((lesson) => lesson.letters);
      expect([...taught].sort()).toEqual(
        course.letters.map((entry) => entry.letter).sort()
      );
    });

    test("letter lessons come first, then numbers, then punctuation", () => {
      const kindOf = (letter: string) =>
        entryKind(course.letters.find((entry) => entry.letter === letter)!);
      const lessonKinds = course.lessons.map((lesson) => {
        const kinds = new Set(lesson.letters.map(kindOf));
        // A lesson teaches one kind of thing.
        expect(kinds.size).toBe(1);
        return [...kinds][0];
      });
      const order = ["letter", "number", "punctuation"];
      const ranks = lessonKinds.map((kind) => order.indexOf(kind));
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
      expect(lessonKinds).toContain("number");
      expect(lessonKinds).toContain("punctuation");
    });

    test("lessons have unique ids, a title and at least four entries", () => {
      const ids = course.lessons.map((lesson) => lesson.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const lesson of course.lessons) {
        expect(lesson.title).not.toBe("");
        // Fewer than four leaves a "which letter?" question short of choices
        // in the first lesson.
        expect(lesson.letters.length).toBeGreaterThanOrEqual(4);
      }
    });
  }
);

test("the values from the sources: UEB and Greek punctuation", () => {
  const dots = (course: string, letter: string) =>
    entryCells(getCourse(course).letters.find((entry) => entry.letter === letter)!);
  // UEB (Braille Australia UEB training manual, ICEB Rules 2024).
  expect(dots("english", "?")).toEqual([[2, 3, 6]]);
  expect(dots("english", ";")).toEqual([[2, 3]]);
  expect(dots("english", "–")).toEqual([[6], [3, 6]]);
  expect(dots("english", "(")).toEqual([[5], [1, 2, 6]]);
  // Greek (Kouroupetroglou, The Greek Braille System): the question mark is
  // ";" in print, and the ano teleia "·" is the Greek semicolon.
  expect(dots("greek", ";")).toEqual([[2, 6]]);
  expect(dots("greek", "·")).toEqual([[2, 3]]);
  expect(dots("greek", "—")).toEqual([[3, 6], [3, 6]]);
});
