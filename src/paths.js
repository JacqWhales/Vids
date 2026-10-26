// Which episode to build, and where its build files and outputs go.
// Choose with EPISODE=<file in episodes/>, e.g. EPISODE=ep2-secret-santa npm run webtoon.
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EPISODE = process.env.EPISODE || 'ep1-never-have-i-ever';

module.exports = {
  ROOT,
  EPISODE,
  BUILD: path.join(ROOT, 'build', EPISODE),
  OUT: path.join(ROOT, 'out', EPISODE),
  TTS_DIR: path.join(ROOT, 'build', 'tts'), // voice cache, shared by every episode
  episode: () => require(path.join(ROOT, 'episodes', EPISODE)),
};
