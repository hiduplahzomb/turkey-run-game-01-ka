// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between five screens: title, play,
// paused, caught and escaped.
//
// ?seed=N fixes the run. ?shot=title|play|caught|escaped (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, LIVES, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_ESCAPED, EVENT_HIT, EVENT_OVER, EVENT_PICKUP, EVENT_SMASH } from './world.js';
import { ACTION_CONFIRM, ACTION_DASH, ACTION_JUMP, ACTION_PAUSE, createInput } from './input.js';
import { playCaught, playDash, playEscape, playFeather, playGobble, playHit, playJump, playPickup, playSmash } from './audio.js';
import { createRenderer, SCREEN_ESCAPED, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    playGobble();
    announce(`Playing. ${LIVES} lives. Run 1000 metres before dinner.`);
  }

  function endGame(escaped) {
    screen = escaped ? SCREEN_ESCAPED : SCREEN_OVER;
    if (world.state.score > best) {
      best = Math.floor(world.state.score);
      saveBest(best);
    }
    if (escaped) { playEscape(); announce(`Escaped! Score ${Math.floor(world.state.score)}. Best ${best}.`); }
    else { playCaught(); announce(`Caught. Score ${Math.floor(world.state.score)}. Best ${best}.`); }
  }

  function handleActions(actions) {
    // Space / click is both "jump" in play and "start" on the title and end
    // screens — the same key the title screen tells the player to press.
    if (actions & (ACTION_CONFIRM | ACTION_JUMP) && (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_ESCAPED)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step(actions) {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, { jump: false, dash: false, slide: false }, true);
      return;
    }
    if (actions & ACTION_JUMP) playJump();
    if (actions & ACTION_DASH) playDash();
    const events = world.step(STEP, {
      jump: Boolean(actions & ACTION_JUMP),
      dash: Boolean(actions & ACTION_DASH),
      slide: input.slideHeld(),
    }, false);
    if (events & EVENT_PICKUP) playPickup();
    if (events & EVENT_SMASH) playSmash();
    if (events & EVENT_HIT) {
      playHit();
      announce(world.state.lives === 1 ? 'Hit. 1 life left. Farmer Bram is close!' : `Hit. ${world.state.lives} lives left.`);
    }
    if (events & EVENT_ESCAPED) endGame(true);
    else if (events & EVENT_OVER) endGame(false);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    handleActions(actions);
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      let first = true;
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step(first ? actions : 0);
        first = false;
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Gobble Dash. Press Space or click to start the escape.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
