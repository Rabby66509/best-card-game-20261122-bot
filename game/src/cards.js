// Ember Court — the card catalogue: every card's suit, cost and effect.
// Suits are told apart by colour AND shape (glyph), never by text alone.

export const SUITS = {
  flame: { name: 'Flame', glyph: '▲', colour: '#e2483a' },
  frost: { name: 'Frost', glyph: '❄', colour: '#4aa3df' },
  thorn: { name: 'Thorn', glyph: '✿', colour: '#58b368' },
  storm: { name: 'Storm', glyph: '⚡', colour: '#e8b93a' },
};

// Effect fields (all optional):
//   dmg    — damage to the enemy (reduced by enemy block)
//   block  — block gained by the player
//   draw   — cards drawn after the card resolves
//   heal   — hit points restored to the player
//   energy — energy refunded
//   weaken — lowers the enemy's next attack intent by this much
//   comboSuit / comboDmg — bonus damage if a card of comboSuit was already
//                          played this turn
export const CARD_DEFS = [
  { id: 'ember-slash',   name: 'Ember Slash',  suit: 'flame', cost: 1, text: 'Deal <b>4</b> damage.', dmg: 4 },
  { id: 'cinder-burst',  name: 'Cinder Burst', suit: 'flame', cost: 2, text: 'Deal <b>7</b> damage.', dmg: 7 },
  { id: 'wildfire',      name: 'Wildfire',     suit: 'flame', cost: 3, text: 'Deal <b>6</b> damage. Draw <b>1</b> card.', dmg: 6, draw: 1 },
  { id: 'ember-feast',   name: 'Ember Feast',  suit: 'flame', cost: 2, text: 'Heal <b>6</b>. Deal <b>2</b> damage.', dmg: 2, heal: 6 },
  { id: 'frostfire',     name: 'Frostfire',    suit: 'flame', cost: 3, text: 'Deal <b>9</b> damage.', dmg: 9 },
  { id: 'frost-shard',   name: 'Frost Shard',  suit: 'frost', cost: 1, text: 'Deal <b>3</b> damage. Gain <b>2</b> block.', dmg: 3, block: 2 },
  { id: 'glacial-wall',  name: 'Glacial Wall', suit: 'frost', cost: 2, text: 'Gain <b>9</b> block.', block: 9 },
  { id: 'winters-bite',  name: "Winter's Bite", suit: 'frost', cost: 2, text: 'Deal <b>5</b> damage. Weaken the Regent\'s attack by <b>3</b>.', dmg: 5, weaken: 3 },
  { id: 'thorn-whip',    name: 'Thorn Whip',   suit: 'thorn', cost: 1, text: 'Deal <b>3</b> damage. Draw <b>1</b> card.', dmg: 3, draw: 1 },
  { id: 'briar-shield',  name: 'Briar Shield', suit: 'thorn', cost: 1, text: 'Gain <b>5</b> block. Draw <b>1</b> card.', block: 5, draw: 1 },
  { id: 'vine-snare',    name: 'Vine Snare',   suit: 'thorn', cost: 2, text: 'Deal <b>4</b> damage. Weaken the Regent\'s attack by <b>2</b>.', dmg: 4, weaken: 2 },
  { id: 'thornmail',     name: 'Thornmail',    suit: 'thorn', cost: 2, text: 'Gain <b>6</b> block. Deal <b>3</b> damage.', dmg: 3, block: 6 },
  { id: 'storm-call',    name: 'Storm Call',   suit: 'storm', cost: 2, text: 'Deal <b>5</b> damage. <b>+4</b> if you played a Storm card this turn.', dmg: 5, comboSuit: 'storm', comboDmg: 4 },
  { id: 'lightning-rod', name: 'Lightning Rod', suit: 'storm', cost: 1, text: 'Deal <b>2</b> damage. Gain <b>1</b> energy.', dmg: 2, energy: 1 },
  { id: 'gale-step',     name: 'Gale Step',    suit: 'storm', cost: 1, text: 'Draw <b>2</b> cards.', draw: 2 },
  { id: 'tempest',       name: 'Tempest',      suit: 'storm', cost: 3, text: 'Deal <b>8</b> damage. Draw <b>1</b> card.', dmg: 8, draw: 1 },
];

export const CARD_BY_ID = Object.fromEntries(CARD_DEFS.map((c) => [c.id, c]));

// The 20-card deck: one of each card, plus a second copy of the four
// one-cost openers so early hands flow.
export const DECK_LIST = [
  ...CARD_DEFS.map((c) => c.id),
  'ember-slash', 'frost-shard', 'thorn-whip', 'lightning-rod',
];
