// Vertical-scroll (WEBTOON-style) storyboard: one strip block per beat, stitched into
//   out/<episode>/webtoon/webtoon.html   the whole episode as one scrolling page (self-contained)
//   out/<episode>/webtoon/NNN.jpg        800x1280 slices, the format WEBTOON uploads take
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const { openPage } = require('./render');
const { ROOT, BUILD, OUT, episode } = require('./paths');

const { beats } = episode();
const DIR = path.join(BUILD, 'webtoon');

const ONOMATOPOEIA = {
  buzz: 'BZZZT!', slap: 'SMACK!', squeak: 'SQUEAK SQUEAK', beep: 'BEEEEEP', scratch: 'SCRRRATCH!', slam: 'SLAM!',
  pop: 'POP!', twinkle: 'TING!', stamp: 'THUNK!', sip: 'SLUUURP', canOpen: 'PSSHHT!', error: 'BWOMP',
  sting: 'DUN DUN DUNNN', whoosh: 'WHOOSH!', slide: 'SHHHK', clock: 'TICK... TOCK...',
  rip: 'RRRIP!', gulp: 'GULP', ding: 'DING!',
};
const MUSIC = { sax: '~ SMOOTH SAX ~', whistle: '~ WHISTLING ~', learned: '~ SOFT GUITAR ~' };

function soundWords(beat) {
  const words = [];
  for (const e of [...(beat.do || []), ...(beat.then || [])]) {
    if (ONOMATOPOEIA[e.sfx]) words.push(ONOMATOPOEIA[e.sfx]);
    if (MUSIC[e.music]) words.push(MUSIC[e.music]);
    if (e.line) words.push(e.line.text.toUpperCase());
  }
  return [...new Set(words)];
}

// Extra space after a block: tight for quick inserts, wide where the scene changes.
function gapAfter(p, next) {
  if (!next) return 0;
  if (p.scene !== next.scene || p.scene === 'black') return 180;
  const insert = /^(hands|eyes|pt)/.test(next.shot) && next.scene === 'room';
  return insert ? 34 : 56;
}

async function main() {
  const timeline = JSON.parse(fs.readFileSync(path.join(BUILD, 'timeline.json')));
  const panels = timeline.panels;
  if (panels.length !== beats.length) throw new Error('timeline is stale: run src/timeline.js first');
  fs.rmSync(DIR, { recursive: true, force: true });
  fs.mkdirSync(DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await openPage(browser, timeline);
  const manifest = [];
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    const spec = { ...p, who: p.who ? p.who.split(' + ') : [], sfx: soundWords(beats[i]), narr: beats[i].narr || '' };
    if (spec.scene === 'disclaimer') continue;
    const data = await page.evaluate(spec => window.webtoonBlock(spec), spec);
    const file = path.join(DIR, `block-${String(p.n).padStart(3, '0')}.png`);
    fs.writeFileSync(file, Buffer.from(data.slice(data.indexOf(',') + 1), 'base64'));
    manifest.push({ file, gap: gapAfter(p, panels[i + 1]) });
  }
  await browser.close();
  console.log(`composed ${manifest.length} blocks`);
  fs.writeFileSync(path.join(DIR, 'manifest.json'), JSON.stringify(manifest));
  const out = path.join(OUT, 'webtoon');
  execFileSync('python3', [path.join(ROOT, 'tools', 'stitch_webtoon.py'), path.join(DIR, 'manifest.json'), out], { stdio: 'inherit' });
}

main().catch(e => { console.error(e); process.exit(1); });
