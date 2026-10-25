# Never Have I Ever: Summit Edition

A South Park-style paper-cutout parody, animated entirely in code: Trump, Putin, Xi and Kim Jong Un
play Never Have I Ever at a Geneva summit while Gary, a nervous UN moderator, tries to keep order.

## How it's made

| Step | File | What it does |
| --- | --- | --- |
| Script | `src/episode.js` | Every beat: dialogue, camera shots, finger counts, gags, sound cues |
| Voices | `tools/tts.py` | Piper neural TTS, a voice and pitch per character (cached in `build/tts`) |
| Timeline | `src/timeline.js` | Times each beat from the voice lengths, builds mouth-flap envelopes and captions |
| Sound | `src/audio.js` | Synthesized sound effects and music (guitar stings, sax, news jingle) and the mix |
| Picture | `renderer/` | Canvas renderer: characters, room, title cards, state TV split screen |
| Video | `src/render.js` | Drives the renderer in headless Chromium, encodes with ffmpeg |
| Storyboard | `src/storyboard.js` | Animatic (held panels with sound) and a printable PDF storyboard |

## Build

Needs Node 18+, Python 3, ffmpeg, Playwright's Chromium and `pip install piper-tts`.

```sh
npm run voices          # download the Piper voices (~500 MB)
npm run build           # -> out/never-have-i-ever.mp4 and out/never-have-i-ever.srt
```

Storyboard version (one held frame per beat, much faster than a full render):

```sh
npm run storyboard      # -> out/animatic.mp4 and out/storyboard.pdf
```

While iterating:

```sh
node src/render.js --stills 30,90,143     # PNG stills at those seconds -> out/stills/
node src/render.js --from 90 --to 110     # a short preview clip
```

To change a joke, edit `src/episode.js` and rebuild; only new or changed lines are re-voiced.

Fonts: Permanent Marker (Apache 2.0) and Bangers (SIL OFL), in `renderer/fonts/`.
