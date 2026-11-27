// The game's rules and state, with no drawing and no browser in it: Tilly
// the turkey, Farmer Bram's closing gap, the dinner countdown, obstacles,
// pickups, zones, score and lives. step() advances one fixed step and returns
// what happened as bit flags, so the caller can react without the world
// knowing about screens or sound. Nothing here allocates after createWorld.
import { DINNER_SECONDS, FIELD, GOAL_DISTANCE, LIVES, OBSTACLE, PICKUP, PLAYER, SCORE, WORLD, ZONES } from './config.js';

export const KIND_HAY = 0;
export const KIND_FENCE = 1;
export const KIND_OVEN = 2;
export const KIND_KNIFE = 3;
export const KIND_MUD = 4;
export const KIND_CORN = 5;
export const KIND_PIE = 6;
export const KIND_FEATHER = 7;

export const EVENT_HIT = 1;
export const EVENT_PICKUP = 2;
export const EVENT_OVER = 4;
export const EVENT_ESCAPED = 8;
export const EVENT_SMASH = 16;

const POOL_OBSTACLES = 24;
const POOL_PICKUPS = 32;

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function zoneAt(distance) {
  for (let i = ZONES.length - 1; i >= 0; i -= 1) if (distance >= ZONES[i].from) return i;
  return 0;
}

export function createWorld(random) {
  const player = {
    x: PLAYER.x, y: FIELD.groundY - PLAYER.height, width: PLAYER.width, height: PLAYER.height,
    vy: 0, grounded: true, jumps: 0, dashing: false, dashTimer: 0, dashCooldown: 0,
    sliding: false, slideTimer: 0, invulnerable: 0, mudTimer: 0, runPhase: 0,
  };
  const obstacles = [];
  for (let i = 0; i < POOL_OBSTACLES; i += 1) {
    obstacles.push({ active: false, kind: KIND_HAY, x: 0, y: 0, width: 0, height: 0, phase: 0, smashed: false });
  }
  const pickups = [];
  for (let i = 0; i < POOL_PICKUPS; i += 1) {
    pickups.push({ active: false, kind: KIND_CORN, x: 0, y: 0, width: 0, height: 0, bob: 0 });
  }
  const state = {
    player, obstacles, pickups,
    score: 0, distance: 0, lives: LIVES, elapsed: 0, dinnerLeft: DINNER_SECONDS,
    farmerGap: 26, combo: 0, bestCombo: 0, corn: 0, pies: 0, feathers: 0,
    zone: 0, speed: WORLD.baseSpeed, spawnTimer: 1.1, sinceStumble: 99, over: false, escaped: false,
  };

  function reset() {
    player.y = FIELD.groundY - PLAYER.height;
    player.vy = 0; player.grounded = true; player.jumps = 0;
    player.dashing = false; player.dashTimer = 0; player.dashCooldown = 0;
    player.sliding = false; player.slideTimer = 0; player.invulnerable = 0; player.mudTimer = 0;
    for (const o of obstacles) o.active = false;
    for (const p of pickups) p.active = false;
    state.score = 0; state.distance = 0; state.lives = LIVES; state.elapsed = 0;
    state.dinnerLeft = DINNER_SECONDS; state.farmerGap = 26; state.combo = 0; state.bestCombo = 0;
    state.corn = 0; state.pies = 0; state.feathers = 0; state.zone = 0;
    state.speed = WORLD.baseSpeed; state.spawnTimer = 1.1; state.sinceStumble = 99;
    state.over = false; state.escaped = false;
  }

  function freeObstacle() {
    for (const o of obstacles) if (!o.active) return o;
    return null;
  }
  function freePickup() {
    for (const p of pickups) if (!p.active) return p;
    return null;
  }

  function spawnObstacle() {
    const o = freeObstacle();
    if (o === null) return;
    const zone = state.zone;
    const roll = random();
    let kind = KIND_HAY;
    if (zone === 0) kind = roll < 0.45 ? KIND_HAY : roll < 0.8 ? KIND_FENCE : KIND_MUD;
    else if (zone === 1) kind = roll < 0.3 ? KIND_HAY : roll < 0.55 ? KIND_FENCE : roll < 0.8 ? KIND_KNIFE : KIND_MUD;
    else kind = roll < 0.25 ? KIND_HAY : roll < 0.45 ? KIND_FENCE : roll < 0.7 ? KIND_OVEN : roll < 0.9 ? KIND_KNIFE : KIND_MUD;
    o.active = true; o.kind = kind; o.smashed = false; o.phase = random() * Math.PI * 2;
    if (kind === KIND_HAY) { o.width = OBSTACLE.hay.width; o.height = OBSTACLE.hay.height; }
    else if (kind === KIND_FENCE) { o.width = OBSTACLE.fence.width; o.height = OBSTACLE.fence.height; }
    else if (kind === KIND_OVEN) { o.width = OBSTACLE.oven.width; o.height = OBSTACLE.oven.height; }
    else if (kind === KIND_KNIFE) { o.width = OBSTACLE.knife.width; o.height = OBSTACLE.knife.height; }
    else { o.width = OBSTACLE.mud.width; o.height = OBSTACLE.mud.height; }
    o.x = FIELD.width + 40;
    o.y = kind === KIND_MUD ? FIELD.groundY - o.height : FIELD.groundY - o.height;
    // A reward arc over the low obstacles, so a good jump pays twice.
    if (kind === KIND_HAY || kind === KIND_FENCE) {
      const n = 2 + Math.floor(random() * 2);
      for (let i = 0; i < n; i += 1) {
        const p = freePickup();
        if (p === null) break;
        p.active = true; p.kind = KIND_CORN;
        p.width = PICKUP.corn.size; p.height = PICKUP.corn.size;
        p.x = o.x + 10 + i * 34; p.y = FIELD.groundY - 150 - (i === 1 ? 26 : 0); p.bob = random() * 6;
      }
    } else if (kind === KIND_OVEN && random() < 0.5) {
      const p = freePickup();
      if (p !== null) {
        p.active = true; p.kind = KIND_PIE; p.width = PICKUP.pie.size; p.height = PICKUP.pie.size;
        p.x = o.x + 30; p.y = FIELD.groundY - 210; p.bob = 0;
      }
    }
  }

  function spawnPickupLine() {
    const kind = random() < 0.12 ? KIND_FEATHER : KIND_CORN;
    const size = kind === KIND_FEATHER ? PICKUP.feather.size : PICKUP.corn.size;
    const y = FIELD.groundY - 90 - random() * 120;
    const n = kind === KIND_FEATHER ? 1 : 3 + Math.floor(random() * 3);
    for (let i = 0; i < n; i += 1) {
      const p = freePickup();
      if (p === null) break;
      p.active = true; p.kind = kind; p.width = size; p.height = size;
      p.x = FIELD.width + 40 + i * 44; p.y = y; p.bob = random() * 6;
    }
  }

  function playerBox() {
    if (player.sliding) return { x: player.x + 4, y: player.y + 30, width: player.width - 8, height: player.height - 30 };
    return { x: player.x + 6, y: player.y + 4, width: player.width - 14, height: player.height - 4 };
  }

  function knifeBox(o) {
    // The blade is a pendulum: it sweeps sideways from the top of the frame.
    // Its danger zone sits at standing head height, so a sliding turkey
    // (low profile) always passes under it and a jumping turkey clears it
    // mid-arc — the knife punishes standing still, never a correct move.
    return { x: o.x + o.width / 2 - 12 + Math.sin(o.phase) * 30, y: o.y + 40, width: 24, height: 40 };
  }

  function stumble() {
    state.lives -= 1;
    state.farmerGap = Math.max(0, state.farmerGap - 7);
    state.combo = 0;
    state.score = Math.max(0, state.score - SCORE.stumblePenalty);
    player.invulnerable = 1.6;
    state.sinceStumble = 0;
    if (state.lives <= 0 || state.farmerGap <= 0) { state.over = true; return EVENT_OVER; }
    return EVENT_HIT;
  }

  // One fixed step. input: { jump (edge), dash (edge), slide (held) }.
  // harmless: title-screen backdrop — the world scrolls but nothing can
  // hurt Tilly and nothing scores.
  function step(dt, input, harmless) {
    if (state.over || state.escaped) return 0;
    let events = 0;
    state.elapsed += dt;
    if (!harmless) state.dinnerLeft = Math.max(0, state.dinnerLeft - dt);
    state.zone = zoneAt(state.distance);
    let speed = WORLD.baseSpeed + WORLD.speedPerZone * state.zone;
    if (player.mudTimer > 0) speed *= WORLD.mudSlow;
    if (player.dashing) speed += 420;
    state.speed = Math.min(WORLD.maxSpeed + 420, speed);
    state.sinceStumble += dt;

    // Farmer Bram: clean running slowly rebuilds the gap; dashing gains more.
    if (!harmless && state.sinceStumble > 3) {
      state.farmerGap = Math.min(30, state.farmerGap + (player.dashing ? 2.0 : 0.9) * dt);
    }

    if (input.jump && (player.grounded || player.jumps < 2)) {
      player.vy = player.grounded ? -PLAYER.jumpSpeed : -PLAYER.doubleJumpSpeed;
      player.grounded = false;
      player.jumps += 1;
      player.sliding = false;
    }
    if (input.dash && player.dashCooldown <= 0 && !player.dashing) {
      player.dashing = true; player.dashTimer = PLAYER.dashSeconds;
      player.dashCooldown = PLAYER.dashCooldown; player.invulnerable = Math.max(player.invulnerable, PLAYER.dashSeconds + 0.05);
    }
    if (input.slide && player.grounded && !player.dashing) {
      if (!player.sliding) { player.sliding = true; player.slideTimer = PLAYER.slideSeconds; }
    }
    if (player.dashTimer > 0) { player.dashTimer -= dt; if (player.dashTimer <= 0) player.dashing = false; }
    if (player.dashCooldown > 0) player.dashCooldown -= dt;
    if (player.slideTimer > 0) { player.slideTimer -= dt; if (player.slideTimer <= 0) player.sliding = false; }
    if (player.invulnerable > 0) player.invulnerable = Math.max(0, player.invulnerable - dt);
    if (player.mudTimer > 0) player.mudTimer -= dt;

    player.vy += PLAYER.gravity * dt;
    player.y += player.vy * dt;
    if (player.y >= FIELD.groundY - player.height) {
      player.y = FIELD.groundY - player.height; player.vy = 0; player.grounded = true; player.jumps = 0;
    }
    player.runPhase += dt * (player.grounded ? state.speed / 34 : 4);

    const metres = (state.speed * dt) / 14;
    state.distance += metres;
    if (!harmless) state.score += metres * SCORE.perMetre;

    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      if (random() < 0.3) spawnPickupLine(); else spawnObstacle();
      const gap = OBSTACLE.gapMin + random() * (OBSTACLE.gapMax - OBSTACLE.gapMin);
      state.spawnTimer = gap / state.speed;
    }

    const box = playerBox();
    for (const o of obstacles) {
      if (!o.active) continue;
      o.x -= state.speed * dt;
      o.phase += dt * 3.2;
      if (o.x + o.width < -60) { o.active = false; continue; }
      if (harmless) continue;
      const hit = o.kind === KIND_KNIFE ? knifeBox(o) : { x: o.x + 8, y: o.y + 6, width: o.width - 16, height: o.height - 6 };
      if (!overlaps(box, hit)) continue;
      if (o.kind === KIND_MUD) {
        player.mudTimer = WORLD.mudSeconds;
        o.active = false;
        continue;
      }
      if (player.dashing) {
        o.active = false; o.smashed = true;
        state.score += 25; state.combo += 1; state.bestCombo = Math.max(state.bestCombo, state.combo);
        events |= EVENT_SMASH;
        continue;
      }
      if (player.invulnerable > 0) continue;
      o.active = false;
      events |= stumble();
      if (state.over) break;
    }
    for (const p of pickups) {
      if (!p.active) continue;
      p.x -= state.speed * dt;
      p.bob += dt * 3;
      if (p.x + p.width < -40) { p.active = false; continue; }
      if (harmless) continue;
      if (!overlaps(box, { x: p.x, y: p.y, width: p.width, height: p.height })) continue;
      p.active = false;
      if (p.kind === KIND_CORN) { state.score += PICKUP.corn.points; state.corn += 1; }
      else if (p.kind === KIND_PIE) { state.score += PICKUP.pie.points; state.pies += 1; }
      else { state.score += PICKUP.feather.points; state.feathers += 1; player.dashCooldown = 0; }
      state.combo += 1; state.bestCombo = Math.max(state.bestCombo, state.combo);
      events |= EVENT_PICKUP;
    }

    if (!harmless && state.distance >= GOAL_DISTANCE) {
      state.escaped = true;
      state.score += SCORE.escapeBonus;
      events |= EVENT_ESCAPED;
    }
    if (!harmless && state.dinnerLeft <= 0 && !state.escaped) {
      state.over = true;
      events |= EVENT_OVER;
    }
    return events;
  }

  reset();
  return { state, reset, step, zoneAt };
}
