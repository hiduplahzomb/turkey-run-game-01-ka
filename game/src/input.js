// Keyboard + mouse + touch input. Jump, dash and slide are the three verbs;
// confirm starts / restarts, pause freezes the run. Edge-triggered actions
// are consumed once by takeActions(), held keys are read live.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_JUMP = 4;
export const ACTION_DASH = 8;

export function createInput(canvas) {
  let queued = 0;
  const held = { slide: false };

  function press(action) { queued |= action; }
  function keyDown(event) {
    if (event.repeat) return;
    const key = event.key;
    if (key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W') { event.preventDefault(); press(ACTION_JUMP); }
    else if (key === 'Shift' || key === 'x' || key === 'X') press(ACTION_DASH);
    else if (key === 'ArrowDown' || key === 's' || key === 'S') held.slide = true;
    else if (key === 'Enter') press(ACTION_CONFIRM);
    else if (key === 'p' || key === 'P' || key === 'Escape') press(ACTION_PAUSE);
  }
  function keyUp(event) {
    const key = event.key;
    if (key === 'ArrowDown' || key === 's' || key === 'S') held.slide = false;
  }
  function pointerDown(event) {
    event.preventDefault();
    // Left half of the screen jumps, right half dashes — mouse and touch.
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    if (x < 0.5) press(ACTION_JUMP); else press(ACTION_DASH);
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  canvas.addEventListener('pointerdown', pointerDown);

  return {
    takeActions() { const actions = queued; queued = 0; return actions; },
    jumpHeld() { return false; },
    slideHeld() { return held.slide; },
    // Live direction is unused by the runner (Tilly always runs right) but
    // kept for the autopilot interface: -1/0/1 never steers her.
    direction() { return 0; },
  };
}
