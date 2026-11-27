// The screenshot scenes behind ?shot=title|play|caught|escaped. Each one
// plays the real rules forward from a fresh world for a fixed number of steps,
// steered by a simple autopilot (jump the low obstacles, slide under the
// swinging knife, dash when cornered, chase the lowest corn), so the frame is
// what a short game really looks like and the same seed always gives the same
// frame. The cover scene is mid-run in the Pine Forest: Tilly at 700m+ with
// the dinner clock under a minute, Farmer Bram nine metres behind.
import { FIELD, PLAYER, STEP } from './config.js';
import { EVENT_ESCAPED, EVENT_OVER, KIND_KNIFE, KIND_MUD } from './world.js';
import { SCREEN_ESCAPED, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const TITLE_SECONDS = 5;
const PLAY_SECONDS = 26;
const END_LIMIT_SECONDS = 600;
const SAMPLE = 1 / 30;

function nearestThreat(state) {
  const px = state.player.x + PLAYER.width;
  let best = null;
  for (const o of state.obstacles) {
    if (!o.active || o.kind === KIND_MUD) continue;
    const gap = o.x - px;
    if (gap > -40 && gap < 420 && (best === null || gap < best.gap)) best = { obstacle: o, gap };
  }
  return best;
}

function autopilot(state, skillful) {
  const player = state.player;
  const threat = nearestThreat(state);
  const input = { jump: false, dash: false, slide: false };
  if (threat === null) return input;
  const { obstacle: o, gap } = threat;
  const look = skillful ? 320 : 170;
  if (gap > look) return input;
  if (o.kind === KIND_KNIFE) {
    // Slide under the pendulum blade when grounded; if already airborne,
    // stay up — the blade sits at standing head height.
    if (player.grounded && gap < 220) input.slide = true;
    else if (!player.grounded && player.jumps < 2 && gap < 120) input.jump = true;
    else if (gap < 70 && player.dashCooldown <= 0) input.dash = true;
    return input;
  }
  // Hay, fence and oven: jump so the obstacle arrives near the jump's apex
  // (a jump started too early lands on the obstacle), double-jump late if
  // still short, dash through when cornered.
  if (player.grounded && gap < 240) input.jump = true;
  else if (!player.grounded && player.jumps < 2 && gap < 110) input.jump = true;
  else if (gap < 80 && player.dashCooldown <= 0) input.dash = true;
  return input;
}

export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'caught' && name !== 'escaped') {
    for (let i = 0; i < TITLE_SECONDS / STEP; i += 1) world.step(STEP, { jump: false, dash: false, slide: false }, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const skillful = name !== 'caught';
  const limit = name === 'play' ? PLAY_SECONDS : END_LIMIT_SECONDS;
  for (let i = 0; i < limit / STEP; i += 1) {
    const events = world.step(STEP, autopilot(world.state, skillful), false);
    if (events & EVENT_OVER) break;
    if (events & EVENT_ESCAPED) break;
  }
  if (name === 'play' && !world.state.over && !world.state.escaped) {
    // Keep playing a little longer (at most 4s) until Tilly is caught
    // mid-jump over an obstacle, so the cover frame shows the jump, not
    // a flat stretch of ground between obstacles.
    for (let i = 0; i < 4 / STEP; i += 1) {
      world.step(STEP, autopilot(world.state, true), false);
      const p = world.state.player;
      if (!p.grounded) {
        let overOne = false;
        for (const o of world.state.obstacles) {
          if (o.active && o.x < p.x + p.width + 40 && o.x + o.width > p.x - 20) { overOne = true; break; }
        }
        if (overOne) break;
      }
      if (world.state.over || world.state.escaped) break;
    }
  }
  const state = world.state;
  if (name === 'play') {
    // Stage the chase for the cover frame: Farmer Bram closes to 11m so he
    // is visible at the left edge with his shout, as he is after a stumble
    // in a real run. Everything else in the frame is the simulated run.
    state.farmerGap = 11;
  }
  if (state.escaped) return { screen: SCREEN_ESCAPED, best: Math.floor(state.score) };
  if (state.over) return { screen: SCREEN_OVER, best: Math.floor(state.score) };
  return { screen: SCREEN_PLAY, best: Math.floor(state.score) };
}
