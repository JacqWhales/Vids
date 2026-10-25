// Storyboard version of the episode: one held frame per beat.
//   out/animatic.mp4     every panel held for its beat, with the voices, sound and subtitles
//   out/storyboard.pdf   printable sheet: panels with shot, dialogue and stage directions
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const { openPage, frame } = require('./render');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const DIR = path.join(BUILD, 'storyboard');
const OUT = path.join(ROOT, 'out');

const SPEAKERS = {
  trump: 'TRUMP', putin: 'PUTIN', kim: 'KIM', xi: 'XI', gary: 'GARY', waiter: 'WAITER',
  anchorUS: 'PATRIOT NEWS', anchorRU: 'KREMLIN 24', anchorCN: 'PARTY NEWS 1', anchorKP: 'GLORIOUS TV',
};

function shotLabel(p) {
  if (p.scene !== 'room') return { disclaimer: 'Card', title: 'Title card', black: 'Black', region: 'Card', tv: 'TV split', endcard: 'End card' }[p.scene];
  const [kind, arg] = p.shot.replace('+push', '').split(':');
  const push = p.shot.endsWith('+push') ? ', slow push' : '';
  const names = s => s.split(',').map(w => SPEAKERS[w] || w).join(' & ');
  if (kind === 'wide') return 'Wide' + push;
  if (kind === 'close') return `Close: ${names(arg)}${push}`;
  if (kind === 'two') return `Two-shot: ${names(arg)}`;
  if (kind === 'hands') return `Insert: ${names(arg)}'s hands`;
  if (kind === 'eyes') return `Extreme close-up: ${names(arg)}'s eyes`;
  return 'Insert';
}

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function sheetHtml(panels) {
  const cards = panels.map(p => {
    const who = p.who.split(' + ').map(w => SPEAKERS[w] || w).join(' + ');
    return `<div class="panel">
      <img src="thumb-${p.n}.jpg">
      <div class="meta"><b>${p.n}</b><span>${esc(shotLabel(p))}</span><span>${(p.end - p.start).toFixed(1)}s</span></div>
      ${p.text ? `<div class="line"><b>${esc(who)}:</b> ${esc(p.text)}</div>` : ''}
      ${p.note ? `<div class="note">${esc(p.note)}</div>` : ''}
    </div>`;
  }).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4 landscape; margin: 10mm; }
    body { font-family: Inter, sans-serif; color: #1b1b1f; margin: 0; }
    h1 { font-size: 20px; margin: 0 0 8px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm 6mm; }
    .panel { break-inside: avoid; font-size: 11px; line-height: 1.35; }
    img { width: 100%; display: block; border: 2px solid #1b1b1f; }
    .meta { display: flex; gap: 10px; margin: 4px 0 2px; color: #555; }
    .meta b { color: #1b1b1f; }
    .meta span:last-child { margin-left: auto; }
    .note { color: #555; font-style: italic; margin-top: 2px; }
  </style></head><body>
  <h1>Never Have I Ever: Summit Edition — storyboard (script v2)</h1>
  <div class="grid">${cards}</div></body></html>`;
}

async function main() {
  const timeline = JSON.parse(fs.readFileSync(path.join(BUILD, 'timeline.json')));
  const panels = timeline.panels;
  fs.mkdirSync(DIR, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await openPage(browser, timeline);
  for (const p of panels) {
    fs.writeFileSync(path.join(DIR, `panel-${p.n}.png`), await frame(page, p.at, { label: String(p.n) }));
    fs.writeFileSync(path.join(DIR, `thumb-${p.n}.jpg`), await frame(page, p.at, { subs: false }, 'image/jpeg', 800));
  }
  console.log(`rendered ${panels.length} panels`);

  // Animatic: hold each panel until the next beat starts.
  const list = panels.map((p, i) => {
    const start = i === 0 ? 0 : p.start;
    const end = i === panels.length - 1 ? timeline.duration : panels[i + 1].start;
    return `file 'panel-${p.n}.png'\nduration ${(end - start).toFixed(3)}`;
  });
  list.push(`file 'panel-${panels[panels.length - 1].n}.png'`);
  fs.writeFileSync(path.join(DIR, 'animatic.txt'), list.join('\n'));
  const animatic = path.join(OUT, 'animatic.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(DIR, 'animatic.txt'),
    '-i', path.join(BUILD, 'mix.wav'), '-map', '0:v', '-map', '1:a', '-vf', 'fps=24,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000',
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', animatic], { stdio: 'inherit' });
  console.log(animatic);

  const html = path.join(DIR, 'storyboard.html');
  fs.writeFileSync(html, sheetHtml(panels));
  const sheet = await browser.newPage();
  await sheet.goto('file://' + html);
  const pdf = path.join(OUT, 'storyboard.pdf');
  await sheet.pdf({ path: pdf, landscape: true, format: 'A4', printBackground: true });
  console.log(pdf);
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
