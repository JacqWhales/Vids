// Episode 2, "Secret Santa" — a 30-second holiday short. Two gift swaps, then one for Gary.
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
  { scene: 'title', wait: 2.6, do: [{ sfx: 'holidayJingle' }] },

  { scene: 'room', shot: 'wide', say: 'gary', text: 'Peace talks failed. Again. Secret Santa!',
    note: 'The room is decked out for the holidays. Everyone in Santa hats. A wrapped gift in front of each leader.',
    do: [{ set: { gary: 3, gift_putin: 'wrapped', gift_kim: 'wrapped', gift_trump: 'wrapped', gift_xi: 'wrapped' } }] },

  // ---- Kim got Trump: a missile -------------------------------------------------------------------
  { shot: 'wide', wait: 1.2, do: [...unwrap('trump', 'missile', 0.1), { at: 0.6, sfx: 'twinkle' }, face('trump', 'happy', 0.5)],
    note: 'Trump tears his open: a missile with a bow on it.', panelAt: 1.1 },
  { say: 'kim', shot: 'close:kim', text: 'It comes... to you.', do: [face('kim', 'smug')] },
  { say: 'trump', shot: 'close:trump', text: 'Is that a threat or a delivery?', do: [face('trump', 'shock')] },
  { say: 'kim', shot: 'close:kim', text: 'Yes.', do: [face('kim', 'happy')] },

  // ---- Xi got Kim: a phone ------------------------------------------------------------------------
  { shot: 'close:kim', wait: 0.9, do: [face('trump', null), ...unwrap('kim', 'phone', 0)], panelAt: 0.8,
    note: 'Kim unwraps a phone.' },
  { say: 'phone', text: 'Hello, Kim.', do: [{ sfx: 'ding' }, face('kim', 'shock', 0.3), { look: { kim: 'down' } }],
    then: [{ look: { kim: null } }], note: 'The phone already knows his name.' },
  { say: 'kim', text: 'Is it listening?' },
  { say: 'xi', shot: 'close:xi', text: 'Only for your safety.', do: [face('xi', 'smug')] },
  { say: 'kim', shot: 'close:kim', text: 'Same as my phones!', do: [face('kim', 'happy')] },

  // ---- Gary's gift --------------------------------------------------------------------------------
  { say: 'gary', shot: 'close:gary', text: 'Ooh, mine! It says... "Gary 4."',
    do: [face('xi', null), face('kim', null), { sfx: 'rip' }, { at: 0.3, set: { hold_gary: 'nametag' } }, face('gary', 'shock', 1.0)],
    note: 'He opens it. It\'s a name tag.' },
  { say: leaders, shot: 'wide', text: 'Merry Christmas, Gary.',
    do: [{ look: { all: 'gary' } }, ...leaders.map(w => face(w, 'happy'))], note: 'All four smile warmly.' },
  { shot: 'close:gary+push', wait: 1.2, do: [{ at: 0.3, sfx: 'gulp' }], note: 'Gulp.' },

  { scene: 'endcard', wait: 3.2, do: [{ sfx: 'holidayJingle' }], panelAt: 3.0 },
];

module.exports = { cast, beats, leaders, setting, titleCard, endCard, pause: 0.15 };
