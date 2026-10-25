// Renders the episode: drives the canvas renderer in headless Chromium, pipes frames to ffmpeg
// in parallel chunks, then joins them with the mixed audio.
//
//   node src/render.js                 full video  -> out/never-have-i-ever.mp4
//   node src/render.js --stills 12,40  PNG stills  -> out/stills/
//   node src/render.js --from 60 --to 90   a preview clip of that range
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const OUT = path.join(ROOT, 'out');
const FPS = 24;

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i < 0 ? null : process.argv[i + 1];
}

async function openPage(browser, timeline) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => { throw e; });
  await page.goto('file://' + path.join(ROOT, 'renderer', 'index.html'));
  await page.evaluate(async tl => {
    await document.fonts.load('400 40px Marker');
    await document.fonts.load('400 40px Bangers');
    window.init(tl);
  }, timeline);
  return page;
}

async function frame(page, t) {
  const data = await page.evaluate(t => {
    window.renderFrame(t);
    return document.getElementById('c').toDataURL('image/png');
  }, t);
  return Buffer.from(data.slice(data.indexOf(',') + 1), 'base64');
}

async function renderChunk(browser, timeline, f0, f1, file) {
  const page = await openPage(browser, timeline);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), file],
  { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', c => (c ? rej(new Error(`ffmpeg exited ${c}`)) : res())));
  for (let f = f0; f < f1; f++) {
    const png = await frame(page, f / FPS);
    if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 240 === 0) console.log(`  ${path.basename(file)}: frame ${f - f0}/${f1 - f0}`);
  }
  ff.stdin.end();
  await done;
  await page.close();
}

async function main() {
  const timeline = JSON.parse(fs.readFileSync(path.join(BUILD, 'timeline.json')));
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  const stills = arg('stills');
  if (stills) {
    fs.mkdirSync(path.join(OUT, 'stills'), { recursive: true });
    const page = await openPage(browser, timeline);
    for (const t of stills.split(',').map(Number)) {
      const file = path.join(OUT, 'stills', `t${t.toFixed(2)}.png`);
      fs.writeFileSync(file, await frame(page, t));
      console.log(file);
    }
    await browser.close();
    return;
  }

  const from = Number(arg('from') || 0);
  const to = Math.min(Number(arg('to') || timeline.duration), timeline.duration);
  const preview = arg('from') || arg('to');
  const f0 = Math.round(from * FPS);
  const f1 = Math.round(to * FPS);
  const workers = Number(arg('workers') || 4);
  const per = Math.ceil((f1 - f0) / workers);
  const chunks = [];
  for (let k = 0; k < workers; k++) {
    const a = f0 + k * per;
    const b = Math.min(f1, a + per);
    if (a < b) chunks.push({ a, b, file: path.join(BUILD, `chunk${k}.mp4`) });
  }
  console.log(`rendering ${f1 - f0} frames in ${chunks.length} chunks`);
  const started = Date.now();
  await Promise.all(chunks.map(c => renderChunk(browser, timeline, c.a, c.b, c.file)));
  await browser.close();
  console.log(`frames done in ${((Date.now() - started) / 1000).toFixed(0)}s`);

  const list = path.join(BUILD, 'chunks.txt');
  fs.writeFileSync(list, chunks.map(c => `file '${c.file}'`).join('\n'));
  const outFile = path.join(OUT, preview ? `preview-${from}-${to}.mp4` : 'never-have-i-ever.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list,
    '-ss', String(from), '-t', String(to - from), '-i', path.join(BUILD, 'mix.wav'),
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', outFile], { stdio: 'inherit' });
  console.log(outFile);
}

main().catch(e => { console.error(e); process.exit(1); });
