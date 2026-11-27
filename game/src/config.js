// GOBBLE DASH: Escape Before Dinner — config: every tuning number, colour
// and zone in one place. The playfield is a fixed 1280x720 logical area; the
// renderer scales it to the window, so no rule below depends on screen size.
// Tilly the turkey must cover GOAL_DISTANCE metres before the dinner timer
// runs out; Farmer Bram chases from behind and every stumble lets him close
// the gap. Three stumbles and she is caught.
export const FIELD = { width: 1280, height: 720, groundY: 600 };

export const STEP = 1 / 60;

export const GOAL_DISTANCE = 1000;
// A skilled run covers 1000m in ~35s, so the dinner bell is set at 40s:
// the whole run eats almost the whole timer, and at ~770m only ~10s are
// left for the last ~230m — real tension, not a 3-minute stroll.
export const DINNER_SECONDS = 40;

export const PLAYER = {
  x: 300,
  width: 64,
  height: 64,
  jumpSpeed: 1050,
  doubleJumpSpeed: 920,
  gravity: 2600,
  dashSpeed: 1500,
  dashSeconds: 0.22,
  dashCooldown: 1.0,
  slideSeconds: 0.55,
};

export const WORLD = {
  baseSpeed: 340,
  speedPerZone: 70,
  maxSpeed: 620,
  mudSlow: 0.55,
  mudSeconds: 1.2,
};

export const LIVES = 3;

export const ZONES = [
  { name: 'BARN YARD', from: 0, to: 333, skyTop: '#ff9a3d', skyMid: '#ffc46b', skyBot: '#ffe3a1', ground: '#b5773a', grass: '#7fae4c' },
  { name: 'CORNFIELD', from: 334, to: 666, skyTop: '#e86a4e', skyMid: '#f2a65e', skyBot: '#ffd98a', ground: '#8a5a28', grass: '#c9a227' },
  { name: 'PINE FOREST', from: 667, to: 1000, skyTop: '#5a3d7a', skyMid: '#8a5fa8', skyBot: '#e8a56b', ground: '#4a3a26', grass: '#3f7a44' },
];

export const OBSTACLE = {
  hay: { width: 74, height: 58 },
  fence: { width: 56, height: 84 },
  oven: { width: 92, height: 96 },
  knife: { width: 46, height: 120 },
  mud: { width: 120, height: 14 },
  gapMin: 300,
  gapMax: 470,
};

export const PICKUP = {
  corn: { size: 26, points: 10 },
  pie: { size: 30, points: 25 },
  feather: { size: 30, points: 50 },
};

export const SCORE = { perMetre: 1, stumblePenalty: 25, escapeBonus: 500 };

export const PALETTE = {
  turkeyBody: '#8a5230',
  turkeyWing: '#6e3f22',
  tail: ['#a0522d', '#d2691e', '#e8a33c', '#c94f32'],
  head: '#e8d8c8',
  wattle: '#e5534b',
  beak: '#f2a93b',
  farmerShirt: '#3b6ea5',
  farmerHat: '#7a5a2e',
  farmerSkin: '#e8b88a',
  knifeBlade: '#d7dce4',
  knifeHandle: '#5a3a22',
  ovenBody: '#3a3f4a',
  ovenFire: '#ff7a1a',
  hay: '#d9a441',
  fence: '#8a6a42',
  mud: '#5a3a1e',
  corn: '#f2c94c',
  pie: '#c96a3b',
  feather: '#ffd94d',
  panel: 'rgba(20, 16, 10, 0.93)',
  text: '#fff6e0',
  muted: '#ffe9b8',
  danger: '#ff4d3d',
  good: '#7dff8a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const BEST_KEY = 'gobble-dash.best';
