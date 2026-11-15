/**
 * What the Accessibility page says, kept as data so filling in a test result
 * later is a one-line change. Never record a result that was not tested.
 */

export const REPORT_URL = "https://github.com/Krispy2009/braille-buddy/issues/new";

export const GOAL =
  "Braille Buddy aims to meet WCAG 2.2 level AA. It has not been independently audited yet, so this page says what is built in, what has been tested with assistive technology, and what is still missing.";

export const BUILT_IN: string[] = [
  "Play entirely from the keyboard, with a visible focus outline.",
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
  "Braille Buddy teaches the dot patterns on screen. It does not drive a refreshable braille display or produce tactile output.",
  "The page has not had an independent accessibility audit.",
];
