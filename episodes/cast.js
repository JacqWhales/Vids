// Voices for everyone who speaks, shared by all episodes: a Piper voice, pitch, pace and stereo position.
const cast = {
  trump: { voice: 'en_US-ryan-high', pitch: 0.9, length: 1.08, pan: 0.1 },
  putin: { voice: 'en_GB-northern_english_male-medium', pitch: 0.82, length: 1.18, pan: -0.35 },
  kim: { voice: 'en_US-joe-medium', pitch: 1.14, length: 0.96, pan: -0.12 },
  xi: { voice: 'en_GB-alan-medium', pitch: 0.93, length: 1.12, pan: 0.3 },
  gary: { voice: 'en_US-kusal-medium', pitch: 1.1, length: 0.9, pan: 0.5 },
  waiter: { voice: 'en_GB-alan-medium', pitch: 0.78, length: 1.2, pan: 0.3 },
  phone: { voice: 'en_GB-alan-medium', pitch: 1.12, length: 1.0, pan: -0.1 },
  faller: { voice: 'en_US-joe-medium', pitch: 1.35, length: 1.0, pan: -0.6 },
  faller2: { voice: 'en_US-kusal-medium', pitch: 1.3, length: 1.0, pan: -0.6 },
  anchorUS: { voice: 'en_US-ryan-high', pitch: 1.06, length: 0.88, pan: -0.2 },
  anchorRU: { voice: 'en_GB-northern_english_male-medium', pitch: 0.92, length: 1.05, pan: 0.2 },
  anchorCN: { voice: 'en_US-lessac-medium', pitch: 0.97, length: 1.05, pan: -0.2 },
  anchorKP: { voice: 'en_US-lessac-medium', pitch: 1.18, length: 0.92, pan: 0.2 },
};

module.exports = { cast };
