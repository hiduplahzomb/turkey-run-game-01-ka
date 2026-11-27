// Drawing only: the world's state and the current screen in, pixels out.
// The 1280x720 playfield is scaled to fit the window and centred, the margin
// filled with the backdrop colour. Flat vector art drawn with canvas paths —
// no images, no fonts beyond the system stack. Text that holds a number is
// rebuilt only when the number changes, so a frame allocates nothing.
import { FIELD, FONT, GOAL_DISTANCE, LIVES, PALETTE, ZONES } from './config.js';
import { KIND_CORN, KIND_FENCE, KIND_FEATHER, KIND_HAY, KIND_KNIFE, KIND_MUD, KIND_OVEN, KIND_PIE, zoneAt } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_ESCAPED = 'escaped';

function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(1, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align = 'left', bold = false) {
    const key = size + (bold ? 'b' : '');
    if (!fonts.has(key)) fonts.set(key, `${bold ? '700 ' : ''}${size}px ${FONT}`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = 'top';
    context.fillText(value, x, y);
  }

  function panel(x, y, w, h) {
    context.fillStyle = PALETTE.panel;
    context.beginPath();
    context.roundRect(x, y, w, h, 18);
    context.fill();
    context.strokeStyle = 'rgba(255, 220, 140, 0.55)';
    context.lineWidth = 2;
    context.stroke();
  }

  function drawSky(state) {
    const zone = ZONES[state.zone];
    const grad = context.createLinearGradient(0, 0, 0, FIELD.groundY);
    grad.addColorStop(0, zone.skyTop);
    grad.addColorStop(0.55, zone.skyMid);
    grad.addColorStop(1, zone.skyBot);
    context.fillStyle = grad;
    context.fillRect(0, 0, FIELD.width, FIELD.groundY);
    // Low Thanksgiving sun.
    context.fillStyle = '#fff2c0';
    context.beginPath();
    context.arc(1050, 150, 54, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'rgba(255, 242, 192, 0.35)';
    context.beginPath();
    context.arc(1050, 150, 84, 0, Math.PI * 2);
    context.fill();
    // Drifting clouds, placed by distance so they parallax.
    context.fillStyle = 'rgba(255, 244, 214, 0.85)';
    for (let i = 0; i < 6; i += 1) {
      const cx = ((hash(i + 3) * 1400 - state.distance * 6 - i * 260) % 1500 + 1500) % 1500 - 110;
      const cy = 46 + hash(i + 11) * 120;
      context.beginPath();
      context.ellipse(cx, cy, 62, 18, 0, 0, Math.PI * 2);
      context.ellipse(cx + 42, cy + 6, 44, 14, 0, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawBackdrop(state) {
    const zone = state.zone;
    const off = state.distance * 14;
    context.save();
    if (zone === 0) {
      // Barn + windmill on the horizon.
      context.fillStyle = '#a34a2e';
      context.fillRect(((200 - off * 0.25) % 1500 + 1500) % 1500 - 110, 470, 190, 130);
      context.fillStyle = '#7e351f';
      context.beginPath();
      context.moveTo(((200 - off * 0.25) % 1500 + 1500) % 1500 - 125, 472);
      context.lineTo(((200 - off * 0.25) % 1500 + 1500) % 1500 - 15, 400);
      context.lineTo(((200 - off * 0.25) % 1500 + 1500) % 1500 + 95, 472);
      context.closePath();
      context.fill();
      context.fillStyle = '#e8d8a8';
      context.fillRect(((200 - off * 0.25) % 1500 + 1500) % 1500 - 30, 520, 60, 80);
    } else if (zone === 1) {
      // Corn rows marching to the horizon: stalks with leaves and cobs.
      for (let i = 0; i < 22; i += 1) {
        const cx = ((i * 97 - off * 0.4) % 1400 + 1400) % 1400 - 60;
        const h = 90 + hash(i) * 50;
        context.fillStyle = '#5a7a24';
        context.fillRect(cx, 600 - h, 7, h);
        context.fillStyle = '#7fae4c';
        context.beginPath();
        context.moveTo(cx + 3, 600 - h + 30);
        context.lineTo(cx - 16, 600 - h + 62);
        context.lineTo(cx + 3, 600 - h + 52);
        context.closePath();
        context.fill();
        context.fillStyle = '#f2c94c';
        context.beginPath();
        context.ellipse(cx + 10, 600 - h + 26, 7, 13, 0.3, 0, Math.PI * 2);
        context.fill();
      }
    } else {
      // Pine forest silhouettes.
      context.fillStyle = '#2c4a2e';
      for (let i = 0; i < 18; i += 1) {
        const cx = ((i * 113 - off * 0.35) % 1400 + 1400) % 1400 - 60;
        const h = 120 + hash(i + 40) * 110;
        context.beginPath();
        context.moveTo(cx, 600);
        context.lineTo(cx + 26, 600 - h);
        context.lineTo(cx + 52, 600);
        context.closePath();
        context.fill();
      }
    }
    context.restore();
  }

  function drawGround(state) {
    const zone = ZONES[state.zone];
    context.fillStyle = zone.ground;
    context.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
    context.fillStyle = zone.grass;
    context.fillRect(0, FIELD.groundY, FIELD.width, 10);
    // Speed lines on the dirt: dashes placed by distance, so they scroll.
    context.fillStyle = 'rgba(0, 0, 0, 0.18)';
    for (let i = 0; i < 14; i += 1) {
      const dx = ((i * 173 - state.distance * 14) % 1400 + 1400) % 1400 - 60;
      context.fillRect(dx, 640 + hash(i + 7) * 56, 46, 5);
    }
  }

  function drawTurkey(player, state, blink) {
    const cx = player.x + player.width / 2;
    const base = player.y + player.height;
    const flap = Math.sin(player.runPhase) * 0.5;
    const sliding = player.sliding;
    context.save();
    if (blink && player.invulnerable > 0 && Math.floor(player.invulnerable * 10) % 2 === 0 && !player.dashing) context.globalAlpha = 0.35;
    if (player.dashing) {
      context.strokeStyle = 'rgba(255, 220, 120, 0.8)';
      context.lineWidth = 4;
      for (let i = 1; i <= 3; i += 1) {
        context.beginPath();
        context.moveTo(cx - 40 - i * 22, base - 34 + i * 8);
        context.lineTo(cx - 8 - i * 22, base - 34 + i * 8);
        context.stroke();
      }
    }
    // Tail fan.
    for (let i = 0; i < 4; i += 1) {
      context.fillStyle = PALETTE.tail[i];
      context.beginPath();
      const ang = Math.PI + (i - 1.5) * 0.42;
      context.ellipse(cx - 26, base - (sliding ? 16 : 30), 16, 30, ang - Math.PI / 2, 0, Math.PI * 2);
      context.fill();
    }
    // Body.
    context.fillStyle = PALETTE.turkeyBody;
    context.beginPath();
    context.ellipse(cx, base - (sliding ? 16 : 30), sliding ? 34 : 26, sliding ? 14 : 26, 0, 0, Math.PI * 2);
    context.fill();
    // Wing, flapping while running.
    context.fillStyle = PALETTE.turkeyWing;
    context.beginPath();
    context.ellipse(cx - 4, base - (sliding ? 16 : 28) + flap * 6, 16, 10, -0.4 + flap * 0.4, 0, Math.PI * 2);
    context.fill();
    // Head + beak + wattle, facing right (the escape direction).
    const hy = base - (sliding ? 22 : 52);
    context.fillStyle = PALETTE.head;
    context.beginPath();
    context.arc(cx + 18, hy, 11, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.beak;
    context.beginPath();
    context.moveTo(cx + 26, hy - 2);
    context.lineTo(cx + 40, hy + 3);
    context.lineTo(cx + 26, hy + 7);
    context.closePath();
    context.fill();
    context.fillStyle = PALETTE.wattle;
    context.beginPath();
    context.ellipse(cx + 24, hy + 10, 4, 7, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#1a1a1a';
    context.beginPath();
    context.arc(cx + 21, hy - 3, 2.4, 0, Math.PI * 2);
    context.fill();
    // Legs, pumping while grounded.
    if (player.grounded && !sliding) {
      const lp = Math.sin(player.runPhase * 2) * 10;
      context.strokeStyle = '#e8a33c';
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(cx - 8, base - 8);
      context.lineTo(cx - 8 + lp, base + 2);
      context.moveTo(cx + 8, base - 8);
      context.lineTo(cx + 8 - lp, base + 2);
      context.stroke();
    }
    context.restore();
  }

  function drawFarmer(state) {
    // Farmer Bram runs in from the left as the gap closes; off-screen while far.
    const fx = state.player.x - 46 - state.farmerGap * 22;
    if (fx < -140) return;
    const base = FIELD.groundY;
    const bob = Math.sin(state.elapsed * 14) * 4;
    context.save();
    context.translate(fx, base + bob);
    context.fillStyle = PALETTE.farmerShirt;
    context.fillRect(18, -78, 44, 52);
    context.fillStyle = PALETTE.farmerSkin;
    context.beginPath();
    context.arc(40, -88, 15, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.farmerHat;
    context.fillRect(20, -104, 40, 10);
    context.fillRect(26, -118, 28, 16);
    context.fillStyle = '#3a2a1a';
    context.fillRect(18, -26, 12, 26);
    context.fillRect(50, -26, 12, 26);
    // Pitchfork, raised.
    context.strokeStyle = '#c9a86a';
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(66, -20);
    context.lineTo(84, -104);
    context.stroke();
    context.strokeStyle = '#d7dce4';
    context.lineWidth = 3;
    for (let i = -1; i <= 1; i += 1) {
      context.beginPath();
      context.moveTo(84 + i * 7, -104);
      context.lineTo(84 + i * 7, -122);
      context.stroke();
    }
    context.restore();
    // Shout bubble when he is close — clamped on-screen.
    if (state.farmerGap < 14) {
      const bx = Math.max(16, Math.min(fx + 10, FIELD.width - 206));
      panel(bx, FIELD.groundY - 190, 190, 44);
      text('“COME BACK HERE!”', bx + 10, FIELD.groundY - 178, 17, PALETTE.text, 'left', true);
    }
  }

  function drawObstacle(o) {
    if (o.kind === KIND_HAY) {
      context.fillStyle = PALETTE.hay;
      context.beginPath();
      context.arc(o.x + o.width / 2, o.y + o.height - 16, 30, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#b57f22';
      context.beginPath();
      context.arc(o.x + o.width / 2, o.y + o.height - 16, 20, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#8a5f14';
      context.lineWidth = 2;
      for (let i = -2; i <= 2; i += 1) {
        context.beginPath();
        context.moveTo(o.x + o.width / 2 + i * 10, o.y + 8);
        context.lineTo(o.x + o.width / 2 + i * 12, o.y + o.height - 30);
        context.stroke();
      }
    } else if (o.kind === KIND_FENCE) {
      context.fillStyle = PALETTE.fence;
      context.fillRect(o.x + 4, o.y, 10, o.height);
      context.fillRect(o.x + o.width - 14, o.y, 10, o.height);
      context.fillRect(o.x, o.y + 14, o.width, 9);
      context.fillRect(o.x, o.y + 44, o.width, 9);
    } else if (o.kind === KIND_OVEN) {
      context.fillStyle = PALETTE.ovenBody;
      context.beginPath();
      context.roundRect(o.x, o.y, o.width, o.height, 8);
      context.fill();
      context.fillStyle = '#171a21';
      context.beginPath();
      context.roundRect(o.x + 12, o.y + 34, o.width - 24, 44, 6);
      context.fill();
      // Fire inside the oven mouth.
      const fl = Math.sin(o.phase * 2) * 5;
      context.fillStyle = PALETTE.ovenFire;
      context.beginPath();
      context.moveTo(o.x + 20, o.y + 74);
      context.quadraticCurveTo(o.x + o.width / 2, o.y + 30 + fl, o.x + o.width - 20, o.y + 74);
      context.closePath();
      context.fill();
      context.fillStyle = '#ffd94d';
      context.beginPath();
      context.moveTo(o.x + 30, o.y + 74);
      context.quadraticCurveTo(o.x + o.width / 2, o.y + 48 + fl, o.x + o.width - 30, o.y + 74);
      context.closePath();
      context.fill();
      context.fillStyle = '#5a3a22';
      context.fillRect(o.x + o.width / 2 - 6, o.y - 26, 12, 28);
      text('OVEN', o.x + o.width / 2, o.y + 8, 13, '#ffb37a', 'center', true);
    } else if (o.kind === KIND_KNIFE) {
      // Wooden frame + pendulum carving knife: the blade sweeps sideways
      // from the top bar, hanging at standing head height.
      context.fillStyle = '#6e4a26';
      context.fillRect(o.x + 2, o.y, 8, o.height);
      context.fillRect(o.x + o.width - 10, o.y, 8, o.height);
      context.fillRect(o.x, o.y, o.width, 8);
      const pivotX = o.x + o.width / 2;
      const pivotY = o.y + 8;
      const swing = Math.sin(o.phase) * 0.5;
      const bx = pivotX + Math.sin(swing) * 62;
      const by = pivotY + Math.cos(swing) * 62;
      context.strokeStyle = '#8a6a42';
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(pivotX, pivotY);
      context.lineTo(bx, by);
      context.stroke();
      context.save();
      context.translate(bx, by);
      context.rotate(swing);
      context.fillStyle = PALETTE.knifeHandle;
      context.fillRect(-5, -24, 10, 22);
      context.fillStyle = PALETTE.knifeBlade;
      context.beginPath();
      context.moveTo(-9, -2);
      context.lineTo(9, -2);
      context.lineTo(0, 38);
      context.closePath();
      context.fill();
      context.restore();
    } else if (o.kind === KIND_MUD) {
      context.fillStyle = PALETTE.mud;
      context.beginPath();
      context.ellipse(o.x + o.width / 2, o.y + 8, o.width / 2, 9, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = 'rgba(255, 220, 150, 0.5)';
      context.beginPath();
      context.arc(o.x + 26, o.y + 6, 4, 0, Math.PI * 2);
      context.arc(o.x + 78, o.y + 9, 3, 0, Math.PI * 2);
      context.fill();
      text('MUD', o.x + o.width / 2, o.y - 18, 12, '#d9b48a', 'center', true);
    }
  }

  function drawPickup(p) {
    const bobY = Math.sin(p.bob) * 4;
    const cx = p.x + p.width / 2;
    const cy = p.y + p.height / 2 + bobY;
    if (p.kind === KIND_CORN) {
      context.fillStyle = PALETTE.corn;
      context.beginPath();
      context.ellipse(cx, cy, 9, 13, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#7fae4c';
      context.beginPath();
      context.moveTo(cx - 8, cy + 10);
      context.lineTo(cx, cy + 20);
      context.lineTo(cx + 8, cy + 10);
      context.closePath();
      context.fill();
    } else if (p.kind === KIND_PIE) {
      context.fillStyle = PALETTE.pie;
      context.beginPath();
      context.moveTo(cx - 14, cy + 6);
      context.lineTo(cx + 14, cy + 6);
      context.lineTo(cx, cy - 12);
      context.closePath();
      context.fill();
      context.fillStyle = '#f2c94c';
      context.beginPath();
      context.arc(cx, cy + 2, 4, 0, Math.PI * 2);
      context.fill();
    } else if (p.kind === KIND_FEATHER) {
      context.fillStyle = PALETTE.feather;
      context.beginPath();
      context.ellipse(cx, cy, 7, 16, 0.5, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#c9a227';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(cx - 4, cy + 12);
      context.lineTo(cx + 4, cy - 12);
      context.stroke();
    }
  }

  function drawHud(state, best) {
    // Top bar: score left, dinner countdown centre, lives + dash right.
    panel(16, 12, 300, 64);
    text(`SCORE ${Math.floor(state.score)}`, 30, 22, 24, PALETTE.text, 'left', true);
    text(`CORN ${state.corn}  PIE ${state.pies}  FEATHER ${state.feathers}`, 30, 52, 14, PALETTE.muted);
    const urgent = state.dinnerLeft < 30;
    panel(490, 12, 300, 64);
    text(urgent ? 'DINNER IN — HURRY!' : 'DINNER IN', 640, 20, 14, urgent ? PALETTE.danger : PALETTE.muted, 'center', true);
    text(fmtTime(state.dinnerLeft), 640, 36, 26, urgent ? PALETTE.danger : PALETTE.text, 'center', true);
    panel(964, 12, 300, 64);
    let hx = 978;
    for (let i = 0; i < LIVES; i += 1) {
      context.fillStyle = i < state.lives ? '#ff5a6e' : 'rgba(255,255,255,0.18)';
      context.beginPath();
      context.arc(hx + 8, 34, 9, 0, Math.PI * 2);
      context.arc(hx + 24, 34, 9, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.moveTo(hx, 38);
      context.lineTo(hx + 32, 38);
      context.lineTo(hx + 16, 56);
      context.closePath();
      context.fill();
      hx += 42;
    }
    const dashFrac = state.player.dashCooldown <= 0 ? 1 : 1 - state.player.dashCooldown / 1.6;
    context.fillStyle = 'rgba(255,255,255,0.18)';
    context.fillRect(978, 58, 120, 8);
    context.fillStyle = dashFrac >= 1 ? PALETTE.good : '#ffd94d';
    context.fillRect(978, 58, 120 * dashFrac, 8);
    text(state.player.dashCooldown <= 0 ? 'DASH READY' : 'DASH…', 1108, 52, 13, PALETTE.muted);
    // Distance progress bar with zone ticks.
    panel(16, 88, 1248, 40);
    context.fillStyle = 'rgba(255,255,255,0.18)';
    context.fillRect(30, 104, 1100, 10);
    context.fillStyle = '#7dff8a';
    context.fillRect(30, 104, 1100 * Math.min(1, state.distance / GOAL_DISTANCE), 10);
    text(`${Math.floor(state.distance)}m / ${GOAL_DISTANCE}m — ${ZONES[state.zone].name}`, 36, 118, 13, PALETTE.text, 'left', true);
    text(`BEST ${Math.max(best, Math.floor(state.score))}`, 1130, 118, 13, PALETTE.muted, 'left', true);
    // Farmer gap strip, bottom-left.
    panel(16, 640, 340, 56);
    const gapFrac = Math.min(1, state.farmerGap / 30);
    context.fillStyle = 'rgba(255,255,255,0.18)';
    context.fillRect(30, 676, 200, 8);
    context.fillStyle = state.farmerGap < 12 ? PALETTE.danger : '#ff9a3d';
    context.fillRect(30, 676, 200 * gapFrac, 8);
    text(`FARMER BRAM — ${Math.max(0, Math.floor(state.farmerGap))}m BEHIND`, 30, 650, 15, PALETTE.text, 'left', true);
    if (state.combo >= 3) text(`COMBO x${state.combo}`, 1140, 652, 20, '#ffd94d', 'left', true);
    if (state.player.dashing) text('DASH SMASH!', 640, 150, 30, '#ffd94d', 'center', true);
  }

  function drawTitle(state, best) {
    panel(290, 150, 700, 330);
    text('GOBBLE DASH', 640, 168, 64, '#ffd94d', 'center', true);
    text('Escape Before Dinner', 640, 238, 30, PALETTE.text, 'center', true);
    text('Tilly the turkey has 3 minutes to run 1000m to Freedom Forest', 640, 288, 18, PALETTE.muted, 'center');
    text('before Farmer Bram serves her for Thanksgiving dinner.', 640, 312, 18, PALETTE.muted, 'center');
    text('SPACE / CLICK LEFT — jump (x2)      SHIFT / CLICK RIGHT — dash', 640, 352, 17, PALETTE.text, 'center');
    text('DOWN — slide under the carving knife      Corn +10 · Pie +25 · Golden feather +50', 640, 378, 17, PALETTE.text, 'center');
    text('Press SPACE or click to run!', 640, 420, 20, PALETTE.good, 'center', true);
    if (best > 0) text(`BEST SCORE ${best}`, 640, 452, 15, PALETTE.muted, 'center');
  }

  function drawOver(state, best, escaped) {
    panel(290, 150, 700, 340);
    if (escaped) {
      text('ESCAPED!', 640, 168, 64, PALETTE.good, 'center', true);
      text('Tilly reached Freedom Forest — no dinner today!', 640, 238, 20, PALETTE.text, 'center');
    } else {
      text('CAUGHT!', 640, 168, 64, PALETTE.danger, 'center', true);
      text(state.dinnerLeft <= 0 ? 'The dinner bell rang — Tilly is on the table.' : 'Farmer Bram caught Tilly at the fence.', 640, 238, 20, PALETTE.text, 'center');
    }
    text(`SCORE ${Math.floor(state.score)}   DISTANCE ${Math.floor(state.distance)}m / ${GOAL_DISTANCE}m`, 640, 292, 22, PALETTE.text, 'center', true);
    text(`CORN ${state.corn}   PIES ${state.pies}   FEATHERS ${state.feathers}   BEST COMBO x${state.bestCombo}`, 640, 328, 18, PALETTE.muted, 'center');
    text(`BEST ${Math.max(best, Math.floor(state.score))}`, 640, 362, 18, PALETTE.muted, 'center');
    text('Press SPACE or click to run again!', 640, 420, 20, PALETTE.good, 'center', true);
  }

  function drawPaused() {
    panel(440, 280, 400, 130);
    text('PAUSED', 640, 300, 44, PALETTE.text, 'center', true);
    text('Press P or SPACE to keep running', 640, 356, 18, PALETTE.muted, 'center');
  }

  function draw(state, screen, best) {
    resize();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = '#1b1f2a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawSky(state);
    drawBackdrop(state);
    drawGround(state);
    for (const p of state.pickups) if (p.active) drawPickup(p);
    for (const o of state.obstacles) if (o.active) drawObstacle(o);
    drawFarmer(state);
    drawTurkey(state.player, state, screen === SCREEN_PLAY || screen === SCREEN_PAUSED);
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(state, best);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    if (screen === SCREEN_OVER) drawOver(state, best, false);
    if (screen === SCREEN_ESCAPED) drawOver(state, best, true);
    if (screen === SCREEN_PAUSED) drawPaused();
  }

  return { draw };
}
