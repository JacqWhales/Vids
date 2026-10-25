// Scenes and full-frame overlays. Each scene draws one whole frame for time t.

const NAMES = { putin: 'V. PUTIN', kim: 'KIM JONG UN', trump: 'D. TRUMP', xi: 'XI JINPING' };

// ---- The summit room ----------------------------------------------------------------------------

function roomBackground(t) {
  ctx.fillStyle = '#a8bfd4';
  ctx.fillRect(WORLD.x0, 0, WORLD.x1 - WORLD.x0, H);
  ctx.fillStyle = '#8ca6bf';
  ctx.fillRect(WORLD.x0, 560, WORLD.x1 - WORLD.x0, 200);
  line([[WORLD.x0, 560], [WORLD.x1, 560]], '#6d879f', 6);
  ctx.fillStyle = '#7a3440';
  ctx.fillRect(WORLD.x0, TABLE_Y, WORLD.x1 - WORLD.x0, H - TABLE_Y);

  // The banner, and the hasty correction taped under it.
  rrect(640, 22, 640, 66, 6, '#f3efe2');
  text('INTERNATIONAL TRADE TALKS', 960, 56, 34, '#1d3b6e', { weight: 900 });
  line([[690, 36], [1230, 76]], '#d32f2f', 8);
  line([[690, 76], [1230, 36]], '#d32f2f', 8);
  ctx.save();
  ctx.translate(960, 112);
  ctx.rotate(-0.03);
  rrect(-170, -24, 340, 50, 2, '#fff7a8', INK, 3);
  text('PARTY GAMES!!', 0, 2, 38, '#c2185b', { font: 'Marker', weight: 400 });
  ctx.fillStyle = 'rgba(240,240,220,0.8)';
  ctx.fillRect(-190, -30, 46, 18);
  ctx.fillRect(146, -30, 46, 18);
  ctx.restore();

  for (const who of LEADERS) flag(who, CHARS[who].x, 205);
  clock(1760, 150, t);
  plant(130);
  windowView(t);
}

function flag(who, x, y) {
  ctx.save();
  ctx.translate(x - 66, y - 40);
  const w = 132;
  const h = 80;
  if (who === 'trump') {
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i % 2 ? '#fff' : '#b22234';
      ctx.fillRect(0, (h / 7) * i, w, h / 7 + 0.5);
    }
    ctx.fillStyle = '#3c3b6e';
    ctx.fillRect(0, 0, w * 0.42, h * 0.54);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) ell(8 + c * 13, 8 + r * 13, 2.5, 2.5, '#fff', null);
  } else if (who === 'putin') {
    ['#fff', '#0039a6', '#d52b1e'].forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(0, (h / 3) * i, w, h / 3 + 0.5); });
  } else if (who === 'kim') {
    ctx.fillStyle = '#024fa2'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, h * 0.18, w, h * 0.64);
    ctx.fillStyle = '#ed1c27'; ctx.fillRect(0, h * 0.22, w, h * 0.56);
    ell(w * 0.34, h / 2, 17, 17, '#fff', null);
    star(w * 0.34, h / 2, 15, '#ed1c27', null);
  } else {
    ctx.fillStyle = '#de2910'; ctx.fillRect(0, 0, w, h);
    star(22, 22, 13, '#ffde00', null);
    [[44, 9], [52, 19], [52, 32], [44, 42]].forEach(([sx, sy]) => star(sx, sy, 4.5, '#ffde00', null));
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, w, h);
  ctx.restore();
}

function clock(x, y, t) {
  ell(x, y, 48, 48, '#fdfbf2', INK, 5);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    line([[x + Math.cos(a) * 38, y + Math.sin(a) * 38], [x + Math.cos(a) * 44, y + Math.sin(a) * 44]], INK, 3);
  }
  const sec = Math.floor(t) / 60 * TAU - Math.PI / 2;
  line([[x, y], [x + Math.cos(-2.1) * 22, y + Math.sin(-2.1) * 22]], INK, 5);
  line([[x, y], [x + Math.cos(-0.3) * 32, y + Math.sin(-0.3) * 32]], INK, 4);
  line([[x, y], [x + Math.cos(sec) * 38, y + Math.sin(sec) * 38]], '#d32f2f', 2);
}

function plant(x) {
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.32;
    ell(x + Math.cos(a) * 90, 830 + Math.sin(a) * 150, 26, 70, i % 2 ? '#3f8f4f' : '#2e7d40', INK, 3, a + Math.PI / 2);
  }
  poly([[x - 60, 880], [x + 60, 880], [x + 46, 1040], [x - 46, 1040]], '#c4703f');
  rrect(x - 68, 868, 136, 24, 4, '#a85a30');
}

function windowView(t) {
  const { x, y, w, h } = WINDOW;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#6fb8ea');
  sky.addColorStop(1, '#cdeaf7');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  ell(x + 70 + ((t * 4) % 60), y + 70, 46, 18, '#fff', null);
  ell(x + 190 - ((t * 3) % 40), y + 130, 36, 14, '#fff', null);
  poly([[x - 20, y + 330], [x + 70, y + 230], [x + 140, y + 300], [x + 210, y + 210], [x + w + 30, y + 330]], '#7f97b0', null);
  poly([[x + 52, y + 250], [x + 70, y + 230], [x + 88, y + 248]], '#fff', null);
  poly([[x + 192, y + 228], [x + 210, y + 210], [x + 228, y + 226]], '#fff', null);
  ctx.fillStyle = '#3d7fb8';
  ctx.fillRect(x, y + 330, w, h - 330);
  line([[x + 180, y + 335], [x + 180, y + 270]], '#e8f6ff', 5);
  const fall = activeFx('fallingMan', t);
  if (fall != null) fallingMan(x + w / 2 + Math.sin(fall * 9) * 20, y - 160 + fall * (h + 320), fall * 7);
  const ob = activeFx('obama', t);
  if (ob != null) obama(x - 160 + ob * (w + 320), y + 230 + Math.sin(ob * 12) * 4);
  ctx.restore();
  ctx.strokeStyle = '#f6f3ea';
  ctx.lineWidth = 18;
  ctx.strokeRect(x, y, w, h);
  line([[x + w / 2, y], [x + w / 2, y + h]], '#f6f3ea', 10);
  line([[x, y + h / 2], [x + w, y + h / 2]], '#f6f3ea', 10);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.strokeRect(x - 9, y - 9, w + 18, h + 18);
  rrect(x - 24, y + h + 4, w + 48, 20, 4, '#f6f3ea');
}

function fallingMan(x, y, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  line([[-14, -10], [-40, -52]], '#2b2b33', 12);
  line([[14, -10], [42, -48]], '#2b2b33', 12);
  line([[-8, 40], [-26, 84]], '#2b2b33', 13);
  line([[8, 40], [30, 80]], '#2b2b33', 13);
  rrect(-22, -20, 44, 66, 8, '#2b2b33');
  poly([[-7, -18], [7, -18], [0, 18]], '#fff', null);
  ell(0, -46, 26, 28, '#f2d0b4');
  ell(-9, -50, 6, 7, '#fff', INK, 2);
  ell(9, -50, 6, 7, '#fff', INK, 2);
  ell(0, -34, 8, 10, '#3a1212', INK, 2);
  ctx.restore();
}

function obama(x, y) {
  ctx.save();
  ctx.translate(x, y);
  suit({ w: 95, neck: 34, color: '#262f45' });
  poly([[-26, 86], [26, 86], [0, 150]], '#fff');
  poly([[-8, 96], [8, 96], [11, 200], [0, 214], [-11, 200]], '#4a6fb5');
  line([[-30, 84], [0, 170], [30, 84]], '#c62828', 6);
  ell(0, 182, 24, 24, '#f2c230', INK, 3);
  star(0, 182, 12, '#fff3b0', null);
  const tw = Math.abs(Math.sin(x * 0.05));
  star(36, 160, 10 + tw * 6, '#fff', null);
  ell(-74, 6, 18, 26, '#8d5a3b');
  ell(74, 6, 18, 26, '#8d5a3b');
  ell(0, 0, 74, 88, '#8d5a3b');
  path(c => { c.moveTo(-72, -20); c.bezierCurveTo(-72, -96, 72, -96, 72, -20); c.quadraticCurveTo(0, -66, -72, -20); }, '#1c1714');
  eyes({ lx: -26, rx: 26, y: -4, rw: 13, rh: 11, pupil: 5, skin: '#8d5a3b', look: { dx: 0.4, dy: 0 }, blink: false });
  path(c => { c.moveTo(-32, 36); c.quadraticCurveTo(0, 74, 32, 36); c.closePath(); }, '#fff', INK, 3.5);
  ctx.restore();
}

function table() {
  poly([[250, TABLE_Y], [1640, TABLE_Y], [1662, 772], [228, 772]], '#9a6a43');
  ctx.fillStyle = '#2f4f86';
  ctx.fillRect(228, 772, 1434, H - 772);
  for (let x = 300; x < 1640; x += 110) line([[x, 790], [x - 8, H]], '#3d5f9c', 6);
  line([[228, 790], [1662, 790]], '#d9b54a', 6);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.strokeRect(228, 772, 1434, H - 772);
  for (const who of LEADERS) {
    const x = CHARS[who].x;
    rrect(x - 110, 818, 220, 50, 4, '#d9b54a', INK, 3);
    text(NAMES[who], x, 844, 26, INK, { weight: 900 });
  }
}

function props(t) {
  ctx.save();
  ctx.translate(CHARS.xi.x, 708);
  honeyPot();
  ctx.restore();
  const p = S('teaToGary', t);
  LEADERS.forEach((who, i) => {
    const home = CHARS[who].x + 140;
    teacup(lerp(home, 1590 - (3 - i) * 52, p), TABLE_Y + 2, t + i);
  });
}

function teacup(x, y, t) {
  ell(x, y + 6, 30, 7, '#fff', INK, 3);
  path(c => {
    c.moveTo(x - 22, y - 26);
    c.lineTo(x + 22, y - 26);
    c.quadraticCurveTo(x + 20, y + 4, x, y + 4);
    c.quadraticCurveTo(x - 20, y + 4, x - 22, y - 26);
  }, '#fff', INK, 3);
  path(c => { c.ellipse(x + 26, y - 14, 8, 9, 0, -Math.PI / 2, Math.PI / 2); }, null, INK, 3);
  ell(x, y - 26, 22, 5, '#9c6b3e', INK, 2);
  const s = Math.sin(t * 3) * 4;
  path(c => { c.moveTo(x - 6, y - 34); c.quadraticCurveTo(x - 14 + s, y - 46, x - 4, y - 58); }, null, 'rgba(255,255,255,0.8)', 3);
}

function trolley(t) {
  const X = S('trolleyX', t);
  if (X < -420) return;
  const moving = tweening('trolleyX', t);
  const bob = moving ? Math.abs(Math.sin(t * 10)) * -8 : 0;
  // Waiter
  ctx.save();
  ctx.translate(X - 200, 640 + bob);
  path(c => {
    c.moveTo(-24, 60);
    c.quadraticCurveTo(-82, 66, -92, 130);
    c.lineTo(-100, 440);
    c.lineTo(100, 440);
    c.lineTo(92, 130);
    c.quadraticCurveTo(82, 66, 24, 60);
    c.closePath();
  }, '#18181c');
  poly([[-26, 62], [26, 62], [0, 190]], '#fff');
  poly([[-20, 66], [0, 76], [20, 66], [20, 88], [0, 78], [-20, 88]], INK, null);
  ell(0, 0, 58, 70, '#f2d2b6');
  path(c => { c.moveTo(-58, -12); c.bezierCurveTo(-60, -90, 60, -90, 58, -12); c.quadraticCurveTo(0, -56, -58, -12); }, '#141414');
  eyes({ lx: -20, rx: 20, y: -6, rw: 11, rh: 9, pupil: 4, lid: 0.4, skin: '#f2d2b6', look: { dx: 1, dy: 0 }, blink: false });
  path(c => {
    c.moveTo(0, 26);
    c.bezierCurveTo(-20, 16, -40, 36, -48, 18);
    c.bezierCurveTo(-36, 44, -10, 38, 0, 30);
    c.bezierCurveTo(10, 38, 36, 44, 48, 18);
    c.bezierCurveTo(40, 36, 20, 16, 0, 26);
  }, '#141414', null);
  if (S('trolleyOffer', t)) {
    line([[60, 110], [150, 40], [210, -20]], '#18181c', 26);
    ell(210, -24, 16, 14, '#f2d2b6');
    teacup(232, -32, t);
  } else {
    line([[70, 120], [150, 190]], '#18181c', 26);
  }
  ctx.restore();
  // Trolley
  ctx.save();
  ctx.translate(X, bob * 0.3);
  line([[-130, 846], [-160, 830]], '#9aa1ab', 8);
  for (const lx of [-118, 118]) line([[lx, 852], [lx, 1010]], '#9aa1ab', 8);
  rrect(-136, 840, 272, 18, 4, '#c9ced6');
  rrect(-126, 960, 252, 14, 4, '#c9ced6');
  for (const wx of [-118, 118]) ell(wx, 1022, 14, 14, '#333', INK, 3);
  ell(-40, 800, 46, 40, '#e8e8ee');
  path(c => { c.moveTo(-84, 790); c.quadraticCurveTo(-120, 760, -116, 744); }, null, INK, 9);
  path(c => { c.moveTo(-84, 790); c.quadraticCurveTo(-120, 760, -116, 744); }, null, '#e8e8ee', 5);
  rrect(-60, 752, 40, 12, 4, '#e8e8ee');
  ell(-40, 748, 6, 6, '#e8e8ee', INK, 2);
  teacup(50, 836, t);
  teacup(105, 836, t + 1);
  ctx.restore();
}

function roomOverlays(t) {
  if (S('pink', t)) {
    ctx.fillStyle = 'rgba(255,90,170,0.18)';
    ctx.fillRect(0, 0, W, H);
    const t0 = t - since('pink', t);
    for (let i = 0; i < 16; i++) {
      const p = ((t - t0) * 0.18 + hash(i)) % 1;
      const x = hash(i + 50) * W + Math.sin(t * 2 + i) * 20;
      heart(x, H - p * (H + 120), 30 + hash(i + 9) * 30, i % 2 ? '#ff4f9a' : '#ff8cc6');
    }
  }
  if (S('counterOn', t)) {
    const n = Math.round(S('counter', t));
    ctx.save();
    ctx.translate(W / 2, 250);
    ctx.rotate(-0.04);
    rrect(-230, -130, 460, 250, 8, '#fffdf0', INK, 6);
    text('FELONY COUNTS', 0, -82, 44, '#c62828', { font: 'Bangers', weight: 400 });
    text(String(n), 0, 30, 150, INK, { font: 'Bangers', weight: 400 });
    if (n >= 34) {
      ctx.rotate(0.22);
      rrect(-180, -50, 360, 100, 10, null, '#c62828', 10);
      text('GUILTY', 0, 4, 88, '#c62828', { font: 'Bangers', weight: 400 });
    }
    ctx.restore();
  }
  const cap = S('caption', t);
  if (cap) {
    const shown = cap.slice(0, Math.floor(since('caption', t) * 24));
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(70, 920, 920, 84);
    text(shown, 100, 962, 40, '#fff', { align: 'left', font: 'JetBrains Mono', weight: 700 });
  }
  if (S('censor', t)) {
    const small = document.createElement('canvas');
    small.width = W / 40;
    small.height = H / 40;
    small.getContext('2d').drawImage(canvas, 0, 0, small.width, small.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-0.12);
    rrect(-420, -110, 840, 220, 16, 'rgba(0,0,0,0.6)', '#e53935', 14);
    text('CENSORED', 0, 8, 170, '#e53935', { font: 'Bangers', weight: 400 });
    ctx.restore();
  }
}

// ---- Cards and other scenes ---------------------------------------------------------------------

function paperBackground(color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
}

function paperLetters(str, cx, y, size, t0, t) {
  const colors = ['#e53935', '#fdd835', '#43a047', '#fafafa', '#fb8c00', '#8e24aa', '#1e88e5'];
  const step = size * 0.98;
  const chars = [...str];
  const x0 = cx - (chars.length - 1) * step / 2;
  chars.forEach((ch, i) => {
    if (ch === ' ') return;
    const p = clamp((t - t0 - i * 0.05) / 0.45, 0, 1);
    if (p <= 0) return;
    const dy = (1 - easeOutBack(p)) * -260;
    ctx.save();
    ctx.translate(x0 + i * step, y + dy);
    ctx.rotate((hash(i + str.length) - 0.5) * 0.3);
    const col = colors[i % colors.length];
    rrect(-size * 0.45, -size * 0.55, size * 0.9, size * 1.1, 4, col, INK, 4);
    text(ch, 0, size * 0.04, size * 0.8, col === '#fafafa' || col === '#fdd835' ? INK : '#fff', { font: 'Bangers', weight: 400 });
    ctx.restore();
  });
}

function disclaimer(t) {
  paperBackground('#000');
  const a = clamp(t - 0.5, 0, 1);
  ctx.globalAlpha = a;
  text('DISCLAIMER', W / 2, 330, 44, '#fff', { weight: 900 });
  const lines = [
    'The following is a crude parody.',
    'All characters are cartoon impersonations of real public figures,',
    'voiced badly by robots.',
    '',
    'Please do not send missiles.',
  ];
  lines.forEach((l, i) => text(l, W / 2, 440 + i * 62, 40, '#ddd', { weight: 600 }));
  ctx.globalAlpha = 1;
}

function title(t) {
  const t0 = t - since('scene', t);
  paperBackground('#2b6cb0');
  for (let i = 0; i < 40; i++) star(hash(i) * W, hash(i + 7) * H, 6 + hash(i + 3) * 10, 'rgba(255,255,255,0.25)', null);
  paperLetters('NEVER HAVE', W / 2, 250, 150, t0 + 0.2, t);
  paperLetters('I EVER', W / 2, 430, 150, t0 + 0.75, t);
  if (t - t0 > 1.7) {
    ctx.save();
    ctx.translate(W / 2, 590);
    ctx.rotate(-0.03);
    rrect(-330, -46, 660, 92, 4, '#111', '#fff', 4);
    text('SUMMIT EDITION', 0, 4, 72, '#fdd835', { font: 'Bangers', weight: 400 });
    ctx.restore();
  }
  const beat = Math.floor((t - t0) / 0.2875) % 2;
  LEADERS.forEach((who, i) => {
    const x = W / 2 + (i - 1.5) * 330;
    const pop = clamp((t - t0 - 2.2 - i * 0.2) / 0.4, 0, 1);
    if (pop <= 0) return;
    const y = 880 + (1 - easeOutBack(pop)) * 300 - (beat === i % 2 ? 14 : 0);
    drawHead(who, x, y, 0.95, { mouth: beat === i % 2 ? 1 : 0, hat: false });
  });
}

function region() {
  paperBackground('#0b0b0b');
  ell(W / 2, 400, 90, 90, '#2a2a2a', '#555', 6);
  ell(W / 2 - 30, 380, 9, 12, '#888', null);
  ell(W / 2 + 30, 380, 9, 12, '#888', null);
  path(c => { c.moveTo(W / 2 - 40, 450); c.quadraticCurveTo(W / 2, 410, W / 2 + 40, 450); }, null, '#888', 6);
  text('This content is not available in your region.', W / 2, 580, 46, '#e0e0e0', { weight: 600 });
  text('Error code: 6-4-1989', W / 2, 650, 30, '#777', { weight: 500, font: 'JetBrains Mono' });
}

const STATIONS = [
  { name: 'PATRIOT NEWS', bg: '#173a7a', accent: '#c62828', headline: 'TRUMP WINS BIGLY', who: 'anchorUS',
    ticker: 'BIGGEST MARGIN IN HISTORY ★ FINGERS: TREMENDOUS ★ NOBEL COMMITTEE UNDER INVESTIGATION ★' },
  { name: 'KREMLIN 24', bg: '#5a1a22', accent: '#1e4fa8', headline: 'PUTIN: 99.9% OF FINGERS', who: 'anchorRU',
    ticker: 'WINDOW SAFETY WEEK CONTINUES ★ BEAR APPROVAL AT RECORD HIGH ★ TEA PRICES STABLE ★' },
  { name: 'PARTY NEWS 1', bg: '#a8141a', accent: '#f2c230', headline: 'NO GAME OCCURRED', who: 'anchorCN',
    ticker: 'NOTHING HAPPENED TODAY ★ NOTHING HAPPENED IN 1989 EITHER ★ HONEY EXPORTS UP ★' },
  { name: 'GLORIOUS TV', bg: '#3f7fbf', accent: '#ff5fa2', headline: 'MARSHAL KIM: 11 HOLES-IN-ONE', who: 'anchorKP',
    ticker: 'MARSHAL KIM ALSO INVENTED FINGERS ★ HAIRCUT NOW MANDATORY FOR GARYS ★' },
];

function anchor(i, t) {
  const speaking = mouthOpen(STATIONS[i].who, t);
  const st = { mouth: speaking, look: { dx: 0, dy: 0 }, blink: (t + i) % 3.7 < 0.12 };
  const skin = ['#f3c9a5', '#f2d6c3', '#f1d0a8', '#f1d0a8'][i];
  const bodyCol = ['#1d2f6f', '#4b4f58', '#c62828', '#ff7fb6'][i];
  path(c => {
    c.moveTo(-44, 86);
    c.quadraticCurveTo(-130, 94, -140, 170);
    c.lineTo(-150, 300);
    c.lineTo(150, 300);
    c.lineTo(140, 170);
    c.quadraticCurveTo(130, 94, 44, 86);
    c.closePath();
  }, bodyCol);
  if (i < 2) {
    poly([[-36, 86], [36, 86], [0, 170]], '#fff');
    poly([[-9, 100], [9, 100], [13, 240], [0, 256], [-13, 240]], i === 0 ? '#c62828' : '#1e4fa8');
  } else if (i === 3) {
    poly([[-44, 88], [0, 170], [44, 88], [30, 84], [0, 140], [-30, 84]], '#fff');
    line([[0, 170], [-30, 230]], '#c2185b', 8);
  }
  if (i >= 2) ell(0, -40, 100, 96, '#141414', null);
  if (i === 3) ell(0, -112, 48, 34, '#141414', INK, 3);
  ell(-92, 10, 14, 22, skin);
  ell(92, 10, 14, 22, skin);
  ell(0, 0, 92, 100, skin);
  if (i === 0) path(c => { c.moveTo(-92, -10); c.bezierCurveTo(-110, -120, 110, -130, 96, -10); c.quadraticCurveTo(40, -90, -92, -10); }, '#4a2f1a');
  if (i === 1) line([[-86, -20], [-70, -70]], '#8a8a8a', 9), line([[86, -20], [70, -70]], '#8a8a8a', 9);
  if (i >= 2) path(c => { c.moveTo(-94, 30); c.bezierCurveTo(-110, -130, 110, -130, 94, 30); c.quadraticCurveTo(80, -60, 0, -66); c.quadraticCurveTo(-80, -60, -94, 30); }, '#141414');
  eyes({ lx: -30, rx: 30, y: -6, rw: 15, rh: 13, pupil: 5, skin, look: st.look, blink: st.blink });
  if (i >= 2) { line([[-46, -16], [-40, -22]], INK, 3); line([[46, -16], [40, -22]], INK, 3); }
  mouth(0, 50, 42, st.mouth, { smile: i === 3 ? 10 : 0 });
}

function tv(t) {
  const active = S('tvActive', t);
  STATIONS.forEach((s, i) => {
    const qx = (i % 2) * (W / 2);
    const qy = Math.floor(i / 2) * (H / 2);
    ctx.save();
    ctx.beginPath();
    ctx.rect(qx, qy, W / 2, H / 2);
    ctx.clip();
    ctx.translate(qx, qy);
    ctx.fillStyle = s.bg;
    ctx.fillRect(0, 0, W / 2, H / 2);
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(k * 170 - 40, 0, 70, H / 2);
    }
    if (i === 0) for (let k = 0; k < 10; k++) star(60 + k * 95, 60 + (k % 2) * 40, 16, 'rgba(255,255,255,0.5)', null);
    if (i === 1) { ell(800, 170, 50, 60, '#d4a72c', null); poly([[760, 140], [800, 60], [840, 140]], '#d4a72c', null); }
    if (i === 2) { star(110, 90, 50, '#ffde00', null); [[190, 40], [215, 85], [215, 135], [190, 175]].forEach(([x, y]) => star(x, y, 16, '#ffde00', null)); }
    if (i === 3) { poly([[520, 330], [700, 120], [860, 330]], '#e9f2fb', null); star(800, 90, 40, '#e53935', null); }
    ctx.save();
    ctx.translate(480, 210);
    ctx.scale(0.95, 0.95);
    anchor(i, t);
    ctx.restore();
    rrect(150, 390, 660, 160, 8, '#2a2a30', INK, 4);
    text(s.name, 480, 440, 34, s.accent, { font: 'Bangers', weight: 400 });
    rrect(0, 452, W / 2, 46, 0, '#fff', null);
    rrect(0, 452, 150, 46, 0, s.accent, null);
    text('BREAKING', 75, 476, 26, '#fff', { font: 'Bangers', weight: 400 });
    text(s.headline, 170, 476, 32, INK, { align: 'left', font: 'Bangers', weight: 400 });
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 498, W / 2, 42);
    const tw = s.ticker.length * 15;
    const off = ((t * 120) % (tw + 960));
    text(s.ticker, W / 2 - off, 520, 24, '#ffde00', { align: 'left', weight: 800 });
    rrect(20, 20, 210, 50, 6, 'rgba(0,0,0,0.5)', null);
    text(s.name, 125, 46, 28, '#fff', { font: 'Bangers', weight: 400 });
    ell(250, 45, 8, 8, Math.floor(t * 2) % 2 ? '#e53935' : '#600', null);
    text('LIVE', 285, 46, 24, '#fff', { weight: 900 });
    ctx.restore();
    if (active >= 0 && active !== i) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(qx, qy, W / 2, H / 2);
    }
  });
  if (active >= 0) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 10;
    ctx.strokeRect((active % 2) * (W / 2) + 5, Math.floor(active / 2) * (H / 2) + 5, W / 2 - 10, H / 2 - 10);
  }
  line([[W / 2, 0], [W / 2, H]], '#000', 8);
  line([[0, H / 2], [W, H / 2]], '#000', 8);
}

function endcard(t) {
  const t0 = t - since('scene', t);
  paperBackground('#1f3d2b');
  paperLetters('NEVER HAVE I EVER', W / 2, 170, 86, t0, t);
  const a = clamp((t - t0 - 0.9) / 0.6, 0, 1);
  ctx.globalAlpha = a;
  text('No world leaders were harmed in the making of this video.', W / 2, 340, 48, '#fff', { weight: 800 });
  text('Several Garys were.', W / 2, 420, 64, '#fdd835', { font: 'Marker', weight: 400 });
  ctx.globalAlpha = 1;
  [1, 2, 3].forEach((n, i) => {
    const p = clamp((t - t0 - 1.6 - i * 0.35) / 0.4, 0, 1);
    if (p <= 0) return;
    const x = W / 2 + (i - 1) * 300;
    const y = 700 + (1 - easeOutBack(p)) * 300;
    drawHead('gary', x, y, 1.1, { t, gary: n, look: { dx: 0, dy: 0 } });
    rrect(x - 70, y + 140, 140, 48, 6, '#fff', INK, 3);
    text(`GARY ${n}`, x, y + 165, 28, INK, { weight: 900 });
  });
  if (t - t0 > 3.2) text('Gary 3 starts Monday.', W / 2, 1010, 34, '#cfe8d6', { weight: 600 });
}

function room(t) {
  applyCamera(cameraFor(t));
  roomBackground(t);
  missile();
  ctx.save();
  ctx.translate(CHARS.putin.x - 215, 665);
  bear(t);
  ctx.restore();
  for (const who of LEADERS) drawCharacter(who, t);
  drawCharacter('gary', t);
  if (S('hands', t)) for (const who of LEADERS) drawHands(who, t);
  table();
  props(t);
  podium();
  trolley(t);
}

const SCENES = { disclaimer, title, room, region, tv, endcard };
