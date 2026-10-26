// Core of the renderer: canvas, timeline state lookups, drawing helpers and the per-frame entry point.
// The page exposes window.init(timeline) and window.renderFrame(t); src/render.js drives both.
const W = 1920;
const H = 1080;
const TAU = Math.PI * 2;
const INK = '#1b1b1f';
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let TL = null;

const LEADERS = ['putin', 'kim', 'trump', 'xi'];
const CHARS = {
  putin: { x: 520, y: 420 },
  kim: { x: 840, y: 420 },
  trump: { x: 1160, y: 420 },
  xi: { x: 1460, y: 420 },
  gary: { x: 1760, y: 395 },
};
const TABLE_Y = 730;
const WINDOW = { x: 40, y: 110, w: 260, h: 420 };
const WORLD = { x0: -500, x1: 2420 };
// Close-up framing; the vertical storyboard swaps in a looser one with headroom for portrait crops.
const CLOSE_FRAMING = { s: 2.0, dy: 110 };

const DEFAULTS = {
  scene: 'disclaimer', shot: 'wide', hands: false, counterOn: false, counter: 0, caption: '',
  trolleyX: -500, trolleyOffer: false, censor: false, gary: 1, pink: false, hat: false, teaToGary: 0,
  tvActive: -1, shake: 0, button_xi: false, press: null, duck_kim: 0, bearCover: false, bearSweat: false,
  letterbox: false, honeyX: 0, trolleyCargo: 'tea', coke: false, garyCup: false, xiSip: false,
};

// ---- Timeline state ---------------------------------------------------------------------------

function lastEvent(key, t) {
  const arr = TL.state[key];
  if (!arr) return null;
  let lo = 0;
  let hi = arr.length - 1;
  let idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].t <= t) { idx = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return idx < 0 ? null : { e: arr[idx], prev: arr[idx - 1] };
}

function defaultFor(key) {
  if (key.startsWith('fingers_')) return 10;
  if (key.startsWith('look_') || key.startsWith('reachTo_')) return null;
  if (key.startsWith('reach_')) return 0;
  return DEFAULTS[key];
}

// Value of a state key at time t, interpolating tweened numbers.
function S(key, t) {
  const r = lastEvent(key, t);
  const def = defaultFor(key);
  if (!r) return def;
  const { e, prev } = r;
  if (e.tw && typeof e.v === 'number') {
    const from = prev ? prev.v : def;
    return from + (e.v - from) * easeInOut(Math.min(1, (t - e.t) / e.tw));
  }
  return e.v;
}

// Seconds since a key last changed (Infinity if never).
function since(key, t) {
  const r = lastEvent(key, t);
  return r ? t - r.e.t : Infinity;
}

function tweening(key, t) {
  const r = lastEvent(key, t);
  return !!(r && r.e.tw && t - r.e.t < r.e.tw);
}

function activeFx(name, t) {
  for (const f of TL.fx) if (f.name === name && t >= f.t && t < f.t + f.dur) return (t - f.t) / f.dur;
  return null;
}

function activeSpeech(t) {
  for (const s of TL.speech) if (t >= s.start && t < s.start + s.dur) return s;
  return null;
}

// 0 = closed, 1 = half open, 2 = wide open; driven by the voice line's loudness.
function mouthOpen(who, t) {
  const s = activeSpeech(t);
  if (!s || !s.who.includes(who)) return 0;
  const v = s.env[Math.floor((t - s.start) * 24)] || 0;
  return v > 0.55 ? 2 : v > 0.2 ? 1 : 0;
}

function lookVector(who, t) {
  let target = S(`look_${who}`, t);
  if (target == null) {
    const s = activeSpeech(t);
    target = s && !s.who.includes(who) && CHARS[s.who[0]] ? s.who[0] : 'camera';
  }
  if (target === 'camera') return { dx: 0, dy: 0 };
  if (target === 'down') return { dx: 0, dy: 1 };
  const me = CHARS[who];
  const points = {
    window: { x: WINDOW.x + WINDOW.w / 2, y: 320 },
    missile: { x: 1000, y: 330 },
    trolley: { x: S('trolleyX', t), y: 760 },
  };
  const p = points[target] || CHARS[target] || { x: me.x, y: me.y };
  const dx = p.x - me.x;
  const dy = (p.y - me.y) * 0.6;
  const d = Math.hypot(dx, dy) || 1;
  return { dx: dx / d, dy: dy / d };
}

function blinking(who, t) {
  const phase = { putin: 0.3, kim: 1.1, trump: 2.2, xi: 0.7, gary: 1.7 }[who] || 0.5;
  const period = 3.2 + phase;
  return (t + phase * 1.7) % period < 0.13;
}

// ---- Drawing helpers --------------------------------------------------------------------------

function easeInOut(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
function easeOutBack(p) { const c = 1.7; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, p) { return a + (b - a) * p; }

function shape(fill, stroke = INK, lw = 4) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function ell(x, y, rx, ry, fill, stroke = INK, lw = 4, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
  shape(fill, stroke, lw);
}
function rrect(x, y, w, h, r, fill, stroke = INK, lw = 4) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  shape(fill, stroke, lw);
}
function poly(pts, fill, stroke = INK, lw = 4) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  shape(fill, stroke, lw);
}
function path(fn, fill, stroke = INK, lw = 4) {
  ctx.beginPath();
  fn(ctx);
  shape(fill, stroke, lw);
}
function line(pts, stroke = INK, lw = 4) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.lineCap = 'round';
  shape(null, stroke, lw);
}
function text(str, x, y, size, color, o = {}) {
  ctx.font = `${o.weight || 800} ${size}px ${o.font || 'Inter'}`;
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = o.baseline || 'middle';
  if (o.stroke) {
    ctx.lineWidth = o.strokeWidth || size / 6;
    ctx.strokeStyle = o.stroke;
    ctx.lineJoin = 'round';
    ctx.strokeText(str, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function wrapText(str, maxWidth, size, font = 'Inter', weight = 800) {
  ctx.font = `${weight} ${size}px ${font}`;
  const words = str.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && cur) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}
function heart(x, y, s, fill) {
  path(c => {
    c.moveTo(x, y + s * 0.3);
    c.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
    c.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
    c.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
    c.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
  }, fill, INK, 3);
}

// Deterministic pseudo-random numbers, so every render of a frame is identical.
function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

let grain = null;
function paperGrain() {
  if (grain) return grain;
  const g = document.createElement('canvas');
  g.width = g.height = 256;
  const gc = g.getContext('2d');
  const img = gc.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (hash(i * 0.37) - 0.5) * 90;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  gc.putImageData(img, 0, 0);
  grain = ctx.createPattern(g, 'repeat');
  return grain;
}

// Construction-paper texture over the whole frame.
function applyGrain() {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = paperGrain();
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// ---- Camera -----------------------------------------------------------------------------------

function cameraFor(t) {
  let shot = S('shot', t);
  const push = shot.endsWith('+push');
  shot = shot.replace('+push', '');
  let cam = { cx: W / 2, cy: H / 2, s: 1 };
  const [kind, arg] = shot.split(':');
  if (kind === 'close') cam = { cx: CHARS[arg].x, cy: CHARS[arg].y + CLOSE_FRAMING.dy, s: CLOSE_FRAMING.s };
  if (kind === 'hands') cam = { cx: CHARS[arg].x, cy: CHARS[arg].y + 225, s: 4.5 };
  if (kind === 'eyes') cam = { cx: CHARS[arg].x, cy: CHARS[arg].y - 6, s: 6.5 };
  if (kind === 'pt') {
    const [x, y, s] = arg.split(',').map(Number);
    cam = { cx: x, cy: y, s };
  }
  if (kind === 'two') {
    const [a, b] = arg.split(',');
    cam = { cx: (CHARS[a].x + CHARS[b].x) / 2, cy: 530, s: 1.55 };
  }
  if (push) cam.s *= 1 + 0.1 * easeInOut(Math.min(1, since('shot', t) / 3));
  const hw = W / 2 / cam.s;
  const hh = H / 2 / cam.s;
  cam.cx = clamp(cam.cx, WORLD.x0 + hw, WORLD.x1 - hw);
  cam.cy = clamp(cam.cy, hh, H - hh);
  const sh = since('shake', t);
  if (sh < 0.5) {
    const a = 16 * (1 - sh / 0.5);
    cam.cx += Math.sin(t * 95) * a / cam.s;
    cam.cy += Math.cos(t * 80) * a / cam.s;
  }
  return cam;
}

function applyCamera(cam) {
  ctx.setTransform(cam.s, 0, 0, cam.s, W / 2 - cam.cx * cam.s, H / 2 - cam.cy * cam.s);
}

// ---- Entry points -----------------------------------------------------------------------------

window.init = timeline => { TL = timeline; };

// opts.subs: draw subtitles (default true). opts.label: storyboard panel label in the corner.
window.renderFrame = (t, opts = {}) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  const scene = S('scene', t);
  SCENES[scene](t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (scene === 'room') roomOverlays(t);
  applyGrain();
  if ((scene === 'room' || scene === 'tv') && opts.subs !== false) drawSubtitle(t);
  if (opts.label) {
    ctx.font = '800 34px Inter';
    const w = ctx.measureText(opts.label).width;
    rrect(24, 24, w + 40, 58, 8, 'rgba(255,255,255,0.92)', INK, 4);
    text(opts.label, 44, 54, 34, INK, { align: 'left' });
  }
};

function drawSubtitle(t) {
  const sub = TL.subs.find(s => t >= s.start && t < s.end);
  if (!sub) return;
  const size = 44;
  ctx.letterSpacing = '2px';
  const lines = wrapText(sub.text, 1500, size, 'Inter', 700);
  ctx.letterSpacing = '2px';
  lines.forEach((l, i) => {
    const y = H - 60 - (lines.length - 1 - i) * (size * 1.2);
    text(l, W / 2, y, size, '#fff', { stroke: '#000', strokeWidth: 8, weight: 700 });
  });
  ctx.letterSpacing = '0px';
}
