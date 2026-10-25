// "Never Have I Ever: Summit Edition" — the whole episode as data.
//
// Each item in `beats` is one beat on the timeline:
//   say:   speaker id (or an array for a chorus). `text` is the subtitle, `tts` overrides pronunciation.
//   wait:  a silent beat of N seconds.
//   shot:  camera — 'wide', 'close:<who>', 'two:<a>,<b>', 'hands:<who>'; add '+push' for a slow zoom. Persists.
//   scene: 'disclaimer' | 'title' | 'room' | 'region' | 'tv' | 'endcard'. Persists.
//   do:    events fired at the start of the beat (an event's `at` delays it by that many seconds).
//   then:  events fired when the beat's audio ends.
//   hold:  extra seconds after the audio before `then` fires.  pause: gap after the beat (default 0.3).
//
// An event may combine any of:
//   set/tween   set renderer state keys, optionally tweened over `tween` seconds
//   finger      who puts one finger down        fingers  {who|all: n} absolute
//   look        {who|all: target|null}          fx       transient effect name, with `dur`
//   sfx         sound effect name (+ dur/gain)  music / stopMusic   start or stop a music bed
//   line        {who, text} an unsubtitled voice line (screams and the like)

const cast = {
  trump: { voice: 'en_US-ryan-high', pitch: 0.9, length: 1.08, pan: 0.1 },
  putin: { voice: 'en_GB-northern_english_male-medium', pitch: 0.82, length: 1.18, pan: -0.35 },
  kim: { voice: 'en_US-joe-medium', pitch: 1.14, length: 0.96, pan: -0.12 },
  xi: { voice: 'en_GB-alan-medium', pitch: 0.93, length: 1.12, pan: 0.3 },
  gary: { voice: 'en_US-kusal-medium', pitch: 1.1, length: 0.9, pan: 0.5 },
  faller: { voice: 'en_US-joe-medium', pitch: 1.35, length: 1.0, pan: -0.6 },
  anchorUS: { voice: 'en_US-ryan-high', pitch: 1.06, length: 0.88, pan: -0.2 },
  anchorRU: { voice: 'en_GB-northern_english_male-medium', pitch: 0.92, length: 1.05, pan: 0.2 },
  anchorCN: { voice: 'en_US-lessac-medium', pitch: 0.97, length: 1.05, pan: -0.2 },
  anchorKP: { voice: 'en_US-lessac-medium', pitch: 1.18, length: 0.92, pan: 0.2 },
};

const leaders = ['putin', 'kim', 'trump', 'xi'];

// Trump counts his 34 felony counts; the first ten take his fingers with them.
function felonyMontage() {
  const ev = [{ set: { counterOn: true, counter: 0 }, look: { all: 'trump' } }];
  for (let i = 1; i <= 34; i++) {
    const e = { at: i * 0.11, set: { counter: i } };
    if (i <= 10) e.finger = 'trump';
    else e.sfx = 'tick';
    ev.push(e);
  }
  ev.push({ at: 34 * 0.11 + 0.05, sfx: 'stamp' });
  return ev;
}

const beats = [
  { scene: 'disclaimer', wait: 5.5 },
  { scene: 'title', wait: 5.6, do: [{ sfx: 'titleJingle' }] },

  // ---- Cold open -------------------------------------------------------------------------
  { scene: 'room', shot: 'wide', wait: 3.0,
    do: [{ set: { caption: 'GENEVA — A TOP SECRET SUMMIT' } }, { sfx: 'clock', dur: 3.0 }],
    then: [{ set: { caption: '' } }] },
  { say: 'gary', text: 'Okay! Um. Welcome, everybody. So, since the trade talks have... completely collapsed...' },
  { wait: 0.9, do: [{ look: { kim: 'missile', putin: 'camera' } }], then: [{ look: { all: null } }] },
  { say: 'gary', text: 'Somebody found a party game in the drawer! It\'s called Never Have I Ever.' },
  { say: 'gary', text: 'Everybody hold up ten fingers.',
    then: [{ set: { hands: true }, fingers: { all: 10 }, sfx: 'pop' }], hold: 0.4 },
  { say: 'gary', text: 'Say something you\'ve never done. If you HAVE done it, you put a finger down. Last one with fingers wins.' },
  { say: 'gary', shot: 'close:gary', text: 'Mister President, I... I can\'t actually see your fingers.' },
  { shot: 'hands:trump', wait: 1.6, do: [{ sfx: 'twinkle', at: 0.3 }] },
  { say: 'trump', shot: 'close:trump',
    text: 'They\'re there. I have the most fingers. Tremendous fingers. Bigger than anybody\'s. People are saying it.' },
  { say: 'gary', shot: 'wide', text: 'Okay. Mister Trump, you go first.', tts: 'Okay. Mister Trump, you go first.' },

  // ---- Round 1: Trump --------------------------------------------------------------------
  { say: 'trump', shot: 'close:trump', text: 'Never have I ever... been convicted of a felony.' },
  { wait: 1.0, do: [{ look: { trump: 'down' } }] },
  { say: 'trump', text: 'Oh. Wait.' },
  { shot: 'wide', wait: 4.4, do: felonyMontage() },
  { say: 'trump', shot: 'two:kim,trump', text: 'Kim. Can I borrow some fingers?',
    do: [{ set: { counterOn: false }, look: { trump: 'kim', kim: null } }] },
  { say: 'kim', text: 'No.', then: [{ look: { all: null } }] },
  { say: 'gary', shot: 'wide', text: 'Sir, that\'s... all of your fingers.' },
  { say: 'trump', shot: 'close:trump', text: 'It\'s a witch hunt. A total witch hunt. I\'m putting them back up.',
    then: [{ fingers: { trump: 10 }, sfx: 'pop' }] },
  { say: 'gary', shot: 'wide', text: 'You can\'t just—', tts: 'You can\'t just', pause: 0.05 },
  { say: 'trump', text: 'Back up. Totally exonerated.' },
  { say: 'putin', shot: 'close:putin', text: 'In your country... courts are allowed to do this?' },
  { say: 'xi', shot: 'close:xi', text: 'Fascinating. Who appoints these judges?', tts: 'Fascinating. Who appoints, these judges?' },
  { say: 'kim', shot: 'close:kim', text: 'In my country, the judge would be... very sorry.',
    do: [{ at: 1.3, look: { kim: 'missile' } }], then: [{ look: { kim: null } }] },

  // ---- Round 2: Kim ----------------------------------------------------------------------
  { say: 'gary', shot: 'wide', text: 'O-kay. Mister Kim, your turn.', tts: 'Oh, kay. Mister Kim, your turn.' },
  { say: 'kim', shot: 'close:kim', text: 'Never have I ever... used nerve agent in an airport.',
    then: [{ at: 0.3, finger: 'kim' }], hold: 0.8 },
  { say: 'gary', shot: 'wide', text: 'Sir, you\'re supposed to say something you HAVEN\'T done.' },
  { say: 'kim', shot: 'close:kim', text: 'I know. I am bragging.' },
  { shot: 'wide', wait: 0.8, do: [{ look: { all: 'putin' } }] },
  { say: 'putin', shot: 'close:putin', text: 'Does... airplane count?' },
  { say: 'kim', shot: 'two:putin,kim', text: 'Close enough, comrade.',
    do: [{ look: { kim: 'putin', putin: 'kim' } }],
    then: [{ finger: 'putin' }, { at: 0.4, fx: 'highfive', dur: 0.7 }, { at: 0.75, sfx: 'slap' }], hold: 1.3 },

  // ---- Round 3: Putin --------------------------------------------------------------------
  { say: 'gary', shot: 'wide', text: 'Mister Putin?', do: [{ look: { all: null } }] },
  { say: 'putin', shot: 'close:putin+push', text: 'Never have I ever... had critic fall out of window.' },
  { shot: 'wide', wait: 1.3, do: [{ look: { all: 'window' } }] },
  { wait: 1.8, do: [{ fx: 'fallingMan', dur: 1.1 }, { line: { who: 'faller', text: 'Aaaaaaaaaaah!' } }] },
  { wait: 0.6, do: [{ look: { putin: 'camera' } }] },
  { say: 'putin', shot: 'close:putin', text: 'Wind.', hold: 0.5, then: [{ look: { all: null } }] },
  { say: 'gary', shot: 'wide', text: 'Shouldn\'t you put a finger d—', tts: 'Shouldn\'t you put a finger', pause: 0,
    do: [{ at: 0.6, set: { trolleyX: 1430 }, tween: 2.6 }, { at: 0.6, sfx: 'squeak', dur: 2.6 },
         { at: 0.6, look: { all: 'trolley' } }] },
  { wait: 1.9, do: [{ at: 0.9, set: { trolleyOffer: true } }] },
  { say: 'gary', text: 'I\'m good! I\'m so good. Thank you so much.',
    then: [{ set: { trolleyOffer: false } }, { at: 0.2, set: { trolleyX: -500 }, tween: 2.4 },
           { at: 0.2, sfx: 'squeak', dur: 2.4 }], hold: 1.4 },

  // ---- Round 4: Xi -----------------------------------------------------------------------
  { say: 'gary', text: 'Uh... Mister Xi?', tts: 'Uh... Mister Shee?', do: [{ look: { all: null } }] },
  { say: 'xi', shot: 'close:xi', text: 'Never have I ever... heard of June fourth, nineteen eighty-nine.' },
  { shot: 'wide', wait: 1.4, do: [{ finger: 'putin' }, { at: 0.3, finger: 'kim' }, { at: 0.6, finger: 'trump' }] },
  { shot: 'close:xi+push', wait: 1.3 },
  { say: 'trump', shot: 'wide', text: 'Oh, come on. The tank guy! Everybody knows the tank gu—',
    tts: 'Oh, come on. The tank guy! Everybody knows the tank', pause: 0 },
  { scene: 'region', wait: 3.4, do: [{ sfx: 'error' }] },
  { scene: 'room', shot: 'close:trump', wait: 1.0, do: [{ look: { trump: 'camera' } }] },
  { say: 'trump', text: '...What was I saying?', then: [{ look: { trump: null } }] },
  { say: 'gary', shot: 'close:gary', text: 'Mister Xi, has anyone ever told you, you look a little bit like Winnie the—',
    tts: 'Mister Shee, has anyone ever told you, you look a little bit like Winnie the', pause: 0,
    then: [{ set: { censor: true }, sfx: 'beep', dur: 1.8 }] },
  { wait: 1.8, then: [{ set: { censor: false, gary: 2 } }] },
  { say: 'gary', shot: 'close:gary', text: 'Hi. I\'m the new Gary. Let\'s keep going.', hold: 0.3 },

  // ---- Round 5: Kim, again ---------------------------------------------------------------
  { say: 'kim', shot: 'close:kim', text: 'Never have I ever... written love letters... to another world leader.' },
  { shot: 'two:kim,trump', wait: 1.4,
    do: [{ look: { kim: 'trump' } }, { at: 0.5, finger: 'kim' }, { music: 'sax' }, { set: { pink: true } }] },
  { wait: 1.0, do: [{ look: { trump: 'kim' } }, { at: 0.4, finger: 'trump' }] },
  { say: 'trump', text: 'He wrote me beautiful letters. Beautiful letters. We fell in love.' },
  { say: 'kim', text: 'You don\'t write anymore.' },
  { say: 'trump', text: 'I\'ve been very busy, Kim. There\'s tariffs.' },
  { say: 'putin', shot: 'close:putin', text: 'He writes to me also.',
    then: [{ stopMusic: 'sax', sfx: 'scratch', set: { pink: false }, look: { kim: 'trump', trump: 'camera' } }],
    hold: 0.5 },
  { say: 'kim', shot: 'close:kim', text: 'DONALD!' },
  { say: 'trump', shot: 'close:trump', text: 'It\'s a very different relationship. Very different.',
    then: [{ look: { all: null } }] },

  // ---- Round 6: Trump, again -------------------------------------------------------------
  { say: 'gary', shot: 'wide', text: 'Moving on! Mister President?' },
  { say: 'trump', shot: 'close:trump', text: 'Never have I ever... been robbed of a Nobel Peace Prize.' },
  { shot: 'wide', wait: 1.4 },
  { say: 'trump', shot: 'close:trump', text: 'Robbed! Rigged! I ended, like, eight wars!',
    then: [{ finger: 'trump' }, { set: { shake: 1 }, sfx: 'slam' }] },
  { shot: 'wide', wait: 3.4, do: [{ look: { all: 'window' } }, { fx: 'obama', dur: 3.4 }, { at: 1.4, sfx: 'twinkle' }] },
  { say: 'trump', shot: 'close:trump', text: 'Oh, come ON.', then: [{ look: { all: null } }] },

  // ---- Round 7: the final round ----------------------------------------------------------
  { say: 'gary', shot: 'close:gary', text: 'Okay. Final round. Never have I ever... stayed in power past my term limit.' },
  { say: 'putin', shot: 'close:putin', text: 'I changed constitution. Terms reset. Very legal.' },
  { say: 'xi', shot: 'close:xi', text: 'We removed term limits in 2018. Very efficient.',
    tts: 'We removed term limits in twenty eighteen. Very efficient.' },
  { say: 'kim', shot: 'close:kim', text: 'What is... term limit?' },
  { shot: 'close:trump', wait: 1.8, do: [{ at: 0.5, set: { hat: true }, sfx: 'pop' }] },
  { shot: 'wide', wait: 1.2 },
  { say: 'gary', text: 'So... nobody puts a finger down? Then... the game never ends?' },
  { say: leaders, shot: 'wide+push', text: 'Never.', do: [{ look: { all: 'camera' } }],
    then: [{ sfx: 'sting' }], hold: 1.6 },

  // ---- "I learned something today" -------------------------------------------------------
  { say: 'gary', shot: 'close:gary', text: 'You know... I learned something today.',
    do: [{ music: 'learned' }, { look: { all: 'gary' } }] },
  { say: 'gary', text: 'We came here to talk about trade, and nuclear weapons, and human rights.' },
  { say: 'gary', text: 'But maybe the real weapons of mass destruction... were the friends we made along the way.',
    hold: 1.2, then: [{ stopMusic: 'learned' }] },
  { shot: 'wide', wait: 2.4,
    do: [{ at: 0.3, set: { teaToGary: 1 }, tween: 1.6 }, { at: 0.3, sfx: 'slide', dur: 1.6 }] },
  { say: 'gary', shot: 'close:gary', text: '...I\'m good.', hold: 0.6 },

  // ---- State media -----------------------------------------------------------------------
  { scene: 'tv', wait: 1.6, do: [{ sfx: 'newsJingle' }, { set: { tvActive: -1 } }] },
  { say: 'anchorUS', text: 'Breaking news! President Trump wins Never Have I Ever by the biggest margin in history!',
    do: [{ set: { tvActive: 0 } }] },
  { say: 'anchorRU', text: 'Vladimir Putin wins, with ninety-nine point nine percent of the fingers.',
    do: [{ set: { tvActive: 1 } }] },
  { say: 'anchorCN', text: 'Comrade Xi has won. There was no game. There was also no square.',
    tts: 'Comrade Shee has won. There was no game. There was also, no square.', do: [{ set: { tvActive: 2 } }] },
  { say: 'anchorKP', text: 'Marshal Kim wins, with a record eleven holes-in-one!',
    do: [{ set: { tvActive: 3 } }], hold: 1.0 },
  { scene: 'endcard', wait: 6.0, do: [{ sfx: 'endJingle' }] },
];

module.exports = { cast, beats, leaders };
