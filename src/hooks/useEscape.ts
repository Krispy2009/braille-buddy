import React from "react";

const TEXT_INPUTS = new Set(["text", "search", "email", "tel", "url", "password", "number"]);

/**
 * Escape leaves the screen: the same as its close or back button, so focus
 * goes back to the same place. Escape is not a character key, so the
 * Keyboard shortcuts switch (WCAG 2.1.4) doesn't cover it.
 *
 * It never throws away typing: Escape in a text field that has text in it is
 * left to the field, and Escape that ends an input method's composition is
 * the composition's. Something else that handles Escape first (a dialog, a
 * confirm) calls preventDefault, and then this stays out of it.
 */
export const useEscape = (onEscape: () => void, enabled = true): void => {
  const escape = React.useEffectEvent(() => onEscape());

  React.useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || event.isComposing) return;
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const target = event.target;
      const typing =
        (target instanceof HTMLInputElement && TEXT_INPUTS.has(target.type)) ||
        target instanceof HTMLTextAreaElement;
      if (typing && target.value !== "") return;
      if (target instanceof HTMLSelectElement) return;
      event.preventDefault();
      escape();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
};
