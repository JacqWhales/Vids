// Vertical-scroll (WEBTOON-style) storyboard. Each beat becomes one strip block, 800px wide:
// a crop of the frame shaped for the shot, speech bubbles pointing at the speaker,
// lettered sound effects and the odd narration box. src/webtoon.js stitches the blocks.
const STRIP_W = 800;
const DIALOGUE_FONT = "'Comic Neue'";
const frameCopy = document.createElement('canvas');
frameCopy.width = W;
frameCopy.height = H;

const ANCHORS = { anchorUS: 0, anchorRU: 1, anchorCN: 2, anchorKP: 3 };

function worldToScreen(cam, x, y) {
  return { x: (x - cam.cx) * cam.s + W / 2, y: (y - cam.cy) * cam.s + H / 2 };
}

// Where each speaker's head is on screen, for aiming bubble tails.
function speakerPoints(p) {
  const pts = [];
  for (const who of p.who) {
    if (p.scene === 'tv' && who in ANCHORS) {
      const i = ANCHORS[who];
      pts.push({ x: (i % 2) * (W / 2) + 480, y: Math.floor(i / 2) * (H / 2) + 160 });
    } else if (p.scene === 'room') {
      const cam = cameraFor(p.at);
      if (CHARS[who]) pts.push(worldToScreen(cam, CHARS[who].x, CHARS[who].y - 30));
      if (who === 'waiter') pts.push(worldToScreen(cam, S('trolleyX', p.at) - 200, 620));
    }
  }
  return pts;
}

function layoutFor(p) {
  const kind = p.scene === 'room' ? p.shot.replace('+push', '').split(':')[0] : p.scene;
  const arg = p.shot.replace('+push', '').split(':')[1];
  if (kind === 'close') {
    const pw = 560;
    const ph = 700;
    const sw = H * pw / ph;
    const cx = worldToScreen(cameraFor(p.at), CHARS[arg].x, 0).x;
    const left = CHARS[arg].x < W / 2;
    return { pw, ph, px: left ? 34 : STRIP_W - 34 - pw, src: [clamp(cx - sw / 2, 0, W - sw), 0, sw, H] };
  }
  if (kind === 'two') return { pw: 760, ph: 570, px: 20, src: [(W - 1440) / 2, 0, 1440, H] };
  if (kind === 'hands' || kind === 'pt') return { pw: 470, ph: 470, px: (STRIP_W - 470) / 2, src: [(W - H) / 2, 0, H, H] };
  if (kind === 'eyes') return { pw: STRIP_W, ph: 260, px: 0, src: [0, H / 2 - 312, W, 624], bleed: true };
  if (kind === 'black') return { pw: STRIP_W, ph: 520, px: 0, black: true, bleed: true };
  if (kind === 'tv') {
    const a = S('tvActive', p.at);
    const src = a < 0 ? [0, 0, W, H] : [(a % 2) * (W / 2), Math.floor(a / 2) * (H / 2), W / 2, H / 2];
    return { pw: 760, ph: 428, px: 20, src };
  }
  return { pw: STRIP_W, ph: 450, px: 0, src: [0, 0, W, H], bleed: true };
}

function isShout(str) {
  const letters = str.replace(/[^A-Za-z]/g, '');
  return letters.length > 0 && letters.replace(/[^A-Z]/g, '').length / letters.length > 0.6;
}

function bubbleSpec(str) {
  const shout = isShout(str);
  const font = shout ? 'Bangers' : DIALOGUE_FONT;
  const weight = shout ? 400 : 700;
  const size = shout ? 54 : 30;
  const lines = wrapText(shout ? str.toUpperCase() : str, shout ? 520 : 470, size, font, weight);
  ctx.font = `${weight} ${size}px ${font}`;
  const textW = Math.max(...lines.map(l => ctx.measureText(l).width));
  return { lines, font, weight, size, shout, w: textW + (shout ? 110 : 64), h: lines.length * size * 1.22 + (shout ? 70 : 40) };
}

function bubblePath(b, cx, top) {
  const cy = top + b.h / 2;
  ctx.beginPath();
  if (!b.shout) {
    ctx.roundRect(cx - b.w / 2, top, b.w, b.h, Math.min(b.h / 2, 46));
    return;
  }
  const n = 26;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const r = i % 2 ? 1 : 1.16 + hash(i) * 0.08;
    const x = cx + Math.cos(a) * (b.w / 2) * r;
    const y = cy + Math.sin(a) * (b.h / 2) * r;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}

function tailPath(cx, baseY, tip) {
  const dir = Math.sign(tip.x - cx) || 1;
  const bx = clamp(tip.x, cx - 60, cx + 60);
  ctx.beginPath();
  ctx.moveTo(bx - 16 * dir - 10, baseY - 14);
  ctx.lineTo(bx + 14, baseY - 14);
  ctx.lineTo(tip.x, tip.y);
  ctx.closePath();
}

function drawBubble(b, cx, top, tips) {
  const bottom = top + b.h * (b.shout ? 1.05 : 1);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 7;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#fff';
  for (const tip of tips) { tailPath(cx, bottom, tip); ctx.stroke(); }
  bubblePath(b, cx, top);
  ctx.stroke();
  for (const tip of tips) { tailPath(cx, bottom, tip); ctx.fill(); }
  bubblePath(b, cx, top);
  ctx.fill();
  const lh = b.size * 1.22;
  b.lines.forEach((l, i) => {
    text(l, cx, top + b.h / 2 + (i - (b.lines.length - 1) / 2) * lh + (b.shout ? 4 : 2), b.size,
      b.shout ? '#c62828' : INK, { font: b.font, weight: b.weight });
  });
}

function narrationBox(str, x, y) {
  ctx.font = `700 26px ${DIALOGUE_FONT}`;
  const w = ctx.measureText(str).width + 36;
  rrect(x, y - 50, w, 50, 2, '#fff3b8', INK, 4);
  text(str, x + 18, y - 24, 26, INK, { font: DIALOGUE_FONT, weight: 700, align: 'left' });
}

function sfxLettering(words, l, py) {
  const spots = [[0.72, 0.8, -0.12], [0.28, 0.42, 0.1], [0.7, 0.3, -0.06]];
  words.forEach((w, i) => {
    const [fx, fy, rot] = spots[i % spots.length];
    ctx.save();
    ctx.translate(l.px + l.pw * fx, py + l.ph * fy);
    ctx.rotate(rot);
    const size = w.length > 12 ? 50 : 76;
    text(w, 0, 0, size, i % 2 ? '#ffeb3b' : '#ff5252', { font: 'Bangers', weight: 400, stroke: INK, strokeWidth: 12 });
    ctx.restore();
  });
}

window.webtoonBlock = p => {
  CLOSE_FRAMING.s = 1.55;
  CLOSE_FRAMING.dy = 95;
  canvas.width = W;
  canvas.height = H;
  window.renderFrame(p.at, { subs: false });
  const heads = speakerPoints(p);
  const l = layoutFor(p);
  frameCopy.getContext('2d').drawImage(canvas, 0, 0);

  const bub = p.text ? bubbleSpec(p.text) : null;
  const py = bub ? 18 + bub.h * 0.62 : 12;
  canvas.width = STRIP_W;
  canvas.height = Math.round(py + l.ph + 14);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (l.black) {
    ctx.fillStyle = '#000';
    ctx.fillRect(l.px, py, l.pw, l.ph);
  } else {
    const [sx, sy, sw, sh] = l.src;
    ctx.drawImage(frameCopy, sx, sy, sw, sh, l.px, py, l.pw, l.ph);
    if (!l.bleed) {
      ctx.lineWidth = 5;
      ctx.strokeStyle = INK;
      ctx.strokeRect(l.px, py, l.pw, l.ph);
    }
  }
  if (p.sfx.length) sfxLettering(p.sfx, l, py);
  if (p.narr) narrationBox(p.narr, l.px + 14, py + l.ph - 14);

  if (bub) {
    const [sx, sy, sw, sh] = l.src || [0, 0, W, H];
    const inPanel = heads
      .map(h => ({ x: l.px + (h.x - sx) * l.pw / sw, y: py + (h.y - sy) * l.ph / sh }))
      .filter(h => h.x > l.px && h.x < l.px + l.pw && h.y > py && h.y < py + l.ph);
    const meanX = inPanel.length ? inPanel.reduce((a, h) => a + h.x, 0) / inPanel.length : l.px + l.pw / 2;
    const cx = clamp(meanX, bub.w / 2 + 18, STRIP_W - bub.w / 2 - 18);
    const top = 18;
    const bottom = top + bub.h;
    const tips = inPanel.length
      ? inPanel.map(h => ({ x: lerp(cx, h.x, 0.75), y: Math.max(bottom + 30, Math.min(h.y - 40, bottom + 110)) }))
      : [{ x: cx + 24, y: bottom + 34 }];
    drawBubble(bub, cx, top, tips);
  }

  const url = canvas.toDataURL('image/png');
  canvas.width = W;
  canvas.height = H;
  return url;
};
