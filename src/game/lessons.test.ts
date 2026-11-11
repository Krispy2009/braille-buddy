import { getCourse } from "../courses";
import { itemId } from "./braille";
import {
  completeLesson,
  coursePoints,
  learntCount,
  lessonStates,
  metLetters,
} from "./lessons";
import { emptyProgress, Progress } from "./progress";

const english = getCourse("english");
const [first, second] = english.lessons;

const withBoxes = (letters: string[], box: number, base = emptyProgress()): Progress => ({
  ...base,
  letters: {
    ...base.letters,
    ...Object.fromEntries(
      letters.map((letter) => [
        itemId("english", letter),
        { correct: box, wrong: 0, box },
      ])
    ),
  },
});

test("a new player has the first lesson open and the rest locked", () => {
  expect(lessonStates(english, emptyProgress())).toEqual([
    "open",
    "locked",
    "locked",
    "locked",
    "locked",
  ]);
  expect(metLetters(english, emptyProgress())).toEqual(first.letters);
});

test("a lesson is finished once every letter is learnt, which opens the next", () => {
  const nearly = withBoxes(first.letters.slice(1), 2);
  expect(learntCount(english, first, nearly)).toBe(4);
  expect(completeLesson(english, first, nearly)).toBe(nearly);

  const all = withBoxes(first.letters, 2);
  const done = completeLesson(english, first, all);
  expect(done).not.toBe(all);
  expect(all.completedLessons).toEqual({});
  expect(lessonStates(english, done).slice(0, 3)).toEqual(["done", "open", "locked"]);
  expect(metLetters(english, done)).toEqual([...first.letters, ...second.letters]);
  expect(completeLesson(english, first, done)).toBe(done);
});

test("a later mistake does not lock a finished lesson again", () => {
  const done = completeLesson(english, first, withBoxes(first.letters, 2));
  const slipped = withBoxes(["a"], 0, done);
  expect(learntCount(english, first, slipped)).toBe(4);
  expect(lessonStates(english, slipped)[0]).toBe("done");
});

test("course points count only that course's right answers", () => {
  const progress: Progress = {
    ...emptyProgress(),
    letters: {
      "english:a": { correct: 3, wrong: 1, box: 1 },
      "greek:α": { correct: 5, wrong: 0, box: 4 },
    },
  };
  expect(coursePoints(english, progress)).toBe(30);
  expect(coursePoints(getCourse("greek"), progress)).toBe(50);
});
