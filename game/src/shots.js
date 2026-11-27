// The screenshot scenes behind ?shot=title|play|caught|escaped. Each one
// plays the real rules forward from a fresh world for a fixed number of steps,
// steered by a simple autopilot (jump the low obstacles, slide under the
// swinging knife, dash when cornered, chase the lowest corn), so the frame is
// what a short game really looks like and the same seed always gives the same
// frame. The cover scene is mid-run in the Pine Forest: Tilly past 700m with
// only seconds left on the 40-second dinner clock, Farmer Bram at whatever
// gap the run honestly earned, a fresh dash-smash on screen. The caught
// scene runs an autopilot that never dodges anything, so it really does get
// caught instead of escaping by accident.
import { FIELD, PLAYER, STEP } from './config.js';
import { EVENT_ESCAPED, EVENT_OVER, KIND_FEATHER, KIND_FENCE, KIND_HAY, KIND_KNIFE, KIND_MUD, KIND_OVEN, KIND_PIE } from './world.js';
import { SCREEN_ESCAPED, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const TITLE_SECONDS = 5;
const PLAY_SECONDS = 26;
const END_LIMIT_SECONDS = 600;

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

function nearestValuable(state) {
  // The nearest pie or golden feather ahead — the pickups worth jumping
  // for. Corn is left to chance: it sits low and a jump for it would
  // cost more than it pays.
  const px = state.player.x;
  let best = null;
  for (const p of state.pickups) {
    if (!p.active || (p.kind !== KIND_PIE && p.kind !== KIND_FEATHER)) continue;
    const gap = p.x - px;
    if (gap > 0 && gap < 380 && (best === null || gap < best.gap)) best = { pickup: p, gap };
  }
  return best;
}

function autopilot(state, skillful) {
  const player = state.player;
  const input = { jump: false, dash: false, slide: false };
  // While a dash is running, give no further input: jumping mid-dash
  // would lift Tilly over the very obstacle the dash is meant to smash.
  if (player.dashing) return input;
  const threat = nearestThreat(state);
  if (threat === null) {
    // No obstacle near: jump for a pie or golden feather floating above
    // the ground line, double-jumping if it is still above Tilly and
    // close. Only when nothing threatens — a jump for a pickup must
    // never carry Tilly into an obstacle.
    const val = nearestValuable(state);
    if (val !== null) {
      const p = val.pickup;
      if (player.grounded && p.y < FIELD.groundY - 80) input.jump = true;
      else if (!player.grounded && player.jumps < 2 && val.gap < 130 && p.y + p.height < player.y + 10) input.jump = true;
    }
    return input;
  }
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
  // A low hay bale, fence or oven with the dash ready is smashed through
  // instead — that is the dash's job, and it is how a real run earns the
  // smash banner and its points. The dash only lasts 0.22s, so the
  // autopilot holds its jump and waits until the obstacle is inside dash
  // range before dashing; dashing from far out would expire before
  // contact and waste the dash. One exception: an oven with a pie
  // floating above it is jumped over instead of dashed through. The
  // jump is a late one (gap < 170), so the arc passes through the pie
  // rather than over it, and the arc is ridden without a double jump or
  // an air dash — both would lift Tilly clear over the pie. Only once
  // the pie is behind her (gap <= -40) does normal handling resume, to
  // dodge the oven itself instead of chasing the pie.
  const pieAboveOven = o.kind === KIND_OVEN && state.pickups.some((p) => p.active && p.kind === KIND_PIE && Math.abs(p.x - (o.x + 30)) < 20);
  if (pieAboveOven) {
    if (player.grounded) {
      if (gap < 170) input.jump = true;
      return input;
    }
    if (gap > -40) return input;
  }
  if ((o.kind === KIND_HAY || o.kind === KIND_FENCE || o.kind === KIND_OVEN) && player.grounded && player.dashCooldown <= 0) {
    if (gap < 110) { input.dash = true; return input; }
    if (gap < 240) return input;
  }
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
  const limit = name === 'play' ? PLAY_SECONDS : END_LIMIT_SECONDS;
  if (name === 'caught') {
    // No dodging at all: Tilly runs straight into the obstacles, stumbles
    // three times and is caught (seed 1: at ~11s, 246m). Any input here
    // would risk the "caught" scene escaping, as the old half-skilled
    // autopilot did.
    for (let i = 0; i < limit / STEP; i += 1) {
      const events = world.step(STEP, { jump: false, dash: false, slide: false }, false);
      if (events & EVENT_OVER) break;
      if (events & EVENT_ESCAPED) break;
    }
  } else {
    const skillful = true;
    for (let i = 0; i < limit / STEP; i += 1) {
      const events = world.step(STEP, autopilot(world.state, skillful), false);
      if (events & EVENT_OVER) break;
      if (events & EVENT_ESCAPED) break;
    }
  }
  if (name === 'play' && !world.state.over && !world.state.escaped) {
    // Keep playing a little longer (at most 10s) until the frame shows the
    // real action at once: Tilly caught mid-jump over an obstacle, a dash
    // smash still fresh enough to show its banner, and a combo of 3 or
    // more on the board. A swinging knife in frame is preferred for the
    // first 3s, then dropped so the scene still lands in time. Nothing
    // here is staged by hand — every number on screen is the run's own.
    let waited = 0;
    for (let i = 0; i < 10 / STEP; i += 1) {
      world.step(STEP, autopilot(world.state, true), false);
      waited += STEP;
      const p = world.state.player;
      if (world.state.over || world.state.escaped) break;
      if (world.state.distance > 920 || world.state.dinnerLeft < 4) break;
      if (!p.grounded && world.state.smashTimer > 0 && world.state.combo >= 3 && p.dashCooldown > 0.3) {
        // The dash was spent a moment ago, so the fading DASH SMASH!
        // banner is still clearly visible in the frame.
        let overOne = false;
        for (const o of world.state.obstacles) {
          if (o.active && o.x < p.x + p.width + 40 && o.x + o.width > p.x - 20) { overOne = true; break; }
        }
        if (!overOne) continue;
        const knifeSeen = world.state.obstacles.some((o) => o.active && o.kind === KIND_KNIFE && o.x > p.x && o.x < FIELD.width);
        if (knifeSeen || waited > 3) break;
      }
    }
  }
  const state = world.state;
  if (state.escaped) return { screen: SCREEN_ESCAPED, best: Math.floor(state.score) };
  if (state.over) return { screen: SCREEN_OVER, best: Math.floor(state.score) };
  return { screen: SCREEN_PLAY, best: Math.floor(state.score) };
}
