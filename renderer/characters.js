// The cast, drawn South Park style: flat paper cutouts, big heads, flapping mouths.
// Every head and body is drawn in head-local coordinates (head centre at 0,0, radius about 100).

const SKIN = {
  trump: '#f39a45', putin: '#f2d6c3', kim: '#f0c9a0', xi: '#f1d0a8', gary: '#f5d6b6',
};

// Expressions: 'neutral' | 'happy' | 'shock' | 'angry' | 'smug' | 'sad', set per character with face_<who>.
function eyes(o) {
  const face = o.face || 'neutral';
  const rw = face === 'shock' ? o.rw * 1.15 : o.rw;
  const rh = face === 'shock' ? o.rh * 1.4 : o.rh;
  const pupil = face === 'shock' ? o.pupil * 0.7 : o.pupil;
  const lid = face === 'shock' ? 0 : face === 'smug' ? Math.max(o.lid || 0, 0.5) : face === 'angry' ? Math.max(o.lid || 0, 0.3) : o.lid;
  o = { ...o, rw, rh, pupil, lid };
  for (const ex of [o.lx, o.rx]) {
    if (face === 'happy') {
      path(c => { c.moveTo(ex - o.rw, o.y + 4); c.quadraticCurveTo(ex, o.y - o.rh * 1.4, ex + o.rw, o.y + 4); }, null, INK, 4.5);
      continue;
    }
    if (o.blink) {
      ell(ex, o.y, o.rw, o.rh, o.skin, null);
      line([[ex - o.rw, o.y], [ex + o.rw, o.y]], INK, 4);
      continue;
    }
    ell(ex, o.y, o.rw, o.rh, '#fff', INK, 3.5);
    const px = ex + o.look.dx * o.rw * 0.55;
    const py = o.y + o.look.dy * o.rh * 0.4;
    ell(px, py, o.pupil, o.pupil, INK, null);
    if (o.lid) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(ex, o.y, o.rw, o.rh, 0, 0, TAU);
      ctx.clip();
      ctx.fillStyle = o.skin;
      const lidY = o.y - o.rh + o.rh * 2 * o.lid;
      ctx.fillRect(ex - o.rw - 2, o.y - o.rh - 2, o.rw * 2 + 4, lidY - (o.y - o.rh) + 2);
      ctx.restore();
      line([[ex - o.rw + 2, lidY], [ex + o.rw - 2, lidY]], INK, 3.5);
      ell(ex, o.y, o.rw, o.rh, null, INK, 3.5);
    }
  }
}

// Eyebrows carry most of the acting: tilted in for angry, up for sad, lifted for shock.
function brows(o) {
  const face = o.face || 'neutral';
  for (const side of [-1, 1]) {
    const cx = side < 0 ? o.lx : o.rx;
    let inner = 0;
    let outer = 0;
    let lift = 0;
    if (face === 'angry') { inner = 10; outer = -5; }
    if (face === 'sad') { inner = -9; outer = 4; }
    if (face === 'shock') lift = -13;
    if (face === 'happy') lift = -5;
    if (face === 'smug') { if (side < 0) lift = -11; else { inner = 4; outer = 2; } }
    const ix = cx - side * o.w / 2;
    const ox = cx + side * o.w / 2;
    path(c => {
      c.moveTo(ox, o.y + outer + lift);
      c.quadraticCurveTo(cx, o.y + lift - (o.curve || 0), ix, o.y + inner + lift);
    }, null, o.color, o.lw);
  }
}

// A soft cutout shadow on the lower right of a head.
function headShade(rx, ry, cy = 0) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, cy, rx, ry, 0, 0, TAU);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(-rx - 5, cy - ry - 5, rx * 2 + 10, ry * 2 + 10);
  ctx.ellipse(-rx * 0.12, cy - ry * 0.14, rx * 0.98, ry * 0.97, 0, 0, TAU);
  ctx.fillStyle = 'rgba(90,40,20,0.13)';
  ctx.fill('evenodd');
  ctx.restore();
}

function mouth(x, y, w, open, o = {}) {
  const face = o.face || 'neutral';
  if (!open) {
    if (face === 'shock') { ell(x, y + 4, w * 0.18, w * 0.24, '#3a1212', INK, 3.5); return; }
    if (face === 'smug') {
      path(c => { c.moveTo(x - w / 2, y + 2); c.quadraticCurveTo(x + w / 8, y + 8, x + w / 2, y - 10); }, null, INK, 4);
      return;
    }
    if (face === 'happy') o = { smile: 16 };
    if (face === 'angry' || face === 'sad') o = { smile: -10 };
  } else if (face === 'happy') {
    o = { ...o, smile: o.smile || 12 };
  }
  if (!open) {
    if (o.pucker) { ell(x, y, w * 0.28, w * 0.17, '#d9776d', INK, 3.5); return; }
    ctx.beginPath();
    if (o.wavy) {
      ctx.moveTo(x - w / 2, y);
      ctx.bezierCurveTo(x - w / 4, y - 8, x - w / 8, y + 8, x, y);
      ctx.bezierCurveTo(x + w / 8, y - 8, x + w / 4, y + 8, x + w / 2, y);
    } else {
      ctx.moveTo(x - w / 2, y);
      ctx.quadraticCurveTo(x, y + (o.smile || 0), x + w / 2, y);
    }
    ctx.lineCap = 'round';
    shape(null, INK, 4);
    return;
  }
  const h = open === 2 ? w * 0.6 : w * 0.32;
  const rx = w / 2 * (open === 2 ? 0.8 : 0.7);
  ctx.save();
  ctx.beginPath();
  if (o.smile) {
    ctx.moveTo(x - rx, y);
    ctx.quadraticCurveTo(x, y + h * 1.6, x + rx, y);
    ctx.closePath();
  } else {
    ctx.ellipse(x, y + h * 0.25, rx, h / 2 + 2, 0, 0, TAU);
  }
  shape('#3a1212', INK, 3.5);
  ctx.clip();
  ell(x, y + h * 0.75, rx * 0.65, h * 0.35, '#d9545b', null);
  ctx.restore();
}

function suit(o) {
  path(c => {
    c.moveTo(-o.neck, 85);
    c.quadraticCurveTo(-o.w * 0.9, 92, -o.w, 170);
    c.lineTo(-o.w - 18, 340);
    c.lineTo(o.w + 18, 340);
    c.lineTo(o.w, 170);
    c.quadraticCurveTo(o.w * 0.9, 92, o.neck, 85);
    c.closePath();
  }, o.color);
}

// ---- Trump --------------------------------------------------------------------------------------

function trumpBody() {
  suit({ w: 160, neck: 60, color: '#1f2b55' });
  poly([[-44, 86], [44, 86], [0, 196]], '#f4f4f4');
  poly([[-12, 104], [12, 104], [19, 300], [0, 325], [-19, 300]], '#c8102e');
  poly([[-15, 92], [15, 92], [11, 112], [-11, 112]], '#a50d26');
  line([[-44, 86], [-8, 225]], INK, 4);
  line([[44, 86], [8, 225]], INK, 4);
  rrect(-108, 140, 22, 15, 2, '#fff', INK, 2);
  ctx.fillStyle = '#c8102e';
  ctx.fillRect(-106, 146, 18, 3);
  ctx.fillStyle = '#1f2b55';
  ctx.fillRect(-106, 142, 8, 5);
}

function trumpHead(st) {
  const skin = SKIN.trump;
  ell(-108, 8, 16, 24, skin);
  ell(108, 8, 16, 24, skin);
  path(c => {
    c.moveTo(-104, -20);
    c.bezierCurveTo(-110, 60, -70, 104, 0, 104);
    c.bezierCurveTo(70, 104, 110, 60, 104, -20);
    c.bezierCurveTo(100, -90, -100, -90, -104, -20);
  }, skin);
  headShade(102, 92, 10);
  line([[-70, 62], [-52, 82]], '#c46d2a', 3);
  line([[70, 62], [52, 82]], '#c46d2a', 3);
  ell(-38, -8, 36, 26, '#f9d8a2', null);
  ell(38, -8, 36, 26, '#f9d8a2', null);
  eyes({ lx: -38, rx: 38, y: -6, rw: 20, rh: 14, pupil: 6, lid: 0.42, skin: '#f9d8a2', look: st.look, blink: st.blink, face: st.face });
  brows({ lx: -40, rx: 40, y: -36, w: 40, color: '#f0c040', lw: 6, face: st.face });
  mouth(0, 50, 50, st.mouth, { pucker: true, face: st.face });
  // The hair: a single heroic swoop.
  path(c => {
    c.moveTo(-112, -6);
    c.bezierCurveTo(-128, -92, -62, -142, 18, -134);
    c.bezierCurveTo(92, -128, 138, -96, 130, -38);
    c.bezierCurveTo(118, -60, 96, -64, 70, -58);
    c.bezierCurveTo(30, -54, -20, -64, -62, -48);
    c.bezierCurveTo(-86, -40, -100, -24, -112, -6);
  }, '#f8d24a');
  line([[-80, -60], [-20, -110], [60, -112]], '#e2b52c', 4);
  line([[-60, -48], [10, -86], [100, -80]], '#e2b52c', 4);
  if (st.hat !== undefined && st.hat !== false) trumpHat(st.hat);
}

function trumpHat(drop) {
  ctx.save();
  ctx.translate(0, -420 * (1 - drop));
  path(c => {
    c.moveTo(-112, -44);
    c.bezierCurveTo(-112, -150, 112, -150, 112, -44);
    c.closePath();
  }, '#d0202e');
  path(c => {
    c.moveTo(-122, -46);
    c.quadraticCurveTo(0, -4, 122, -46);
    c.quadraticCurveTo(0, -26, -122, -46);
  }, '#b0141f');
  ell(0, -142, 8, 5, '#b0141f', INK, 3);
  text('TRUMP', 0, -100, 30, '#fff', { weight: 900 });
  text('2028', 0, -70, 24, '#fff', { weight: 900 });
  ctx.restore();
}

// ---- Putin --------------------------------------------------------------------------------------

function putinBody() {
  const skin = SKIN.putin;
  rrect(-34, 70, 68, 50, 10, skin, null);
  path(c => {
    c.moveTo(-50, 92);
    c.quadraticCurveTo(-142, 98, -158, 170);
    c.lineTo(-172, 340);
    c.lineTo(172, 340);
    c.lineTo(158, 170);
    c.quadraticCurveTo(142, 98, 50, 92);
    c.closePath();
  }, skin);
  path(c => { c.moveTo(-112, 212); c.quadraticCurveTo(-60, 246, -8, 206); }, null, INK, 3.5);
  path(c => { c.moveTo(112, 212); c.quadraticCurveTo(60, 246, 8, 206); }, null, INK, 3.5);
  ell(-60, 214, 6, 6, '#d98a88', null);
  ell(60, 214, 6, 6, '#d98a88', null);
  for (const [x, y] of [[-6, 196], [4, 204], [-3, 214], [6, 222]]) line([[x, y], [x + 5, y - 6]], '#b49272', 2);
  line([[-4, 120], [0, 150]], '#d6b39f', 3);
}

function putinHead(st) {
  const skin = SKIN.putin;
  ell(-90, 10, 14, 22, skin);
  ell(90, 10, 14, 22, skin);
  ell(0, 0, 90, 104, skin);
  headShade(90, 104);
  line([[-86, -18], [-80, -62], [-56, -86]], '#c2a383', 10);
  line([[86, -18], [80, -62], [56, -86]], '#c2a383', 10);
  for (const [x, y] of [[-28, -98], [-6, -103], [16, -101]]) line([[x, y], [x + 10, y - 6]], '#d2b796', 3);
  eyes({ lx: -32, rx: 32, y: -8, rw: 16, rh: 11, pupil: 5, lid: 0.35, skin, look: st.look, blink: st.blink, face: st.face });
  path(c => { c.moveTo(-46, 10); c.quadraticCurveTo(-32, 18, -18, 10); }, null, '#c9a99a', 2.5);
  path(c => { c.moveTo(18, 10); c.quadraticCurveTo(32, 18, 46, 10); }, null, '#c9a99a', 2.5);
  brows({ lx: -33, rx: 33, y: -29, w: 34, color: '#a98d73', lw: 3.5, face: st.face });
  mouth(0, 54, 38, st.mouth, { face: st.face });
}

function bear(t) {
  const blink = (t % 4.3) < 0.12;
  const cover = S('bearCover', t);
  ell(-42, -48, 20, 20, '#7a4b2a');
  ell(42, -48, 20, 20, '#7a4b2a');
  ell(-42, -48, 10, 10, '#c8a07a', null);
  ell(42, -48, 10, 10, '#c8a07a', null);
  ell(0, 0, 66, 58, '#7a4b2a');
  ell(0, 20, 30, 22, '#c8a07a');
  ell(0, 9, 12, 8, INK, null);
  line([[0, 17], [0, 28]], INK, 3);
  if (blink) {
    line([[-30, -10], [-16, -10]], INK, 3);
    line([[16, -10], [30, -10]], INK, 3);
  } else {
    ell(-22, -10, 6, 7, INK, null);
    ell(22, -10, 6, 7, INK, null);
    ell(-20, -12, 2, 2, '#fff', null);
    ell(24, -12, 2, 2, '#fff', null);
  }
  if (TL.setting === 'holiday') {
    ctx.save();
    ctx.translate(6, -52);
    ctx.rotate(0.2);
    path(c => { c.moveTo(-46, 6); c.quadraticCurveTo(-30, -44, 10, -48); c.quadraticCurveTo(40, -42, 52, -10); c.quadraticCurveTo(32, -26, 28, 6); c.closePath(); }, '#d32f2f');
    ell(52, -10, 11, 11, '#fafafa');
    rrect(-52, -4, 100, 20, 10, '#fafafa');
    ctx.restore();
  }
  if (S('bearShirt', t)) {
    path(c => { c.moveTo(-70, 70); c.quadraticCurveTo(-64, 40, -36, 36); c.lineTo(36, 36); c.quadraticCurveTo(64, 40, 70, 70); c.closePath(); }, '#5b8fd6');
    poly([[-30, 34], [0, 52], [-6, 64], [-38, 44]], '#fff', INK, 3);
    poly([[30, 34], [0, 52], [6, 64], [38, 44]], '#fff', INK, 3);
    for (const y of [60, 68]) ell(0, y, 3, 3, '#fff', INK, 1.5);
  }
  if (cover) {
    ell(-24, -10, 24, 20, '#6a3f22');
    ell(24, -10, 24, 20, '#6a3f22');
    for (const x of [-34, -24, -14, 14, 24, 34]) ell(x, -24, 5, 5, '#c8a07a', null);
  }
  if (S('bearSweat', t)) {
    for (const [k, x] of [[0, 54], [0.45, -56]]) {
      const p = (t * 0.9 + k) % 1;
      const y = -30 + p * 60;
      ctx.globalAlpha = 1 - p;
      path(c => { c.moveTo(x, y - 12); c.quadraticCurveTo(x + 8, y, x, y + 4); c.quadraticCurveTo(x - 8, y, x, y - 12); }, '#8fd3ff', INK, 2);
      ctx.globalAlpha = 1;
    }
  }
}

// ---- Kim ----------------------------------------------------------------------------------------

function kimBody() {
  suit({ w: 168, neck: 50, color: '#26272b' });
  rrect(-44, 80, 88, 30, 8, '#26272b');
  line([[0, 110], [0, 330]], '#4a4b52', 3);
  for (const y of [135, 175, 215, 255]) ell(0, y, 5, 5, '#8c8e96', INK, 2);
  rrect(-108, 140, 50, 34, 4, null, '#4a4b52', 3);
  rrect(58, 140, 50, 34, 4, null, '#4a4b52', 3);
}

function kimHead(st) {
  const skin = SKIN.kim;
  ell(-108, 12, 16, 24, skin);
  ell(108, 12, 16, 24, skin);
  ell(0, 5, 110, 100, skin);
  headShade(110, 100, 5);
  ell(-64, 34, 18, 10, 'rgba(230,120,110,0.35)', null);
  ell(64, 34, 18, 10, 'rgba(230,120,110,0.35)', null);
  path(c => { c.moveTo(-46, 92); c.quadraticCurveTo(0, 114, 46, 92); }, null, '#c79a74', 3);
  poly([[-108, 0], [-104, -56], [-86, -78], [-82, -14]], '#6f6a66', null);
  poly([[108, 0], [104, -56], [86, -78], [82, -14]], '#6f6a66', null);
  // The flat-top: short on the sides, tall and slicked back on top.
  path(c => {
    c.moveTo(-88, -46);
    c.lineTo(-90, -112);
    c.quadraticCurveTo(-88, -130, -66, -132);
    c.quadraticCurveTo(-30, -142, 0, -134);
    c.quadraticCurveTo(34, -144, 66, -134);
    c.quadraticCurveTo(90, -132, 88, -112);
    c.lineTo(88, -46);
    c.quadraticCurveTo(40, -62, 0, -58);
    c.quadraticCurveTo(-40, -62, -88, -46);
  }, '#111114');
  for (const x of [-50, -16, 18, 52]) path(c => { c.moveTo(x - 6, -66); c.quadraticCurveTo(x + 10, -100, x + 2, -126); }, null, '#3a3a44', 3);
  eyes({ lx: -36, rx: 36, y: -6, rw: 16, rh: 10, pupil: 5, lid: 0.3, skin, look: st.look, blink: st.blink, face: st.face });
  brows({ lx: -38, rx: 38, y: -26, w: 36, color: INK, lw: 6, face: st.face });
  mouth(0, 54, 44, st.mouth, { face: st.face });
}

function missile() {
  ctx.save();
  ctx.translate(1000, 0);
  poly([[-35, 270], [0, 190], [35, 270]], '#c62828');
  rrect(-35, 266, 70, 470, 4, '#c9ccd1');
  ctx.fillStyle = '#2e5a2e';
  ctx.fillRect(-33, 330, 66, 14);
  ctx.fillRect(-33, 600, 66, 14);
  star(0, 400, 16, '#c62828');
  ctx.save();
  ctx.translate(14, 480);
  ctx.rotate(0.12);
  rrect(-22, -16, 44, 32, 2, '#ffe14d', INK, 2);
  text('TICKET', 0, 0, 10, INK, { weight: 900 });
  ctx.restore();
  ctx.restore();
}

function star(x, y, r, fill, stroke = INK) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  poly(pts, fill, stroke, 2);
}

// ---- Xi -----------------------------------------------------------------------------------------

function xiBody() {
  suit({ w: 160, neck: 58, color: '#2d2e33' });
  poly([[-42, 86], [42, 86], [0, 190]], '#f4f4f4');
  poly([[-11, 102], [11, 102], [17, 290], [0, 312], [-17, 290]], '#7d1d1d');
  poly([[-14, 92], [14, 92], [10, 110], [-10, 110]], '#621414');
  line([[-42, 86], [-8, 220]], INK, 4);
  line([[42, 86], [8, 220]], INK, 4);
  ell(-100, 148, 7, 7, '#d42a2a', INK, 2);
}

function xiHead(st) {
  const skin = SKIN.xi;
  ell(-103, 12, 15, 23, skin);
  ell(103, 12, 15, 23, skin);
  ell(0, 4, 105, 100, skin);
  headShade(105, 100, 4);
  ell(-60, 36, 18, 10, 'rgba(230,130,110,0.3)', null);
  ell(60, 36, 18, 10, 'rgba(230,130,110,0.3)', null);
  path(c => {
    c.moveTo(-101, -12);
    c.bezierCurveTo(-112, -100, -40, -130, 10, -126);
    c.bezierCurveTo(72, -122, 110, -90, 101, -12);
    c.quadraticCurveTo(96, -56, 60, -70);
    c.quadraticCurveTo(-10, -82, -40, -62);
    c.quadraticCurveTo(-78, -58, -101, -12);
  }, '#16161a');
  line([[-40, -62], [-28, -118]], '#4a4a52', 3);
  eyes({ lx: -36, rx: 36, y: -4, rw: 17, rh: 13, pupil: 6, skin, look: st.look, blink: st.blink, face: st.face });
  brows({ lx: -36, rx: 36, y: -30, w: 40, color: INK, lw: 5, curve: 10, face: st.face });
  mouth(0, 50, 46, st.mouth, { smile: 12, face: st.face });
}

function honeyPot() {
  ell(0, 0, 28, 24, '#e0a526');
  rrect(-20, -32, 40, 12, 4, '#e0a526');
  path(c => { c.moveTo(-18, -24); c.quadraticCurveTo(-10, -10, -14, 4); }, null, '#f7c948', 6);
  rrect(-20, -6, 40, 16, 2, '#fff8e1', INK, 2);
  text('HONEY', 0, 2, 10, INK, { weight: 900 });
}

// ---- Gary ---------------------------------------------------------------------------------------

function garyBody(st) {
  const shirt = { 1: '#bcd3ea', 2: '#c6e0b4', 3: '#f3e3a0' }[st.gary] || '#bcd3ea';
  path(c => {
    c.moveTo(-30, 92);
    c.quadraticCurveTo(-96, 98, -112, 170);
    c.lineTo(-122, 300);
    c.lineTo(122, 300);
    c.lineTo(112, 170);
    c.quadraticCurveTo(96, 98, 30, 92);
    c.closePath();
  }, shirt);
  poly([[-30, 90], [0, 116], [-10, 132], [-40, 104]], '#fff', INK, 3);
  poly([[30, 90], [0, 116], [10, 132], [40, 104]], '#fff', INK, 3);
  line([[-26, 100], [0, 196]], '#1f5fbf', 5);
  line([[26, 100], [0, 196]], '#1f5fbf', 5);
  rrect(-34, 192, 68, 44, 4, '#fff', INK, 3);
  ctx.fillStyle = '#1f5fbf';
  ctx.fillRect(-32, 194, 64, 10);
  text(st.gary > 1 ? `GARY ${st.gary}` : 'GARY', 0, 220, 15, INK, { weight: 900 });
}

function garyHead(st) {
  const skin = SKIN.gary;
  ell(-76, 6, 13, 20, skin);
  ell(76, 6, 13, 20, skin);
  ell(0, 0, 78, 104, skin);
  headShade(78, 104);
  path(c => {
    c.moveTo(-77, -30);
    c.quadraticCurveTo(-92, -92, -50, -108);
    c.quadraticCurveTo(-28, -130, 0, -112);
    c.quadraticCurveTo(26, -134, 46, -108);
    c.quadraticCurveTo(88, -104, 77, -30);
    c.quadraticCurveTo(62, -76, 20, -72);
    c.quadraticCurveTo(-20, -82, -50, -62);
    c.quadraticCurveTo(-68, -56, -77, -30);
  }, '#6b4626');
  eyes({ lx: -32, rx: 32, y: -10, rw: 15, rh: 15, pupil: 6, skin, look: st.look, blink: st.blink, face: st.face });
  ell(-32, -10, 26, 24, 'rgba(255,255,255,0.15)', INK, 4);
  ell(32, -10, 26, 24, 'rgba(255,255,255,0.15)', INK, 4);
  line([[-6, -12], [6, -12]], INK, 4);
  brows({ lx: -34, rx: 34, y: -50, w: 40, color: INK, lw: 4, face: st.face === 'neutral' ? 'sad' : st.face });
  mouth(0, 58, 38, st.mouth, { wavy: true, face: st.face });
  if (st.gary === 3) garyHelmet();
  for (const k of [0, 0.5]) {
    const p = ((st.t * 0.7 + k) % 1);
    const x = 66 + k * 10;
    const y = -40 + p * 90;
    ctx.globalAlpha = 1 - p;
    path(c => {
      c.moveTo(x, y - 14);
      c.quadraticCurveTo(x + 9, y, x, y + 4);
      c.quadraticCurveTo(x - 9, y, x, y - 14);
    }, '#8fd3ff', INK, 2);
    ctx.globalAlpha = 1;
  }
}

function garyHelmet() {
  path(c => {
    c.moveTo(-92, -40);
    c.bezierCurveTo(-96, -150, 96, -150, 92, -40);
    c.quadraticCurveTo(0, -62, -92, -40);
  }, '#e53935');
  for (const x of [-40, 0, 40]) rrect(x - 8, -122 + Math.abs(x) * 0.3, 16, 34, 6, '#1b1b1f', null);
  line([[-86, -40], [-70, 40], [-30, 84]], INK, 4);
  line([[86, -40], [70, 40], [30, 84]], INK, 4);
}

function podium() {
  poly([[1640, 612], [1880, 612], [1870, 1080], [1650, 1080]], '#3d5f96');
  rrect(1622, 596, 276, 24, 4, '#8b5e3c');
  ell(1760, 760, 56, 56, '#f4f1e6', INK, 4);
  ell(1760, 760, 36, 36, '#6fa8dc', INK, 3);
  line([[1724, 760], [1796, 760]], INK, 2);
  line([[1760, 724], [1760, 796]], INK, 2);
  path(c => { c.ellipse(1760, 760, 16, 36, 0, 0, TAU); }, null, INK, 2);
  rrect(1680, 852, 160, 40, 4, '#d9b54a', INK, 3);
  text('MODERATOR', 1760, 873, 22, INK, { weight: 900 });
}

// ---- Hands --------------------------------------------------------------------------------------

// Draws a hand holding up `n` fingers (0-5). Fingers drop pinky first, thumb last.
function hand(cx, cy, scale, n, mirror, skin, tilt) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  ctx.scale(mirror ? -scale : scale, scale);
  const fingers = [{ x: -17, len: 36 }, { x: -5, len: 42 }, { x: 7, len: 39 }, { x: 18, len: 30 }];
  fingers.forEach((f, i) => {
    const up = n >= i + 2;
    const l = up ? f.len : 10;
    rrect(f.x - 6, -18 - l, 12, l + 14, 6, skin, INK, 3.5);
  });
  rrect(-25, -20, 50, 46, 14, skin, INK, 4);
  ctx.save();
  ctx.translate(-24, 4);
  ctx.rotate(n >= 1 ? -0.7 : 0.4);
  rrect(-6, n >= 1 ? -34 : -14, 12, n >= 1 ? 38 : 18, 6, skin, INK, 3.5);
  ctx.restore();
  ctx.restore();
}

const SLEEVE = { trump: '#1f2b55', putin: SKIN.putin, kim: '#26272b', xi: '#2d2e33' };

function handOffset(who, side, t) {
  const p = activeFx('highfive', t);
  if (p == null) return { dx: 0, dy: 0 };
  const k = Math.sin(Math.PI * p);
  if (who === 'putin' && side > 0) return { dx: 50 * k, dy: -90 * k };
  if (who === 'kim' && side < 0) return { dx: -60 * k, dy: -90 * k };
  return { dx: 0, dy: 0 };
}

function reachTarget(who, t) {
  const to = S(`reachTo_${who}`, t);
  const c = CHARS[who];
  if (to === 'button') return { x: c.x + 6, y: TABLE_Y - 40 };
  if (CHARS[to]) return { x: CHARS[to].x - 95, y: CHARS[to].y + 190 };
  return null;
}

function drawHands(who, t) {
  const c = CHARS[who];
  if (who === 'kim' && S('duck_kim', t) > 0.3) return;
  const n = S(`fingers_${who}`, t);
  const drop = since(`fingers_${who}`, t) < 0.2 ? 8 : 0;
  const scale = who === 'trump' ? 0.28 : 1;
  for (const side of [-1, 1]) {
    const up = side < 0 ? clamp(n, 0, 5) : clamp(n - 5, 0, 5);
    const off = handOffset(who, side, t);
    let hx = c.x + side * 95 + off.dx;
    let hy = c.y + 215 + drop + off.dy;
    const target = side > 0 && reachTarget(who, t);
    const r = S(`reach_${who}`, t);
    if (target && r > 0) {
      hx = lerp(hx, target.x, r);
      hy = lerp(hy, target.y, r);
    }
    const sleeveTop = hy + 22 * scale;
    path(cx => {
      cx.moveTo(hx - 17, sleeveTop);
      cx.lineTo(c.x + side * 95 - 19, TABLE_Y + 10);
      cx.lineTo(c.x + side * 95 + 19, TABLE_Y + 10);
      cx.lineTo(hx + 17, sleeveTop);
      cx.closePath();
    }, SLEEVE[who]);
    hand(hx, hy, scale, up, side > 0, SKIN[who], side * 0.12);
  }
  const hf = activeFx('highfive', t);
  if (who === 'kim' && hf != null && Math.abs(hf - 0.5) < 0.12) {
    star(680, 520, 46, '#ffe14d');
    text('SMACK!', 680, 440, 44, '#fff', { font: 'Bangers', weight: 400, stroke: INK, strokeWidth: 8 });
  }
}

// ---- Putting a character together ---------------------------------------------------------------

const HEADS = { trump: trumpHead, putin: putinHead, kim: kimHead, xi: xiHead, gary: garyHead };
const BODIES = { trump: trumpBody, putin: putinBody, kim: kimBody, xi: xiBody, gary: garyBody };

function charState(who, t) {
  const st = { t, mouth: mouthOpen(who, t), look: lookVector(who, t), blink: blinking(who, t), gary: S('gary', t),
    face: S(`face_${who}`, t) || 'neutral' };
  if (who === 'trump' && S('hat', t)) st.hat = easeOutBack(Math.min(1, since('hat', t) / 0.45));
  return st;
}

function button(x, y, pressed) {
  rrect(x - 30, y - 16, 60, 20, 4, '#3a3a40');
  ell(x, y - 16 + (pressed ? 6 : 0), 22, 11, '#e53935', INK, 3);
}

function drawCharacter(who, t) {
  const c = CHARS[who];
  const st = charState(who, t);
  ctx.save();
  ctx.translate(c.x, c.y + (who === 'kim' ? 340 * S('duck_kim', t) : 0));
  if (who === 'gary' && st.gary === 3) ctx.translate(Math.sin(t * 47) * 2, 0);
  BODIES[who](st);
  ell(0, 98, 60, 15, 'rgba(0,0,0,0.16)', null);
  // Bob the head while talking, on twos like a cheap cutout.
  const bob = st.mouth ? -5 * (Math.floor(t * 12) % 2) : 0;
  ctx.translate(0, bob);
  HEADS[who](st);
  if (TL.setting === 'holiday') santaHat(who, st);
  if ((who === 'gary' && S('garyCup', t)) || (who === 'xi' && S('xiSip', t))) teacup(26, 82, t);
  ctx.restore();
}

// Santa hats: where each head's top sits, how wide it is, and the tilt.
const HAT_FIT = { trump: [-118, 100, 0.12], putin: [-90, 82, -0.1], kim: [-126, 94, 0.08], xi: [-106, 96, -0.12], gary: [-100, 78, 0.15] };

function santaHat(who, st) {
  let [y, w, tilt] = HAT_FIT[who];
  if (who === 'gary' && st.gary === 3) y = -128;
  if (who === 'trump' && st.hat) return;
  ctx.save();
  ctx.translate(0, y);
  ctx.rotate(tilt);
  path(c => {
    c.moveTo(-w, 8);
    c.quadraticCurveTo(-w * 0.7, -w * 0.95, w * 0.3, -w * 1.05);
    c.quadraticCurveTo(w * 0.95, -w * 0.9, w * 1.2, -w * 0.25);
    c.quadraticCurveTo(w * 0.75, -w * 0.6, w * 0.65, 8);
    c.closePath();
  }, '#d32f2f');
  ell(w * 1.2, -w * 0.25, 19, 19, '#fafafa');
  rrect(-w - 12, -8, w * 2 + 24, 32, 16, '#fafafa');
  ctx.restore();
}

// Gifts held up in front of the chest, with a hand gripping each side.
function heldItem(who, item, t) {
  const c = CHARS[who];
  ctx.save();
  ctx.translate(c.x, c.y + (who === 'gary' ? 175 : 165));
  const bob = Math.sin(t * 3) * 3;
  ctx.translate(0, bob);
  const gripX = { missile: 32, shirt: 72, window: 74, phone: 42, nametag: 94 }[item];
  ITEMS[item](t);
  const r = who === 'trump' ? 7 : 17;
  ell(-gripX, 0, r, r * 1.15, SKIN[who]);
  ell(gripX, 0, r, r * 1.15, SKIN[who]);
  ctx.restore();
}

function bow(x, y, s, color) {
  ell(x - 14 * s, y, 14 * s, 9 * s, color, INK, 3, -0.4);
  ell(x + 14 * s, y, 14 * s, 9 * s, color, INK, 3, 0.4);
  ell(x, y, 6 * s, 6 * s, color, INK, 3);
}

const ITEMS = {
  missile() {
    poly([[-18, -70], [0, -112], [18, -70]], '#c62828');
    rrect(-18, -72, 36, 140, 3, '#c9ccd1');
    poly([[-18, 50], [-34, 72], [-18, 68]], '#8d939c');
    poly([[18, 50], [34, 72], [18, 68]], '#8d939c');
    star(0, -30, 9, '#c62828');
    ctx.fillStyle = '#ff6fae';
    ctx.fillRect(-18, 6, 36, 10);
    bow(0, 4, 1, '#ff6fae');
  },
  shirt() {
    path(c => {
      c.moveTo(-40, -62); c.lineTo(-78, -40); c.lineTo(-64, -6); c.lineTo(-50, -14); c.lineTo(-50, 70);
      c.lineTo(50, 70); c.lineTo(50, -14); c.lineTo(64, -6); c.lineTo(78, -40); c.lineTo(40, -62); c.closePath();
    }, '#5b8fd6');
    poly([[-40, -62], [0, -36], [-10, -22], [-46, -50]], '#fff', INK, 3);
    poly([[40, -62], [0, -36], [10, -22], [46, -50]], '#fff', INK, 3);
    line([[0, -36], [0, 70]], '#3f6fb2', 3);
    for (const y of [-14, 12, 38]) ell(6, y, 3.5, 3.5, '#fff', INK, 1.5);
  },
  window() {
    rrect(-72, -88, 144, 176, 4, '#f6f3ea');
    ctx.fillStyle = '#8ecdf0';
    ctx.fillRect(-60, -76, 120, 152);
    line([[0, -76], [0, 76]], '#f6f3ea', 10);
    line([[-60, 0], [60, 0]], '#f6f3ea', 10);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.strokeRect(-60, -76, 120, 152);
    bow(0, -88, 1.1, '#43a047');
  },
  phone(t) {
    rrect(-38, -72, 76, 144, 14, '#16161a');
    rrect(-31, -60, 62, 116, 6, '#1e3a5f', null);
    const look = Math.sin(t * 1.3) * 6;
    ell(0, -4, 24, 15, '#fff', INK, 2.5);
    ell(look, -4, 8, 8, '#c62828', null);
    ell(look, -4, 3.5, 3.5, INK, null);
    text('REC', 0, 34, 14, '#ff5252', { weight: 900 });
  },
  nametag() {
    rrect(-92, -58, 184, 116, 10, '#fff');
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(-92, -58, 184, 116, 10);
    ctx.clip();
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(-92, -58, 184, 38);
    ctx.restore();
    text('HELLO', 0, -44, 22, '#fff', { weight: 900 });
    text('my name is', 0, -26, 12, '#fff', { weight: 700 });
    text('GARY 4', 0, 18, 44, INK, { font: 'Marker', weight: 400 });
    rrect(-92, -58, 184, 116, 10, null, INK, 4);
  },
};

function giftBox(x, y, color, state) {
  const ribbon = '#ffd54f';
  if (state === 'open') {
    rrect(x - 62, y - 70, 124, 70, 3, color);
    ell(x, y - 70, 62, 9, '#5a1414', INK, 3);
    ctx.save();
    ctx.translate(x + 82, y - 34);
    ctx.rotate(0.5);
    rrect(-34, -8, 68, 22, 3, color);
    ctx.restore();
    for (const [dx, r] of [[-80, 0.4], [-92, -0.8], [96, 1.2]]) {
      ctx.save();
      ctx.translate(x + dx, y - 6);
      ctx.rotate(r);
      poly([[-12, -6], [10, -10], [14, 6], [-8, 9]], color, INK, 2);
      ctx.restore();
    }
    return;
  }
  rrect(x - 62, y - 92, 124, 92, 3, color);
  ctx.fillStyle = ribbon;
  ctx.fillRect(x - 9, y - 92, 18, 92);
  ctx.fillRect(x - 62, y - 54, 124, 16);
  rrect(x - 62, y - 92, 124, 92, 3, null, INK, 4);
  bow(x, y - 96, 1.4, ribbon);
}

// A bare head for title cards and the like.
function drawHead(who, x, y, scale, st) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const full = { t: 0, mouth: 0, look: { dx: 0, dy: 0 }, blink: false, gary: 1, face: 'neutral', ...st };
  HEADS[who](full);
  if (TL.setting === 'holiday') santaHat(who, full);
  ctx.restore();
}
