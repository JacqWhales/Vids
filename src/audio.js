// Synthesized sound effects and music beds, plus the final stereo mix of the episode.
const fs = require('fs');
const path = require('path');
const { readClip, SR } = require('./timeline');
const { BUILD } = require('./paths');

const TAU = Math.PI * 2;
const len = sec => Math.max(1, Math.ceil(sec * SR));
const midi = n => 440 * Math.pow(2, (n - 69) / 12);

let seed = 12345;
function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
const noise = () => rand() * 2 - 1;

// Mixes `src` into `dst` starting at sample `at`.
function addInto(dst, src, at, gain = 1) {
  for (let i = 0; i < src.length && at + i < dst.length; i++) if (at + i >= 0) dst[at + i] += src[i] * gain;
  return dst;
}

// Pitch sweep from f0 to f1 with an exponential decay.
function sweep(f0, f1, dur, decay, type = 'sine') {
  const out = new Float32Array(len(dur));
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const k = i / out.length;
    ph += TAU * (f0 + (f1 - f0) * k) / SR;
    const w = type === 'square' ? Math.sign(Math.sin(ph)) * 0.6 : Math.sin(ph);
    out[i] = w * Math.exp(-k * decay) * Math.min(1, i / 60);
  }
  return out;
}

function noiseBurst(dur, decay, smooth = 0) {
  const out = new Float32Array(len(dur));
  let lp = 0;
  for (let i = 0; i < out.length; i++) {
    const n = noise();
    lp += (n - lp) * (1 - smooth);
    out[i] = lp * Math.exp(-(i / out.length) * decay);
  }
  return out;
}

// Karplus-Strong plucked string, which reads as a cheap acoustic guitar.
function pluck(freq, dur, decay = 0.996, gain = 0.5) {
  const out = new Float32Array(len(dur));
  const n = Math.round(SR / freq);
  const ring = new Float32Array(n).map(() => noise() * gain);
  let idx = 0;
  for (let i = 0; i < out.length; i++) {
    const next = (idx + 1) % n;
    const v = ring[idx];
    ring[idx] = decay * 0.5 * (v + ring[next]);
    out[i] = v;
    idx = next;
  }
  return out;
}

function strum(dst, at, notes, dur, dir = 1, gain = 0.35) {
  const order = dir > 0 ? notes : [...notes].reverse();
  order.forEach((m, i) => addInto(dst, pluck(midi(m), dur), at + Math.round(i * 0.018 * SR), gain));
}

// Additive "brass" for stabs and stings.
function brass(freq, dur, attack = 0.02, release = 0.3) {
  const out = new Float32Array(len(dur));
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const env = Math.min(1, t / attack) * Math.min(1, (dur - t) / release);
    let v = 0;
    for (let h = 1; h <= 8; h++) v += Math.sin(TAU * freq * h * t) / h * (h % 2 ? 1 : 0.6);
    out[i] = v * env * 0.25;
  }
  return out;
}

function lowpass(x, alpha) {
  let y = 0;
  for (let i = 0; i < x.length; i++) x[i] = y += (x[i] - y) * alpha;
  return x;
}

function timpani(dur = 0.9) {
  const out = sweep(110, 55, dur, 5);
  return addInto(out, noiseBurst(0.08, 8, 0.6), 0, 0.4);
}

const sfx = {
  thunk: () => sweep(620, 240, 0.13, 6),
  pop: () => addInto(sweep(300, 1000, 0.09, 4), noiseBurst(0.02, 10), 0, 0.3),
  tick: () => addInto(sweep(1800, 1600, 0.03, 12), noiseBurst(0.01, 10), 0, 0.3),
  stamp: () => addInto(sweep(90, 40, 0.35, 6), noiseBurst(0.2, 10, 0.4), 0, 0.7),
  clock: dur => {
    const out = new Float32Array(len(dur));
    for (let k = 0; k * 0.5 < dur; k++) addInto(out, sweep(k % 2 ? 1500 : 1900, 1400, 0.03, 14), len(k * 0.5), 0.5);
    return out;
  },
  twinkle: () => {
    const out = new Float32Array(len(1.2));
    [84, 88, 91, 96, 100].forEach((m, i) => addInto(out, sweep(midi(m), midi(m), 0.6, 6), len(i * 0.07), 0.25));
    return out;
  },
  slap: () => lowpass(noiseBurst(0.16, 14), 0.5),
  squeak: dur => {
    const out = lowpass(noiseBurst(dur, 0, 0.98), 0.05).map(v => v * 0.6);
    for (let k = 0; k * 0.38 < dur - 0.1; k++) {
      const s = sweep(1500 + rand() * 300, 2100 + rand() * 300, 0.13, 2);
      addInto(out, s, len(k * 0.38), 0.12);
    }
    return out;
  },
  beep: dur => sweep(1000, 1000, dur, 0).map((v, i, a) => v * Math.min(1, (a.length - i) / 200) * 0.5),
  error: () => {
    const out = new Float32Array(len(0.9));
    addInto(out, sweep(660, 655, 0.3, 4, 'square'), 0, 0.35);
    return addInto(out, sweep(440, 435, 0.5, 4, 'square'), len(0.28), 0.35);
  },
  scratch: () => {
    const out = new Float32Array(len(0.45));
    for (let i = 0; i < out.length; i++) {
      const k = i / out.length;
      out[i] = noise() * Math.sin(TAU * (900 - 700 * k) * i / SR) * (1 - k) * 0.8;
    }
    return lowpass(out, 0.35);
  },
  slam: () => {
    const out = addInto(sweep(80, 35, 0.5, 6), noiseBurst(0.25, 10, 0.3), 0, 0.6);
    for (let k = 0; k < 5; k++) addInto(out, sweep(2500 + rand() * 2000, 2400, 0.06, 10), len(0.05 + k * 0.06), 0.15);
    return out;
  },
  slide: dur => lowpass(noiseBurst(dur, 1, 0.2), 0.2).map(v => v * 0.35),
  sting: () => {
    const out = new Float32Array(len(2.6));
    for (const m of [38, 41, 45, 50, 53]) addInto(out, brass(midi(m), 2.5, 0.04, 1.6), 0, 0.5);
    addInto(out, timpani(1.2), 0, 1);
    return lowpass(out, 0.3);
  },
  newsJingle: () => {
    const out = new Float32Array(len(2.0));
    const hits = [[0, [60, 64, 67]], [0.18, [60, 64, 67]], [0.36, [65, 69, 72]], [0.7, [67, 71, 74]], [1.0, [72, 76, 79]]];
    for (const [t, chord] of hits) for (const m of chord) addInto(out, brass(midi(m), t < 1 ? 0.22 : 0.9), len(t), 0.4);
    addInto(out, timpani(), len(1.0), 0.9);
    return out;
  },
  buzz: () => sweep(110, 105, 0.6, 1.5, 'square').map((v, i, a) => v * Math.min(1, (a.length - i) / 400)),
  whoosh: () => {
    const out = noiseBurst(0.35, 0, 0.7);
    return out.map((v, i) => v * Math.sin(Math.PI * i / out.length) * 0.8);
  },
  canOpen: () => addInto(sweep(3000, 2500, 0.02, 8), lowpass(noiseBurst(0.3, 6), 0.6), len(0.01), 0.7),
  sip: () => {
    const out = new Float32Array(len(0.9));
    for (let k = 0; k < 3; k++) addInto(out, lowpass(noiseBurst(0.18, 3, 0.5), 0.15), len(k * 0.26), 0.6);
    return addInto(out, sweep(300, 180, 0.12, 6), len(0.8), 0.4);
  },
  rip: () => {
    const out = new Float32Array(len(0.45));
    let gate = 0;
    for (let i = 0; i < out.length; i++) {
      if (i % 240 === 0) gate = rand() < 0.6 ? 1 : 0.2;
      out[i] = noise() * gate * (1 - i / out.length);
    }
    return lowpass(out, 0.45);
  },
  gulp: () => addInto(sweep(320, 110, 0.2, 3), sweep(180, 260, 0.08, 4), len(0.18), 0.6),
  ding: () => addInto(sweep(1320, 1320, 1.0, 5), sweep(2640, 2640, 0.8, 7), 0, 0.5),
  holidayJingle: () => {
    const out = guitarRiff([[60, 64, 67, 72], [65, 69, 72, 77], [67, 71, 74, 79], [60, 64, 67, 72]], 4.8);
    for (let k = 0; k * 0.2875 < 4.3; k++) addInto(out, sleighBell(), len(k * 0.2875), k % 2 ? 0.18 : 0.28);
    return out;
  },
  titleJingle: () => guitarRiff([[55, 59, 62, 67], [48, 52, 55, 60, 64], [50, 54, 57, 62], [55, 59, 62, 67]], 5.6),
  endJingle: () => guitarRiff([[48, 52, 55, 60, 64], [50, 54, 57, 62], [55, 59, 62, 67]], 6.0),
};

function sleighBell() {
  const out = new Float32Array(len(0.18));
  const partials = [3100, 4700, 6300, 7900].map(f => [f * (0.98 + rand() * 0.04), rand() * TAU]);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let v = noise() * 0.3;
    for (const [f, ph] of partials) v += Math.sin(TAU * f * t + ph) * 0.25;
    out[i] = v * Math.exp(-t * 28);
  }
  return out;
}

// Down-down-up-up-down strumming through the chords, then a final ring.
function guitarRiff(chords, dur) {
  const out = new Float32Array(len(dur));
  const bar = 1.15;
  const pattern = [[0, 1], [0.29, 1], [0.43, -1], [0.72, -1], [0.86, 1]];
  chords.forEach((chord, c) => {
    const last = c === chords.length - 1;
    addInto(out, pluck(midi(chord[0] - 12), 1.2, 0.997), len(c * bar), 0.5);
    for (const [off, dir] of last ? [[0, 1]] : pattern) strum(out, len(c * bar + off * bar), chord, last ? 2.5 : 0.6, dir);
  });
  return out;
}

const music = {
  // A sultry, entirely made-up saxophone line over a soft pad.
  sax(dur) {
    const out = new Float32Array(len(dur));
    const beat = 60 / 76;
    const melody = [[69, 1.5], [67, 0.5], [64, 1], [62, 1], [64, 3], [0, 1], [72, 1], [71, 0.5], [69, 0.5], [67, 1], [64, 1], [69, 3], [0, 1]];
    const chords = [[45, 52, 57, 60], [43, 50, 55, 59], [41, 48, 53, 57], [40, 47, 52, 56]];
    let t = 0;
    for (let rep = 0; t < dur; rep++) {
      for (const [m, b] of melody) {
        if (t >= dur) break;
        if (m) addInto(out, saxNote(midi(m), b * beat), len(t), 0.5);
        t += b * beat;
      }
    }
    for (let k = 0; k * 4 * beat < dur; k++) {
      for (const m of chords[k % chords.length]) addInto(out, pad(midi(m), 4 * beat), len(k * 4 * beat), 0.06);
    }
    return out;
  },
  // Spaghetti-western standoff: a lonely whistle over a slow, low guitar. An original tune.
  whistle(dur) {
    const out = new Float32Array(len(dur + 1));
    const beat = 60 / 66;
    const melody = [[76, 1.5], [81, 0.5], [76, 1], [74, 0.5], [72, 0.5], [74, 3], [76, 1.5], [79, 0.5], [77, 1], [76, 0.5], [74, 0.5], [69, 3]];
    let t = 0;
    for (let rep = 0; t < dur; rep++) {
      for (const [m, b] of melody) {
        if (t >= dur) break;
        addInto(out, whistleNote(midi(m), b * beat), len(t), 0.35);
        t += b * beat;
      }
    }
    for (let k = 0; k * 2 * beat < dur; k++) addInto(out, pluck(midi(k % 2 ? 40 : 45), 2.2, 0.998, 0.6), len(k * 2 * beat), 0.45);
    return out;
  },
  // The gentle "I learned something today" acoustic arpeggio.
  learned(dur) {
    const out = new Float32Array(len(dur + 2));
    const eighth = 60 / 72 / 2;
    const chords = [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]];
    const order = [0, 1, 2, 3, 2, 1, 2, 3];
    for (let k = 0; k * eighth < dur; k++) {
      const chord = chords[Math.floor(k / 8) % 4];
      addInto(out, pluck(midi(chord[order[k % 8]]), 1.6, 0.997, 0.4), len(k * eighth), 0.32);
    }
    return out;
  },
};

function saxNote(freq, dur) {
  const out = new Float32Array(len(dur));
  let ph = 0;
  let lp = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const vib = 1 + 0.006 * Math.sin(TAU * 5.2 * t) * Math.min(1, t / 0.3);
    ph += TAU * freq * vib / SR;
    let v = 0;
    for (let h = 1; h <= 10; h++) v += Math.sin(ph * h) * (h === 1 ? 1 : 0.9 / h);
    v += noise() * 0.04;
    const env = Math.min(1, t / 0.05) * Math.min(1, (dur - t) / 0.12);
    lp += (v - lp) * 0.25;
    out[i] = lp * env * 0.3;
  }
  return out;
}

function whistleNote(freq, dur) {
  const out = new Float32Array(len(dur));
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    ph += TAU * freq * (1 + 0.012 * Math.sin(TAU * 5.5 * t) * Math.min(1, t / 0.25)) / SR;
    const env = Math.min(1, t / 0.06) * Math.min(1, (dur - t) / 0.1);
    out[i] = (Math.sin(ph) + noise() * 0.03) * env;
  }
  return out;
}

function pad(freq, dur) {
  const out = new Float32Array(len(dur));
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.6) * Math.min(1, (dur - t) / 0.6);
    out[i] = (Math.sin(TAU * freq * t) + 0.3 * Math.sin(TAU * freq * 2.003 * t)) * env;
  }
  return out;
}

const SFX_GAIN = { thunk: 0.5, pop: 0.5, tick: 0.35, clock: 0.35, slap: 0.9, squeak: 0.8, beep: 0.45, error: 0.7,
  twinkle: 0.7, slide: 0.6, rip: 0.7, gulp: 0.8, ding: 0.6, holidayJingle: 0.9, buzz: 0.5, whoosh: 0.6, canOpen: 0.6, sip: 0.8, titleJingle: 0.9, endJingle: 0.8, newsJingle: 0.8, sting: 0.9, slam: 0.9 };

function mix(plan, outFile) {
  const n = len(plan.duration);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const place = (src, t, gain, pan = 0) => {
    const a = (pan + 1) * Math.PI / 4;
    addInto(L, src, len(t), gain * Math.cos(a) * Math.SQRT2);
    addInto(R, src, len(t), gain * Math.sin(a) * Math.SQRT2);
  };
  for (const c of plan.clips) place(readClip(c.file), c.t, c.gain, c.pan * 0.6);
  for (const s of plan.sfx) {
    const make = sfx[s.name];
    if (!make) throw new Error(`unknown sfx ${s.name}`);
    place(make(s.dur || 1), s.t, (s.gain ?? 1) * (SFX_GAIN[s.name] ?? 0.6));
  }
  for (const m of plan.music) {
    const dur = m.end - m.start;
    const bed = music[m.name](dur + 1.5);
    const fade = m.hard ? 0.02 : 1.5;
    const stop = len(m.hard ? dur : dur + 1.5);
    for (let i = 0; i < bed.length; i++) {
      const t = i / SR;
      bed[i] *= i >= stop ? 0 : Math.min(1, t / 0.4, (stop / SR - t) / fade);
    }
    place(bed, m.start, { sax: 0.55, whistle: 0.5 }[m.name] || 0.45);
  }
  // Gentle soft-clip so stacked hits never wrap around.
  const pcm = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    pcm.writeInt16LE(Math.round(Math.tanh(L[i] * 0.9) * 32000), i * 4);
    pcm.writeInt16LE(Math.round(Math.tanh(R[i] * 0.9) * 32000), i * 4 + 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(outFile, Buffer.concat([header, pcm]));
}

module.exports = { mix };

if (require.main === module) {
  const plan = JSON.parse(fs.readFileSync(path.join(BUILD, 'audio-plan.json')));
  mix(plan, path.join(BUILD, 'mix.wav'));
  console.log(`wrote ${path.join(BUILD, 'mix.wav')}`);
}
