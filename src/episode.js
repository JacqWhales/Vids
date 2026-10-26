// "Never Have I Ever: Summit Edition" (script v2, see drafts/script-v2.md) — the whole episode as data.
//
// Each item in `beats` is one beat on the timeline, and one panel in the storyboard:
//   say:   speaker id (or an array for a chorus). `text` is the subtitle, `tts` overrides pronunciation.
//   wait:  a silent beat of N seconds.
//   shot:  camera — 'wide', 'close:<who>', 'two:<a>,<b>', 'hands:<who>', 'eyes:<who>', 'pt:<x>,<y>,<zoom>';
//          add '+push' for a slow zoom. Persists.
//   scene: 'disclaimer' | 'title' | 'room' | 'black' | 'region' | 'tv' | 'endcard'. Persists.
//   do:    events fired at the start of the beat (an event's `at` delays it by that many seconds).
//   then:  events fired when the beat's audio ends.
//   hold:  extra seconds after the audio before `then` fires.  pause: gap after the beat (default 0.3).
//   note:  stage direction, shown on the storyboard.  panelAt: seconds into the beat to grab its panel.
//   narr:  narration box for the vertical (webtoon) storyboard.
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
  waiter: { voice: 'en_GB-alan-medium', pitch: 0.78, length: 1.2, pan: 0.3 },
  faller: { voice: 'en_US-joe-medium', pitch: 1.35, length: 1.0, pan: -0.6 },
  faller2: { voice: 'en_US-kusal-medium', pitch: 1.3, length: 1.0, pan: -0.6 },
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

// Moves a leader's right hand onto their red button (1) or back up (0).
const reach = (who, to, at = 0, tween = 0.6) => ({ at, set: { [`reach_${who}`]: to }, tween });

const beats = [
  { scene: 'disclaimer', wait: 4.5 },
  { scene: 'title', wait: 5.6, do: [{ sfx: 'titleJingle' }] },

  // ---- Cold open: straight in, mid-sentence ------------------------------------------------------
  { scene: 'room', shot: 'wide', say: 'gary',
    text: '...so the trade talks are cancelled, the climate talks are cancelled, and the hostage exchange is "pending." So! Party game.',
    tts: 'So the trade talks are cancelled, the climate talks are cancelled, and the hostage exchange is, pending. So! Party game.',
    note: 'Open mid-sentence. Caption types on: GENEVA — A TOP SECRET SUMMIT.',
    do: [{ set: { caption: 'GENEVA — A TOP SECRET SUMMIT' } }], then: [{ set: { caption: '' } }] },
  { say: 'gary', text: 'Never Have I Ever. Ten fingers up. If you\'ve done it, finger down.',
    note: 'Everyone\'s hands pop up.', panelAt: 3.6,
    then: [{ set: { hands: true }, fingers: { all: 10 }, sfx: 'pop' }], hold: 0.4 },
  { say: 'gary', shot: 'close:gary', text: 'Mister President, I can\'t see your fingers.' },
  { shot: 'hands:trump', wait: 1.4, do: [{ sfx: 'twinkle', at: 0.2 }], note: 'SMASH ZOOM on Trump\'s tiny hands. Twinkle.' },
  { say: 'trump', shot: 'close:trump', text: 'They\'re there. Tremendous fingers. Doctors look at these fingers and they cry.' },

  // ---- Round 1: Trump -----------------------------------------------------------------------------
  { say: 'trump', text: 'Never have I ever been convicted of a felony.' },
  { wait: 0.9, do: [{ look: { trump: 'down' } }], note: 'Beat. He looks down.' },
  { say: 'trump', text: '...Oh.' },
  { shot: 'wide', wait: 4.4, do: felonyMontage(), panelAt: 4.2,
    note: 'FELONY COUNTS counter rolls to 34, taking all ten fingers with it. GUILTY stamp.' },
  { say: 'trump', shot: 'two:kim,trump', text: 'Kim, can I borrow some fingers?',
    do: [{ set: { counterOn: false }, look: { trump: 'kim', kim: null } }] },
  { say: 'kim', text: 'No.', then: [{ look: { all: null } }] },
  { say: 'trump', shot: 'close:trump', text: 'Witch hunt. I\'m putting them back up.', note: 'All ten pop back up.',
    then: [{ fingers: { trump: 10 }, sfx: 'pop' }], hold: 0.3 },
  { say: 'gary', shot: 'wide', text: 'You can\'t just—', tts: 'You can\'t just', pause: 0.05 },
  { say: 'trump', text: 'Back up. Totally exonerated.' },
  { say: 'putin', shot: 'close:putin', text: 'Your judges... they are still alive?', note: 'Genuinely curious.' },
  { say: 'xi', shot: 'close:xi',
    text: 'In China we have ninety-nine point nine percent conviction rate. Congratulations, Donald. You are basically Chinese now.' },
  { say: 'kim', shot: 'close:kim', text: 'In my country, the judge would be very sorry. And so would his grandparents.',
    do: [{ at: 2.0, look: { kim: 'missile' } }], then: [{ look: { kim: null } }] },

  // ---- Round 2: Kim -------------------------------------------------------------------------------
  { say: 'gary', shot: 'wide', text: 'Mister Kim?' },
  { say: 'kim', shot: 'close:kim', text: 'Never have I ever used nerve agent in an airport.',
    note: 'Puts his own finger down. Proudly.', then: [{ at: 0.3, finger: 'kim' }], hold: 0.8 },
  { say: 'gary', shot: 'wide', text: 'Sir, you\'re supposed to say something you HAVEN\'T done.' },
  { say: 'kim', shot: 'close:kim', text: 'I know. I am bragging.' },
  { shot: 'wide', wait: 0.9, do: [{ look: { all: 'putin' } }], note: 'Everyone slowly turns to Putin.' },
  { say: 'putin', shot: 'close:putin', text: 'Does airplane count?' },
  { say: 'kim', shot: 'two:putin,kim', text: 'Close enough, comrade.', note: 'Finger down. HIGH FIVE.', panelAt: 2.5,
    do: [{ look: { kim: 'putin', putin: 'kim' } }],
    then: [{ finger: 'putin' }, { at: 0.4, fx: 'highfive', dur: 0.7 }, { at: 0.75, sfx: 'slap' }], hold: 1.3 },

  // ---- Round 3: Putin -----------------------------------------------------------------------------
  { say: 'gary', shot: 'wide', text: 'Mister Putin?', do: [{ look: { all: null } }] },
  { say: 'putin', shot: 'close:putin+push', text: 'Never have I ever had critic fall out of window.' },
  { shot: 'wide', wait: 1.2, do: [{ look: { all: 'window' } }], note: 'Everyone turns to the window.' },
  { wait: 1.7, do: [{ fx: 'fallingMan', dur: 1.1 }, { line: { who: 'faller', text: 'Aaaaaaaaaaah!' } }],
    note: 'A man in a suit falls past, screaming.', panelAt: 0.5 },
  { wait: 0.5, do: [{ look: { putin: 'camera' } }] },
  { say: 'putin', shot: 'close:putin', text: 'Wind.', hold: 0.6 },
  { shot: 'wide', wait: 1.7, do: [{ at: 0.2, fx: 'fallingMan', dur: 1.1 }, { at: 0.2, line: { who: 'faller2', text: 'Nooooooooo!' } }],
    note: 'Beat. A SECOND man falls past.', panelAt: 0.7 },
  { say: 'putin', shot: 'close:putin', text: '...Very windy day.', then: [{ look: { all: null } }] },
  { say: 'gary', shot: 'wide', text: 'Shouldn\'t you put a finger d—', tts: 'Shouldn\'t you put a finger', pause: 0,
    note: 'Squeak, squeak. The tea trolley rolls in.',
    do: [{ at: 0.6, set: { trolleyX: 1430 }, tween: 2.6 }, { at: 0.6, sfx: 'squeak', dur: 2.6 },
         { at: 0.6, look: { all: 'trolley' } }] },
  { wait: 1.9, do: [{ at: 0.9, set: { trolleyOffer: 'tea' } }], note: 'It stops at Gary. The waiter holds out a cup.', panelAt: 1.5 },
  { say: 'gary', text: 'I\'m good! I\'m so good. Thank you.',
    then: [{ set: { trolleyOffer: false } }, { at: 0.2, set: { trolleyX: -500 }, tween: 2.4 },
           { at: 0.2, sfx: 'squeak', dur: 2.4 }], hold: 1.2 },

  // ---- Round 4: Trump vs. Putin -------------------------------------------------------------------
  { say: 'trump', shot: 'close:trump', text: 'Never have I ever been controlled by Vladimir Putin.', do: [{ look: { all: null } }] },
  { shot: 'wide', wait: 2.8, panelAt: 1.4,
    note: 'Silence. Putin calmly reaches all the way across and pushes one of Trump\'s tiny fingers down. Boop.',
    do: [{ set: { reachTo_putin: 'trump' }, look: { putin: 'trump', kim: 'putin' } }, reach('putin', 1, 0.2, 1.0),
         { at: 1.3, finger: 'trump' }, reach('putin', 0, 1.9, 0.6)] },
  { say: 'trump', shot: 'close:trump', text: '...That was a reflex.', do: [{ look: { kim: null } }] },
  { say: 'putin', shot: 'close:putin', text: 'Good boy.', note: 'Optional line.', then: [{ look: { putin: null } }] },
  { say: 'trump', shot: 'close:trump', text: 'I\'m putting it back up.', then: [{ fingers: { trump: 10 }, sfx: 'pop' }], hold: 0.3 },

  // ---- Round 5: Xi --------------------------------------------------------------------------------
  { say: 'gary', shot: 'wide', text: 'Uh... Mister Xi?', tts: 'Uh... Mister Shee?' },
  { say: 'xi', shot: 'close:xi', text: 'Never have I ever heard of June fourth, nineteen eighty-nine.' },
  { shot: 'wide', wait: 1.4, do: [{ finger: 'putin' }, { at: 0.3, finger: 'kim' }, { at: 0.6, finger: 'trump' }],
    note: 'Putin, Kim and Trump each put a finger down. Xi keeps all ten.', panelAt: 1.2 },
  { shot: 'close:xi+push', wait: 1.3, note: 'Slow push in on Xi, smiling.' },
  { say: 'trump', shot: 'wide', text: 'Oh, come on, the tank guy! Everybody knows the tank gu—',
    tts: 'Oh, come on, the tank guy! Everybody knows the tank', pause: 0 },
  { scene: 'region', wait: 3.2, do: [{ sfx: 'error' }], note: 'HARD CUT.' },
  { scene: 'room', shot: 'close:trump', wait: 0.9, do: [{ look: { trump: 'camera' } }], note: 'Trump blinks.' },
  { say: 'trump', text: '...What was I saying?', then: [{ look: { trump: null } }] },
  { say: 'gary', shot: 'close:gary', text: 'Mister Xi, has anyone ever told you, you look a little like Winnie the—',
    tts: 'Mister Shee, has anyone ever told you, you look a little like Winnie the', pause: 0,
    then: [{ set: { censor: true }, sfx: 'beep', dur: 1.8 }] },
  { wait: 1.8, then: [{ set: { censor: false, gary: 2 } }], note: 'CENSORED. BEEP.', panelAt: 0.9 },
  { say: 'gary', shot: 'close:gary', text: 'Hi! I\'m the new Gary. Love the honey.', note: 'A different man. Green shirt. GARY 2.' },
  { shot: 'close:xi', wait: 1.8, do: [{ at: 0.4, set: { honeyX: 420 }, tween: 1.2 }, { at: 0.4, sfx: 'slide', dur: 1.2 }],
    then: [{ set: { button_xi: true } }],
    note: 'Xi\'s smile does not change. The honey pot quietly slides out of shot.', panelAt: 1.0 },

  // ---- The button ---------------------------------------------------------------------------------
  { shot: 'wide', wait: 1.0, do: [{ set: { reachTo_trump: 'button' } }, reach('trump', 1, 0.1, 0.7)],
    note: 'Trump casually reaches for the big red button on the table in front of him.' },
  { say: 'gary', text: 'Sir, what is th—', tts: 'Sir, what is', pause: 0 },
  { wait: 2.3, panelAt: 0.9,
    note: 'BZZT. PANIC. Kim dives under the table. The bear covers its eyes. Putin doesn\'t move. Xi sips his tea.',
    do: [{ set: { press: 'trump' }, sfx: 'buzz' }, { at: 0.15, set: { duck_kim: 1 }, tween: 0.3 }, { at: 0.15, sfx: 'whoosh' },
         { at: 0.2, set: { bearCover: true }, look: { gary: 'trump', putin: 'camera', xi: 'camera' } },
         { at: 0.6, set: { xiSip: true } }, reach('trump', 0, 0.7, 0.4)] },
  { shot: 'wide', wait: 2.4, panelAt: 2.2, note: 'The waiter wheels in a single Diet Coke on a silver tray.',
    do: [{ set: { trolleyCargo: 'coke', xiSip: false } }, { set: { trolleyX: 1360 }, tween: 2.2 }, { sfx: 'squeak', dur: 2.2 },
         { at: 0.3, look: { all: 'trolley' } }] },
  { say: 'trump', shot: 'close:trump', text: 'Diet Coke. Relax.',
    do: [{ set: { trolleyOffer: 'coke' } }, { at: 0.9, set: { trolleyOffer: false, coke: true }, sfx: 'canOpen' }] },
  { shot: 'wide', wait: 1.1, note: 'Kim slowly climbs back up. His hand lands on his own button.',
    do: [{ set: { duck_kim: 0 }, tween: 0.9 }, { set: { bearCover: false, reachTo_kim: 'button' }, look: { all: null } },
         reach('kim', 1, 0.6, 0.4)] },
  { say: 'kim', shot: 'close:kim', text: 'Your button... is for Diet Coke?' },
  { say: 'trump', shot: 'close:trump', text: 'Mine is. What\'s yours for?' },
  { shot: 'close:kim+push', wait: 2.0, do: [{ look: { kim: 'down' } }, reach('kim', 0, 0.9, 0.8)],
    note: 'Kim looks at his own red button. He slowly takes his hand off it.', panelAt: 0.6 },
  { shot: 'wide', wait: 1.6, do: [{ look: { all: null } }, { set: { trolleyCargo: 'tea', trolleyX: 1430 }, tween: 1.2 },
    { sfx: 'squeak', dur: 1.2 }] },
  { say: 'waiter', text: 'Tea, sir?', do: [{ set: { trolleyOffer: 'tea' } }] },
  { say: 'gary', shot: 'close:gary', text: 'Oh! Sure, thanks!', then: [{ set: { trolleyOffer: false, garyCup: true } }] },
  { shot: 'wide', wait: 1.9, do: [{ look: { all: 'gary' } }, { at: 0.5, sfx: 'sip' }],
    note: 'He takes a sip. Everyone watches him in total silence.', panelAt: 1.2, narr: 'Total silence.' },
  { scene: 'black', wait: 1.2, note: 'CUT TO BLACK.',
    then: [{ set: { gary: 3, garyCup: false, trolleyX: -500, trolleyCargo: 'tea' }, look: { all: null } }] },
  { scene: 'room', shot: 'close:gary', say: 'gary', text: 'I\'m Gary. Please don\'t ask about the other Garys.',
    note: 'A new, shakier man in a bike helmet. GARY 3.' },

  // ---- Round 6: Kim, the love letters -------------------------------------------------------------
  { say: 'kim', shot: 'close:kim', text: 'Never have I ever written love letters to another world leader.' },
  { shot: 'two:kim,trump', wait: 1.4, note: 'Kim slowly puts a finger down, looking at Trump. Sax. Pink. Hearts.',
    do: [{ look: { kim: 'trump' } }, { at: 0.5, finger: 'kim' }, { music: 'sax' }, { set: { pink: true } }] },
  { wait: 1.0, do: [{ look: { trump: 'kim' } }, { at: 0.4, finger: 'trump' }], note: 'Trump puts one down too.' },
  { say: 'trump', text: 'He wrote me beautiful letters. We fell in love.' },
  { say: 'kim', text: 'You don\'t write anymore.' },
  { say: 'trump', text: 'I\'ve been busy, Kim. There\'s tariffs.' },
  { say: 'putin', shot: 'close:putin', text: 'He writes to me also.', note: 'RECORD SCRATCH. The pink is gone.',
    then: [{ stopMusic: 'sax', sfx: 'scratch', set: { pink: false }, look: { kim: 'trump', trump: 'camera' } }], hold: 0.4 },
  { say: 'xi', shot: 'close:xi', text: 'He sends me only tariffs.' },
  { say: 'kim', shot: 'close:kim', text: 'DONALD!' },
  { say: 'trump', shot: 'close:trump', text: 'It\'s a very different relationship. Very different. All of them. Different.',
    then: [{ look: { all: null } }] },

  // ---- Round 7: Trump, the Nobel ------------------------------------------------------------------
  { say: 'trump', shot: 'close:trump', text: 'Never have I ever been robbed of a Nobel Peace Prize.' },
  { shot: 'wide', wait: 1.3, note: 'Nobody moves.', narr: 'Nobody moves.' },
  { say: 'trump', shot: 'close:trump', text: 'Rigged! I ended eight wars! Nine! Some were very small!',
    note: 'Slams his own finger down. The table shakes.', then: [{ finger: 'trump' }, { set: { shake: 1 }, sfx: 'slam' }] },
  { shot: 'wide', wait: 3.4, do: [{ look: { all: 'window' } }, { fx: 'obama', dur: 3.4 }, { at: 1.4, sfx: 'twinkle' }],
    note: 'Obama glides past the window, wearing his medal.', panelAt: 1.7 },
  { say: 'trump', shot: 'close:trump', text: 'Oh, come ON.', then: [{ look: { all: null } }] },

  // ---- Round 8: term limits, then the blow-up -----------------------------------------------------
  { say: 'gary', shot: 'close:gary', text: 'Final round. Never have I ever stayed in power past my term limit.' },
  { say: 'putin', shot: 'close:putin', text: 'I changed constitution. Terms reset. Very legal.' },
  { say: 'xi', shot: 'close:xi', text: 'We removed term limits in 2018. Much more efficient.',
    tts: 'We removed term limits in twenty eighteen. Much more efficient.' },
  { say: 'kim', shot: 'close:kim', text: 'What is... term limit?' },
  { shot: 'close:trump', wait: 1.8, do: [{ at: 0.5, set: { hat: true }, sfx: 'pop' }],
    note: 'Trump silently puts on a red TRUMP 2028 hat.', panelAt: 1.4 },
  { say: 'gary', shot: 'wide', text: 'So nobody puts a finger down... so nobody wins?' },
  { say: leaders, shot: 'wide', text: 'I WIN.', note: 'All four at once.', then: [{ set: { shake: 1 } }], hold: 0.3 },
  { say: 'trump', shot: 'close:trump', text: 'I have the most fingers. I put them back up. Twice. Nobody\'s ever done it twice.' },
  { say: 'putin', shot: 'close:putin', text: 'Is not who has fingers. Is who counts fingers.' },
  { say: 'xi', shot: 'close:xi', text: 'History will say I won. We write the history.' },
  { say: 'kim', shot: 'close:kim', text: 'I win. Also, I invented this game. And fingers.' },
  { shot: 'wide', wait: 2.6, panelAt: 2.4,
    note: 'Each leader slowly puts a hand on their red button. Whistling. Letterbox.',
    do: [{ music: 'whistle' }, { set: { letterbox: true, reachTo_putin: 'button', reachTo_kim: 'button', reachTo_trump: 'button', reachTo_xi: 'button' } },
         reach('putin', 1, 0.3, 0.9), reach('kim', 1, 0.7, 0.9), reach('trump', 1, 1.1, 0.9), reach('xi', 1, 1.5, 0.9)] },
  { shot: 'eyes:putin', wait: 0.9, note: 'Extreme close-ups on eyes.' },
  { shot: 'eyes:kim', wait: 0.9 },
  { shot: 'eyes:trump', wait: 0.9 },
  { shot: 'eyes:xi', wait: 0.9 },
  { shot: 'pt:305,660,3.2', wait: 1.1, do: [{ set: { bearSweat: true } }], note: 'The bear is sweating.' },
  { shot: 'pt:1760,150,3.6', wait: 1.0, do: [{ sfx: 'clock', dur: 1.0, gain: 2 }], note: 'The clock ticks. Loud.' },
  { shot: 'hands:trump', wait: 1.2, note: 'Trump\'s button is still the Diet Coke button. He doesn\'t seem to know.',
    narr: 'It\'s still the Diet Coke button.' },
  { say: 'gary', shot: 'close:gary', text: 'WAIT!',
    then: [{ stopMusic: 'whistle', set: { letterbox: false } }] },

  // ---- The speech ---------------------------------------------------------------------------------
  { say: 'gary', text: 'You know... I learned something today.', do: [{ music: 'learned' }, { look: { all: 'gary' } }] },
  { say: 'gary', text: 'We came here to talk about trade, and nuclear weapons, and human rights.' },
  { say: 'gary', text: 'But maybe the real weapons of mass destruction... were the friends we made along the way.',
    hold: 1.0, then: [{ stopMusic: 'learned' }] },
  { shot: 'wide', wait: 2.6, panelAt: 2.4, note: 'Long silence. One by one, they take their hands off their buttons.', narr: 'One by one...',
    do: [reach('xi', 0, 0.3, 0.6), reach('kim', 0, 0.9, 0.6), reach('putin', 0, 1.5, 0.6), reach('trump', 0, 2.0, 0.5)] },
  { shot: 'wide', wait: 2.2, do: [{ at: 0.3, set: { teaToGary: 1 }, tween: 1.4 }, { at: 0.3, sfx: 'slide', dur: 1.4 }],
    note: 'Then all four slide their teacups toward Gary at the same time.', panelAt: 2.0 },
  { say: 'gary', shot: 'close:gary', text: 'I\'m good.', note: 'Instantly.', hold: 0.6 },

  // ---- State media --------------------------------------------------------------------------------
  { scene: 'tv', wait: 1.5, do: [{ sfx: 'newsJingle' }, { set: { tvActive: -1 } }], note: 'Four-way split of state TV.' },
  { say: 'anchorUS', text: 'President Trump wins by the biggest margin in history, after putting his fingers back up a record two times!',
    do: [{ set: { tvActive: 0 } }] },
  { say: 'anchorRU', text: 'Putin wins, with ninety-nine point nine percent of fingers. Moderator unavailable for comment.',
    do: [{ set: { tvActive: 1 } }] },
  { say: 'anchorCN', text: 'There was no game. There was no square. There was no Gary.',
    tts: 'There was no game. There was no square. There was, no Gary.', do: [{ set: { tvActive: 2 } }] },
  { say: 'anchorKP', text: 'Marshal Kim wins, with a record eleven holes-in-one!', do: [{ set: { tvActive: 3 } }], hold: 1.0 },
  { scene: 'endcard', wait: 6.5, do: [{ sfx: 'endJingle' }], panelAt: 5.0, note: 'Several Garys were. Gary 4 starts Monday.' },
];

module.exports = { cast, beats, leaders };
