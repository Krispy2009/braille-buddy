/**
 * A tiny signal that saved progress changed on this device. Account sync
 * listens to it to send changes to the server; nothing else needs it, and
 * with nobody listening it does nothing.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export const notifyLocalChange = () => {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch {
      // A listener's problem must never stop the game from saving.
    }
  }
};

/** Returns a function that stops listening. */
export const onLocalChange = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
