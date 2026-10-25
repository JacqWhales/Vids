// Turns the episode script into a timed timeline: voices every line (cached), measures it,
// then lays out beats, renderer state changes, effects, subtitles and the audio plan.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { cast, beats, leaders } = require('./episode');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const TTS_DIR = path.join(BUILD, 'tts');
const SR = 48000;
const ENV_FPS = 24;
const DEFAULT_PAUSE = 0.3;
const everyone = [...leaders, 'gary'];

function ttsFile(who, text) {
  const c = cast[who];
  const key = JSON.stringify([c.voice, c.pitch, c.length, text]);
  const hash = crypto.createHash('sha1').update(key).digest('hex').slice(0, 16);
  return path.join(TTS_DIR, `${who}-${hash}.f32`);
}

function voiceJobs() {
  const jobs = [];
  const add = (who, text) => {
    const c = cast[who];
    jobs.push({ out: ttsFile(who, text), voice: c.voice, text, length: c.length, pitch: c.pitch });
  };
  for (const b of beats) {
    if (b.say) for (const who of [].concat(b.say)) add(who, b.tts || b.text);
    for (const e of [...(b.do || []), ...(b.then || [])]) if (e.line) add(e.line.who, e.line.text);
  }
  return jobs;
}

function synthesize() {
  fs.mkdirSync(TTS_DIR, { recursive: true });
  const jobs = voiceJobs();
  const pending = jobs.filter(j => !fs.existsSync(j.out));
  if (!pending.length) return;
  const jobsPath = path.join(BUILD, 'tts-jobs.json');
  fs.writeFileSync(jobsPath, JSON.stringify(pending));
  execFileSync('python3', [path.join(ROOT, 'tools', 'tts.py'), jobsPath, path.join(ROOT, 'voices')],
    { stdio: 'inherit' });
}

function readClip(file) {
  const buf = fs.readFileSync(file);
  return new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
}

// Loudness per 1/24 s, normalised to the clip's peak, for mouth flaps.
function envelope(samples) {
  const hop = SR / ENV_FPS;
  const out = [];
  let peak = 1e-6;
  for (let i = 0; i < samples.length; i += hop) {
    let s = 0;
    const end = Math.min(samples.length, i + hop);
    for (let j = i; j < end; j++) s += samples[j] * samples[j];
    const rms = Math.sqrt(s / (end - i));
    out.push(rms);
    peak = Math.max(peak, rms);
  }
  return out.map(v => Math.round((v / peak) * 100) / 100);
}

function build() {
  synthesize();
  const clipInfo = new Map();
  const info = (who, text) => {
    const file = ttsFile(who, text);
    if (!clipInfo.has(file)) {
      const s = readClip(file);
      clipInfo.set(file, { file, dur: s.length / SR, env: envelope(s) });
    }
    return clipInfo.get(file);
  };

  const raw = []; // unresolved events: {t, ev}
  const speech = [];
  const subs = [];
  const clips = [];
  const panels = [];
  let shot = 'wide';
  let scene = 'disclaimer';
  let t = 0.5;

  for (const b of beats) {
    const start = t;
    shot = b.shot || shot;
    scene = b.scene || scene;
    let audioDur = 0;
    if (b.scene) raw.push({ t: start, ev: { set: { scene: b.scene } } });
    if (b.shot) raw.push({ t: start, ev: { set: { shot: b.shot } } });
    if (b.say) {
      const who = [].concat(b.say);
      const lines = who.map(w => info(w, b.tts || b.text));
      audioDur = Math.max(...lines.map(l => l.dur));
      lines.forEach((l, i) => clips.push({ file: l.file, t: start, gain: who.length > 1 ? 0.7 : 1, pan: cast[who[i]].pan }));
      speech.push({ who, start, dur: audioDur, env: lines[0].env.map((v, i) => Math.max(...lines.map(l => l.env[i] || 0))) });
      subs.push({ start, end: start + audioDur + 0.2, who: who.join('+'), text: b.text });
    } else {
      audioDur = b.wait || 0;
    }
    for (const e of b.do || []) raw.push({ t: start + (e.at || 0), ev: e });
    for (const e of b.then || []) raw.push({ t: start + audioDur + (e.at || 0), ev: e });
    t = start + audioDur + (b.hold || 0) + (b.pause ?? (b.say ? DEFAULT_PAUSE : 0));
    const at = b.panelAt ?? (b.say ? Math.max(0, audioDur * 0.7) : audioDur * 0.6);
    panels.push({ n: panels.length + 1, start: round(start), end: round(t), at: round(start + Math.min(at, t - start - 0.02)),
      scene, shot, who: b.say ? [].concat(b.say).join(' + ') : '', text: b.text || '', note: b.note || '' });
  }
  const duration = t + 0.5;

  raw.sort((a, b) => a.t - b.t);
  const state = {};
  const put = (key, t, v, tw) => (state[key] = state[key] || []).push({ t: round(t), v, tw: tw || 0 });
  const fingers = Object.fromEntries(leaders.map(w => [w, 10]));
  const fx = [];
  const sfx = [];
  const music = [];
  const openMusic = {};

  for (const { t, ev } of raw) {
    if (ev.set) for (const [k, v] of Object.entries(ev.set)) put(k, t, v, ev.tween);
    if (ev.finger) {
      fingers[ev.finger] = Math.max(0, fingers[ev.finger] - 1);
      put(`fingers_${ev.finger}`, t, fingers[ev.finger]);
      sfx.push({ name: 'thunk', t, gain: 0.8 });
    }
    if (ev.fingers) {
      for (const [w, n] of Object.entries(ev.fingers)) {
        for (const who of w === 'all' ? leaders : [w]) {
          fingers[who] = n;
          put(`fingers_${who}`, t, n);
        }
      }
    }
    if (ev.look) {
      for (const [w, target] of Object.entries(ev.look)) {
        for (const who of w === 'all' ? everyone : [w]) put(`look_${who}`, t, target);
      }
    }
    if (ev.fx) fx.push({ name: ev.fx, t: round(t), dur: ev.dur || 1 });
    if (ev.sfx) sfx.push({ name: ev.sfx, t, dur: ev.dur, gain: ev.gain });
    if (ev.line) clips.push({ file: info(ev.line.who, ev.line.text).file, t, gain: 0.9, pan: cast[ev.line.who].pan });
    if (ev.music) openMusic[ev.music] = { name: ev.music, start: t };
    if (ev.stopMusic) {
      const m = openMusic[ev.stopMusic];
      music.push({ ...m, end: t, hard: !!ev.sfx });
      delete openMusic[ev.stopMusic];
    }
  }
  for (const m of Object.values(openMusic)) music.push({ ...m, end: duration });

  const timeline = {
    duration: round(duration),
    state,
    fx,
    speech: speech.map(s => ({ ...s, start: round(s.start), dur: round(s.dur) })),
    subs: subs.map(s => ({ ...s, start: round(s.start), end: round(s.end) })),
    panels,
  };
  const audio = { duration, clips, sfx, music };
  fs.writeFileSync(path.join(BUILD, 'timeline.json'), JSON.stringify(timeline));
  fs.writeFileSync(path.join(BUILD, 'audio-plan.json'), JSON.stringify(audio, null, 1));
  fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'out', 'never-have-i-ever.srt'), srt(timeline.subs));
  return { timeline, audio };
}

// Captions file for uploading to YouTube alongside the video.
function srt(subs) {
  const stamp = s => {
    const ms = Math.round(s * 1000);
    const p = (n, w) => String(n).padStart(w, '0');
    return `${p(Math.floor(ms / 3600000), 2)}:${p(Math.floor(ms / 60000) % 60, 2)}:${p(Math.floor(ms / 1000) % 60, 2)},${p(ms % 1000, 3)}`;
  };
  return subs.map((s, i) => `${i + 1}\n${stamp(s.start)} --> ${stamp(s.end)}\n${s.text}\n`).join('\n');
}

function round(x) {
  return Math.round(x * 1000) / 1000;
}

module.exports = { build, readClip, SR };

if (require.main === module) {
  const { timeline } = build();
  console.log(`timeline: ${timeline.duration.toFixed(1)}s, ${timeline.subs.length} lines`);
}
