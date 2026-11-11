import { COURSES, getCourse } from ".";

test("ships English and Greek", () => {
  expect(COURSES.map((course) => course.id)).toEqual(["english", "greek"]);
  expect(getCourse("english").letters).toHaveLength(26);
  expect(getCourse("greek").letters).toHaveLength(32);
});

test("getCourse throws on an unknown id", () => {
  expect(() => getCourse("klingon")).toThrow(/klingon/);
});

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

    test("every letter has valid dots, ascending, without repeats", () => {
      for (const { letter, dots } of course.letters) {
        expect(letter).not.toBe("");
        expect(dots.length).toBeGreaterThan(0);
        expect(dots.every((dot) => Number.isInteger(dot) && dot >= 1 && dot <= 6)).toBe(true);
        expect(dots).toEqual([...new Set(dots)].sort((a, b) => a - b));
      }
    });

    test("no letter and no dot pattern appears twice", () => {
      const letters = course.letters.map((entry) => entry.letter);
      const patterns = course.letters.map((entry) => entry.dots.join());
      expect(new Set(letters).size).toBe(letters.length);
      expect(new Set(patterns).size).toBe(patterns.length);
    });

    test("lessons cover every letter exactly once", () => {
      const taught = course.lessons.flatMap((lesson) => lesson.letters);
      expect([...taught].sort()).toEqual(
        course.letters.map((entry) => entry.letter).sort()
      );
    });

    test("lessons have unique ids, a title and at least four letters", () => {
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
