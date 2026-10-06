import { GLOBALS } from '../Globals';
// Keep gameplay delays on simulation time while a co-op room is paused.
export function chamberTimeout(callback, delay = 0, ...args) {
  if (!GLOBALS.MULTIPLAYER) return setTimeout(callback, delay, ...args);
  let remaining = delay, previous = performance.now();
  const timer = setInterval(() => {
    const now = performance.now();
    if (!GLOBALS.MULTIPLAYER?.isPaused()) remaining -= now - previous;
    previous = now;
    if (remaining <= 0 && !GLOBALS.MULTIPLAYER?.isPaused()) { clearInterval(timer); callback(...args); }
  }, 16);
  return timer;
}
