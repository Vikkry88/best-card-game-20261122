// Keyboard and pointer input for the duel: number keys pick cards, Enter strikes,
// E ends the turn, arrows move a focus ring. Pointer presses queue as coordinates
// so the main loop can hit-test them against the renderer's layout.

export const ACTION_CONFIRM = 1;
export const ACTION_END_TURN = 2;
export const ACTION_PAUSE = 4;
export const ACTION_RESTART = 8;

const CONFIRM_KEYS = new Set(['Space', 'Enter']);
const END_KEYS = new Set(['KeyE']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);
const RESTART_KEYS = new Set(['KeyR']);
const DIGIT_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'];

export function createInput(target) {
  let actions = 0;
  let digit = -1;
  let focusMove = 0;
  const pointers = [];

  window.addEventListener('keydown', (event) => {
    const digitIndex = DIGIT_KEYS.indexOf(event.code);
    if (digitIndex !== -1) {
      if (!event.repeat) digit = digitIndex;
    } else if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      if (!event.repeat) focusMove -= 1;
    } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      if (!event.repeat) focusMove += 1;
    } else if (CONFIRM_KEYS.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (END_KEYS.has(event.code)) {
      if (!event.repeat) actions |= ACTION_END_TURN;
    } else if (PAUSE_KEYS.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (RESTART_KEYS.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else return;
    event.preventDefault();
  });

  target.addEventListener('pointerdown', (event) => {
    pointers.push({ x: event.clientX, y: event.clientY });
  });

  return {
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    takeDigit() {
      const taken = digit;
      digit = -1;
      return taken;
    },
    takeFocusMove() {
      const taken = focusMove;
      focusMove = 0;
      return taken;
    },
    takePointers() {
      return pointers.splice(0, pointers.length);
    },
  };
}
