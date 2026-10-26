// Episode 2, "Secret Santa" — the holiday summit. Same room, decked out; four gift swaps and one for Gary.
// Beat format and events are documented in ep1-never-have-i-ever.js. New state used here:
//   gift_<who>  'wrapped' | 'open'    hold_<who>  item held up: 'missile' | 'shirt' | 'window' | 'phone' | 'nametag'
//   face_<who>  'happy' | 'shock' | 'angry' | 'smug' | 'sad' (null for neutral)    bearShirt  true once dressed
const { cast } = require('./cast');

const leaders = ['putin', 'kim', 'trump', 'xi'];
const setting = 'holiday';
const titleCard = { lines: ['SECRET', 'SANTA'], sub: 'SUMMIT EDITION' };
const endCard = { title: 'SECRET SANTA', lines: ['Happy holidays from the Summit.', 'Gary 4 starts Monday.'] };

const face = (who, f, at = 0) => ({ at, set: { [`face_${who}`]: f } });
const unwrap = (who, item, at = 0) => [
  { at, set: { [`gift_${who}`]: 'open' }, sfx: 'rip' },
  { at: at + 0.45, set: { [`hold_${who}`]: item } },
];

const beats = [
  { scene: 'title', wait: 4.8, do: [{ sfx: 'holidayJingle' }] },

  // ---- Cold open ----------------------------------------------------------------------------------
  { scene: 'room', shot: 'wide', say: 'gary', text: 'Okay! The peace talks failed. Again. So... Secret Santa! Twenty dollar limit.',
    note: 'The room is decked out for the holidays. Everyone in Santa hats. A wrapped gift in front of each leader.',
    do: [{ set: { gary: 3, caption: 'GENEVA — THE HOLIDAY SUMMIT', gift_putin: 'wrapped', gift_kim: 'wrapped', gift_trump: 'wrapped', gift_xi: 'wrapped' } }],
    then: [{ set: { caption: '' } }] },
  { say: 'putin', shot: 'close:putin', text: 'Dollars?' },
  { say: 'xi', shot: 'close:xi', text: 'Yuan.' },
  { say: 'kim', shot: 'close:kim', text: 'I pay in missiles.', do: [face('kim', 'smug')] },
  { say: 'trump', shot: 'close:trump', text: 'Twenty dollars? With my tariffs, that\'s like four hundred dollars.',
    do: [face('trump', 'smug'), face('kim', null)] },
  { say: 'gary', shot: 'close:gary', text: 'Great. Wonderful. Mister President, open yours!', do: [face('trump', null)] },

  // ---- Kim got Trump: a missile -------------------------------------------------------------------
  { shot: 'wide', wait: 1.6, do: [...unwrap('trump', 'missile', 0.2), { at: 0.9, sfx: 'twinkle' }, face('trump', 'happy', 0.7)],
    note: 'Trump tears it open: a missile with a bow on it.', panelAt: 1.3 },
  { say: 'trump', shot: 'close:trump', text: 'Oh, it\'s beautiful. Does it come in gold?' },
  { say: 'kim', shot: 'close:kim', text: 'It comes... to you.', do: [face('kim', 'smug')] },
  { say: 'trump', shot: 'close:trump', text: 'Is that a threat or a delivery?', do: [face('trump', 'shock')] },
  { say: 'kim', shot: 'close:kim', text: 'Yes.', do: [face('kim', 'happy')], hold: 0.4 },

  // ---- Trump got Putin: a shirt -------------------------------------------------------------------
  { shot: 'wide', wait: 1.5, do: [face('trump', null), face('kim', null), ...unwrap('putin', 'shirt', 0.2)],
    note: 'Putin unwraps a shirt. A regular button-up shirt.', panelAt: 1.2 },
  { say: 'putin', shot: 'close:putin', text: 'What is this?', do: [{ look: { putin: 'down' } }] },
  { say: 'trump', shot: 'close:trump', text: 'It\'s a shirt. You wear it. On your body.', do: [face('trump', 'smug')] },
  { say: 'putin', shot: 'close:putin', text: '...Why?', do: [{ look: { putin: 'trump' } }], hold: 0.3 },
  { shot: 'pt:330,640,2.6', wait: 2.0, panelAt: 1.6,
    note: 'Putin puts the shirt on the bear. The bear looks fantastic.',
    do: [{ look: { putin: null } }, face('trump', null), { at: 0.5, set: { hold_putin: null, bearShirt: true }, sfx: 'pop' },
         { at: 0.9, sfx: 'twinkle' }] },

  // ---- Putin got Xi: a window ---------------------------------------------------------------------
  { shot: 'wide', wait: 1.5, do: unwrap('xi', 'window', 0.2), note: 'Xi unwraps... a window.', panelAt: 1.2 },
  { say: 'xi', shot: 'close:xi', text: '...A window?', do: [face('xi', 'shock')] },
  { say: 'putin', shot: 'close:putin', text: 'Is very nice window. Opens outward.', do: [face('putin', 'smug')] },
  { shot: 'close:xi', wait: 1.8, do: [face('xi', null), { at: 0.6, set: { hold_xi: null }, sfx: 'slide', dur: 0.8 }],
    note: 'Xi slowly hands it back.', narr: 'Xi slowly hands it back.', panelAt: 0.4 },

  // ---- Xi got Kim: a phone ------------------------------------------------------------------------
  { shot: 'wide', wait: 1.3, do: [face('putin', null), ...unwrap('kim', 'phone', 0.2)], panelAt: 1.1 },
  { say: 'kim', shot: 'close:kim', text: 'Ooh! A new phone!', do: [face('kim', 'happy')] },
  { say: 'phone', text: 'Hello, Kim.', do: [{ sfx: 'ding' }, face('kim', 'shock', 0.3), { look: { kim: 'down' } }],
    then: [{ look: { kim: null } }], note: 'The phone already knows his name.' },
  { say: 'xi', shot: 'close:xi', text: 'Already set up for you. Very convenient.', do: [face('xi', 'smug')] },
  { say: 'kim', shot: 'close:kim', text: '...Is it listening to me?' },
  { say: 'xi', shot: 'close:xi', text: 'Only for your safety.', do: [face('xi', 'happy')] },
  { say: 'kim', shot: 'close:kim', text: 'Same as my phones!', do: [face('kim', 'happy')], hold: 0.3 },

  // ---- Gary's gift --------------------------------------------------------------------------------
  { say: 'gary', shot: 'close:gary', text: 'Aw, and there\'s one for me!', do: [face('xi', null), face('kim', null), face('gary', 'happy')] },
  { shot: 'close:gary', wait: 1.4, do: [{ sfx: 'rip' }, { at: 0.4, set: { hold_gary: 'nametag' } }],
    note: 'He opens it. It\'s a name tag.', panelAt: 1.2 },
  { say: 'gary', text: 'It\'s a name tag. It says... "Gary 4."', do: [face('gary', 'shock')] },
  { shot: 'wide', wait: 1.4, do: [{ look: { all: 'gary' } }, ...leaders.map(w => face(w, 'happy', 0.3))],
    note: 'All four leaders turn to Gary and smile warmly.', narr: 'All four smile warmly.' },
  { say: leaders, shot: 'wide', text: 'Merry Christmas, Gary.' },
  { shot: 'close:gary+push', wait: 1.6, do: [{ at: 0.4, sfx: 'gulp' }], note: 'Gary sweats. Gulp.' },

  { scene: 'endcard', wait: 5.5, do: [{ sfx: 'holidayJingle' }], panelAt: 4.5 },
];

module.exports = { cast, beats, leaders, setting, titleCard, endCard };
