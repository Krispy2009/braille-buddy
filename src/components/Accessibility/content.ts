/**
 * What the Accessibility page says, kept as data so filling in a test result
 * later is a one-line change. Never record a result that was not tested.
 */

export const REPORT_URL = "https://github.com/Krispy2009/braille-buddy/issues/new";

/**
 * What the app can and cannot teach (PRODUCT.md, principle 1). Home says it
 * until a first lesson is done; this page keeps it for good. Plain enough for
 * a child to read on their own.
 */
export const WHAT_IT_TEACHES: string[] = [
  "Braille Buddy teaches the dot patterns of braille: which dots make each letter, number and sign.",
  "It does not teach you to read braille with your fingers. Reading by touch takes practice with real braille, printed with dots you can feel. A braille teacher or a local blindness organisation can help you learn it.",
];

export const GOAL =
  "Braille Buddy aims to meet WCAG 2.2 level AA. It has not been independently audited yet, so this page says what is built in, what has been tested with assistive technology, and what is still missing.";

export const BUILT_IN: string[] = [
  "Play entirely from the keyboard, with a visible focus outline. Escape leaves a lesson or the daily puzzle, like its close button; Backspace clears the dots.",
  "Labels for screen readers on every control, with results and feedback announced.",
  "Three themes: Paper, Ink and High vis, following your system's colour scheme and contrast setting until you choose.",
  "Bigger text, which scales the whole interface.",
  "Less motion, following your system's reduced motion setting until you choose.",
  "Switchable keyboard shortcuts, so the F D S J K L and 1 to 6 keys can be turned off if they clash with your screen reader or voice control.",
  "No timers: take as long as you like on every question.",
];

export type TestStatus = "Not tested yet" | "Works" | "Works with problems" | "Does not work";

export type TestResult = {
  /** Screen reader and browser, or phone and screen reader. */
  setup: string;
  platform: string;
  status: TestStatus;
  /** Date tested and version, once there is a result. */
  tested?: string;
  notes?: string;
};

export const TEST_RESULTS: TestResult[] = [
  { setup: "NVDA with Firefox", platform: "Windows", status: "Not tested yet" },
  { setup: "NVDA with Chrome", platform: "Windows", status: "Not tested yet" },
  { setup: "JAWS with Chrome", platform: "Windows", status: "Not tested yet" },
  { setup: "VoiceOver with Safari", platform: "Mac", status: "Not tested yet" },
  { setup: "VoiceOver", platform: "iPhone", status: "Not tested yet" },
  { setup: "TalkBack with Chrome", platform: "Android", status: "Not tested yet" },
];

export const KNOWN_GAPS: string[] = [
  "No screen reader testing has been done yet (see the table above), so there may be problems this page does not list.",
  "Braille Buddy shows braille on the screen only. It does not send braille to a refreshable braille display, and it cannot make braille you can feel.",
  "The page has not had an independent accessibility audit.",
];
