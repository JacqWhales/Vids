# Never Have I Ever: Summit Edition

A South Park-style paper-cutout parody, animated entirely in code: Trump, Putin, Xi and Kim Jong Un
play Never Have I Ever at a Geneva summit while Gary, a nervous UN moderator, tries to keep order.

## How it's made

| Step | File | What it does |
| --- | --- | --- |
| Script | `episodes/*.js` | Every beat: dialogue, camera shots, expressions, gags, sound cues |
| Voices | `tools/tts.py` | Piper neural TTS, a voice and pitch per character (cached in `build/tts`) |
| Timeline | `src/timeline.js` | Times each beat from the voice lengths, builds mouth-flap envelopes and captions |
| Sound | `src/audio.js` | Synthesized sound effects and music (guitar stings, sax, news jingle) and the mix |
| Picture | `renderer/` | Canvas renderer: characters, room, title cards, state TV split screen |
| Video | `src/render.js` | Drives the renderer in headless Chromium, encodes with ffmpeg |
| Storyboard | `src/storyboard.js` | Animatic (held panels with sound) and a printable PDF storyboard |
| Webtoon | `src/webtoon.js`, `renderer/webtoon.js` | The storyboard as a vertical-scroll comic, sliced for WEBTOON |

## Episodes

Each episode is a file in `episodes/` (beats, shots, gags, sound cues); the voices are shared in
`episodes/cast.js`. Pick one with `EPISODE=<name>`; outputs go to `out/<name>/`.

| Episode | File |
| --- | --- |
| 1. Never Have I Ever | `episodes/ep1-never-have-i-ever.js` (default) |
| 2. Secret Santa | `episodes/ep2-secret-santa.js` |

The workflow is webtoon first (cheap to iterate on the script and staging), then the full video.

## Build

Needs Node 18+, Python 3, ffmpeg, Playwright's Chromium and `pip install piper-tts`.

```sh
npm run voices          # download the Piper voices (~500 MB)
npm run build           # -> out/<episode>/episode.mp4 and episode.srt
```

Storyboard version (one held frame per beat, much faster than a full render):

```sh
npm run storyboard      # -> out/<episode>/animatic.mp4 and storyboard.pdf
```

Vertical-scroll comic version (WEBTOON style: speech bubbles, lettered sound effects):

```sh
EPISODE=ep2-secret-santa npm run webtoon   # -> out/<episode>/webtoon/webtoon.html and 800x1280 slices
```

While iterating:

```sh
node src/render.js --stills 30,90,143     # PNG stills at those seconds -> out/<episode>/stills/
node src/render.js --from 90 --to 110     # a short preview clip
```

To change a joke, edit the episode file and rebuild; only new or changed lines are re-voiced.

Fonts: Permanent Marker (Apache 2.0), Bangers and Comic Neue (SIL OFL), in `renderer/fonts/`.
